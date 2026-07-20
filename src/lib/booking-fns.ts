import { createServerFn } from "@tanstack/react-start";
import { supabase } from "./supabase";
import { supabaseAdmin } from "./supabase-admin";
import { z } from "zod";
import { resolveBookingPricing } from "./pricing-fns";

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
  hotelId: z.string().uuid().nullable().optional(),
});

export const createBookingFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof createBookingSchema>) => createBookingSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      // ── Server-side: re-fetch departure to recompute price (never trust client) ──
      const { data: dep } = await supabaseAdmin
        .from("departures")
        .select("id, base_price, dynamic_price, journey_id, packages(starting_price)")
        .eq("id", data.departureId)
        .single();

      // Validate departure belongs to some journey (basic sanity check)
      if (!dep) {
        throw new Error(`Departure ${data.departureId} not found. Cannot create booking.`);
      }

      // Recompute pricing server-side
      const serverPricing = resolveBookingPricing({
        journey: (dep as any).packages || {},
        departure: dep,
        room: null, // room modifier handled separately
        travellers: data.travellers,
        addons: [], // addons recalculated from addonAmount
        coupon: null, // coupon recalculated from couponId
      });

      // Re-validate coupon if provided
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

      // Add any addons passed from client (trusted since they're read-only selects)
      const addonAmount = Number(data.addonAmount) || 0;
      const taxableAmount = Math.max(0, serverPricing.subtotal + addonAmount - serverDiscount);
      const gstAmount = Math.round(taxableAmount * 0.05);
      const totalAmount = taxableAmount + gstAmount;

      console.log(`[createBookingFn] Pricing — base: ${serverPricing.effectiveBasePrice}, addons: ${addonAmount}, discount: ${serverDiscount}, gst: ${gstAmount}, total: ${totalAmount}`);

      const { data: booking, error: bookingError } = await supabaseAdmin
        .from("bookings")
        .insert({
          user_id: data.userId || null,
          departure_id: data.departureId,
          status: "PAYMENT_PENDING",
          traveller_count: data.travellers.length,
          base_amount: serverPricing.effectiveBasePrice * serverPricing.travellersCount,
          addon_amount: addonAmount,
          gst_amount: gstAmount,
          coupon_id: data.couponId,
          discount_amount: serverDiscount,
          total_amount: totalAmount,
          assigned_hotel_id: data.hotelId || null,
        })
        .select("id, booking_id")
        .single();

      if (bookingError || !booking) {
        throw new Error("Failed to create booking record.");
      }

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

      const travellersToInsert = data.travellers.map((t: Record<string, unknown>) => ({
        booking_id: booking.id,
        is_primary: t.isPrimary || false,
        full_name: t.fullName,
        phone: t.phone || null,
        email: t.email || null,
        gender: t.gender || null,
        age: t.dob ? calculateAge(t.dob as string) : t.age ? parseInt(t.age as string) : null,
        id_proof_type: "Aadhaar",
        id_proof_number: t.aadhaarNumber || null,
        assigned_seat_id: t.seatId || null,
        assigned_room_id: t.roomId || null,
        address: t.address || null,
        guardian_number: t.emergencyContactPhone || null,
      }));

      const { error: travellersError } = await supabase
        .from("booking_travellers")
        .insert(travellersToInsert);

      if (travellersError) {
        throw new Error("Failed to save traveller details.");
      }

      return {
        success: true as const,
        bookingId: booking.id,
        displayId: (booking as { booking_id: string }).booking_id,
      };
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "An unknown error occurred";
      return { success: false as const, error: errMsg };
    }
  });

// ==========================================
// RAZORPAY INTEGRATION — Server Functions
// ==========================================

/**
 * Helper: Call Razorpay REST API with Basic Auth.
 * Returns the raw JSON order object on success.
 */
async function createRazorpayOrder(params: {
  amount: number; // in paise (INR × 100)
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

// ==========================================
// SECURE GUEST BOOKING CREATION
// ==========================================

function logFailure(table: string, operation: string, payload: unknown, error: unknown) {
  console.error(`[DB FAILURE] Table: ${table} | Operation: ${operation}`);
  console.error("Payload:", JSON.stringify(payload, null, 2));
  console.error("Error Details:", error);
  const stack = new Error().stack;
  console.error("Stack trace:", stack);
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
  .validator((data: unknown) => data) // Accept anything so validator never throws natively
  .handler(async ({ data: rawData }) => {
    try {
      console.log(`\n[DEBUG] === START createGuestBookingFn ===`);
      console.log(`[DEBUG] Incoming raw payload:`, JSON.stringify(rawData, null, 2));

      // 0. Zod Validation (inside try-catch so errors return as JSON)
      const data = createGuestBookingSchema.parse(rawData);
      console.log(`[DEBUG] Zod validation passed. Parsed data:`, JSON.stringify(data, null, 2));

      // 1. Check if customer already exists by phone or email
      console.log(`[DEBUG] Step 1: Customer lookup`);
      let existingCustomer: { id: string } | null = null;

      console.log(`[DEBUG] Searching customer by phone: ${data.phone}`);
      const { data: customerByPhone, error: phoneSearchError } = await supabaseAdmin
        .from("customers")
        .select("*")
        .eq("phone", data.phone)
        .maybeSingle();

      if (phoneSearchError) {
        logFailure("customers", "SELECT_BY_PHONE", { phone: data.phone }, phoneSearchError);
      }

      if (customerByPhone) {
        console.log(`[DEBUG] Found customer by phone: ${customerByPhone.id}`);
        existingCustomer = customerByPhone;
      } else if (data.email) {
        console.log(`[DEBUG] Searching customer by email: ${data.email}`);
        const { data: customerByEmail, error: emailSearchError } = await supabaseAdmin
          .from("customers")
          .select("*")
          .eq("email", data.email)
          .maybeSingle();

        if (emailSearchError) {
          logFailure("customers", "SELECT_BY_EMAIL", { email: data.email }, emailSearchError);
        }
        if (customerByEmail) {
          console.log(`[DEBUG] Found customer by email: ${customerByEmail.id}`);
          existingCustomer = customerByEmail;
        }
      }

      let customerId = existingCustomer?.id;

      if (!customerId) {
        console.log(`[DEBUG] Step 2: Creating new customer`);
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
          console.error(`[DEBUG] Failed to create customer:`, createCustomerError);
          logFailure("customers", "INSERT", { phone: data.phone }, createCustomerError);
          throw new Error(`Failed to create customer: ${createCustomerError?.message}`);
        }
        customerId = newCustomer.id;
        console.log(`[DEBUG] Created new customer: ${customerId}`);
      } else {
        console.log(`[DEBUG] Using existing customer: ${customerId}`);
      }

      // 3. Calculate GST and Final Amounts
      console.log(`[DEBUG] Step 3: Calculating amounts`);
      const gstRate = 5;
      const baseAmount = data.priceBeforeDiscount || 0;
      const discount = data.discountAmount || 0;
      const taxableAmount = Math.max(0, baseAmount - discount);
      const gstAmount = Math.round(taxableAmount * (gstRate / 100));
      const totalAmount = taxableAmount + gstAmount;

      const depositAmount = data.paymentSchedule === "book_slot" ? 2000 : totalAmount;
      const balanceDue = Math.max(0, totalAmount - depositAmount);

      console.log(
        `[DEBUG] Amounts: Base=${baseAmount}, Discount=${discount}, Taxable=${taxableAmount}, GST=${gstAmount}, Total=${totalAmount}, Deposit=${depositAmount}, Balance=${balanceDue}`,
      );

      // 4. Create PENDING booking
      console.log(`[DEBUG] Step 4: Creating pending booking`);
      const { data: booking, error: bookingError } = await supabaseAdmin
        .from("bookings")
        .insert({
          customer_id: customerId,
          departure_id: data.departureId || null,
          journey_id: data.journeyId || null,
          coupon_id: data.couponId || null,
          status: "CREATED",
          booking_status: "PENDING",
          payment_status: "PENDING",
          traveller_count: 1,
          base_amount: baseAmount,
          gst_rate: gstRate,
          gst_amount: gstAmount,
          discount_amount: discount,
          coupon_discount: discount,
          wallet_amount_used: 0,
          total_amount: totalAmount,
          amount_paid: 0,
          // DO NOT insert balance_due here — it is a GENERATED ALWAYS column in some schema versions.
          // It will be updated after booking creation via a separate UPDATE.
          room_sharing: data.sharingType || null,
          seat_preference: data.seatPreference || null,
          special_requests: data.specialRequests || null,
        })
        .select("id, booking_id")
        .single();

      if (bookingError || !booking) {
        console.error(`[DEBUG] Failed to create booking record:`, bookingError);
        logFailure("bookings", "INSERT", { customerId }, bookingError);
        throw new Error(`Failed to create pending booking: ${bookingError?.message}`);
      }

      const bookingDbId = booking.id;
      const bookingRef = (booking as { booking_id: string }).booking_id;
      console.log(`[DEBUG] Created booking: ID=${bookingDbId}, Ref=${bookingRef}`);

      // 4b. Create primary traveller
      console.log(`[DEBUG] Step 4b: Creating primary traveller`);
      const { error: travellerError } = await supabaseAdmin.from("booking_travellers").insert({
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

      if (travellerError) {
        console.error(`[DEBUG] Failed to create primary traveller:`, travellerError);
        logFailure("booking_travellers", "INSERT", { booking_id: bookingDbId }, travellerError);
        throw new Error(`Failed to create primary traveller: ${travellerError.message}`);
      }
      console.log(`[DEBUG] Primary traveller created successfully`);

      // 5. Create PENDING payment record
      console.log(`[DEBUG] Step 5: Creating pending payment record`);
      const { error: paymentError } = await supabaseAdmin.from("payments").insert({
        booking_id: bookingDbId,
        amount: depositAmount,
        currency: "INR",
        status: "PENDING",
        // `gateway` column added by migration v16; `payment_gateway` is the old column name
        gateway: "razorpay",
        payment_gateway: "razorpay",
      });

      if (paymentError) {
        console.error(`[DEBUG] Failed to create pending payment:`, paymentError);
        logFailure("payments", "INSERT", { booking_id: bookingDbId }, paymentError);
        throw new Error(`Failed to create pending payment record: ${paymentError.message}`);
      }
      console.log(`[DEBUG] Pending payment created successfully`);

      // 6. Create booking timeline event
      console.log(`[DEBUG] Step 6: Creating booking timeline event`);
      const { error: timelineError } = await supabaseAdmin.from("booking_timeline").insert({
        booking_id: bookingDbId,
        event: "BOOKING_CREATED",
        description: "Customer completed booking form securely on server",
        actor: "SYSTEM",
      });

      if (timelineError) {
        console.error(`[DEBUG] Failed to create timeline event:`, timelineError);
        logFailure("booking_timeline", "INSERT", { booking_id: bookingDbId }, timelineError);
      }
      console.log(`[DEBUG] Timeline event created successfully`);

      // ─── Step 7: Server-side price validation ───────────────────────────────
      // SECURITY: Re-calculate the amount on the server using departure base_price.
      // This prevents any client-side amount tampering.
      console.log(`[DEBUG] Step 7: Server-side price validation`);
      let serverBasePrice = data.priceBeforeDiscount; // fallback to client value

      if (data.departureId) {
        const { data: dep } = await supabaseAdmin
          .from("departures")
          .select("base_price")
          .eq("id", data.departureId)
          .single();
        if (dep?.base_price) {
          serverBasePrice = dep.base_price;
          // Apply sharing modifier
          if (data.sharingType === "double") serverBasePrice += 800;
          else if (data.sharingType === "triple") serverBasePrice += 500;
          // Apply transport modifier
          if (data.transportType === "sleeper") serverBasePrice += 1000;
          console.log(`[DEBUG] Server-calculated base price: ${serverBasePrice}`);
        }
      }

      // Re-validate coupon server-side if provided
      let serverDiscount = 0;
      if (data.couponId) {
        const { data: coupon } = await supabaseAdmin
          .from("coupons")
          .select(
            "discount_type, discount_value, max_discount_amount, valid_until, is_active, max_redemptions, current_redemptions",
          )
          .eq("id", data.couponId)
          .single();
        if (coupon && coupon.is_active) {
          const notExpired = !coupon.valid_until || new Date(coupon.valid_until) >= new Date();
          const notExhausted =
            coupon.max_redemptions === null || coupon.current_redemptions < coupon.max_redemptions;
          if (notExpired && notExhausted) {
            if (coupon.discount_type === "PERCENTAGE" || coupon.discount_type === "PERCENT") {
              serverDiscount = Math.round((serverBasePrice * coupon.discount_value) / 100);
            } else {
              serverDiscount = coupon.discount_value;
            }
            if (coupon.max_discount_amount)
              serverDiscount = Math.min(serverDiscount, coupon.max_discount_amount);
            serverDiscount = Math.min(serverDiscount, serverBasePrice);
          }
        }
      }

      const serverTaxable = Math.max(0, serverBasePrice - serverDiscount);
      const serverGst = Math.round(serverTaxable * 0.05);
      const serverTotal = serverTaxable + serverGst;
      const serverDeposit = data.paymentSchedule === "book_slot" ? 2000 : serverTotal;

      console.log(
        `[DEBUG] Server amounts — base: ${serverBasePrice}, discount: ${serverDiscount}, taxable: ${serverTaxable}, gst: ${serverGst}, total: ${serverTotal}, deposit: ${serverDeposit}`,
      );

      // ─── Step 8: Create Razorpay order ──────────────────────────────────────
      console.log(`[DEBUG] Step 8: Creating Razorpay order via API`);
      const razorpayOrder = await createRazorpayOrder({
        amount: serverDeposit * 100, // Razorpay expects paise
        currency: "INR",
        receipt: bookingRef,
        notes: {
          booking_id: bookingDbId,
          customer_name: data.fullName,
        },
      });

      const razorpayOrderId = razorpayOrder.id;
      console.log(`[DEBUG] Razorpay order created: ${razorpayOrderId}`);

      // ─── Step 9: Update razorpay_order_id in booking ────────────────────────
      console.log(`[DEBUG] Step 9: Saving razorpay_order_id to booking`);
      const { error: updateOrderError } = await supabaseAdmin
        .from("bookings")
        .update({ razorpay_order_id: razorpayOrderId })
        .eq("id", bookingDbId);

      if (updateOrderError) {
        console.error(`[DEBUG] Failed to update razorpay_order_id:`, updateOrderError);
        logFailure(
          "bookings",
          "UPDATE_RAZORPAY_ORDER",
          { id: bookingDbId, razorpay_order_id: razorpayOrderId },
          updateOrderError,
        );
      }

      console.log(`[DEBUG] === SUCCESS === Returning Razorpay order`);
      return {
        success: true as const,
        bookingId: bookingDbId,
        bookingRef,
        razorpayOrderId,
        depositAmount: serverDeposit,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "An unknown error occurred";
      const errStack = error instanceof Error ? error.stack : undefined;
      console.error("\n=== FATAL ERROR in createGuestBookingFn ===");
      console.error("File: src/lib/booking-fns.ts");
      console.error("Function: createGuestBookingFn");
      console.error("Payload:", JSON.stringify(rawData, null, 2));
      console.error("Error Message:", errMsg);
      console.error("Stack Trace:", errStack);
      console.error("===========================================\n");

      // Ensure we NEVER throw natively here! Return JSON.
      return {
        success: false as const,
        step: "createGuestBookingFn",
        error: errMsg,
        details: errStack,
      };
    }
  });
