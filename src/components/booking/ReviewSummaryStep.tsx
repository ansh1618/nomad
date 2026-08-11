import { Button } from "@/components/ui/button";
import { CheckCircle2, User, MapPin, Calendar, Users, Armchair, Tag, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReviewSummaryStep({ data, updateData, onNext, onPrev, onGoToStep, journey, isSidebar = false, pricing }: any) {
  
  const handleNext = () => {
    onNext();
  };

  const travellersCount = data?.travellers?.length || 1;
  const effectiveBasePrice = pricing?.effectiveBasePrice ?? pricing?.accommodationPrice ?? 0;
  const payableAmount = pricing?.grandTotal ?? pricing?.total ?? 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in w-full max-w-full overflow-hidden box-border">
      {/* Step Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-primary tracking-tight">
          Review Booking
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-poppins">
          Please review your journey details before making the payment.
        </p>
      </div>
      
      {/* Main Grid */}
      <div className={cn("grid gap-5 sm:gap-6 w-full", isSidebar ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2")}>
        
        {/* Left Column: Details & Travellers */}
        <div className="space-y-5 sm:space-y-6 w-full min-w-0">
          
          {/* Journey Details Card */}
          <div className="bg-white border border-border p-4 sm:p-6 rounded-2xl shadow-soft space-y-4 w-full box-border">
            <h3 className="font-poppins font-bold text-sm sm:text-base text-secondary border-b border-border pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent shrink-0" />
                Journey Details
              </span>
              {onGoToStep && (
                <button 
                  onClick={() => onGoToStep(0)} 
                  className="text-xs font-bold text-accent hover:underline cursor-pointer"
                >
                  Edit Date
                </button>
              )}
            </h3>
            
            <div className="space-y-3 text-xs sm:text-sm font-poppins">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 pb-2.5 border-b border-border/40">
                <span className="text-muted-foreground text-[11px] uppercase font-bold tracking-wider shrink-0 flex items-center gap-1.5">
                  Destination
                </span>
                <span className="font-semibold text-primary sm:text-right break-words font-medium">
                  {journey?.name || "Selected Journey"}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 pb-2.5 border-b border-border/40">
                <span className="text-muted-foreground text-[11px] uppercase font-bold tracking-wider shrink-0 flex items-center gap-1.5">
                  Duration
                </span>
                <span className="font-semibold text-foreground sm:text-right break-words">
                  {journey?.duration || "Standard Package"}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 pb-2.5 border-b border-border/40">
                <span className="text-muted-foreground text-[11px] uppercase font-bold tracking-wider shrink-0 flex items-center gap-1.5">
                  Travellers
                </span>
                <span className="font-semibold text-foreground sm:text-right">
                  {travellersCount} Explorer(s)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                <span className="text-muted-foreground text-[11px] uppercase font-bold tracking-wider shrink-0 flex items-center gap-1.5">
                  Seats Selected
                </span>
                <span className="font-semibold text-foreground sm:text-right break-words">
                  {data?.selectedSeats?.length > 0 ? data.selectedSeats.join(', ') : 'Auto-assign'}
                </span>
              </div>
            </div>
          </div>

          {/* Travellers Card */}
          <div className="bg-white border border-border p-4 sm:p-6 rounded-2xl shadow-soft space-y-4 w-full box-border">
            <h3 className="font-poppins font-bold text-sm sm:text-base text-secondary border-b border-border pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 text-accent shrink-0" />
                Travellers ({travellersCount})
              </span>
              {onGoToStep && (
                <button 
                  onClick={() => onGoToStep(0)} 
                  className="text-xs font-bold text-accent hover:underline cursor-pointer"
                >
                  Edit Travellers
                </button>
              )}
            </h3>
            <div className="space-y-2.5 font-poppins">
              {data.travellers.map((t: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-3 p-3 bg-muted/20 border border-border/50 rounded-xl text-xs sm:text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-primary truncate">{t.fullName || `Explorer ${i+1}`}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{t.phone || 'Contact provided at booking'}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Cost Breakdown */}
        <div className="bg-white border border-border p-4 sm:p-6 rounded-2xl shadow-soft flex flex-col justify-between w-full box-border">
          <div className="space-y-4">
            <h3 className="font-poppins font-bold text-sm sm:text-base text-secondary border-b border-border pb-3">
              Cost Breakdown
            </h3>
            
            <div className="space-y-3 text-xs sm:text-sm font-poppins">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-1 truncate">
                  Package Price <span className="text-[11px] text-muted-foreground/80">({travellersCount} x ₹{(pricing?.accommodationPrice ?? effectiveBasePrice).toLocaleString('en-IN')})</span>
                </span>
                <span className="font-semibold text-right shrink-0">
                  ₹{((pricing?.accommodationPrice ?? effectiveBasePrice) * travellersCount).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-1 truncate">Accommodation</span>
                <span className="font-semibold text-right text-emerald-700 shrink-0">
                  {data.selectedRoomObj ? `Included (${data.selectedRoomObj.type || data.selectedRoomObj.sharing_type})` : "Included"}
                </span>
              </div>
              
              {data.addons?.map((a: any) => (
                <div key={a.id} className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground flex-1 truncate">Add-ons ({a.name})</span>
                  <span className="font-semibold text-right shrink-0">₹{a.price.toLocaleString('en-IN')}</span>
                </div>
              ))}

              {data.coupon && (
                <div className="flex justify-between items-center gap-2 text-emerald-700 font-semibold">
                  <span className="flex-1 truncate flex items-center gap-1">
                    <Tag className="h-3 w-3 shrink-0" /> Coupon ({data.coupon.code})
                  </span>
                  <span className="text-right shrink-0">
                    - ₹{(pricing?.couponDiscount ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              
              <div className="border-t border-dashed border-border pt-3 mt-3 flex justify-between items-center gap-2">
                <span className="text-muted-foreground font-semibold flex-1">Subtotal</span>
                <span className="font-bold text-right text-foreground shrink-0">
                  ₹{(pricing?.subtotal ?? 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2 font-medium">
                <span className="text-muted-foreground flex-1">GST (5%)</span>
                <span className="font-semibold text-right text-foreground shrink-0">
                  ₹{(pricing?.gstAmount ?? 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="text-[11px] text-muted-foreground font-poppins pt-1 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>5% GST & all taxes included.</span>
              </div>
            </div>
          </div>

          {/* Grand Total Footer */}
          <div className="bg-muted/30 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 mt-6 p-4 sm:p-5 rounded-b-2xl border-t border-border/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Grand Total
              </span>
              <span className="text-2xl sm:text-3xl font-display font-bold text-primary tracking-tight truncate">
                ₹{(pricing?.grandTotal ?? pricing?.total ?? 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className={cn("flex flex-col-reverse sm:flex-row justify-between items-center pt-4 mt-6 sm:mt-8 gap-3.5 w-full", isSidebar && "flex-col-reverse")}>
        <Button 
          variant="outline" 
          onClick={onPrev} 
          className="w-full sm:w-auto h-12 text-xs font-semibold rounded-xl border-border px-6"
        >
          Back to Add-ons
        </Button>
        <Button 
          onClick={handleNext} 
          className="w-full sm:w-auto h-12 text-sm font-semibold rounded-xl bg-primary hover:bg-primary/90 px-8 text-white shadow-md active:scale-[0.99] transition-all"
        >
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
}
