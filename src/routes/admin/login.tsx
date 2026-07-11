import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Mountain, Loader2, AlertCircle, Lock, Mail, HelpCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { signIn, isAdmin } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  // Initialize rememberMe from storage if preset
  useEffect(() => {
    const savedRemember = localStorage.getItem("admin_remember_me");
    if (savedRemember !== null) {
      setRememberMe(savedRemember === "true");
    }
  }, []);

  // If already logged in as admin, show redirect message
  if (isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-white/60" />
          <p className="text-sm text-white/60 font-poppins">Redirecting to admin dashboard...</p>
        </div>
      </div>
    );
  }

  const handleForgotPassword = async () => {
    setError("");
    setSuccessMsg("");

    if (!email) {
      setError("Please enter your email address first to reset your password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccessMsg("Password reset link sent to your email. Please check your inbox.");
      }
    } catch (err: any) {
      setError("Failed to trigger password recovery. Please try again.");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    // Save remember me preference
    localStorage.setItem("admin_remember_me", String(rememberMe));

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] relative overflow-hidden">
      {/* Background grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      {/* Subtle glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-[400px] mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.07] border border-white/[0.08] mb-6 shadow-lg">
            <Mountain className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-poppins tracking-tight">Nomadik Admin</h1>
          <p className="text-sm text-white/40 mt-2">Sign in to manage your travel platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@gonomadik.com"
                required
                className="h-11 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/25 focus:border-primary/50 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={forgotPasswordLoading}
                  className="text-xs text-white/40 hover:text-white/60 transition bg-transparent border-none p-0 cursor-pointer flex items-center gap-1"
                >
                  {forgotPasswordLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <HelpCircle className="h-3 w-3" />
                  )}
                  Forgot Password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/25 focus:border-primary/50 focus:ring-primary/20"
              />
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2 py-1">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-white/10 bg-white/[0.05] text-primary focus:ring-primary/20 focus:ring-offset-0 h-4 w-4 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs text-white/60 cursor-pointer select-none">
                Remember Me
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-white text-black hover:bg-white/90 font-semibold text-sm transition-all"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Authenticating...</>
              ) : (
                <><Lock className="h-4 w-4 mr-2" /> Sign In</>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-white/20 mt-6">
          Access restricted to authorized administrators only.
        </p>
      </div>
    </div>
  );
}
