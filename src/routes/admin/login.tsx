import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mountain, Loader2, AlertCircle, Lock } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { signIn, isAdmin } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in as admin, show redirect message
  if (isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">You are already logged in. Redirecting...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

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
                placeholder="admin@nomadik.co.in"
                required
                className="h-11 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/25 focus:border-primary/50 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Password
              </Label>
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

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
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
