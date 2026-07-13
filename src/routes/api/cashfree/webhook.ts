/**
 * Cashfree Webhook Handler
 * Mount at: /api/cashfree/webhook
 *
 * Flow:
 *  1. Verify HMAC-SHA256 signature
 *  2. Extract order + payment data
 *  3. Find booking by cashfree_order_id
 *  4. Call confirmBookingAfterPayment (atomic update)
 *  5. Send email confirmation (async, fire-and-forget)
 *  6. Return HTTP 200
 *
 * Security: Uses service role key (server-only). Never exposes to frontend.
 */

// @ts-ignore
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import { confirmBookingAfterPayment } from "@/lib/booking-api";
import { sendBookingConfirmationEmail } from "@/lib/email";

// Service role client (bypasses RLS) — server-only!
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

export const APIRoute = createAPIFileRoute("/api/cashfree/webhook")({
  POST: async ({ request }) => {
    try {
      const rawBody = await request.text();

      // ── 1. Verify Signature ─────────────────────────────────────
      const timestamp = request.headers.get("x-webhook-timestamp");
      const receivedSignature = request.headers.get("x-webhook-signature");

      if (!timestamp || !receivedSignature) {
        return new Response("Missing signature headers", { status: 401 });
      }

      const expectedSignature = createHmac(
        "sha256",
        process.env.CASHFREE_SECRET_KEY ?? ""
      )
        .update(timestamp + rawBody)
        .digest("base64");

      if (expectedSignature !== receivedSignature) {
        console.error("[Webhook] ❌ Invalid signature");
        return new Response("Invalid signature", { status: 401 });
      }

      const body = JSON.parse(rawBody);

      // ── 2. Extract Event Data ────────────────────────────────────
      const eventType: string = body.type;
      const order = body.data?.order;
      const payment = body.data?.payment;

      if (!order?.order_id) {
        return new Response("No order_id in payload", { status: 400 });
      }

      const cashfreeOrderId: string = order.order_id;
      console.log(`[Webhook] Event: ${eventType} | Order: ${cashfreeOrderId}`);

      // ── 3. Find Booking ──────────────────────────────────────────
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from("bookings")
        .select("id, booking_id, booking_status, customer_id, total_amount")
        .eq("cashfree_order_id", cashfreeOrderId)
        .single();

      if (fetchError || !booking) {
        console.error("[Webhook] Booking not found for order:", cashfreeOrderId);
        // Return 200 to prevent Cashfree retrying
        return new Response("Booking not found", { status: 200 });
      }

      // ── 4. Handle Payment Success ────────────────────────────────
      if (eventType === "PAYMENT_SUCCESS_WEBHOOK") {
        const cashfreePaymentId = payment?.cf_payment_id?.toString() ?? "";
        const amountPaid = Number(payment?.payment_amount ?? booking.total_amount ?? 0);

        await confirmBookingAfterPayment(
          {
            bookingId: booking.id,
            cashfreeOrderId,
            cashfreePaymentId,
            amountPaid,
            gatewayResponse: body,
          },
          supabaseAdmin as any
        );

        console.log(`[Webhook] ✅ Booking confirmed: ${booking.booking_id}`);

        // Send email confirmation (async, don't block response)
        if (booking.customer_id) {
          const { data: customer } = await supabaseAdmin
            .from("customers")
            .select("name, email, phone")
            .eq("id", booking.customer_id)
            .single();

          if (customer?.email) {
            sendBookingConfirmationEmail({
              customerName: customer.name,
              customerEmail: customer.email,
              bookingId: booking.booking_id ?? booking.id,
              amountPaid,
            }).catch((err) =>
              console.error("[Webhook] Email send failed:", err)
            );
          }
        }
      }

      // ── 5. Handle Payment Failure ────────────────────────────────
      else if (
        eventType === "PAYMENT_FAILED_WEBHOOK" ||
        eventType === "PAYMENT_USER_DROPPED_WEBHOOK"
      ) {
        // Update booking back to PENDING (not cancelled — allow retry)
        await supabaseAdmin
          .from("bookings")
          .update({
            booking_status: "PENDING",
            payment_status: "FAILED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", booking.id);

        // Log transaction failure
        await supabaseAdmin.from("transactions").insert({
          booking_id: booking.id,
          gateway: "cashfree",
          order_id: cashfreeOrderId,
          gateway_payment_id: payment?.cf_payment_id?.toString() ?? null,
          amount: booking.total_amount ?? 0,
          currency: "INR",
          status: "FAILED",
          gateway_response: body,
        });

        // Add timeline event
        await supabaseAdmin.from("booking_timeline").insert({
          booking_id: booking.id,
          event: "PAYMENT_FAILED",
          description: "Payment attempt failed or dropped by user",
          actor: "SYSTEM",
          metadata: { order_id: cashfreeOrderId },
        });

        console.log(`[Webhook] ❌ Payment failed: ${booking.booking_id}`);
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("[Webhook] Unexpected error:", err);
      return new Response("Internal server error", { status: 500 });
    }
  },
});
