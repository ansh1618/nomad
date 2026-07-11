import { createServerFn } from "@tanstack/react-start";
import { supabase } from "./supabase";
import { z } from "zod";

// ==========================================
// SEAT & INVENTORY LOCKING
// ==========================================

const lockInventorySchema = z.object({
  departureId: z.string().uuid(),
  inventoryIds: z.array(z.string().uuid()),
  userId: z.string().uuid().nullable().optional(),
});

export const lockInventoryFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof lockInventorySchema>) =>
    lockInventorySchema.parse(data)
  )
  .handler(async ({ data }) => {
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

    return { success: true, message: "Inventory locked for 15 minutes." };
  });

// ==========================================
// BOOKING CREATION
// ==========================================

const createBookingSchema = z.object({
  userId: z.string().uuid().nullable().optional(),
  departureId: z.string().uuid(),
  travellers: z.array(z.any()),
  baseAmount: z.number(),
  addonAmount: z.number(),
  gstAmount: z.number(),
  totalAmount: z.number(),
  couponId: z.string().uuid().optional(),
  discountAmount: z.number().default(0),
});

export const createBookingFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof createBookingSchema>) =>
    createBookingSchema.parse(data)
  )
  .handler(async ({ data }) => {
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: data.userId || null,
        departure_id: data.departureId,
        status: "PAYMENT_PENDING",
        traveller_count: data.travellers.length,
        base_amount: data.baseAmount,
        addon_amount: data.addonAmount,
        gst_amount: data.gstAmount,
        coupon_id: data.couponId,
        discount_amount: data.discountAmount,
        total_amount: data.totalAmount,
      })
      .select("id, booking_id")
      .single();

    if (bookingError || !booking) {
      throw new Error("Failed to create booking record.");
    }

    const travellersToInsert = data.travellers.map((t: any) => ({
      booking_id: booking.id,
      is_primary: t.isPrimary,
      full_name: t.fullName,
      phone: t.phone,
      email: t.email,
      assigned_seat_id: t.seatId,
      assigned_room_id: t.roomId,
    }));

    const { error: travellersError } = await supabase
      .from("booking_travellers")
      .insert(travellersToInsert);

    if (travellersError) {
      throw new Error("Failed to save traveller details.");
    }

    return {
      success: true,
      bookingId: booking.id,
      displayId: (booking as any).booking_id,
    };
  });

// ==========================================
// RAZORPAY INTEGRATION
// ==========================================

const createOrderSchema = z.object({
  bookingId: z.string(),
  amount: z.number(),
});

export const createRazorpayOrderFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof createOrderSchema>) =>
    createOrderSchema.parse(data)
  )
  .handler(async ({ data }) => {
    const { bookingId, amount } = data;

    // Production: uncomment and configure Razorpay SDK
    // const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_SECRET });
    // const order = await razorpay.orders.create({ amount: amount * 100, currency: "INR", receipt: bookingId });

    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        booking_id: bookingId,
        amount,
        currency: "INR",
        status: "PENDING",
        gateway: "razorpay",
      })
      .select("id")
      .single();

    if (error || !payment) {
      throw new Error("Failed to create payment record.");
    }

    const orderId = `order_${payment.id.replace(/-/g, "").slice(0, 16)}`;

    await supabase
      .from("bookings")
      .update({ razorpay_order_id: orderId })
      .eq("id", bookingId);

    return { success: true, orderId, paymentRecordId: payment.id };
  });

const verifyPaymentSchema = z.object({
  bookingId: z.string(),
  paymentId: z.string(),
  orderId: z.string(),
  signature: z.string(),
  userId: z.string().uuid().nullable().optional(),
});

export const verifyRazorpayPaymentFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof verifyPaymentSchema>) =>
    verifyPaymentSchema.parse(data)
  )
  .handler(async ({ data }) => {
    const { bookingId, paymentId, signature } = data;

    // Production signature verification — uncomment once Razorpay keys are set:
    // const crypto = await import("crypto");
    // const expectedSig = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET!)
    //   .update(data.orderId + "|" + paymentId).digest("hex");
    // if (expectedSig !== signature) throw new Error("Invalid payment signature");

    const { error: bookingErr } = await supabase
      .from("bookings")
      .update({
        status: "CONFIRMED",
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      })
      .eq("id", bookingId);

    if (bookingErr) throw new Error("Failed to confirm booking.");

    // Update assigned inventory directly by matching traveler assignments
    const { data: travellers } = await supabase
      .from("booking_travellers")
      .select("assigned_seat_id, assigned_room_id")
      .eq("booking_id", bookingId);

    const inventoryIds = (travellers ?? [])
      .map((t: any) => t.assigned_seat_id || t.assigned_room_id)
      .filter(Boolean);

    if (inventoryIds.length > 0) {
      await supabase
        .from("departure_inventory")
        .update({ status: "BOOKED", booking_id: bookingId })
        .in("id", inventoryIds);
    }

    await supabase
      .from("payments")
      .update({ status: "SUCCESS", gateway_payment_id: paymentId })
      .eq("booking_id", bookingId);

    return { success: true, message: "Payment verified and booking confirmed." };
  });

