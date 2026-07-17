import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, Mail, MapPin, Phone, ShieldCheck, Chrome, ArrowRight, X } from "lucide-react";
import { useAuth } from "@/components/site/AuthContext";
import { triggerNomadikAuth } from "./AuthModal";
import { captureItineraryLeadFn } from "@/lib/itinerary-pdf-fns";

interface ItineraryUnlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: string;
  packageName: string;
  onSuccess: () => void;
}

export function ItineraryUnlockModal({
  open,
  onOpenChange,
  packageId,
  packageName,
  onSuccess
}: ItineraryUnlockModalProps) {
  const { signInWithGoogle } = useAuth();
  
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error("Google sign-in failed. Please try email login.");
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      // 1. Capture the email lead
      await captureItineraryLeadFn({
        data: {
          email,
          phone: phone || undefined,
          city: city || undefined,
          package_id: packageId,
          source: "Premium PDF"
        }
      });

      // 2. Close this modal
      onOpenChange(false);

      // 3. Immediately trigger AuthModal in signup/login mode, prefilled with their email
      triggerNomadikAuth({
        mode: "signup",
        email: email,
        message: `Create a quick password to instantly unlock the ${packageName} PDF guide.`,
        onSuccess: () => {
          onSuccess();
        }
      });
    } catch (err: any) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-background border border-border p-0 rounded-3xl shadow-elegant overflow-hidden glass">
        
        {/* Banner */}
        <div className="bg-[#0F172A] py-8 px-6 text-center text-white relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 via-transparent to-amber-900/20" />
          <div className="relative z-10 space-y-2">
            <span className="glass-dark inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-poppins font-bold uppercase tracking-widest text-[#F59E0B] border border-[#F59E0B]/30">
              <ShieldCheck className="h-3.5 w-3.5 animate-pulse" /> Nomadik Premium Guide
            </span>
            <DialogTitle className="font-display text-2xl font-bold tracking-wide text-white">
              Unlock Your Complete Travel Guide
            </DialogTitle>
            <DialogDescription className="text-white/80 font-sans text-xs max-w-sm mx-auto">
              Get direct access to our vetted itineraries, pickup guidelines, packing checklist, and map details.
            </DialogDescription>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-poppins text-muted-foreground bg-muted/30 p-4 rounded-2xl border border-border/50">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Full Day-by-Day Timeline</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Vetted Hotel Recommendations</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Exact Pickup Locations</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Complete Packing Checklist</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Interactive Travel Maps</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Local Food & Cafe Tips</span>
            </div>
          </div>

          {/* Social login */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full h-11 rounded-xl bg-white border border-border shadow-sm hover:bg-muted/10 font-semibold font-poppins flex items-center justify-center gap-2.5 text-xs text-primary transition-all"
            >
              <Chrome className="h-4 w-4 text-red-500" /> Continue with Google
            </Button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border/70"></div>
              <span className="flex-shrink mx-4 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Or enter email to unlock</span>
              <div className="flex-grow border-t border-border/70"></div>
            </div>

            {/* Email form */}
            <form onSubmit={handleLeadSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-primary">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-muted-foreground/60" />
                  <Input
                    type="email"
                    placeholder="e.g. ansh@gmail.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-primary">Phone Number (Optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4.5 w-4.5 text-muted-foreground/60" />
                    <Input
                      type="tel"
                      placeholder="e.g. 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 h-11 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-primary">Your City (Optional)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 h-4.5 w-4.5 text-muted-foreground/60" />
                    <Input
                      type="text"
                      placeholder="e.g. New Delhi"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="pl-10 h-11 bg-white"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-accent text-white font-semibold font-poppins text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-accent/25 hover:shadow-lg transition-all mt-4"
              >
                {loading ? "Saving lead..." : "Get Free Access"} <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        <DialogFooter className="bg-muted/20 px-6 py-4 border-t border-border/50 text-[10px] text-muted-foreground text-center font-poppins">
          By continuing, you agree to receive premium itinerary updates and travel recommendations from Nomadik.
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
