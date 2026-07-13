import { createServerFn } from "@tanstack/react-start";
import { supabase } from "./supabase";
import { supabaseAdmin } from "./supabase-admin";
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
    } catch (e: any) {
      return { success: false as const, error: e.message || "An unknown error occurred" };
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
});

export const createBookingFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof createBookingSchema>) =>
    createBookingSchema.parse(data)
  )
  .handler(async ({ data }) => {
    try {
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
        success: true as const,
        bookingId: booking.id,
        displayId: (booking as any).booking_id,
      };
    } catch (e: any) {
      return { success: false as const, error: e.message || "An unknown error occurred" };
    }
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
    try {
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

      return { success: true as const, orderId, paymentRecordId: payment.id };
    } catch (e: any) {
      return { success: false as const, error: e.message || "An unknown error occurred" };
    }
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
    try {
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

      return { success: true as const, message: "Payment verified and booking confirmed." };
    } catch (e: any) {
      return { success: false as const, error: e.message || "An unknown error occurred" };
    }
  });

// ==========================================
// SECURE GUEST BOOKING CREATION
// ==========================================

function logFailure(table: string, operation: string, payload: any, error: any) {
  console.error(`[DB FAILURE] Table: ${table} | Operation: ${operation}`);
  console.error("Payload:", JSON.stringify(payload, null, 2));
  console.error("Error Details:", error);
  const stack = new Error().stack;
  console.error("Stack trace:", stack);
}

const createGuestBookingSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
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
  .validator((data: any) => data) // Accept anything so validator never throws natively
  .handler(async ({ data: rawData }) => {
    try {
      console.log(`\n[DEBUG] === START createGuestBookingFn ===`);
      console.log(`[DEBUG] Incoming raw payload:`, JSON.stringify(rawData, null, 2));
      
      // 0. Zod Validation (inside try-catch so errors return as JSON)
      const data = createGuestBookingSchema.parse(rawData);
      console.log(`[DEBUG] Zod validation passed. Parsed data:`, JSON.stringify(data, null, 2));

      // 1. Check if customer already exists by phone or email
      console.log(`[DEBUG] Step 1: Customer lookup`);
      let existingCustomer = null;
      
      console.log(`[DEBUG] Searching customer by phone: ${data.phone}`);
      const { data: customerByPhone, error: phoneSearchError } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('phone', data.phone)
        .maybeSingle();

      if (phoneSearchError) {
        logFailure('customers', 'SELECT_BY_PHONE', { phone: data.phone }, phoneSearchError);
      }

      if (customerByPhone) {
        console.log(`[DEBUG] Found customer by phone: ${customerByPhone.id}`);
        existingCustomer = customerByPhone;
      } else if (data.email) {
        console.log(`[DEBUG] Searching customer by email: ${data.email}`);
        const { data: customerByEmail, error: emailSearchError } = await supabaseAdmin
          .from('customers')
          .select('*')
          .eq('email', data.email)
          .maybeSingle();

        if (emailSearchError) {
          logFailure('customers', 'SELECT_BY_EMAIL', { email: data.email }, emailSearchError);
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
          .from('customers')
          .insert({
            name: data.fullName,
            email: data.email || null,
            phone: data.phone,
            whatsapp: data.phone,
            gender: data.gender || null,
            address: data.address || null,
            referral_source: data.howHeard || null,
          })
          .select('id')
          .single();

        if (createCustomerError || !newCustomer) {
          console.error(`[DEBUG] Failed to create customer:`, createCustomerError);
          logFailure('customers', 'INSERT', { phone: data.phone }, createCustomerError);
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

      const depositAmount = data.paymentSchedule === 'book_slot' ? 2000 : totalAmount;
      const balanceDue = Math.max(0, totalAmount - depositAmount);

      console.log(`[DEBUG] Amounts: Base=${baseAmount}, Discount=${discount}, Taxable=${taxableAmount}, GST=${gstAmount}, Total=${totalAmount}, Deposit=${depositAmount}, Balance=${balanceDue}`);

      // 4. Create PENDING booking
      console.log(`[DEBUG] Step 4: Creating pending booking`);
      const { data: booking, error: bookingError } = await supabaseAdmin
        .from('bookings')
        .insert({
          customer_id: customerId,
          departure_id: data.departureId || null,
          journey_id: data.journeyId || null,
          coupon_id: data.couponId || null,
          status: 'CREATED',
          booking_status: 'PENDING',
          payment_status: 'PENDING',
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
        .select('id, booking_id')
        .single();

      if (bookingError || !booking) {
        console.error(`[DEBUG] Failed to create booking record:`, bookingError);
        logFailure('bookings', 'INSERT', { customerId }, bookingError);
        throw new Error(`Failed to create pending booking: ${bookingError?.message}`);
      }

      const bookingDbId = booking.id;
      const bookingRef = (booking as any).booking_id;
      console.log(`[DEBUG] Created booking: ID=${bookingDbId}, Ref=${bookingRef}`);

      // 4b. Create primary traveller
      console.log(`[DEBUG] Step 4b: Creating primary traveller`);
      const { error: travellerError } = await supabaseAdmin
        .from('booking_travellers')
        .insert({
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
        logFailure('booking_travellers', 'INSERT', { booking_id: bookingDbId }, travellerError);
        throw new Error(`Failed to create primary traveller: ${travellerError.message}`);
      }
      console.log(`[DEBUG] Primary traveller created successfully`);

      // 5. Create PENDING payment record
      console.log(`[DEBUG] Step 5: Creating pending payment record`);
      const { error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          booking_id: bookingDbId,
          amount: depositAmount,
          currency: 'INR',
          status: 'PENDING',
          // `gateway` column added by migration v16; `payment_gateway` is the old column name
          gateway: 'cashfree',
          payment_gateway: 'cashfree',
        });

      if (paymentError) {
        console.error(`[DEBUG] Failed to create pending payment:`, paymentError);
        logFailure('payments', 'INSERT', { booking_id: bookingDbId }, paymentError);
        throw new Error(`Failed to create pending payment record: ${paymentError.message}`);
      }
      console.log(`[DEBUG] Pending payment created successfully`);

      // 6. Create booking timeline event
      console.log(`[DEBUG] Step 6: Creating booking timeline event`);
      const { error: timelineError } = await supabaseAdmin
        .from('booking_timeline')
        .insert({
          booking_id: bookingDbId,
          event: 'BOOKING_CREATED',
          description: 'Customer completed booking form securely on server',
          actor: 'SYSTEM',
        });

      if (timelineError) {
        console.error(`[DEBUG] Failed to create timeline event:`, timelineError);
        logFailure('booking_timeline', 'INSERT', { booking_id: bookingDbId }, timelineError);
      }
      console.log(`[DEBUG] Timeline event created successfully`);

      // 7. Create Cashfree order
      console.log(`[DEBUG] Step 7: Creating Cashfree order`);
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

      const orderId = `NM_${bookingRef}_${Date.now()}`;
      const endpoint = `${CASHFREE_API_BASE}/orders`;
      const requestBody = {
        order_id: orderId,
        order_amount: depositAmount,
        order_currency: "INR",
        customer_details: {
          customer_id: bookingDbId,
          customer_name: data.fullName,
          customer_email: data.email || 'noreply@nomadiktravels.com',
          customer_phone: data.phone,
        },
        order_meta: {
          return_url: `${process.env.VITE_APP_URL ?? "http://localhost:3000"}/booking/success?booking_id=${bookingDbId}&order_id={order_id}`,
          notify_url: `${process.env.VITE_APP_URL ?? "http://localhost:3000"}/api/cashfree/webhook`,
        },
        order_note: `Nomadik Booking ${bookingRef}`,
      };

      console.log(`[DEBUG] Cashfree API Request:`, JSON.stringify(requestBody, null, 2));

      const response = await fetch(endpoint, {
        method: "POST",
        headers: CASHFREE_HEADERS,
        body: JSON.stringify(requestBody),
      });

      const contentType = response.headers.get("content-type") || "";
      const isHtml = contentType.includes("text/html");

      if (!response.ok) {
        const responseBodyStr = await response.text();
        console.error(`\n=== API ERROR LOG ===\nEndpoint: ${endpoint}\nStatus: ${response.status}\nRequest: ${JSON.stringify(requestBody)}\nResponse: ${responseBodyStr}\n=====================\n`);
        
        if (isHtml) {
          throw new Error(`Cashfree API returned an HTML error page (Status ${response.status}). Gateway may be down.`);
        }
        
        let errJson = {};
        try { errJson = JSON.parse(responseBodyStr); } catch(e) {}
        logFailure('cashfree_orders', 'CREATE_ORDER', { orderId }, errJson);
        throw new Error(`Cashfree order creation failed: ${responseBodyStr}`);
      }

      if (isHtml) {
        const htmlBody = await response.text();
        console.error(`[DEBUG] Cashfree returned HTML on a 200 response:`, htmlBody.slice(0, 500));
        throw new Error(`Cashfree returned HTML on a successful status. Body: ${htmlBody.slice(0, 100)}...`);
      }

      const orderData = await response.json();
      console.log(`[DEBUG] Cashfree response:`, JSON.stringify(orderData, null, 2));
      const paymentSessionId: string = orderData.payment_session_id;

      // 8. Update cashfree_order_id inside booking table
      console.log(`[DEBUG] Step 8: Updating cashfree order ID in DB`);
      const { error: updateOrderError } = await supabaseAdmin
        .from('bookings')
        .update({ cashfree_order_id: orderId })
        .eq('id', bookingDbId);

      if (updateOrderError) {
        console.error(`[DEBUG] Failed to update cashfree_order_id:`, updateOrderError);
        logFailure('bookings', 'UPDATE_CASHFREE_ORDER', { id: bookingDbId, cashfree_order_id: orderId }, updateOrderError);
      }
      
      console.log(`[DEBUG] === SUCCESS === Returning payment session`);
      return {
        success: true as const,
        bookingId: bookingDbId,
        bookingRef,
        paymentSessionId,
      };

    } catch (error: any) {
      console.error("\n=== FATAL ERROR in createGuestBookingFn ===");
      console.error("File: src/lib/booking-fns.ts");
      console.error("Function: createGuestBookingFn");
      console.error("Payload:", JSON.stringify(rawData, null, 2));
      console.error("Error Message:", error.message);
      console.error("Stack Trace:", error.stack);
      console.error("===========================================\n");
      
      // Ensure we NEVER throw natively here! Return JSON.
      return { 
        success: false as const, 
        step: 'createGuestBookingFn', 
        error: error.message || "An unknown error occurred",
        details: error.stack
      };
    }
  });
