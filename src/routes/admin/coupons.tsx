import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  TicketPercent,
  Trash2,
  Calendar,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/admin/coupons")({
  component: AdminCoupons,
});

function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [destinations, setDestinations] = useState<any[]>([]);

  // Form states for new coupon
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("FLAT");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [firstBookingOnly, setFirstBookingOnly] = useState(false);
  const [destId, setDestId] = useState("");
  const [open, setOpen] = useState(false);

  const fetchDropdowns = async () => {
    try {
      const { data } = await supabase.from("destinations").select("id, name");
      setDestinations(data || []);
    } catch (err: any) {
      console.error(err.message);
    }
  };

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select(`
          *,
          destinations (name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchDropdowns();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon code permanently?")) return;
    try {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
      toast.success("Coupon code deleted");
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete coupon");
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: code.toUpperCase().trim(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        min_order_amount: minOrder ? parseFloat(minOrder) : 0,
        max_discount_amount: maxDiscount ? parseFloat(maxDiscount) : null,
        valid_from: validFrom ? new Date(validFrom).toISOString() : new Date().toISOString(),
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
        max_redemptions: maxRedemptions ? parseInt(maxRedemptions) : null,
        first_booking_only: firstBookingOnly,
        destination_id: destId || null,
      };

      const { error } = await supabase.from("coupons").insert([payload]);
      if (error) throw error;

      toast.success("Coupon created successfully");
      setOpen(false);
      // Reset form
      setCode("");
      setDiscountValue("");
      setMinOrder("");
      setMaxDiscount("");
      setValidFrom("");
      setValidUntil("");
      setMaxRedemptions("");
      setFirstBookingOnly(false);
      setDestId("");
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || "Failed to create coupon");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground">Discount & Promotion Coupons</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure FLAT discounts, percentage offers, ex-destination promo runs, and usages thresholds.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5 bg-primary">
              <Plus className="h-4 w-4" /> Add Coupon code
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Configure Promotion Coupon</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCoupon} className="space-y-4 pt-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Coupon Code</Label>
                  <Input value={code} onChange={e => setCode(e.target.value)} required placeholder="e.g. FIRST500" className="uppercase" />
                </div>
                <div className="space-y-1">
                  <Label>Discount Type</Label>
                  <Select value={discountType} onValueChange={setDiscountType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FLAT">FLAT INR</SelectItem>
                      <SelectItem value="PERCENTAGE">PERCENTAGE %</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Value</Label>
                  <Input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} required placeholder="500 or 10" />
                </div>
                <div className="space-y-1">
                  <Label>Min Order (INR)</Label>
                  <Input type="number" value={minOrder} onChange={e => setMinOrder(e.target.value)} placeholder="e.g. 7000" />
                </div>
                <div className="space-y-1">
                  <Label>Max Discount (INR)</Label>
                  <Input type="number" value={maxDiscount} onChange={e => setMaxDiscount(e.target.value)} placeholder="Optional limit" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Valid From</Label>
                  <Input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Valid Until</Label>
                  <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Redemptions Limit</Label>
                  <Input type="number" value={maxRedemptions} onChange={e => setMaxRedemptions(e.target.value)} placeholder="e.g. 100" />
                </div>
                <div className="space-y-1">
                  <Label>Destination specific</Label>
                  <Select value={destId} onValueChange={setDestId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Destinations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Destinations</SelectItem>
                      {destinations.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch id="first" checked={firstBookingOnly} onCheckedChange={setFirstBookingOnly} />
                <Label htmlFor="first">Apply to First Booking only</Label>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit">Create Coupon</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading promo codes...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No coupon codes active.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Promo Code</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Discount</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Threshold</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Expiry</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Usage</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/10 transition">
                    <td className="py-3 px-4 font-mono font-bold text-primary">{c.code}</td>
                    <td className="py-3 px-4 font-semibold">
                      {c.discount_type === "FLAT" ? `₹${c.discount_value}` : `${c.discount_value}% OFF`}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">Min order: ₹{c.min_order_amount}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{c.valid_until ? new Date(c.valid_until).toLocaleDateString('en-IN') : "Never"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-xs">
                      {c.current_redemptions} {c.max_redemptions ? `/ ${c.max_redemptions}` : "usages"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(c.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
