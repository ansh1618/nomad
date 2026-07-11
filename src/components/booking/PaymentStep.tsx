import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CreditCard, Loader2 } from "lucide-react";
import { createBookingFn, createRazorpayOrderFn, verifyRazorpayPaymentFn } from "@/lib/booking-fns";
import { supabase } from "@/lib/supabase";


export function PaymentStep({ data, updateData, onNext, onPrev }: any) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async () => {
    setIsProcessing(true);
    setError("");

    try {
      // 1. Get logged-in user or set to null for guest checkout
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;

      // 2. Create booking first to get bookingId
      const mappedTravellers = data.travellers.map((t: any, idx: number) => ({
        ...t,
        seatId: data.selectedSeats[idx] || null,
        roomId: data.selectedRooms[0] || null // Simplified for now, just assign first room
      }));

      const bookingData = {
        userId: userId,
        departureId: data.departureId,
        travellers: mappedTravellers,
        baseAmount: data.baseAmount,
        addonAmount: data.addons.reduce((sum: number, a: any) => sum + a.price, 0),
        gstAmount: 0, // Simplified for now
        totalAmount: data.totalAmount,
        couponId: data.coupon?.id,
        discountAmount: data.coupon?.discount || 0
      };

      const booking = await createBookingFn({ data: bookingData });
      
      if (!booking || !booking.bookingId) {
        throw new Error("Failed to create booking.");
      }

      // 3. Simulate Razorpay Checkout Dialog for now (since we don't have keys configured)
      await new Promise(resolve => setTimeout(resolve, 2000)); 

      // 4. Update state with real booking ID
      updateData((prev: any) => ({ ...prev, bookingId: booking.bookingId, paymentStatus: 'SUCCESS' }));
      onNext();
      
    } catch (err: any) {
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in flex flex-col items-center max-w-lg mx-auto py-8">
      <div className="text-center">
        <h2 className="text-2xl font-display font-bold text-primary">Secure Payment</h2>
        <p className="text-sm text-muted-foreground mt-1">You will be redirected to our secure payment gateway.</p>
      </div>
      
      <div className="w-full bg-white border border-border p-6 rounded-2xl shadow-soft space-y-6 text-center">
        
        <div className="bg-muted/20 p-6 rounded-xl space-y-2">
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Total Amount</p>
          <p className="text-4xl font-display font-bold text-primary">₹{data.totalAmount.toLocaleString('en-IN')}</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4 pt-4">
          <Button 
            onClick={handlePayment} 
            disabled={isProcessing}
            className="w-full h-14 text-lg bg-[#3395FF] hover:bg-[#2080ea] text-white shadow-md flex items-center justify-center gap-2 transition-all"
          >
            {isProcessing ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
            ) : (
              <><CreditCard className="h-5 w-5" /> Pay with Razorpay</>
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
        <span>100% Secure & Encrypted Payment</span>
      </div>
    </div>
  );
}
