import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, Plus, Check, TicketPercent } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export function AddonsAndCouponsStep({ data, updateData, onNext, onPrev, isSidebar = false, pricing }: any) {
  const [addonsList] = useState([
    { id: 'a1', name: 'River Rafting', price: 1500, desc: 'Thrilling white water rafting experience.' },
    { id: 'a2', name: 'Paragliding', price: 3000, desc: 'Soar above the valleys.' },
    { id: 'a3', name: 'Bonfire Night', price: 500, desc: 'Private bonfire with snacks.' }
  ]);
  
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");

  const toggleAddon = (addon: any) => {
    updateData((prev: any) => {
      const isSelected = prev.addons.some((a: any) => a.id === addon.id);
      let newAddons: any[] = [];

      if (isSelected) {
        newAddons = prev.addons.filter((a: any) => a.id !== addon.id);
      } else {
        newAddons = [...prev.addons, addon];
      }

      return { ...prev, addons: newAddons };
    });
  };

  const applyCoupon = async () => {
    setCouponError("");
    if (!couponInput) return;

    try {
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponInput.toUpperCase())
        .single();

      if (error || !coupon) {
        setCouponError("Invalid or expired coupon code.");
        return;
      }

      // Validation
      const now = new Date();
      if (new Date(coupon.valid_from) > now || (coupon.valid_until && new Date(coupon.valid_until) < now)) {
        setCouponError("This coupon is expired or not active yet.");
        return;
      }

      if (coupon.max_redemptions && coupon.current_redemptions >= coupon.max_redemptions) {
        setCouponError("Coupon redemption limit reached.");
        return;
      }

      if (pricing?.subtotal && pricing.subtotal < coupon.min_order_amount) {
        setCouponError(`Minimum order amount for this coupon is ₹${coupon.min_order_amount}`);
        return;
      }

      // Apply
      updateData((prev: any) => {
        return {
          ...prev,
          coupon: coupon
        };
      });
    } catch (err) {
      setCouponError("Error validating coupon. Please try again.");
    }
  };

  const removeCoupon = () => {
    updateData((prev: any) => {
      if (!prev.coupon) return prev;
      return {
        ...prev,
        coupon: null
      };
    });
    setCouponInput("");
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-6 animate-fade-in box-border">
      <div>
        <h2 className="text-2xl font-display font-bold text-primary">Add-ons & Coupons</h2>
        <p className="text-sm text-muted-foreground mt-1">Enhance your journey and apply discount codes.</p>
      </div>
      
      <div className="w-full max-w-full flex flex-col gap-6 box-border overflow-hidden">
        
        {/* Addons */}
        <div className="w-full max-w-full space-y-4 box-border overflow-hidden">
          <h3 className="font-poppins font-bold text-secondary flex items-center gap-2">
            <Plus className="h-5 w-5 text-accent" /> Optional Experiences
          </h3>
          <div className={cn("grid gap-4 w-full max-w-full overflow-hidden box-border", isSidebar ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3")}>
            {addonsList.map((addon) => {
              const isSelected = data.addons.some((a: any) => a.id === addon.id);
              return (
                <div 
                  key={addon.id} 
                  onClick={() => toggleAddon(addon)}
                  className={cn(
                    "w-full max-w-none box-border overflow-hidden rounded-[20px] p-5 flex justify-between items-start gap-4 min-h-[150px] cursor-pointer transition-all border-2",
                    isSelected ? "border-accent bg-accent/5" : "border-border hover:border-accent/50 bg-white"
                  )}
                >
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full space-y-2">
                    <div>
                      <h4 className="font-bold text-sm text-primary leading-snug break-words">{addon.name}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1 break-words">{addon.desc}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between h-full gap-3 shrink-0">
                    <span className="font-semibold text-sm whitespace-nowrap text-foreground">+ ₹{addon.price.toLocaleString('en-IN')}</span>
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center border shrink-0 transition-colors", isSelected ? "bg-accent border-accent text-white" : "border-muted-foreground/40 text-transparent bg-transparent")}>
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coupons */}
        <div className="w-full max-w-full space-y-4 box-border overflow-hidden">
          <h3 className="font-poppins font-bold text-secondary flex items-center gap-2">
            <TicketPercent className="h-5 w-5 text-accent" /> Apply Coupon
          </h3>
          <div className="w-full max-w-full bg-white border border-border p-5 rounded-[20px] shadow-soft space-y-4 box-border overflow-hidden">
            {data.coupon ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 gap-3 w-full box-border">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 shrink-0" />
                  <span className="font-bold text-sm">{data.coupon.code} Applied</span>
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                  <span className="font-bold text-sm whitespace-nowrap">- ₹{(data.coupon.discount || data.coupon.discount_value || 0).toLocaleString('en-IN')}</span>
                  <button onClick={removeCoupon} className="text-xs text-red-500 hover:underline font-semibold cursor-pointer">Remove</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 w-full box-border">
                <div className="flex flex-col sm:flex-row gap-3 w-full box-border">
                  <Input 
                    placeholder="Enter Coupon Code" 
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="uppercase w-full h-11 text-sm rounded-xl border-border"
                  />
                  <Button onClick={applyCoupon} variant="secondary" className="w-full sm:w-auto h-11 px-6 text-sm font-semibold shrink-0 rounded-xl">Apply</Button>
                </div>
                {couponError && <p className="text-xs text-red-500 font-medium">{couponError}</p>}
                <p className="text-xs text-muted-foreground italic">Try code: NOMADIK10</p>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className={cn("flex justify-between pt-4 border-t border-border mt-8 gap-3 w-full", isSidebar && "flex-col-reverse w-full")}>
        <Button variant="outline" onClick={onPrev} className={cn(isSidebar && "w-full h-10")}>Back to Accommodation</Button>
        <Button onClick={onNext} className={cn("bg-primary hover:bg-primary/90", isSidebar && "w-full h-10")}>Continue to Review</Button>
      </div>
    </div>
  );
}
