import { Button } from "@/components/ui/button";
import { CheckCircle2, User, Info } from "lucide-react";

export function ReviewSummaryStep({ data, updateData, onNext, onPrev, journey }: any) {
  
  // Calculate final amounts with GST
  const baseAmount = data.baseAmount * data.travellers.length;
  const addonsAmount = data.addons.reduce((sum: number, a: any) => sum + a.price, 0);
  const discountAmount = data.coupon ? data.coupon.discount : 0;
  
  const subTotal = (baseAmount + addonsAmount) - discountAmount;
  const gstAmount = subTotal * 0.05; // 5% GST
  const finalTotal = subTotal + gstAmount;

  const handleNext = () => {
    // Update data with final GST calculation before payment
    updateData((prev: any) => ({
      ...prev,
      gstAmount,
      totalAmount: finalTotal
    }));
    onNext();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-primary">Review Booking</h2>
        <p className="text-sm text-muted-foreground mt-1">Please review your journey details before making the payment.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Col: Details */}
        <div className="space-y-6">
          <div className="bg-white border border-border p-6 rounded-2xl shadow-soft space-y-4">
            <h3 className="font-poppins font-bold text-secondary border-b border-border pb-3">Journey Details</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase font-semibold">Destination</p>
                <p className="font-semibold">{journey.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase font-semibold">Duration</p>
                <p className="font-semibold">{journey.duration}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase font-semibold">Travellers</p>
                <p className="font-semibold">{data.travellers.length} Explorer(s)</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase font-semibold">Seats Selected</p>
                <p className="font-semibold">{data.selectedSeats.join(', ') || 'Auto-assign'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border p-6 rounded-2xl shadow-soft space-y-4">
            <h3 className="font-poppins font-bold text-secondary border-b border-border pb-3 flex items-center gap-2">
              <User className="h-5 w-5" /> Travellers
            </h3>
            <div className="space-y-3">
              {data.travellers.map((t: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold">{t.fullName || `Explorer ${i+1}`}</p>
                    <p className="text-xs text-muted-foreground">{t.phone || 'No phone provided'}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Cost Breakdown */}
        <div className="bg-white border border-border p-6 rounded-2xl shadow-soft">
          <h3 className="font-poppins font-bold text-secondary border-b border-border pb-3 mb-4">Cost Breakdown</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base Price ({data.travellers.length} x ₹{data.baseAmount})</span>
              <span className="font-semibold">₹{baseAmount.toLocaleString('en-IN')}</span>
            </div>
            
            {data.addons.map((a: any) => (
              <div key={a.id} className="flex justify-between">
                <span className="text-muted-foreground">Add-on: {a.name}</span>
                <span className="font-semibold">₹{a.price.toLocaleString('en-IN')}</span>
              </div>
            ))}

            {data.coupon && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Discount ({data.coupon.code})</span>
                <span>- ₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            
            <div className="border-t border-dashed border-border pt-3 mt-3 flex justify-between">
              <span className="text-muted-foreground font-semibold">Subtotal</span>
              <span className="font-semibold">₹{subTotal.toLocaleString('en-IN')}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">GST (5%) <Info className="h-3 w-3" /></span>
              <span className="font-semibold">₹{gstAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="bg-muted/30 -mx-6 -mb-6 mt-6 p-6 rounded-b-2xl border-t border-border">
            <div className="flex justify-between items-end">
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Payable</span>
              <span className="text-3xl font-display font-bold text-primary">₹{finalTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

      </div>

      <div className="flex justify-between pt-4 mt-8">
        <Button variant="outline" onClick={onPrev}>Back to Add-ons</Button>
        <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 px-8">Proceed to Payment</Button>
      </div>
    </div>
  );
}
