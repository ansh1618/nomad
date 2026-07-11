/**
 * cashfree-webhook.ts
 *
 * TanStack Start API route to receive Cashfree payment webhooks.
 * Mount this at: /api/cashfree/webhook
 *
 * Cashfree sends a POST request with the payment status after every
 * payment attempt. This endpoint:
 *  1. Verifies the webhook signature (HMAC-SHA256)
 *  2. Updates the booking payment_status in Supabase
 *  3. Returns HTTP 200 to acknowledge receipt
 *
 * Setup in Cashfree Dashboard:
 *  Developers → Webhooks → Add Webhook URL:
 *  https://yourdomain.com/api/cashfree/webhook
 */

import { createAPIFileRoute } from "@tanstack/react-start/api";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

// Use service role key for webhook (bypasses RLS) — keep this server-only!
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

export const APIRoute = createAPIFileRoute("/api/cashfree/webhook")({
  POST: async ({ request }) => {
    try {
      const rawBody = await request.text();
      const body = JSON.parse(rawBody);

      // ── 1. Verify Signature ────────────────────────────────────────────────
      const timestamp = request.headers.get("x-webhook-timestamp");
      const receivedSignature = request.headers.get("x-webhook-signature");

      if (!timestamp || !receivedSignature) {
        return new Response("Missing signature headers", { status: 401 });
      }

      const signaturePayload = timestamp + rawBody;
      const expectedSignature = createHmac(
        "sha256",
        process.env.CASHFREE_SECRET_KEY ?? ""
      )
        .update(signaturePayload)
        .digest("base64");

      if (expectedSignature !== receivedSignature) {
        console.error("[Webhook] Invalid signature");
        return new Response("Invalid signature", { status: 401 });
      }

      // ── 2. Extract Event Data ──────────────────────────────────────────────
      const eventType: string = body.type; // e.g. "PAYMENT_SUCCESS_WEBHOOK"
      const order = body.data?.order;
      const payment = body.data?.payment;

      if (!order?.order_id) {
        return new Response("No order_id in payload", { status: 400 });
      }

      const orderId: string = order.order_id;
      console.log(`[Webhook] Event: ${eventType} | Order: ${orderId}`);

      // ── 3. Find Booking by Cashfree Order ID ──────────────────────────────
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from("bookings")
        .select("id, booking_id, payment_status")
        .eq("cashfree_order_id", orderId)
        .single();

      if (fetchError || !booking) {
        console.error("[Webhook] Booking not found for order:", orderId);
        // Return 200 anyway to prevent Cashfree from retrying
        return new Response("Booking not found", { status: 200 });
      }

      // Skip if already processed (idempotency)
      if (booking.payment_status === "Successful") {
        return new Response("Already processed", { status: 200 });
      }

      // ── 4. Update Booking Based on Event ──────────────────────────────────
      const paymentId = payment?.cf_payment_id?.toString() ?? "";

      if (eventType === "PAYMENT_SUCCESS_WEBHOOK") {
        await supabaseAdmin
          .from("bookings")
          .update({
            payment_status: "Successful",
            booking_status: "Confirmed",
            cashfree_payment_id: paymentId,
            transaction_id: paymentId,
          })
          .eq("id", booking.id);

        console.log(`[Webhook] ✅ Payment confirmed: ${booking.booking_id}`);

        // TODO: Send confirmation WhatsApp/email here
        // await sendBookingConfirmationEmail(booking.id);

      } else if (
        eventType === "PAYMENT_FAILED_WEBHOOK" ||
        eventType === "PAYMENT_USER_DROPPED_WEBHOOK"
      ) {
        await supabaseAdmin
          .from("bookings")
          .update({
            payment_status: "Failed",
            booking_status: "Cancelled",
          })
          .eq("id", booking.id);

        console.log(`[Webhook] ❌ Payment failed: ${booking.booking_id}`);
      }

      // Cashfree expects HTTP 200 to stop retrying
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
