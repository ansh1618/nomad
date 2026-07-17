import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/site/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, Phone, User, ArrowRight, CheckCircle2 } from "lucide-react";
import logoFallback from "@/assets/logo.jpg";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>): { returnTo?: string } => ({
    returnTo: search.returnTo as string | undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create Account | Nomadik" },
      { name: "description", content: "Join Nomadik — India's premium curated road trip community." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { signUp, signInWithGoogle, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { returnTo } = useSearch({ from: "/signup" });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate({ to: returnTo || "/account" } as any);
    }
  }, [isAuthenticated, loading, navigate, returnTo]);

  // Password strength
  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { level: 1, label: "Weak", color: "bg-red-500" };
    if (score === 2) return { level: 2, label: "Fair", color: "bg-orange-400" };
    if (score === 3) return { level: 3, label: "Good", color: "bg-yellow-500" };
    return { level: 4, label: "Strong", color: "bg-green-500" };
  };

  const strength = getPasswordStrength();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (!agreeTerms) {
      toast.error("Please accept the Terms of Service to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const { needsVerification } = await signUp(email, password, fullName, phone);
      if (needsVerification) {
        setVerificationSent(true);
      } else {
        // Auto-confirmed (e.g. OAuth or email confirmation disabled)
        toast.success("Account created! Welcome to Nomadik 🎉");
        navigate({ to: returnTo || "/account" } as any);
      }
    } catch (err: any) {
      toast.error(err.message || "Sign up failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle(returnTo || undefined);
    } catch (err: any) {
      toast.error(err.message || "Google signup failed.");
      setGoogleLoading(false);
    }
  };

  if (loading) return null;

  // ── Verification sent screen ───────────────────────────────
  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-6 p-8 bg-card rounded-3xl border border-border shadow-elegant">
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold font-poppins text-foreground">Check Your Inbox</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We've sent a verification email to <strong className="text-foreground">{email}</strong>.
              Click the link in the email to activate your account.
            </p>
          </div>
          <div className="bg-secondary/10 rounded-2xl p-4 text-left space-y-2">
            <p className="text-xs font-poppins font-semibold text-foreground">What to do next:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Open your email inbox</li>
              <li>Find the email from Nomadik</li>
              <li>Click "Confirm Email" button</li>
              <li>You'll be redirected back to login</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">
            Didn't receive it? Check your spam folder or{" "}
            <button
              className="text-accent font-semibold hover:underline"
              onClick={() => setVerificationSent(false)}
            >
              try again
            </button>
            .
          </p>
          <Link to="/login" className="block">
            <Button variant="outline" className="w-full rounded-xl">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Decorative */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-primary via-primary/95 to-secondary/40 flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-5%] left-[-10%] w-80 h-80 rounded-full bg-gold/10 blur-3xl" />
          <div className="absolute bottom-[10%] right-[-10%] w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        </div>

        <Link to="/" className="relative flex items-center gap-3">
          <img src={logoFallback} alt="Nomadik" className="h-12 w-12 rounded-xl object-cover border border-white/20" />
          <div>
            <p className="font-poppins text-xl font-bold text-white uppercase tracking-wider leading-none">Nomadik</p>
            <p className="text-[10px] text-gold font-poppins font-bold tracking-widest uppercase mt-1">Premium Road Trips</p>
          </div>
        </Link>

        <div className="relative space-y-5">
          <h1 className="font-display text-4xl text-white font-bold leading-tight">
            Join India's most<br />trusted travel tribe.
          </h1>
          <div className="space-y-3">
            {[
              "Book premium curated road trips",
              "Real-time convoy tracking",
              "Manage travellers & bookings",
              "Exclusive member offers",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                <span className="text-white/80 text-sm">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/40 text-xs font-poppins">
          © {new Date().getFullYear()} The Nomadik Traveller
        </p>
      </div>

      {/* Right — Signup Form */}
      <div className="flex-1 flex items-start justify-center px-6 py-10 bg-background overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex justify-center pt-4">
            <Link to="/"><img src={logoFallback} alt="Nomadik" className="h-14 w-14 rounded-xl object-cover" /></Link>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-poppins text-foreground">Create account</h2>
            <p className="text-sm text-muted-foreground">Join the Nomadik community — it's free</p>
          </div>

          {/* Google */}
          <Button
            variant="outline"
            className="w-full h-12 border-border flex items-center justify-center gap-3 text-sm font-semibold rounded-xl"
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            type="button"
            id="google-signup-btn"
          >
            {googleLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Sign up with Google
          </Button>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-poppins font-semibold uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-poppins font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3 w-3" /> Full Name
              </label>
              <Input
                id="signup-fullname"
                type="text"
                placeholder="Harsh Vardhan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-11 rounded-xl"
                required
                autoComplete="name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-poppins font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3 w-3" /> Email
                </label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-poppins font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3 w-3" /> Phone
                </label>
                <Input
                  id="signup-phone"
                  type="tel"
                  placeholder="+91 99999 88888"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 rounded-xl"
                  required
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-poppins font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Lock className="h-3 w-3" /> Password
              </label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl pr-10"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Strength meter */}
              {password && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map((l) => (
                      <div
                        key={l}
                        className={`h-1 flex-1 rounded-full transition-all ${l <= strength.level ? strength.color : "bg-border"}`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-poppins font-semibold ${strength.level >= 3 ? "text-green-600" : "text-orange-500"}`}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-poppins font-semibold uppercase tracking-wider text-muted-foreground">
                Confirm Password
              </label>
              <Input
                id="signup-confirm-password"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`h-11 rounded-xl ${confirmPassword && confirmPassword !== password ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                required
                autoComplete="new-password"
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-red-500">Passwords don't match</p>
              )}
            </div>

            <div className="flex items-start gap-2 pt-1">
              <Checkbox
                id="agree-terms"
                checked={agreeTerms}
                onCheckedChange={(v) => setAgreeTerms(!!v)}
              />
              <label htmlFor="agree-terms" className="text-xs text-muted-foreground leading-normal cursor-pointer select-none">
                I agree to Nomadik's{" "}
                <a href="/terms" target="_blank" className="text-accent underline font-semibold">Terms of Service</a>
                {" & "}
                <a href="/privacy" target="_blank" className="text-accent underline font-semibold">Privacy Policy</a>
              </label>
            </div>

            <Button
              id="signup-submit-btn"
              type="submit"
              className="w-full h-12 rounded-xl font-poppins font-semibold text-sm gap-2"
              disabled={submitting || !agreeTerms}
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>Create Account <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              search={{ returnTo }}
              className="text-accent font-semibold hover:underline"
            >
              Log in
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">← Back to Nomadik</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
