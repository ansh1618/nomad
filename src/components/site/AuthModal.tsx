import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { KeyRound, Mail, Phone, User, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/site/AuthContext";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

// ─────────────────────────────────────────────────────────────
// Imperative trigger (used by Navbar, booking pages, etc.)
// ─────────────────────────────────────────────────────────────

export interface AuthModalOptions {
  mode?: "login" | "signup" | "forgot";
  onSuccess?: () => void;
  allowGuest?: boolean;
  returnTo?: string;
  message?: string;
  email?: string;
}

let triggerAuthModalInstance: (options?: AuthModalOptions) => void = () => {};

export function triggerNomadikAuth(options?: AuthModalOptions) {
  triggerAuthModalInstance(options);
}

// ─────────────────────────────────────────────────────────────
// AuthModal Component
// ─────────────────────────────────────────────────────────────

export function AuthModal() {
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [options, setOptions] = useState<AuthModalOptions>({});

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // Register imperative trigger
  useEffect(() => {
    triggerAuthModalInstance = (opts) => {
      if (opts?.mode) setMode(opts.mode);
      setOptions(opts || {});
      setOpen(true);
      // Reset state
      setEmail(opts?.email || "");
      setPassword("");
      setFullName("");
      setPhone("");
      setConfirmPassword("");
      setVerificationSent(false);
      setForgotSent(false);
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
    setVerificationSent(false);
    setForgotSent(false);
  };

  // ── Google OAuth ────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle(options.returnTo);
      // Browser redirects — nothing runs after this
    } catch (err: any) {
      toast.error(err.message || "Google login failed.");
      setGoogleLoading(false);
    }
  };

  // ── Email Login ─────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields."); return; }
    setLoading(true);
    try {
      await signIn(email, password);
      handleClose();
      if (options.onSuccess) options.onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  // ── Sign Up ─────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) { toast.error("Passwords do not match."); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (!agreeTerms) { toast.error("Please accept the Terms to continue."); return; }

    setLoading(true);
    try {
      const { needsVerification } = await signUp(email, password, fullName, phone);
      if (needsVerification) {
        setVerificationSent(true);
      } else {
        handleClose();
        if (options.onSuccess) options.onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || "Sign up failed.");
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password ─────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email address."); return; }
    setLoading(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      if (error) throw error;
      setForgotSent(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    handleClose();
    if (options.onSuccess) options.onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-background border border-border overflow-hidden p-0 rounded-2xl shadow-elegant glass flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="bg-primary py-6 px-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold tracking-wide text-white">
              {mode === "login" && "Welcome Back"}
              {mode === "signup" && "Join Nomadik"}
              {mode === "forgot" && "Reset Password"}
            </DialogTitle>
            <DialogDescription className="text-white/80 font-sans text-xs mt-1">
              {options.message
                ? options.message
                : mode === "login"
                ? "Sign in to access your bookings and travel history."
                : mode === "signup"
                ? "Create your free account and join 10,000+ explorers."
                : "Enter your email to receive a password reset link."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* ── Verification Sent ──────────────────────────── */}
          {verificationSent && (
            <div className="text-center space-y-4 py-2">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <h3 className="font-bold font-poppins text-foreground">Check Your Inbox</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  We sent a verification email to <strong>{email}</strong>.
                  Click the link to activate your account.
                </p>
              </div>
              <Button variant="outline" className="w-full rounded-xl" onClick={handleClose}>
                Done
              </Button>
            </div>
          )}

          {/* ── Forgot Sent ────────────────────────────────── */}
          {forgotSent && (
            <div className="text-center space-y-4 py-2">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <h3 className="font-bold font-poppins text-foreground">Reset Link Sent</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Check <strong>{email}</strong> for your reset link. Link expires in 1 hour.
                </p>
              </div>
              <Button variant="outline" className="w-full rounded-xl" onClick={() => { setForgotSent(false); setMode("login"); }}>
                Back to Login
              </Button>
            </div>
          )}

          {/* ── Login ─────────────────────────────────────── */}
          {!verificationSent && !forgotSent && mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-accent" /> Email
                </label>
                <Input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background border-border h-11" required />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <KeyRound className="h-3 w-3 text-accent" /> Password
                  </label>
                  <button type="button" onClick={() => setMode("forgot")} className="text-[10px] text-accent font-semibold hover:underline">
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-background border-border h-11 pr-9" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" variant="hero" className="w-full h-11" disabled={loading}>
                {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Sign In"}
              </Button>
            </form>
          )}

          {/* ── Sign Up ───────────────────────────────────── */}
          {!verificationSent && !forgotSent && mode === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3 w-3 text-accent" /> Full Name
                  </label>
                  <Input type="text" placeholder="Harsh Vardhan" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-background h-10" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-accent" /> Email
                  </label>
                  <Input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background h-10" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-accent" /> Phone
                  </label>
                  <Input type="tel" placeholder="+91 99999 88888" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-background h-10" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">Password</label>
                  <Input type="password" placeholder="Min. 8 chars" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-background h-10" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">Confirm</label>
                  <Input type="password" placeholder="Confirm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-background h-10" required />
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox id="modal-terms" checked={agreeTerms} onCheckedChange={(v) => setAgreeTerms(!!v)} />
                <label htmlFor="modal-terms" className="text-[10px] text-muted-foreground leading-normal cursor-pointer">
                  I agree to the{" "}
                  <a href="/terms" target="_blank" className="text-accent underline font-semibold">Terms</a> &{" "}
                  <a href="/privacy" target="_blank" className="text-accent underline font-semibold">Privacy Policy</a>
                </label>
              </div>

              <Button type="submit" variant="hero" className="w-full h-11" disabled={loading || !agreeTerms}>
                {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Create Account"}
              </Button>
            </form>
          )}

          {/* ── Forgot ────────────────────────────────────── */}
          {!verificationSent && !forgotSent && mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-accent" /> Registered Email
                </label>
                <Input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background h-11" required />
              </div>
              <Button type="submit" variant="hero" className="w-full h-11" disabled={loading}>
                {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Send Reset Link"}
              </Button>
              <button type="button" onClick={() => setMode("login")} className="text-xs text-accent font-semibold block text-center w-full hover:underline">
                Back to Login
              </button>
            </form>
          )}

          {/* ── OAuth + mode switch (not shown on forgot/sent screens) ── */}
          {!verificationSent && !forgotSent && mode !== "forgot" && (
            <>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground text-[10px] tracking-widest font-semibold font-poppins">OR</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full h-10 text-xs border-border flex items-center justify-center gap-2"
                  onClick={handleGoogleLogin}
                  type="button"
                  disabled={googleLoading}
                  id="modal-google-btn"
                >
                  {googleLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <>
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </Button>

                {options.allowGuest && (
                  <Button onClick={handleContinueAsGuest} variant="ocean" className="w-full h-11 text-xs" type="button">
                    Continue as Guest <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}

                <div className="text-center text-xs text-muted-foreground pt-1">
                  {mode === "login" ? (
                    <>
                      Don't have an account?{" "}
                      <button type="button" onClick={() => setMode("signup")} className="text-accent font-semibold hover:underline">Sign Up</button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button type="button" onClick={() => setMode("login")} className="text-accent font-semibold hover:underline">Login</button>
                    </>
                  )}
                </div>

                <div className="text-center text-xs text-muted-foreground">
                  <Link to="/login" onClick={handleClose} className="text-muted-foreground hover:text-foreground underline">
                    Full login page →
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
