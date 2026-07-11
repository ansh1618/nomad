import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { KeyRound, Mail, Phone, User, Compass, AlertCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface AuthModalOptions {
  mode?: "login" | "signup" | "forgot";
  onSuccess?: () => void;
  allowGuest?: boolean;
}

let triggerAuthModalInstance: (options?: AuthModalOptions) => void = () => {};

export function triggerNomadikAuth(options?: AuthModalOptions) {
  triggerAuthModalInstance(options);
}

export function AuthModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [options, setOptions] = useState<AuthModalOptions>({});

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // States
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    triggerAuthModalInstance = (opts) => {
      if (opts?.mode) setMode(opts.mode);
      setOptions(opts || {});
      setOpen(true);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      toast.success("Successfully logged in!");
      setOpen(false);
      if (options.onSuccess) options.onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!agreeTerms) {
      toast.error("You must agree to the Terms and Privacy Policy.");
      return;
    }

    setLoading(true);
    try {
      // 1. Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone
          }
        }
      });

      if (authError) throw authError;

      // 2. Sync to public.users table (standard policy permits self-insert)
      if (authData.user) {
        const { error: profileError } = await supabase
          .from("users")
          .insert([
            {
              id: authData.user.id,
              full_name: fullName,
              phone: phone,
              email: email
            }
          ]);
        if (profileError) {
          console.error("Profile sync error:", profileError);
        }
      }

      toast.success("Registration complete! Check your email for verification.");
      setOpen(false);
      if (options.onSuccess) options.onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to sign up.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please provide your email address.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account?reset=true`
      });
      if (error) throw error;

      toast.success("Reset link sent! Please check your email inbox.");
      setMode("login");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    toast.info("Google OAuth: Coming Soon (Credentials Configuration Pending)");
  };

  const handleContinueAsGuest = () => {
    setOpen(false);
    if (options.onSuccess) options.onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-background border border-border overflow-hidden p-0 rounded-2xl shadow-elegant glass flex flex-col max-h-[95vh]">
        <div className="bg-ocean py-6 px-6 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold tracking-wide text-white">
              {mode === "login" && "Welcome Back"}
              {mode === "signup" && "Create Account"}
              {mode === "forgot" && "Reset Password"}
            </DialogTitle>
            <DialogDescription className="text-white/80 font-sans text-xs mt-1">
              {mode === "login" && "Access your personalized Nomadik travels & convoy statistics."}
              {mode === "signup" && "Join the premium tribe of road-trip and group travel explorers."}
              {mode === "forgot" && "Provide your email to receive a password reset link."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-accent" /> Email Address
                </label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border-border h-11"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <KeyRound className="h-3 w-3 text-accent" /> Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-[10px] text-accent font-semibold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border-border h-11"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                />
                <label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer select-none">
                  Remember Me
                </label>
              </div>

              <Button type="submit" variant="hero" className="w-full h-11" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3 w-3 text-accent" /> Full Name
                </label>
                <Input
                  type="text"
                  placeholder="Harsh Vardhan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-white border-border h-10"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-accent" /> Email Address
                </label>
                <Input
                  type="email"
                  placeholder="harsh@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border-border h-10"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-accent" /> Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="99999 88888"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-white border-border h-10"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white border-border h-10"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    Confirm
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white border-border h-10"
                    required
                  />
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-1.5">
                <Checkbox
                  id="terms"
                  checked={agreeTerms}
                  onCheckedChange={(checked) => setAgreeTerms(!!checked)}
                />
                <label htmlFor="terms" className="text-[10px] text-muted-foreground leading-normal cursor-pointer select-none">
                  I agree to the Nomadik <a href="/terms" className="text-accent underline font-semibold">Terms of Service</a> & <a href="/privacy" className="text-accent underline font-semibold">Privacy Policy</a>.
                </label>
              </div>

              <Button type="submit" variant="hero" className="w-full h-11 mt-2" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-accent" /> Registered Email
                </label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border-border h-11"
                  required
                />
              </div>

              <Button type="submit" variant="hero" className="w-full h-11 animate-pulse" disabled={loading}>
                {loading ? "Sending link..." : "Send Reset Link"}
              </Button>

              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-xs text-accent font-semibold block text-center w-full hover:underline"
              >
                Back to Login
              </button>
            </form>
          )}

          {/* Divider */}
          {mode !== "forgot" && (
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground text-[10px] tracking-widest font-semibold font-poppins">OR</span></div>
            </div>
          )}

          {/* Alternate Sign-up/Login Links */}
          {mode !== "forgot" && (
            <div className="space-y-3.5">
              <Button
                variant="outline"
                className="w-full h-10 text-xs border-border flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
                onClick={handleGoogleLogin}
                type="button"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase font-bold tracking-wider">Coming Soon</span>
              </Button>

              {options.allowGuest && (
                <Button
                  onClick={handleContinueAsGuest}
                  variant="ocean"
                  className="w-full h-11 text-xs"
                  type="button"
                >
                  Continue as Guest <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}

              <div className="text-center text-xs text-muted-foreground pt-1">
                {mode === "login" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className="text-accent font-semibold hover:underline"
                    >
                      Sign Up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-accent font-semibold hover:underline"
                    >
                      Login
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
