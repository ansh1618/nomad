import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/site/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, Compass, ArrowRight } from "lucide-react";
import { Link as TLink } from "@tanstack/react-router";
import logoFallback from "@/assets/logo.jpg";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { returnTo?: string } => ({
    returnTo: search.returnTo as string | undefined,
  }),
  head: () => ({
    meta: [
      { title: "Login | Nomadik" },
      { name: "description", content: "Login to your Nomadik account to manage bookings, trips, and profile." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, signInWithGoogle, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { returnTo } = useSearch({ from: "/login" });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate({ to: returnTo || "/account" } as any);
    }
  }, [isAuthenticated, loading, navigate, returnTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back!");
      navigate({ to: returnTo || "/account" } as any);
    } catch (err: any) {
      toast.error(err.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle(returnTo || undefined);
      // Browser redirects, no code runs after this
    } catch (err: any) {
      toast.error(err.message || "Google login failed.");
      setGoogleLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex">
      {/* Left — Decorative Panel */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-primary via-primary/95 to-secondary/40 flex-col justify-between p-12 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-gold/10 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        </div>

        <Link to="/" className="relative flex items-center gap-3">
          <img src={logoFallback} alt="Nomadik" className="h-12 w-12 rounded-xl object-cover border border-white/20" />
          <div>
            <p className="font-poppins text-xl font-bold text-white uppercase tracking-wider leading-none">Nomadik</p>
            <p className="text-[10px] text-gold font-poppins font-bold tracking-widest uppercase mt-1">Premium Road Trips</p>
          </div>
        </Link>

        <div className="relative space-y-6">
          <h1 className="font-display text-5xl text-white font-bold leading-tight">
            Every road leads<br />to a new story.
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-sm">
            Log in to access your bookings, track upcoming journeys, and unlock exclusive member experiences.
          </p>
          <div className="flex gap-4">
            {["10K+", "500+", "50+"].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="font-poppins text-2xl font-bold text-gold">{stat}</p>
                <p className="text-white/60 text-xs font-poppins">{["Travellers", "Trips Done", "Destinations"][i]}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/40 text-xs font-poppins">
          © {new Date().getFullYear()} The Nomadik Traveller. All rights reserved.
        </p>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center">
            <Link to="/">
              <img src={logoFallback} alt="Nomadik" className="h-14 w-14 rounded-xl object-cover" />
            </Link>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-poppins text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to your Nomadik account</p>
          </div>

          {/* Google Button */}
          <Button
            variant="outline"
            className="w-full h-12 border-border flex items-center justify-center gap-3 text-sm font-semibold rounded-xl hover:bg-secondary/5 transition-all"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            type="button"
            id="google-login-btn"
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
            Continue with Google
          </Button>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-poppins font-semibold uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-poppins font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3 w-3" /> Email Address
              </label>
              <Input
                id="login-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-border bg-background text-sm"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-poppins font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3 w-3" /> Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-accent font-semibold hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-border pr-10 bg-background text-sm"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(!!v)}
              />
              <label htmlFor="remember-me" className="text-xs text-muted-foreground cursor-pointer select-none">
                Keep me logged in
              </label>
            </div>

            <Button
              id="login-submit-btn"
              type="submit"
              className="w-full h-12 rounded-xl font-poppins font-semibold text-sm gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>Sign In <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/signup"
              search={{ returnTo }}
              className="text-accent font-semibold hover:underline"
            >
              Sign up free
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              ← Back to Nomadik
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
