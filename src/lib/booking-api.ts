/**
 * booking-api.ts
 *
 * Core business logic for the Nomadik booking system.
 * All booking operations go through this file.
 *
 * Architecture:
 *   Website → booking-api.ts → Supabase
 *   Webhook  → booking-api.ts → Supabase
 *
 * Rules:
 *  - Never expose RAZORPAY_KEY_SECRET or CASHFREE_SECRET_KEY in here.
 *  - Use supabaseAdmin (service role) only in server-fn / webhook context
 *  - Use supabase (anon) for client-side inserts that have RLS INSERT policies
 *  - confirmBookingAfterPayment is gateway-agnostic. Pass gateway='razorpay' or 'cashfree'.
 */

import { supabase } from "./supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Customer, BookingTimeline } from "@/types/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateCustomerInput {
  name: string;
  email?: string;
  phone: string;
  whatsapp?: string;
  gender?: string;
  city?: string;
  state?: string;
  address?: string;
  referral_source?: string;
}

export interface CreateBookingInput {
  customerId: string;
  departureId?: string;
  journeyId?: string;
  couponId?: string;
  couponCode?: string;
  traveller_count: number;
  base_amount: number;
  gst_rate?: number;
  gst_amount?: number;
  discount_amount: number;
  coupon_discount?: number;
  total_amount: number;
  amount_paid: number;
  balance_due?: number;
  room_sharing?: string;
  seat_preference?: string;
  food_preference?: string;
  special_requests?: string;
}

export interface CreateTravellerInput {
  bookingId: string;
  fullName: string;
  phone?: string;
  email?: string;
  gender?: string;
  age?: number;
  address?: string;
  guardianNumber?: string;
  seatPreference?: string;
  roomSharing?: string;
  heardFrom?: string;
  referredBy?: string;
  aadhaarDocUrl?: string;
  photoUrl?: string;
  isPrimary?: boolean;
}

export interface ConfirmBookingInput {
  bookingId: string;
  orderId?: string;
  paymentId?: string;
  signature?: string;
  amountPaid: number;
  gatewayResponse?: Record<string, unknown>;
  departureId?: string;
  traveller_count?: number;
  gateway?: string;
  // Legacy support for Cashfree
  cashfreeOrderId?: string;
  cashfreePaymentId?: string;
}

// ─── Timeline Logging ─────────────────────────────────────────────────────────

export async function addBookingTimeline(
  bookingId: string,
  event: string,
  description?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await supabase.from("booking_timeline").insert({
      booking_id: bookingId,
      event,
      description: description ?? null,
      actor: "SYSTEM",
      metadata: metadata ?? null,
    });
  } catch {
    // Timeline is non-critical — never throw
    console.warn(`[Timeline] Failed to log event ${event} for booking ${bookingId}`);
  }
}

// ─── Seat Management ──────────────────────────────────────────────────────────

export async function lockDepartureSeats(departureId: string, count: number): Promise<void> {
  const { data: dep } = await supabase
    .from("departures")
    .select("available_seats")
    .eq("id", departureId)
    .single();

  if (!dep) throw new Error("Departure not found");
  if ((dep.available_seats ?? 0) < count) {
    throw new Error("Not enough seats available");
  }

  const { error } = await supabase
    .from("departures")
    .update({ available_seats: dep.available_seats - count })
    .eq("id", departureId);

  if (error) throw new Error(`Failed to lock seats: ${error.message}`);
}

export async function releaseSeats(departureId: string, count: number): Promise<void> {
  const { data: dep } = await supabase
    .from("departures")
    .select("available_seats")
    .eq("id", departureId)
    .single();

  if (!dep) return;

  await supabase
    .from("departures")
    .update({ available_seats: (dep.available_seats ?? 0) + count })
    .eq("id", departureId);
}

// ─── Coupon Validation ────────────────────────────────────────────────────────

export interface CouponResult {
  valid: boolean;
  couponId?: string;
  discountAmount: number;
  message: string;
}

export async function validateCoupon(code: string, baseAmount: number): Promise<CouponResult> {
  const { data: coupon, error } = await supabase
    .from("coupons")
    .select(
      "id, code, discount_type, discount_value, min_amount, max_discount_amount, max_redemptions, current_redemptions, valid_until, is_active",
    )
    .eq("code", code.toUpperCase().trim())
    .eq("is_active", true)
    .maybeSingle();

  if (error || !coupon) {
    return { valid: false, discountAmount: 0, message: "Invalid or expired coupon code." };
  }

  // Check expiry
  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
    return { valid: false, discountAmount: 0, message: "This coupon has expired." };
  }

  // Check usage limit
  if (coupon.max_redemptions !== null && coupon.current_redemptions >= coupon.max_redemptions) {
    return { valid: false, discountAmount: 0, message: "This coupon has reached its usage limit." };
  }

  // Check minimum amount
  const minAmount = ((coupon as Record<string, unknown>).min_amount as number) ?? 0;
  if (baseAmount < minAmount) {
    return {
      valid: false,
      discountAmount: 0,
      message: `Minimum order amount of ₹${minAmount} required.`,
    };
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discount_type === "PERCENTAGE" || coupon.discount_type === "PERCENT") {
    discountAmount = Math.round((baseAmount * coupon.discount_value) / 100);
  } else {
    discountAmount = coupon.discount_value;
  }

  // Cap at max_discount_amount
  if (coupon.max_discount_amount) {
    discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
  }
  discountAmount = Math.min(discountAmount, baseAmount);

  return {
    valid: true,
    couponId: coupon.id,
    discountAmount,
    message: `✓ Coupon applied! You save ₹${discountAmount.toLocaleString("en-IN")}.`,
  };
}

// ─── Confirm Booking (called from webhook after payment success) ──────────────

/**
 * Atomically confirms a booking after payment verification.
 * Called from the Cashfree webhook handler (using supabaseAdmin).
 *
 * Steps:
 *  1. Update booking → CONFIRMED
 *  2. Insert payment record
 *  3. Insert transaction record
 *  4. Update departure available_seats
 *  5. Update customer stats
 *  6. Add booking timeline event
 *  7. Create admin notification
 */
export async function confirmBookingAfterPayment(
  input: ConfirmBookingInput,
  adminClient: SupabaseClient,
): Promise<void> {
  // Normalize gateway-agnostic fields
  const gateway = input.gateway ?? (input.cashfreeOrderId ? "cashfree" : "razorpay");
  const orderId = input.orderId ?? input.cashfreeOrderId ?? "";
  const paymentId = input.paymentId ?? input.cashfreePaymentId ?? "";
  const { bookingId, amountPaid, gatewayResponse, signature } = input;

  // 1. Fetch booking
  const { data: booking, error: fetchErr } = await adminClient
    .from("bookings")
    .select("id, customer_id, departure_id, total_amount, traveller_count, booking_status")
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking) {
    throw new Error(`Booking not found: ${fetchErr?.message}`);
  }

  // Idempotency: skip if already CONFIRMED
  if (booking.booking_status === "CONFIRMED") {
    console.log(`[BookingAPI] Booking ${bookingId} already CONFIRMED, skipping`);
    return;
  }

  // 2. Update booking to CONFIRMED — use gateway-specific columns
  const gatewayBookingFields: Record<string, string> =
    gateway === "razorpay"
      ? {
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature ?? "",
          transaction_id: paymentId,
        }
      : {
          cashfree_order_id: orderId,
          cashfree_payment_id: paymentId,
          transaction_id: paymentId,
        };

  await adminClient
    .from("bookings")
    .update({
      status: "CONFIRMED",
      booking_status: "CONFIRMED",
      payment_status: "SUCCESS",
      amount_paid: amountPaid,
      balance_due: Math.max(0, (booking.total_amount ?? 0) - amountPaid),
      updated_at: new Date().toISOString(),
      ...gatewayBookingFields,
    })
    .eq("id", bookingId);

  // 3. Insert payment record using generic gateway columns
  await adminClient.from("payments").insert({
    booking_id: bookingId,
    amount: amountPaid,
    currency: "INR",
    status: "SUCCESS",
    payment_type: "ONLINE",
    payment_gateway: gateway,
    gateway_order_id: orderId,
    gateway_payment_id: paymentId,
    gateway_signature: signature ?? null,
  });

  // 4. Insert transaction record (raw gateway response)
  await adminClient.from("transactions").insert({
    booking_id: bookingId,
    gateway,
    order_id: orderId,
    gateway_payment_id: paymentId,
    amount: amountPaid,
    currency: "INR",
    status: "SUCCESS",
    gateway_response: gatewayResponse ?? null,
  });

  // 5. Decrement departure available_seats
  if (booking.departure_id) {
    const { data: dep } = await adminClient
      .from("departures")
      .select("available_seats")
      .eq("id", booking.departure_id)
      .single();

    if (dep) {
      await adminClient
        .from("departures")
        .update({
          available_seats: Math.max(0, (dep.available_seats ?? 0) - (booking.traveller_count ?? 1)),
        })
        .eq("id", booking.departure_id);
    }
  }

  // 6. Update customer stats
  if (booking.customer_id) {
    const { data: customer } = await adminClient
      .from("customers")
      .select("total_bookings, total_spent")
      .eq("id", booking.customer_id)
      .single();

    if (customer) {
      await adminClient
        .from("customers")
        .update({
          total_bookings: (customer.total_bookings ?? 0) + 1,
          total_spent: (customer.total_spent ?? 0) + amountPaid,
          last_booking_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.customer_id);
    }
  }

  // 7. Add booking timeline event
  await adminClient.from("booking_timeline").insert({
    booking_id: bookingId,
    event: "PAYMENT_SUCCESS",
    description: `Payment of ₹${amountPaid} confirmed via ${gateway}`,
    actor: "SYSTEM",
    metadata: { gateway, gateway_payment_id: paymentId, order_id: orderId },
  });

  // 8. Create admin notification
  await adminClient.from("notifications").insert({
    recipient_type: "ADMIN",
    title: "💰 New Booking Confirmed",
    message: `Booking confirmed via ${gateway}. Amount: ₹${amountPaid.toLocaleString("en-IN")}`,
    type: "SUCCESS",
    related_booking_id: bookingId,
  });
}
