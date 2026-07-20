/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CreditCard, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createBookingFn } from "@/lib/booking-fns";
import { createRazorpayOrderFn, verifyRazorpayPaymentFn } from "@/lib/mutations/payment";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PaymentStep({ data, updateData, onNext, onPrev, journey, isSidebar = false, pricing }: any) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // ── Validation gate ────────────────────────────────────────────────────────
  const validationErrors: string[] = [];
  if (!data.departureId) validationErrors.push("No departure selected");
  if (!data.travellers || data.travellers.length === 0) validationErrors.push("No traveller details provided");
  if (!pricing || pricing.total <= 0) validationErrors.push("Invalid booking price");

  const isValid = validationErrors.length === 0;

  const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePayment = async () => {
    if (!isValid) return;
    setIsProcessing(true);
    setError("");

    try {
      // ── Step 1: Get user ───────────────────────────────────────────────────
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;

      // ── Step 2: Validate departureId is not null ───────────────────────────
      if (!data.departureId) throw new Error("Please select a departure date before proceeding.");

      // ── Step 3: Create Pending Booking ─────────────────────────────────────
      console.log("[Booking] Creating pending booking...", {
        departureId: data.departureId,
        effectiveBasePrice: pricing.effectiveBasePrice,
        travellers: data.travellers.length,
        total: pricing.total,
        gst: pricing.gst,
        couponDiscount: pricing.couponDiscount,
        addonsTotal: pricing.addonsTotal,
      });

      const mappedTravellers = data.travellers.map((t: any, idx: number) => ({
        ...t,
        seatId: data.selectedSeats[idx] || null,
        roomId: data.selectedRooms[0] || null,
      }));

      const bookingPayload = {
        userId,
        departureId: data.departureId,
        travellers: mappedTravellers,
        // Backend will recompute from DB — pass our computed values for audit trail only
        baseAmount: pricing.effectiveBasePrice * pricing.travellersCount,
        addonAmount: pricing.addonsTotal,
        gstAmount: pricing.gst,
        totalAmount: pricing.total,
        couponId: data.coupon?.id || undefined,
        discountAmount: pricing.couponDiscount,
        hotelId: journey?.hotel_id || journey?.accommodation?.id || null,
      };

      const booking = await createBookingFn({ data: bookingPayload });

      if (!booking || !booking.success || !booking.bookingId) {
        throw new Error((booking as any)?.error || "Failed to create booking.");
      }

      const bookingId = booking.bookingId;
      console.log("[Booking] Created booking ID:", bookingId);

      // ── Step 4: Create Razorpay Order ──────────────────────────────────────
      console.log("[Booking] Creating Razorpay order for amount:", pricing.total);
      const order = await createRazorpayOrderFn({
        data: {
          bookingId,
          amount: pricing.total,
          currency: "INR",
          paymentType: "FULL",
        },
      });

      console.log("[Booking] Razorpay order created:", order.orderId);

      // ── Step 5: Load Razorpay SDK and open checkout ───────────────────────
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay. Check your internet connection.");

      const primaryTraveller = data.travellers[0] || {};

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          order_id: order.orderId,
          name: "Nomadik Travels",
          description: `Booking for ${journey?.name || "your journey"}`,
          prefill: {
            name: primaryTraveller.fullName || "",
            email: primaryTraveller.email || "",
            contact: primaryTraveller.phone || "",
          },
          theme: { color: "#C8A96A" },

          // ── Step 6: On Payment Success → Verify Signature ────────────────
          handler: async (response: any) => {
            try {
              console.log("[Booking] Payment captured, verifying signature...", {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                bookingId,
              });

              const verification = await verifyRazorpayPaymentFn({
                data: {
                  bookingId,
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  amountPaid: pricing.total,
                },
              });

              if (!verification.success) {
                reject(new Error("Payment verification failed. Please contact support."));
                return;
              }

              console.log("[Booking] Payment verified successfully. Booking confirmed.");

              // ── Step 7: Update state and move to success ─────────────────
              updateData((prev: any) => ({
                ...prev,
                bookingId,
                paymentId: response.razorpay_payment_id,
                paymentStatus: "SUCCESS",
              }));

              resolve();
            } catch (err: any) {
              reject(err);
            }
          },

          modal: {
            ondismiss: () => reject(new Error("Payment cancelled.")),
          },
        });

        rzp.open();
      });

      onNext();
    } catch (err: any) {
      console.error("[Booking] Payment flow error:", err);
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in flex flex-col items-center max-w-lg mx-auto py-8">
      <div className="text-center">
        <h2 className="text-2xl font-display font-bold text-primary">Secure Payment</h2>
        <p className="text-sm text-muted-foreground mt-1">
          You will be redirected to our secure payment gateway.
        </p>
      </div>

      <div className="w-full bg-white border border-border p-6 rounded-2xl shadow-soft space-y-6 text-center">
        <div className="bg-muted/20 p-6 rounded-xl space-y-2">
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
            Total Amount
          </p>
          <p className="text-4xl font-display font-bold text-primary">
            ₹{(pricing?.total ?? 0).toLocaleString("en-IN")}
          </p>
          {pricing?.gst > 0 && (
            <p className="text-xs text-muted-foreground">
              Incl. GST ₹{pricing.gst.toLocaleString("en-IN")}
            </p>
          )}
        </div>

        {/* Validation errors */}
        {!isValid && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-left">
            {validationErrors.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-amber-700 text-xs font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {e}
              </div>
            ))}
          </div>
        )}

        {isValid && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>All booking details verified. Ready to pay.</span>
          </div>
        )}

        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        <div className="space-y-4 pt-4">
          <Button
            onClick={handlePayment}
            disabled={isProcessing || !isValid}
            className="w-full h-14 text-lg bg-[#3395FF] hover:bg-[#2080ea] disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md flex items-center justify-center gap-2 transition-all"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" /> Pay ₹{(pricing?.total ?? 0).toLocaleString("en-IN")} with Razorpay
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={onPrev}
            disabled={isProcessing}
            className="w-full h-12"
          >
            Back to Review
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="h-5 w-5 text-green-500" />
        <span>100% Secure &amp; Encrypted Payment</span>
      </div>
    </div>
  );
}
