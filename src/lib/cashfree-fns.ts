/**
 * cashfree-fns.ts
 *
 * TanStack Start server functions for Cashfree payment integration.
 *
 * Flow:
 *  1. Frontend calls createCashfreeOrderFn → gets payment_session_id
 *  2. Frontend opens Cashfree SDK checkout modal
 *  3. On payment success, Cashfree webhook hits /api/cashfree/webhook
 *  4. Webhook verifies signature and updates booking to "Successful"
 *
 * Environment Variables required in .env:
 *   CASHFREE_APP_ID=your_app_id
 *   CASHFREE_SECRET_KEY=your_secret_key
 *   CASHFREE_ENVIRONMENT=SANDBOX  (or PRODUCTION)
 *   VITE_CASHFREE_APP_ID=your_app_id  (for frontend SDK)
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "./supabase";

// ─── Config ───────────────────────────────────────────────────────────────────

const CASHFREE_ENV = process.env.CASHFREE_ENVIRONMENT ?? "SANDBOX";
const CASHFREE_API_BASE =
  CASHFREE_ENV === "PRODUCTION"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const CASHFREE_HEADERS = {
  "x-api-version": "2023-08-01",
  "x-client-id": process.env.CASHFREE_APP_ID ?? "",
  "x-client-secret": process.env.CASHFREE_SECRET_KEY ?? "",
  "Content-Type": "application/json",
};

// ─── STEP 1: Save Pending Booking to Supabase ─────────────────────────────────

const savePendingBookingSchema = z.object({
  tripId: z.string().uuid(),
  tripDateId: z.string().uuid().nullable(),
  departureDate: z.string(),
  isCustomDate: z.boolean().default(false),

  // Personal info
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  whatsappSame: z.boolean().default(true),
  whatsappNumber: z.string().optional(),
  address: z.string().optional(),
  age: z.number().int().min(1).max(120).optional(),
  gender: z.string().optional(),
  guardianNumber: z.string().optional(),
  aadharUrl: z.string().url().optional(),
  profileUrl: z.string().url().optional(),
  referredBy: z.string().optional(),
  heardFrom: z.string().optional(),

  // Traveler type
  isSolo: z.boolean().default(false),

  // Pricing
  roomSharing: z.enum(["Double", "Triple", "Quad"]).default("Triple"),
  couponCode: z.string().optional(),
  couponId: z.string().uuid().optional(),
  baseAmount: z.number().positive(),
  discountAmount: z.number().min(0).default(0),
  totalPayable: z.number().positive(),
  paymentSchedule: z.enum(["Full Payment", "Book Slot"]).default("Full Payment"),
  depositAmount: z.number().min(0).optional(),
  balanceDue: z.number().min(0).optional(),
  specialRequests: z.string().optional(),
  termsAccepted: z.boolean(),
});

export type SavePendingBookingInput = z.infer<typeof savePendingBookingSchema>;

export const savePendingBookingFn = createServerFn({ method: "POST" })
  .validator((data: SavePendingBookingInput) => savePendingBookingSchema.parse(data))
  .handler(async ({ data }) => {
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        trip_id: data.tripId,
        trip_date_id: data.tripDateId,
        departure_date: data.departureDate,
        custom_date: data.isCustomDate,

        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        whatsapp_same: data.whatsappSame,
        whatsapp_number: data.whatsappNumber,
        address: data.address,
        age: data.age,
        gender: data.gender,
        guardian_number: data.guardianNumber,
        aadhar_url: data.aadharUrl,
        profile_url: data.profileUrl,
        referred_by: data.referredBy,
        heard_from: data.heardFrom,

        is_solo: data.isSolo,

        room_sharing: data.roomSharing,
        coupon_code: data.couponCode,
        coupon_id: data.couponId,
        base_amount: data.baseAmount,
        discount_amount: data.discountAmount,
        total_payable: data.totalPayable,
        payment_schedule: data.paymentSchedule,
        deposit_amount: data.depositAmount,
        balance_due: data.balanceDue,
        special_requests: data.specialRequests,
        terms_accepted: data.termsAccepted,
        terms_accepted_at: data.termsAccepted ? new Date().toISOString() : null,

        payment_status: "Pending",
        booking_status: "Draft",
      })
      .select("id, booking_id")
      .single();

    if (error || !booking) {
      throw new Error(`Failed to create booking: ${error?.message}`);
    }

    return {
      bookingId: booking.id as string,
      bookingRef: (booking as any).booking_id as string,
    };
  });


// ─── STEP 2: Create Cashfree Order ────────────────────────────────────────────

const createCashfreeOrderSchema = z.object({
  bookingId: z.string().uuid(),
  bookingRef: z.string(),
  amount: z.number().positive(),       // Final payable amount (or deposit)
  customerName: z.string(),
  customerEmail: z.string().email(),
  customerPhone: z.string(),
});

export const createCashfreeOrderFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof createCashfreeOrderSchema>) =>
    createCashfreeOrderSchema.parse(data)
  )
  .handler(async ({ data }) => {
    const orderId = `NM_${data.bookingRef}_${Date.now()}`;

    // Call Cashfree API
    const response = await fetch(`${CASHFREE_API_BASE}/orders`, {
      method: "POST",
      headers: CASHFREE_HEADERS,
      body: JSON.stringify({
        order_id: orderId,
        order_amount: data.amount,
        order_currency: "INR",
        customer_details: {
          customer_id: data.bookingId,
          customer_name: data.customerName,
          customer_email: data.customerEmail,
          customer_phone: data.customerPhone,
        },
        order_meta: {
          return_url: `${process.env.VITE_APP_URL ?? "http://localhost:3000"}/booking/success?booking_id=${data.bookingId}&order_id={order_id}`,
          notify_url: `${process.env.VITE_APP_URL ?? "http://localhost:3000"}/api/cashfree/webhook`,
        },
        order_note: `Nomadik Booking ${data.bookingRef}`,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Cashfree order creation failed: ${JSON.stringify(err)}`);
    }

    const orderData = await response.json();
    const paymentSessionId: string = orderData.payment_session_id;

    // Save Cashfree order ID to booking
    await supabase
      .from("bookings")
      .update({ cashfree_order_id: orderId })
      .eq("id", data.bookingId);

    return {
      orderId,
      paymentSessionId,   // Pass this to Cashfree SDK on the frontend
    };
  });


// ─── STEP 3: Verify Payment (called from webhook or return URL) ────────────────

const verifyPaymentSchema = z.object({
  orderId: z.string(),
  bookingId: z.string().uuid(),
});

export const verifyPaymentFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof verifyPaymentSchema>) =>
    verifyPaymentSchema.parse(data)
  )
  .handler(async ({ data }) => {
    // Check order status from Cashfree
    const response = await fetch(
      `${CASHFREE_API_BASE}/orders/${data.orderId}`,
      { method: "GET", headers: CASHFREE_HEADERS }
    );

    if (!response.ok) {
      throw new Error("Failed to verify payment status with Cashfree");
    }

    const orderData = await response.json();
    const orderStatus: string = orderData.order_status; // PAID | ACTIVE | EXPIRED

    if (orderStatus === "PAID") {
      const cfPaymentId = orderData.cf_order_id?.toString() ?? "";

      await supabase
        .from("bookings")
        .update({
          payment_status: "Successful",
          booking_status: "Confirmed",
          cashfree_payment_id: cfPaymentId,
          transaction_id: cfPaymentId,
        })
        .eq("id", data.bookingId);

      // Decrement available seats
      await supabase.rpc("decrement_trip_date_seats", {
        p_booking_id: data.bookingId,
      }).maybeSingle();

      return { status: "PAID", bookingId: data.bookingId };
    }

    if (orderStatus === "EXPIRED" || orderStatus === "CANCELLED") {
      await supabase
        .from("bookings")
        .update({ payment_status: "Failed", booking_status: "Cancelled" })
        .eq("id", data.bookingId);

      return { status: "FAILED", bookingId: data.bookingId };
    }

    return { status: "PENDING", bookingId: data.bookingId };
  });


// ─── Coupon Validation ─────────────────────────────────────────────────────────

const validateCouponSchema = z.object({
  code: z.string().min(1),
  baseAmount: z.number().positive(),
});

export const validateCouponFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof validateCouponSchema>) =>
    validateCouponSchema.parse(data)
  )
  .handler(async ({ data }) => {
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("id, code, discount_type, discount_value, min_amount, max_uses, used_count, valid_until")
      .eq("code", data.code.toUpperCase().trim())
      .eq("is_active", true)
      .single();

    if (error || !coupon) {
      return { valid: false, message: "Invalid or expired coupon code." };
    }

    // Check expiry
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return { valid: false, message: "This coupon has expired." };
    }

    // Check usage limit
    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      return { valid: false, message: "This coupon has reached its usage limit." };
    }

    // Check minimum amount
    if (data.baseAmount < (coupon.min_amount ?? 0)) {
      return {
        valid: false,
        message: `Minimum order amount of ₹${coupon.min_amount} required for this coupon.`,
      };
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === "PERCENT") {
      discountAmount = Math.round((data.baseAmount * coupon.discount_value) / 100);
    } else {
      discountAmount = coupon.discount_value;
    }

    discountAmount = Math.min(discountAmount, data.baseAmount); // Cap at full amount

    return {
      valid: true,
      couponId: coupon.id as string,
      discountAmount,
      message: `Coupon applied! You save ₹${discountAmount.toLocaleString("en-IN")}.`,
    };
  });
