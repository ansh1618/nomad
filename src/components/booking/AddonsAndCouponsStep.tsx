import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, Plus, Check, TicketPercent } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export function AddonsAndCouponsStep({ data, updateData, onNext, onPrev, isSidebar = false }: any) {
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
      let newTotal = prev.totalAmount;

      if (isSelected) {
        newAddons = prev.addons.filter((a: any) => a.id !== addon.id);
        newTotal -= addon.price;
      } else {
        newAddons = [...prev.addons, addon];
        newTotal += addon.price;
      }

      return { ...prev, addons: newAddons, totalAmount: newTotal };
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

      if (data.baseAmount < coupon.min_order_amount) {
        setCouponError(`Minimum order amount for this coupon is ₹${coupon.min_order_amount}`);
        return;
      }

      // Apply
      updateData((prev: any) => {
        let discount = 0;
        if (coupon.discount_type === "PERCENTAGE") {
          discount = (prev.baseAmount * coupon.discount_value) / 100;
          if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
            discount = coupon.max_discount_amount;
          }
        } else if (coupon.discount_type === "FIXED") {
          discount = coupon.discount_value;
        }

        return {
          ...prev,
          coupon: { code: coupon.code, discount, id: coupon.id },
          totalAmount: prev.baseAmount + prev.addons.reduce((sum: number, a: any) => sum + a.price, 0) - discount
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
        coupon: null,
        totalAmount: prev.baseAmount + prev.addons.reduce((sum: number, a: any) => sum + a.price, 0)
      };
    });
    setCouponInput("");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-primary">Add-ons & Coupons</h2>
        <p className="text-sm text-muted-foreground mt-1">Enhance your journey and apply discount codes.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Addons */}
        <div className="space-y-4">
          <h3 className="font-poppins font-bold text-secondary flex items-center gap-2">
            <Plus className="h-5 w-5" /> Optional Experiences
          </h3>
          <div className="space-y-3">
            {addonsList.map((addon) => {
              const isSelected = data.addons.some((a: any) => a.id === addon.id);
              return (
                <div 
                  key={addon.id} 
                  onClick={() => toggleAddon(addon)}
                  className={cn(
                    "p-4 border-2 rounded-xl flex items-center justify-between cursor-pointer transition",
                    isSelected ? "border-accent bg-accent/5" : "border-border hover:border-accent/50 bg-white"
                  )}
                >
                  <div>
                    <h4 className="font-bold text-sm text-primary">{addon.name}</h4>
                    <p className="text-xs text-muted-foreground">{addon.desc}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">+ ₹{addon.price}</span>
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center border", isSelected ? "bg-accent border-accent text-white" : "border-muted-foreground text-transparent")}>
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coupons */}
        <div className="space-y-4">
          <h3 className="font-poppins font-bold text-secondary flex items-center gap-2">
            <TicketPercent className="h-5 w-5" /> Apply Coupon
          </h3>
          <div className="bg-white border border-border p-5 rounded-xl shadow-soft space-y-4">
            {data.coupon ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span className="font-bold">{data.coupon.code} Applied</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">- ₹{data.coupon.discount}</span>
                  <button onClick={removeCoupon} className="text-xs text-red-500 hover:underline">Remove</button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter Coupon Code" 
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="uppercase"
                  />
                  <Button onClick={applyCoupon} variant="secondary">Apply</Button>
                </div>
                {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                <p className="text-xs text-muted-foreground italic">Try code: NOMADIK10</p>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className={cn("flex justify-between pt-4 border-t border-border mt-8 gap-3", isSidebar && "flex-col-reverse w-full")}>
        <Button variant="outline" onClick={onPrev} className={cn(isSidebar && "w-full h-10")}>Back to Accommodation</Button>
        <Button onClick={onNext} className={cn("bg-primary hover:bg-primary/90", isSidebar && "w-full h-10")}>Continue to Review</Button>
      </div>
    </div>
  );
}
