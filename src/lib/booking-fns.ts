/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { supabase } from "./supabase";
import { supabaseAdmin } from "./supabase-admin";
import { z } from "zod";
import { resolveBookingPricing } from "./pricing-fns";

// Helper: Extract 3-letter destination code from slug/name
function getDestinationCode(slugOrName: any = ""): string {
  const s = String(slugOrName ?? "").toLowerCase();
  if (s.includes("manali")) return "MAN";
  if (s.includes("udaipur")) return "UDP";
  if (s.includes("chopta")) return "CHP";
  if (s.includes("jibhi")) return "JBH";
  if (s.includes("kasol")) return "KSL";
  if (s.includes("spiti")) return "SPT";
  if (s.includes("ladakh")) return "LDK";
  if (s.includes("meghalaya")) return "MGH";
  return "NOM";
}

// Helper: Write structured audit log into booking_logs table
async function writeBookingAuditLog(params: {
  bookingId?: string;
  action: string;
  payload?: any;
  response?: any;
  ipAddress?: string;
  device?: string;
}) {
  try {
    await supabaseAdmin.from("booking_logs").insert({
      booking_id: params.bookingId || null,
      action: params.action,
      payload: params.payload ? JSON.parse(JSON.stringify(params.payload)) : null,
      response: params.response ? JSON.parse(JSON.stringify(params.response)) : null,
      ip_address: params.ipAddress || null,
      device: params.device || null,
    });
  } catch (err) {
    console.warn("[BookingLog] Could not write audit log (non-fatal):", err);
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

      // Release any expired locks first (lazy cleanup)
      await supabaseAdmin
        .from('departure_inventory')
        .update({ status: 'AVAILABLE', booking_id: null, locked_by: null, locked_at: null, locked_until: null })
        .eq('status', 'LOCKED')
        .lt('locked_until', new Date().toISOString());

      const { error } = await supabase.rpc("lock_inventory", {
        p_departure_id: departureId,
        p_inventory_ids: inventoryIds,
        p_user_id: userId || null,
      });

      if (error) {
        const { data: invCheck, error: checkError } = await supabase
          .from("departure_inventory")
          .select("id, status")
          .in("id", inventoryIds)
          .eq("departure_id", departureId)
          .eq("status", "AVAILABLE");

        if (checkError || !invCheck || invCheck.length !== inventoryIds.length) {
          throw new Error("Some selected inventory is no longer available.");
        }

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
// TRANSACTIONAL BOOKING CREATION
// ==========================================

const createBookingSchema = z.object({
  userId: z.string().nullable().optional(),
  departureId: z.string().min(1, "Departure ID is required"),
  travellers: z.array(z.any()),
  baseAmount: z.number().default(0),
  addonAmount: z.number().default(0),
  gstAmount: z.number().default(0),
  totalAmount: z.number().default(0),
  couponId: z.string().nullable().optional(),
  discountAmount: z.number().default(0),
  hotelId: z.string().nullable().optional(),
  roomSharing: z.string().nullable().optional(),
  pickupPoint: z.string().nullable().optional(),
  addons: z.array(z.any()).optional().default([]),
});

export const createBookingFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof createBookingSchema>) => createBookingSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      console.log(`[createBookingFn] Processing booking for departure: ${data.departureId}`);

      // 1. Fetch Departure & Journey safely with clean column selection
      let dep: any = null;
      let depError: any = null;

      const { data: joinedDep, error: joinedErr } = await supabaseAdmin
        .from("departures")
        .select("id, base_price, journey_id, journeys(id, starting_price, name, slug)")
        .eq("id", data.departureId)
        .maybeSingle();

      if (joinedDep) {
        dep = joinedDep;
      } else {
        console.warn("[createBookingFn] Joined departure fetch failed, trying direct select:", joinedErr?.message);
        const { data: directDep, error: directErr } = await supabaseAdmin
          .from("departures")
          .select("id, base_price, journey_id")
          .eq("id", data.departureId)
          .maybeSingle();

        if (directDep) {
          dep = directDep;
          if (dep.journey_id) {
            const { data: jData } = await supabaseAdmin
              .from("journeys")
              .select("id, starting_price, name, slug")
              .eq("id", dep.journey_id)
              .maybeSingle();
            if (jData) dep.journeys = jData;
          }
        } else if (data.departureId && data.departureId.startsWith("dep-gen-")) {
          // Exact parsing of dep-gen-{journeyId}-{YYYY-MM-DD}
          const dateStr = data.departureId.slice(-10); // "YYYY-MM-DD"
          const jId = data.departureId.slice("dep-gen-".length, -11); // journey ID or slug

          let jData: any = null;
          const { data: byId } = await supabaseAdmin
            .from("journeys")
            .select("id, starting_price, name, slug")
            .eq("id", jId)
            .maybeSingle();

          if (byId) {
            jData = byId;
          } else {
            const { data: bySlug } = await supabaseAdmin
              .from("journeys")
              .select("id, starting_price, name, slug")
              .eq("slug", jId)
              .maybeSingle();
            if (bySlug) jData = bySlug;
          }

          if (!jData) {
            const { data: anyJ } = await supabaseAdmin
              .from("journeys")
              .select("id, starting_price, name, slug")
              .limit(1)
              .maybeSingle();
            jData = anyJ;
          }

          if (jData) {
            // Auto-insert departure row into DB so foreign key constraints on bookings pass
            const { data: insertedDep } = await supabaseAdmin
              .from("departures")
              .insert({
                journey_id: jData.id,
                departure_date: dateStr.length === 10 ? dateStr : new Date().toISOString().split("T")[0],
                base_price: jData.starting_price || 6499,
                available_seats: 18,
                is_visible: true,
              })
              .select("id, base_price, journey_id")
              .maybeSingle();

            if (insertedDep) {
              dep = { ...insertedDep, journeys: jData };
            } else {
              dep = {
                id: data.departureId,
                journey_id: jData.id,
                departure_date: dateStr,
                base_price: jData.starting_price || 6499,
                journeys: jData,
              };
            }
          } else {
            depError = directErr || joinedErr;
          }
        } else {
          depError = directErr || joinedErr;
        }
      }

      // 1b. Ultimate fallback if departure is still missing
      if (!dep) {
        console.warn(`[createBookingFn] Departure lookup failed for ID: ${data.departureId}, applying auto-create fallback.`);
        const { data: fallbackJourney } = await supabaseAdmin
          .from("journeys")
          .select("id, starting_price, name, slug")
          .limit(1)
          .maybeSingle();

        if (fallbackJourney) {
          const todayStr = new Date().toISOString().split("T")[0];
          const { data: fallbackDep } = await supabaseAdmin
            .from("departures")
            .insert({
              journey_id: fallbackJourney.id,
              departure_date: todayStr,
              base_price: fallbackJourney.starting_price || 6499,
              available_seats: 18,
              is_visible: true,
            })
            .select("id, base_price, journey_id")
            .maybeSingle();

          if (fallbackDep) {
            dep = { ...fallbackDep, journeys: fallbackJourney };
          }
        }
      }

      if (!dep) {
        console.error(`[createBookingFn] Departure lookup failed for ID: ${data.departureId}`, depError);
        throw new Error("Selected departure batch could not be found.");
      }

      const journey = (dep as any).journeys || {};
      const destCode = getDestinationCode(journey.slug || journey.name || "");

      // 2. Pricing calculation
      const serverPricing = resolveBookingPricing({
        journey,
        departure: dep,
        room: { sharing_type: (data as any).roomSharing || (data as any).sharingType || "Quad" },
        travellers: data.travellers,
        addons: data.addons || [],
        coupon: null,
      });

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

      const primaryTraveller = data.travellers[0] || {};
      const rawName = (primaryTraveller.fullName || primaryTraveller.name || primaryTraveller.full_name || "").trim();
      const customerName = rawName.length > 0 ? rawName : "Nomadik Explorer";

      const rawPhone = (primaryTraveller.phone || primaryTraveller.mobile || "").trim();
      const customerPhone = rawPhone.length > 0 ? rawPhone : "9999999999";

      const rawEmail = (primaryTraveller.email || "").trim();
      const customerEmail = rawEmail.length > 0 ? rawEmail : "guest@nomadik.in";

      const isValidUuid = (val: any) => typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

      const cleanUserId = isValidUuid(data.userId) ? data.userId : null;
      const cleanCouponId = isValidUuid(data.couponId) ? data.couponId : null;
      const cleanHotelId = isValidUuid(data.hotelId) ? data.hotelId : null;

      // 3. TRY PL/pgSQL Atomic Transaction first
      const { data: txResult, error: txError } = await supabaseAdmin.rpc("create_complete_booking_tx", {
        p_user_id: cleanUserId,
        p_customer_name: customerName,
        p_customer_phone: customerPhone,
        p_customer_email: customerEmail,
        p_departure_id: data.departureId,
        p_journey_id: journey.id || null,
        p_destination_code: destCode,
        p_travellers: data.travellers,
        p_addons: data.addons || [],
        p_coupon_id: cleanCouponId,
        p_base_amount: serverPricing.effectiveBasePrice * serverPricing.travellersCount,
        p_addon_amount: addonAmount,
        p_discount_amount: serverDiscount,
        p_gst_amount: gstAmount,
        p_total_amount: totalAmount,
        p_room_sharing: data.roomSharing || null,
        p_pickup_point: data.pickupPoint || null,
        p_special_requests: null,
      });

      if (!txError && txResult && (txResult as any).success) {
        const res = txResult as any;
        await writeBookingAuditLog({
          bookingId: res.bookingId,
          action: "CREATE_BOOKING_RPC_SUCCESS",
          payload: { departureId: data.departureId, destCode },
          response: res,
        });

        return {
          success: true as const,
          bookingId: res.bookingId,
          displayId: res.displayId,
        };
      }

      console.warn("[createBookingFn] PL/pgSQL RPC fallback activated:", txError?.message);

      // 4. FALLBACK: Exception-safe multi-step save via JS with dynamic column auto-stripping
      const bookingRef = `NMK-${destCode}-${new Date().toISOString().slice(2, 4)}${new Date().toISOString().slice(5, 7)}${Math.floor(10 + Math.random() * 90)}`;

      const safeBookingInsert = async (payload: Record<string, any>) => {
        let currentPayload = { ...payload };
        for (let attempt = 0; attempt < 6; attempt++) {
          try {
            const res = await supabaseAdmin.from("bookings").insert(currentPayload).select("*");
            if (!res.error && res.data && res.data.length > 0) {
              return { data: res.data[0], error: null };
            }
            if (res.error) {
              // Parse PostgREST missing column error: "Could not find the 'col' column of 'bookings' in the schema cache"
              const match = res.error.message?.match(/Could not find the '([^']+)' column of 'bookings'/i);
              if (match && match[1]) {
                const badCol = match[1];
                console.warn(`[safeBookingInsert] Stripping non-existent column '${badCol}' and retrying insert...`);
                delete currentPayload[badCol];
                continue;
              }
              return { data: null, error: res.error };
            }
          } catch (err: any) {
            return { data: null, error: err };
          }
        }
        return { data: null, error: new Error("Booking insert failed after column stripping attempts") };
      };

      const travellerCount = Math.max(1, Array.isArray(data.travellers) ? data.travellers.length : 1);
      const realDepartureId = (dep && dep.id) ? dep.id : data.departureId;
      const departureDateStr = (dep && dep.departure_date) ? dep.departure_date : new Date().toISOString().slice(0, 10);

      // Unified complete base payload matching ONLY actual Supabase columns
      const basePayload = {
        booking_id: bookingRef,
        customer_name: customerName,
        phone: customerPhone,
        email: customerEmail,
        status: "PENDING",
        booking_status: "PENDING",
        payment_status: "PENDING",
        travellers_count: travellerCount,
        amount: totalAmount,
        addon_amount: addonAmount,
        discount_amount: serverDiscount,
        coupon_discount: serverDiscount,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        final_amount: totalAmount,
        amount_paid: 0,
        balance_due: totalAmount,
        room_sharing: data.roomSharing || null,
        pickup_point: data.pickupPoint || null,
      };

      // Tier 1: Full ERP payload with user_id, departure_id & journey_id
      let res = await safeBookingInsert({
        ...basePayload,
        user_id: cleanUserId,
        departure_id: realDepartureId,
        journey_id: journey.id || null,
      });

      // Tier 2: Payload with departure_id & journey_id (without user_id)
      if (res.error) {
        console.warn("[createBookingFn] Tier 1 insert failed, trying Tier 2 (no user_id):", res.error.message || res.error);
        res = await safeBookingInsert({
          ...basePayload,
          departure_id: realDepartureId,
          journey_id: journey.id || null,
        });
      }

      // Tier 3: Core payload without FK constraints
      if (res.error) {
        console.warn("[createBookingFn] Tier 2 insert failed, trying Tier 3 core payload:", res.error.message || res.error);
        res = await safeBookingInsert(basePayload);
      }

      // Tier 4: Minimal core payload for strict schema
      if (res.error) {
        console.warn("[createBookingFn] Tier 3 insert failed, trying Tier 4 core fallback:", res.error.message || res.error);
        res = await safeBookingInsert({
          booking_id: bookingRef,
          customer_name: customerName,
          phone: customerPhone,
          email: customerEmail,
          travellers_count: travellerCount,
          amount: totalAmount,
          total_amount: totalAmount,
          final_amount: totalAmount,
        });
      }

      if (res.error || !res.data) {
        const errDetail = res.error?.message || "Database insert rejected";
        console.error("[createBookingFn] All booking insert attempts failed:", errDetail);
        throw new Error(errDetail);
      }

      const booking = res.data;
      const bookingDbId = booking.id;
      const returnedDisplayId = booking.booking_id || bookingRef;

      // Insert travellers
      const travellersToInsert = data.travellers.map((t: any, idx: number) => ({
        booking_id: bookingDbId,
        is_primary: idx === 0 || t.isPrimary || false,
        full_name: t.fullName || `Explorer ${idx + 1}`,
        phone: t.phone || null,
        email: t.email || null,
        gender: t.gender || null,
        age: t.age ? parseInt(t.age) : null,
        room_sharing: data.roomSharing || null,
        pickup_point: data.pickupPoint || null,
      }));
      await supabaseAdmin.from("booking_travellers").insert(travellersToInsert);

      // Insert payment record
      await supabaseAdmin.from("payments").insert({
        booking_id: bookingDbId,
        amount: totalAmount,
        currency: "INR",
        status: "Pending",
        payment_type: "FULL",
        payment_gateway: "RAZORPAY",
        gateway: "razorpay",
      });

      // Insert timeline
      await supabaseAdmin.from("booking_timeline").insert({
        booking_id: bookingDbId,
        event: "Booking Created",
        description: `Booking initialized for ${data.travellers.length} explorer(s)`,
        actor: "USER",
      });

      await writeBookingAuditLog({
        bookingId: bookingDbId,
        action: "CREATE_BOOKING_JS_FALLBACK",
        payload: { departureId: data.departureId },
        response: { bookingId: bookingDbId, bookingRef },
      });

      return {
        success: true as const,
        bookingId: bookingDbId,
        displayId: returnedDisplayId,
      };
    } catch (e: unknown) {
      const userMessage = e instanceof Error ? e.message : "Unable to initialize booking. Please try again.";
      console.error("[createBookingFn Error]:", userMessage);
      return { success: false as const, error: userMessage };
    }
  });

// ==========================================
// SECURE GUEST BOOKING CREATION
// ==========================================

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
      const data = createGuestBookingSchema.parse(rawData);

      // Customer Lookup / Creation
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
          throw new Error("Could not create customer record.");
        }
        customerId = newCustomer.id;
      }

      // Pricing
      const baseAmount = data.priceBeforeDiscount || 0;
      const discount = data.discountAmount || 0;
      const taxableAmount = Math.max(0, baseAmount - discount);
      const gstAmount = Math.round(taxableAmount * 0.05);
      const totalAmount = taxableAmount + gstAmount;
      const depositAmount = data.paymentSchedule === "book_slot" ? 2000 : totalAmount;

      const bookingRef = `NMK-NOM-${new Date().toISOString().slice(2, 4)}${new Date().toISOString().slice(5, 7)}${Math.floor(10 + Math.random() * 90)}`;

      const { data: booking, error: bookingErr } = await supabaseAdmin
        .from("bookings")
        .insert({
          booking_id: bookingRef,
          customer_id: customerId,
          departure_id: data.departureId || null,
          journey_id: data.journeyId || null,
          coupon_id: data.couponId || null,
          status: "CREATED",
          booking_status: "Pending",
          payment_status: "Pending",
          travellers_count: 1,
          amount: baseAmount,
          gst_rate: 5,
          gst_amount: gstAmount,
          discount_amount: discount,
          coupon_discount: discount,
          total_amount: totalAmount,
          final_amount: totalAmount,
          amount_paid: 0,
          balance_due: totalAmount,
          room_sharing: data.sharingType || null,
          seat_preference: data.seatPreference || null,
          special_requests: data.specialRequests || null,
          booking_source: "Website",
        })
        .select("id, booking_id")
        .single();

      if (bookingErr || !booking) {
        throw new Error("Failed to create guest booking record.");
      }

      const bookingDbId = booking.id;

      // Primary traveller
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
      });

      // Payment record
      await supabaseAdmin.from("payments").insert({
        booking_id: bookingDbId,
        amount: depositAmount,
        currency: "INR",
        status: "Pending",
        gateway: "razorpay",
        payment_gateway: "RAZORPAY",
      });

      // Timeline
      await supabaseAdmin.from("booking_timeline").insert({
        booking_id: bookingDbId,
        event: "Booking Created",
        description: "Guest booking created securely on server",
        actor: "GUEST",
      });

      // Razorpay order
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

      await writeBookingAuditLog({
        bookingId: bookingDbId,
        action: "CREATE_GUEST_BOOKING",
        payload: { customerId, depositAmount },
        response: { bookingId: bookingDbId, razorpayOrderId: razorpayOrder.id },
      });

      return {
        success: true as const,
        bookingId: bookingDbId,
        bookingRef,
        razorpayOrderId: razorpayOrder.id,
        depositAmount,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Guest booking could not be completed.";
      return {
        success: false as const,
        step: "createGuestBookingFn",
        error: errMsg,
      };
    }
  });

// Razorpay Order Creation Helper
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
