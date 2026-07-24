/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Chrome,
  ArrowRight,
  User,
  KeyRound,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/site/AuthContext";

interface ItineraryLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onSuccess: () => void;
}

export function ItineraryLoginModal({
  open,
  onOpenChange,
  title,
  onSuccess,
}: ItineraryLoginModalProps) {
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // On Google redirect, return flow handles session
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Google login failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in email and password.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
        toast.success("Welcome back! Opening itinerary...");
        onOpenChange(false);
        onSuccess();
      } else {
        if (!fullName || !phone) {
          toast.error("Please fill in your name and phone number.");
          setLoading(false);
          return;
        }
        const res = await signUp(email, password, fullName, phone);
        if (res?.needsVerification) {
          toast.success("Verification email sent! Check your inbox.");
        } else {
          toast.success("Account created! Opening itinerary...");
          onOpenChange(false);
          onSuccess();
        }
      }
    } catch (err: any) {
      console.error("[ItineraryLoginModal] Auth error:", err);
      toast.error(err.message || "Authentication failed. Check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full bg-[#0F172A] border border-[#334155] p-0 rounded-[28px] shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden text-white font-sans backdrop-blur-xl">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-slate-950 via-[#1E293B] to-slate-950 p-6 text-center border-b border-[#334155] relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F59E0B]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-poppins font-bold uppercase tracking-widest bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
              <Lock className="h-3 w-3" /> Unlock Complete Itinerary
            </span>

            <DialogTitle className="font-display font-bold text-2xl text-white tracking-wide">
              {title || "Travel Guide & Roadmap"}
            </DialogTitle>

            <DialogDescription className="text-white/70 text-xs font-poppins max-w-xs mx-auto">
              Login to access full day-wise guide, stay details, maps, and inclusions.
            </DialogDescription>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Feature Checklist */}
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl space-y-2">
            <p className="text-[11px] font-poppins font-bold uppercase tracking-wider text-[#F59E0B]">
              🔒 Login to Access:
            </p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] font-poppins text-white/90">
              {[
                "Complete day-by-day",
                "Vetted Hotels & Stays",
                "Meals & Food info",
                "Exact Pickup Points",
                "Inclusions & Exclusions",
                "Packing Checklist",
                "Travel Guide Notes",
                "Cancellation Policies",
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Social Auth Option */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full h-11 bg-white hover:bg-slate-100 text-slate-900 font-poppins font-semibold text-xs rounded-xl border border-slate-300 flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer"
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
              ) : (
                <Chrome className="h-4 w-4 text-[#4285F4]" />
              )}
              <span>Continue with Google</span>
            </Button>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-[#0F172A] px-3 text-[10px] uppercase font-poppins font-bold text-slate-400">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3 font-poppins">
            {mode === "signup" && (
              <>
                <div className="space-y-1">
                  <Label className="text-[11px] text-white/80 font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Ansh Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={mode === "signup"}
                      className="pl-9 h-10 bg-slate-900/90 border-slate-700 text-white text-xs rounded-xl focus:border-[#F59E0B]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-white/80 font-medium">Phone Number</Label>
                  <div className="relative">
                    <Input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required={mode === "signup"}
                      className="h-10 bg-slate-900/90 border-slate-700 text-white text-xs rounded-xl focus:border-[#F59E0B]"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <Label className="text-[11px] text-white/80 font-medium">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="nomad@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-9 h-10 bg-slate-900/90 border-slate-700 text-white text-xs rounded-xl focus:border-[#F59E0B]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-white/80 font-medium">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-9 h-10 bg-slate-900/90 border-slate-700 text-white text-xs rounded-xl focus:border-[#F59E0B]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full h-11 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white font-poppins font-bold text-xs uppercase tracking-wider rounded-xl shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{mode === "login" ? "Sign In & Unlock PDF" : "Create Account & Unlock"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Mode Switcher Footer */}
          <div className="text-center text-xs text-slate-400 font-poppins pt-1 border-t border-slate-800">
            {mode === "login" ? (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-[#F59E0B] font-bold hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-[#F59E0B] font-bold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>

        </div>

      </DialogContent>
    </Dialog>
  );
}
