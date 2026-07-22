import { Button } from "@/components/ui/button";
import { CheckCircle2, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReviewSummaryStep({ data, updateData, onNext, onPrev, journey, isSidebar = false, pricing }: any) {
  
  const handleNext = () => {
    onNext();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-primary">Review Booking</h2>
        <p className="text-sm text-muted-foreground mt-1">Please review your journey details before making the payment.</p>
      </div>
      
      <div className={cn("grid gap-8", isSidebar ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
        
        {/* Left Col: Details */}
        <div className="space-y-6">
          <div className="bg-white border border-border p-6 rounded-2xl shadow-soft space-y-4">
            <h3 className="font-poppins font-bold text-secondary border-b border-border pb-3">Journey Details</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center gap-4">
                <p className="text-muted-foreground text-xs uppercase font-semibold whitespace-nowrap min-w-[80px]">Destination</p>
                <p className="font-semibold text-right break-words">{journey.name}</p>
              </div>
              <div className="flex justify-between items-center gap-4">
                <p className="text-muted-foreground text-xs uppercase font-semibold whitespace-nowrap min-w-[80px]">Duration</p>
                <p className="font-semibold text-right break-words">{journey.duration}</p>
              </div>
              <div className="flex justify-between items-center gap-4">
                <p className="text-muted-foreground text-xs uppercase font-semibold whitespace-nowrap min-w-[80px]">Travellers</p>
                <p className="font-semibold text-right break-words">{data.travellers.length} Explorer(s)</p>
              </div>
              <div className="flex justify-between items-center gap-4">
                <p className="text-muted-foreground text-xs uppercase font-semibold whitespace-nowrap min-w-[80px]">Seats</p>
                <p className="font-semibold text-right break-words">{data.selectedSeats.join(', ') || 'Auto-assign'}</p>
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
            <div className="flex justify-between items-center gap-4">
              <span className="text-muted-foreground flex-1">Base Price <span className="text-xs whitespace-nowrap">({data.travellers.length} x ₹{pricing.effectiveBasePrice})</span></span>
              <span className="font-semibold text-right whitespace-nowrap">₹{(pricing.effectiveBasePrice * pricing.travellersCount).toLocaleString('en-IN')}</span>
            </div>
            {pricing.roomModifier > 0 && (
              <div className="flex justify-between items-center gap-4">
                <span className="text-muted-foreground flex-1">Room Upgrade <span className="text-xs whitespace-nowrap">({data.travellers.length} x ₹{pricing.roomModifier})</span></span>
                <span className="font-semibold text-right whitespace-nowrap">₹{(pricing.roomModifier * pricing.travellersCount).toLocaleString('en-IN')}</span>
              </div>
            )}
            
            {data.addons.map((a: any) => (
              <div key={a.id} className="flex justify-between items-center gap-4">
                <span className="text-muted-foreground flex-1">Add-on: {a.name}</span>
                <span className="font-semibold text-right whitespace-nowrap">₹{a.price.toLocaleString('en-IN')}</span>
              </div>
            ))}

            {data.coupon && (
              <div className="flex justify-between items-center gap-4 text-green-600 font-semibold">
                <span className="flex-1">Discount ({data.coupon.code})</span>
                <span className="text-right whitespace-nowrap">- ₹{pricing.couponDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}
            
            <div className="border-t border-dashed border-border pt-3 mt-3 flex justify-between items-center gap-4">
              <span className="text-muted-foreground font-semibold flex-1">Subtotal</span>
              <span className="font-semibold text-right whitespace-nowrap">₹{pricing.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-[11px] text-muted-foreground font-poppins mt-1">
              Taxes will be calculated securely during Razorpay checkout.
            </div>
          </div>

          <div className="bg-muted/30 -mx-6 -mb-6 mt-6 p-6 rounded-b-2xl border-t border-border">
            <div className="flex justify-between items-end">
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Payable</span>
              <span className="text-3xl font-display font-bold text-primary">₹{(pricing.payableBeforeGst ?? pricing.subtotal).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

      </div>

      <div className={cn("flex justify-between pt-4 mt-8 gap-3", isSidebar && "flex-col-reverse w-full")}>
        <Button variant="outline" onClick={onPrev} className={cn(isSidebar && "w-full h-10")}>Back to Add-ons</Button>
        <Button onClick={handleNext} className={cn("bg-primary hover:bg-primary/90 px-8", isSidebar && "w-full h-10")}>Proceed to Payment</Button>
      </div>
    </div>
  );
}
