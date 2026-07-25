import { createAPIFileRoute } from "@tanstack/react-start/api";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import { confirmBookingAfterPayment } from "@/lib/booking-api";
import { sendBookingConfirmationEmail } from "@/lib/email";

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
);

export const APIRoute = createAPIFileRoute("/api/verify-payment")({
  POST: async ({ request }) => {
    try {
      const body = await request.json().catch(() => ({}));
      const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        booking_id,
      } = body;

      // Validate missing fields
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required fields" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Check key secret
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        return new Response(
          JSON.stringify({ success: false, error: "Server error: Razorpay secret key not configured." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      // Calculate signature
      const expectedSignature = createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      // Verify signature
      if (expectedSignature !== razorpay_signature) {
        console.error("[Razorpay Verification] Signature mismatch.");
        return new Response(
          JSON.stringify({ success: false, error: "Payment verification failed. Signature mismatch." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      console.log("[Razorpay Verification] Signature valid.");

      // Optional: If booking_id is provided, confirm booking in Supabase
      if (booking_id) {
        const { data: booking, error: fetchErr } = await supabaseAdmin
          .from("bookings")
          .select("id, booking_id, booking_status, customer_id, total_amount, amount_paid")
          .eq("id", booking_id)
          .single();

        if (fetchErr || !booking) {
          console.error("[Razorpay Verification] Booking not found:", booking_id);
          return new Response(
            JSON.stringify({ success: false, error: "Booking record not found on server." }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        // Atomically confirm booking and update state
        await confirmBookingAfterPayment(
          {
            bookingId: booking.id,
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature,
            amountPaid: booking.total_amount ?? 0,
            gateway: "razorpay",
            gatewayResponse: body,
          },
          supabaseAdmin as unknown as SupabaseClient
        );

        console.log("[Razorpay Verification] Booking successfully confirmed:", booking.booking_id);

        // Send booking confirmation email asynchronously (fire-and-forget)
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
              amountPaid: booking.total_amount ?? 0,
            }).catch((err) => console.error("[Razorpay Verification] Email sending failed:", err));
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment signature verified successfully.",
          bookingId: booking_id || null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("[Verify Payment API] Unexpected error:", err);
      return new Response(
        JSON.stringify({ success: false, error: errMsg }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});
