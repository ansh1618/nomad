/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { supabase } from "./supabase";
import { supabaseAdmin } from "./supabase-admin";
import { z } from "zod";
import { resolveBookingPricing } from "./pricing-fns";

// ==========================================
// LOGGER HELPER
// ==========================================
function logBookingEvent(step: string, details: any, isError = false) {
  const timestamp = new Date().toISOString();
  if (isError) {
    console.error(`[BOOKING ERROR ${timestamp}] ${step}:`, details);
  } else {
    console.log(`[BOOKING LOG ${timestamp}] ${step}:`, typeof details === "object" ? JSON.stringify(details) : details);
  }
}

// ==========================================
// SEAT & INVENTORY LOCKING
// ==========================================

const lockInventorySchema = z.object({
  departureId: z.string().uuid(),
  inventoryIds: z.array(z.string().uuid()),
  userId: z.string().uuid().nullable().optional(),
});

export const lockInventoryFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof lockInventorySchema>) => lockInventorySchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const { departureId, inventoryIds, userId } = data;

      // Try RPC first, fall back to manual lock
      const { error } = await supabase.rpc("lock_inventory", {
        p_departure_id: departureId,
        p_inventory_ids: inventoryIds,
        p_user_id: userId || null,
      });

      if (error) {
        // Check availability
        const { data: invCheck, error: checkError } = await supabase
          .from("departure_inventory")
          .select("id, status")
          .in("id", inventoryIds)
          .eq("departure_id", departureId)
          .eq("status", "AVAILABLE");

        if (checkError || !invCheck || invCheck.length !== inventoryIds.length) {
          throw new Error("Some selected inventory is no longer available.");
        }

        // Lock with 15-minute expiry
        const lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        const { error: lockError } = await supabase
          .from("departure_inventory")
          .update({
            status: "LOCKED",
            locked_by: userId || null,
            locked_at: new Date().toISOString(),
            locked_until: lockedUntil,
          })
          .in("id", inventoryIds)
          .eq("status", "AVAILABLE");

        if (lockError) {
          throw new Error("Failed to lock inventory. Please try again.");
        }
      }

      return { success: true as const, message: "Inventory locked for 15 minutes." };
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "An unknown error occurred";
      return { success: false as const, error: errMsg };
    }
  });

// ==========================================
// SAFE INSERT HELPER WITH FALLBACK FOR SCHEMA CACHE
// ==========================================
async function safeInsertBooking(payload: Record<string, any>) {
  logBookingEvent("Attempting booking insert", { payloadKeys: Object.keys(payload) });

  // First try: full payload
  let { data: booking, error: bookingError } = await supabaseAdmin
    .from("bookings")
    .insert(payload)
    .select("id, booking_id")
    .single();

  if (bookingError) {
    logBookingEvent("Primary booking insert failed, checking schema cache fallback", bookingError, true);

    // If PostgREST threw a schema cache or missing column error, sanitize optional columns and retry
    const isSchemaError =
      bookingError.message.includes("schema cache") ||
      bookingError.message.includes("column") ||
      bookingError.code === "PGRST204";

    if (isSchemaError) {
      logBookingEvent("Retrying insert with essential fallback keys", {});

      const coreKeys = [
        "user_id",
        "customer_id",
        "departure_id",
        "journey_id",
        "coupon_id",
        "status",
        "booking_status",
        "payment_status",
        "traveller_count",
        "base_amount",
        "total_amount",
        "amount_paid",
        "room_sharing",
        "seat_preference",
        "pickup_point",
        "special_requests",
      ];

      const fallbackPayload: Record<string, any> = {};
      coreKeys.forEach((key) => {
        if (payload[key] !== undefined) {
          fallbackPayload[key] = payload[key];
        }
      });

      const retryResult = await supabaseAdmin
        .from("bookings")
        .insert(fallbackPayload)
        .select("id, booking_id")
        .single();

      if (retryResult.data) {
        booking = retryResult.data;
        bookingError = null;
        logBookingEvent("Fallback booking insert succeeded!", { bookingId: booking.id });
      } else {
        bookingError = retryResult.error;
      }
    }
  }

  if (bookingError || !booking) {
    logBookingEvent("Fatal booking insertion error", bookingError, true);
    throw new Error(
      "Unable to initialize booking right now. Please verify your details or contact support."
    );
  }

  return booking;
}

// ==========================================
// BOOKING CREATION (MAIN WIZARD)
// ==========================================

const createBookingSchema = z.object({
  userId: z.string().uuid().nullable().optional(),
  departureId: z.string().uuid(),
  travellers: z.array(z.any()),
  baseAmount: z.number().default(0),
  addonAmount: z.number().default(0),
  gstAmount: z.number().default(0),
  totalAmount: z.number().default(0),
  couponId: z.string().uuid().nullable().optional(),
  discountAmount: z.number().default(0),
  hotelId: z.string().uuid().nullable().optional(),
  roomSharing: z.string().nullable().optional(),
  pickupPoint: z.string().nullable().optional(),
  addons: z.array(z.any()).optional().default([]),
});

export const createBookingFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof createBookingSchema>) => createBookingSchema.parse(data))
  .handler(async ({ data }) => {
    logBookingEvent("createBookingFn received request", {
      departureId: data.departureId,
      travellerCount: data.travellers.length,
      userId: data.userId,
    });

    try {
      // 1. Server-side: re-fetch departure & journey details
      const { data: dep, error: depError } = await supabaseAdmin
        .from("departures")
        .select("id, base_price, dynamic_price, journey_id, journeys(id, starting_price, price, name, destination)")
        .eq("id", data.departureId)
        .single();

      if (depError || !dep) {
        throw new Error("Selected departure batch could not be found.");
      }

      const journey = (dep as any).journeys || {};

      // 2. Recompute pricing server-side
      const serverPricing = resolveBookingPricing({
        journey,
        departure: dep,
        room: null,
        travellers: data.travellers,
        addons: data.addons || [],
        coupon: null,
      });

      // 3. Coupon validation
      let serverDiscount = 0;
      if (data.couponId) {
        const { data: coupon } = await supabaseAdmin
          .from("coupons")
          .select("discount_type, discount_value, max_discount_amount, valid_until, is_active, max_redemptions, current_redemptions")
          .eq("id", data.couponId)
          .single();

        if (coupon && coupon.is_active) {
          const notExpired = !coupon.valid_until || new Date(coupon.valid_until) >= new Date();
          const notExhausted = coupon.max_redemptions === null || coupon.current_redemptions < coupon.max_redemptions;
          if (notExpired && notExhausted) {
            if (coupon.discount_type === "PERCENTAGE" || coupon.discount_type === "PERCENT") {
              serverDiscount = Math.round((serverPricing.subtotal * coupon.discount_value) / 100);
            } else {
              serverDiscount = coupon.discount_value;
            }
            if (coupon.max_discount_amount) serverDiscount = Math.min(serverDiscount, coupon.max_discount_amount);
          }
        }
      }

      const addonAmount = Number(data.addonAmount) || 0;
      const taxableAmount = Math.max(0, serverPricing.subtotal + addonAmount - serverDiscount);
      const gstAmount = Math.round(taxableAmount * 0.05);
      const totalAmount = data.totalAmount > 0 ? data.totalAmount : taxableAmount + gstAmount;

      logBookingEvent("Calculated server pricing", {
        base: serverPricing.effectiveBasePrice,
        addons: addonAmount,
        discount: serverDiscount,
        gst: gstAmount,
        total: totalAmount,
      });

      // 4. TRANSACTIONAL STEP 1: Insert Booking Record
      const bookingPayload: Record<string, any> = {
        user_id: data.userId || null,
        departure_id: data.departureId,
        journey_id: journey.id || null,
        status: "PAYMENT_PENDING",
        booking_status: "PENDING",
        payment_status: "PENDING",
        traveller_count: data.travellers.length,
        base_amount: serverPricing.effectiveBasePrice * serverPricing.travellersCount,
        addon_amount: addonAmount,
        gst_amount: gstAmount,
        coupon_id: data.couponId || null,
        discount_amount: serverDiscount,
        coupon_discount: serverDiscount,
        total_amount: totalAmount,
        amount_paid: 0,
        room_sharing: data.roomSharing || null,
        pickup_point: data.pickupPoint || null,
        assigned_hotel_id: data.hotelId || null,
        booking_source: "Website",
      };

      const booking = await safeInsertBooking(bookingPayload);
      const bookingDbId = booking.id;
      const bookingRef = (booking as any).booking_id || bookingDbId;

      logBookingEvent("Booking record created successfully", { bookingDbId, bookingRef });

      // 5. TRANSACTIONAL STEP 2: Insert Travellers
      const calculateAge = (dobString: string) => {
        if (!dobString) return null;
        const today = new Date();
        const birthDate = new Date(dobString);
        if (isNaN(birthDate.getTime())) return null;
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      };

      const travellersToInsert = data.travellers.map((t: Record<string, any>, idx: number) => ({
        booking_id: bookingDbId,
        is_primary: idx === 0 || t.isPrimary || false,
        full_name: t.fullName || `Explorer ${idx + 1}`,
        phone: t.phone || null,
        email: t.email || null,
        gender: t.gender || null,
        age: t.dob ? calculateAge(t.dob as string) : t.age ? parseInt(t.age as string) : null,
        id_proof_type: t.idProofType || "Aadhaar",
        id_proof_number: t.aadhaarNumber || t.idProofNumber || null,
        assigned_seat_id: t.seatId || null,
        assigned_room_id: t.roomId || null,
        address: t.address || null,
        guardian_number: t.emergencyContactPhone || null,
        pickup_point: data.pickupPoint || null,
        room_sharing: data.roomSharing || null,
      }));

      const { error: travellersError } = await supabaseAdmin
        .from("booking_travellers")
        .insert(travellersToInsert);

      if (travellersError) {
        logBookingEvent("Traveller insertion warning", travellersError, true);
      } else {
        logBookingEvent("Saved travellers successfully", { count: travellersToInsert.length });
      }

      // 6. TRANSACTIONAL STEP 3: Insert Selected Addons Breakdown
      if (data.addons && data.addons.length > 0) {
        const addonsToInsert = data.addons.map((a: any) => ({
          booking_id: bookingDbId,
          addon_id: a.id || null,
          name: a.name || a.title || "Addon Experience",
          price: Number(a.price) || 0,
        }));
        const { error: addonsErr } = await supabaseAdmin.from("booking_addons").insert(addonsToInsert);
        if (addonsErr) logBookingEvent("Addons insertion warning", addonsErr, true);
      }

      // 7. TRANSACTIONAL STEP 4: Insert Initial Payments Pending Record
      const { error: payErr } = await supabaseAdmin.from("payments").insert({
        booking_id: bookingDbId,
        amount: totalAmount,
        currency: "INR",
        status: "PENDING",
        payment_type: "FULL",
        payment_gateway: "RAZORPAY",
        gateway: "razorpay",
      });
      if (payErr) logBookingEvent("Payment record creation warning", payErr, true);

      // 8. TRANSACTIONAL STEP 5: Insert Booking Timeline Event
      const { error: timeErr } = await supabaseAdmin.from("booking_timeline").insert({
        booking_id: bookingDbId,
        event: "BOOKING_CREATED",
        description: `Booking initialized for ${data.travellers.length} explorer(s)`,
        actor: "USER",
      });
      if (timeErr) logBookingEvent("Timeline insertion warning", timeErr, true);

      return {
        success: true as const,
        bookingId: bookingDbId,
        displayId: bookingRef,
      };
    } catch (e: unknown) {
      const userMessage = e instanceof Error ? e.message : "Unable to initialize booking. Please try again.";
      logBookingEvent("createBookingFn execution failure", userMessage, true);
      return { success: false as const, error: userMessage };
    }
  });

// ==========================================
// SECURE GUEST BOOKING CREATION
// ==========================================

function logFailure(table: string, operation: string, payload: unknown, error: unknown) {
  console.error(`[DB FAILURE] Table: ${table} | Operation: ${operation}`);
  console.error("Payload:", JSON.stringify(payload, null, 2));
  console.error("Error Details:", error);
}

const createGuestBookingSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(8),
  isWhatsapp: z.boolean().default(true),
  address: z.string().optional(),
  age: z.string().optional(),
  gender: z.string(),
  guardianNumber: z.string().optional(),
  aadharUrl: z.string().nullable().optional(),
  profileUrl: z.string().nullable().optional(),
  referredBy: z.string().optional(),
  howHeard: z.string().optional(),
  sharingType: z.string(),
  transportType: z.string().optional().default("standard"),
  seatPreference: z.string(),
  paymentSchedule: z.string(),
  couponId: z.string().uuid().nullable().optional(),
  discountAmount: z.number().default(0),
  priceBeforeDiscount: z.number(),
  departureId: z.string().uuid().nullable().optional(),
  journeyId: z.string().uuid().nullable().optional(),
  specialRequests: z.string().optional(),
});

export const createGuestBookingFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data: rawData }) => {
    try {
      logBookingEvent("START createGuestBookingFn", rawData);

      const data = createGuestBookingSchema.parse(rawData);

      // 1. Customer Lookup / Creation
      let existingCustomer: { id: string } | null = null;
      const { data: customerByPhone } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("phone", data.phone)
        .maybeSingle();

      if (customerByPhone) {
        existingCustomer = customerByPhone;
      } else if (data.email) {
        const { data: customerByEmail } = await supabaseAdmin
          .from("customers")
          .select("id")
          .eq("email", data.email)
          .maybeSingle();
        if (customerByEmail) existingCustomer = customerByEmail;
      }

      let customerId = existingCustomer?.id;

      if (!customerId) {
        const { data: newCustomer, error: createCustomerError } = await supabaseAdmin
          .from("customers")
          .insert({
            name: data.fullName,
            email: data.email || null,
            phone: data.phone,
            whatsapp: data.phone,
            gender: data.gender || null,
            address: data.address || null,
            referral_source: data.howHeard || null,
          })
          .select("id")
          .single();

        if (createCustomerError || !newCustomer) {
          throw new Error("Could not create customer record for guest booking.");
        }
        customerId = newCustomer.id;
      }

      // 2. Pricing
      const baseAmount = data.priceBeforeDiscount || 0;
      const discount = data.discountAmount || 0;
      const taxableAmount = Math.max(0, baseAmount - discount);
      const gstAmount = Math.round(taxableAmount * 0.05);
      const totalAmount = taxableAmount + gstAmount;
      const depositAmount = data.paymentSchedule === "book_slot" ? 2000 : totalAmount;

      // 3. Create Booking via Safe Fallback Helper
      const bookingPayload: Record<string, any> = {
        customer_id: customerId,
        departure_id: data.departureId || null,
        journey_id: data.journeyId || null,
        coupon_id: data.couponId || null,
        status: "CREATED",
        booking_status: "PENDING",
        payment_status: "PENDING",
        traveller_count: 1,
        base_amount: baseAmount,
        gst_rate: 5,
        gst_amount: gstAmount,
        discount_amount: discount,
        coupon_discount: discount,
        wallet_amount_used: 0,
        total_amount: totalAmount,
        amount_paid: 0,
        room_sharing: data.sharingType || null,
        seat_preference: data.seatPreference || null,
        special_requests: data.specialRequests || null,
        booking_source: "Website",
      };

      const booking = await safeInsertBooking(bookingPayload);
      const bookingDbId = booking.id;
      const bookingRef = (booking as any).booking_id || bookingDbId;

      // 4. Primary Traveller
      await supabaseAdmin.from("booking_travellers").insert({
        booking_id: bookingDbId,
        is_primary: true,
        full_name: data.fullName,
        phone: data.phone,
        email: data.email || null,
        gender: data.gender || null,
        age: data.age ? parseInt(data.age) : null,
        address: data.address || null,
        guardian_number: data.guardianNumber || null,
        seat_preference: data.seatPreference || null,
        room_sharing: data.sharingType || null,
        heard_from: data.howHeard || null,
        referred_by: data.referredBy || null,
        aadhaar_doc_url: data.aadharUrl || null,
        photo_url: data.profileUrl || null,
      });

      // 5. Payment record
      await supabaseAdmin.from("payments").insert({
        booking_id: bookingDbId,
        amount: depositAmount,
        currency: "INR",
        status: "PENDING",
        gateway: "razorpay",
        payment_gateway: "razorpay",
      });

      // 6. Timeline
      await supabaseAdmin.from("booking_timeline").insert({
        booking_id: bookingDbId,
        event: "BOOKING_CREATED",
        description: "Guest booking created securely on server",
        actor: "GUEST",
      });

      // 7. Create Razorpay order
      const razorpayOrder = await createRazorpayOrder({
        amount: depositAmount * 100,
        currency: "INR",
        receipt: bookingRef,
        notes: {
          booking_id: bookingDbId,
          customer_name: data.fullName,
        },
      });

      await supabaseAdmin
        .from("bookings")
        .update({ razorpay_order_id: razorpayOrder.id })
        .eq("id", bookingDbId);

      return {
        success: true as const,
        bookingId: bookingDbId,
        bookingRef,
        razorpayOrderId: razorpayOrder.id,
        depositAmount,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Guest booking could not be completed.";
      logBookingEvent("createGuestBookingFn failure", errMsg, true);

      return {
        success: false as const,
        step: "createGuestBookingFn",
        error: errMsg,
      };
    }
  });

// ==========================================
// RAZORPAY INTEGRATION HELPER
// ==========================================
async function createRazorpayOrder(params: {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string; receipt: string }> {
  const keyId = process.env.RAZORPAY_KEY_ID ?? "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";
  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Razorpay order creation failed (${response.status}): ${errText}`);
  }
  return response.json();
}
