/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  CreditCard,
  Loader2,
  Lock,
  AlertTriangle,
  Building,
  Calendar,
  Users,
  Hotel,
  Tag,
} from "lucide-react";
import { createBookingFn } from "@/lib/booking-fns";
import { createRazorpayOrderFn, verifyRazorpayPaymentFn } from "@/lib/mutations/payment";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PaymentStep({
  data,
  updateData,
  onNext,
  onPrev,
  journey,
  isSidebar = false,
  pricing,
}: any) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Single source of truth: departureId from bookingData
  const hasDeparture = Boolean(data.departureId);
  const hasTravellers = Boolean(data.travellers && data.travellers.length > 0);
  const hasValidPrice = Boolean(pricing && pricing.subtotal > 0);

  const isValid = hasDeparture && hasTravellers && hasValidPrice;

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id || null;

      // ── Step 2: Validate departureId ───────────────────────────────────────
      if (!data.departureId) {
        throw new Error("Select your preferred departure to continue securely.");
      }

      // ── Step 3: Create Pending Booking ─────────────────────────────────────
      const mappedTravellers = data.travellers.map((t: any, idx: number) => ({
        ...t,
        seatId: data.selectedSeats[idx] || null,
        roomId: data.selectedRooms[0] || null,
      }));

      const bookingPayload = {
        userId,
        departureId: data.departureId,
        travellers: mappedTravellers,
        baseAmount: pricing.effectiveBasePrice * pricing.travellersCount,
        addonAmount: pricing.addonsTotal,
        gstAmount: pricing.gst,
        totalAmount: pricing.total, // backend stores total with GST
        couponId: data.coupon?.id || undefined,
        discountAmount: pricing.couponDiscount,
        hotelId: journey?.hotel_id || journey?.accommodation?.id || null,
      };

      const booking = await createBookingFn({ data: bookingPayload });

      if (!booking || !booking.success) {
        const serverError = (booking as any)?.error || "Unable to initialize booking. Please check details and try again.";
        throw new Error(serverError);
      }

      if (!booking.bookingId) {
        throw new Error("Booking was created but ID is missing. Please contact support.");
      }

      const bookingId = booking.bookingId;

      // ── Step 4: Create Razorpay Order (backend adds GST) ──────────────────
      // Send pricing.total (subtotal + GST) to Razorpay
      const order = await createRazorpayOrderFn({
        data: {
          bookingId,
          amount: pricing.total, // GST-inclusive amount for the actual charge
          currency: "INR",
          paymentType: "FULL",
        },
      });

      // ── Step 5: Load Razorpay SDK and open checkout ───────────────────────
      const loaded = await loadRazorpayScript();
      if (!loaded)
        throw new Error("Payment gateway connection failed. Please check internet connection.");

      const primaryTraveller = data.travellers[0] || {};

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: order.keyId,
          amount: order.amount, // in paise — Razorpay displays this with GST
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

          handler: async (response: any) => {
            try {
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
                reject(
                  new Error("Payment confirmation pending. Contact support if debited.")
                );
                return;
              }

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
            ondismiss: () => reject(new Error("Payment process was cancelled.")),
          },
        });

        rzp.open();
      });

      onNext();
    } catch (err: any) {
      console.error("[Booking] Payment flow error:", err);
      const userMsg = err.message?.includes("cancelled")
        ? "Payment process was cancelled."
        : err.message || "Payment process could not be completed. Please try again.";
      setError(userMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Derive departure date from bookingData directly
  const departureDateStr = data.departureDate
    ? new Date(data.departureDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : data.selectedDeparture?.date
    ? new Date(data.selectedDeparture.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  // Display the pre-GST amount (post-coupon) — GST only inside Razorpay
  const displayAmount = pricing?.payableBeforeGst ?? pricing?.subtotal ?? 0;

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 animate-fade-in py-2 px-1 box-border">
      {/* ── HEADER ── */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-primary">
          Secure Payment
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground font-poppins">
          Complete your booking securely using Razorpay.
        </p>
      </div>

      {/* ── DEPARTURE WARNING (only when genuinely not selected) ── */}
      {!hasDeparture && (
        <div className="bg-amber-50/90 border border-amber-200/90 p-4 rounded-[16px] text-amber-900 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs font-poppins space-y-0.5">
            <p className="font-semibold text-amber-950">
              Select your preferred departure to continue securely.
            </p>
            <p className="text-amber-800/80">
              Please step back and choose an available departure batch date.
            </p>
          </div>
        </div>
      )}

      {/* ── PAYMENT SUMMARY CARD ── */}
      <div className="w-full bg-white border border-border/80 p-6 sm:p-7 rounded-[20px] shadow-soft space-y-6 box-border">
        {/* Total Amount — show subtotal (no GST) */}
        <div className="bg-muted/30 border border-border/60 p-5 rounded-[16px] space-y-1">
          <span className="text-[11px] font-poppins font-bold uppercase tracking-wider text-muted-foreground block">
            Total Payable
          </span>
          <div className="text-3xl sm:text-4xl font-display font-bold text-primary tracking-tight">
            ₹{displayAmount.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-muted-foreground font-poppins">
            Taxes will be calculated securely during checkout.
          </p>
        </div>

        {/* Booking Summary Breakdown */}
        <div className="space-y-3.5 pt-1 border-t border-border/50 text-xs font-poppins">
          <div className="flex justify-between items-center gap-4">
            <span className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wider flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-accent shrink-0" /> Journey
            </span>
            <span className="font-semibold text-primary text-right line-clamp-1">
              {journey?.name || "Selected Journey"}
            </span>
          </div>

          <div className="flex justify-between items-center gap-4">
            <span className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-accent shrink-0" /> Departure
            </span>
            <span className="font-semibold text-foreground text-right">
              {departureDateStr || (hasDeparture ? "Selected Batch" : "—")}
            </span>
          </div>

          <div className="flex justify-between items-center gap-4">
            <span className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wider flex items-center gap-1.5">
              <Hotel className="h-3.5 w-3.5 text-accent shrink-0" /> Accommodation
            </span>
            <span className="font-semibold text-foreground text-right">
              {data.selectedRoomObj?.type ||
                data.selectedRoomObj?.title ||
                "Standard Room Sharing"}
            </span>
          </div>

          <div className="flex justify-between items-center gap-4">
            <span className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wider flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-accent shrink-0" /> Travellers
            </span>
            <span className="font-semibold text-foreground text-right">
              {pricing?.travellersCount ?? data.travellers?.length ?? 1} Explorer(s)
            </span>
          </div>

          {data.coupon && (
            <div className="flex justify-between items-center gap-4 text-green-700">
              <span className="text-[11px] uppercase font-semibold tracking-wider flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-green-600 shrink-0" /> Coupon (
                {data.coupon.code})
              </span>
              <span className="font-bold text-right">
                - ₹{(pricing?.couponDiscount ?? 0).toLocaleString("en-IN")}
              </span>
            </div>
          )}

          {pricing?.addonsTotal > 0 && (
            <div className="flex justify-between items-center gap-4">
              <span className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wider">
                Add-ons Total
              </span>
              <span className="font-semibold text-foreground text-right">
                + ₹{pricing.addonsTotal.toLocaleString("en-IN")}
              </span>
            </div>
          )}
        </div>

        {/* Security Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 py-2.5 px-3 bg-muted/20 border border-border/60 rounded-[14px] text-[11px] text-muted-foreground font-poppins font-medium text-center">
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3 text-emerald-600 shrink-0" /> 256-bit Encryption
          </span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" /> PCI DSS Compliant
          </span>
          <span className="text-border">•</span>
          <span>Powered by Razorpay</span>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-[14px] text-red-700 text-xs font-poppins text-left flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button
            onClick={handlePayment}
            disabled={isProcessing || !isValid}
            className="w-full h-[56px] text-base font-semibold rounded-[16px] bg-[#3395FF] hover:bg-[#2080ea] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 transition-all duration-200"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                <span>
                  Pay ₹{displayAmount.toLocaleString("en-IN")} Securely
                </span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={onPrev}
            disabled={isProcessing}
            className="w-full h-11 text-xs font-semibold rounded-[14px] border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            Back to Review Summary
          </Button>
        </div>
      </div>

      {/* ── FOOTER NOTICE ── */}
      <div className="text-center space-y-1 text-xs text-muted-foreground/80 font-poppins pt-1">
        <p className="flex items-center justify-center gap-1 font-medium">
          <Lock className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Payments are
          securely processed by Razorpay.
        </p>
        <p className="text-[11px] text-muted-foreground/60">
          Your card details are never stored by Nomadik.
        </p>
      </div>
    </div>
  );
}
