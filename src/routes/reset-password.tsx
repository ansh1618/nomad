import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/site/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import logoFallback from "@/assets/logo.jpg";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Reset Password | Nomadik" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // Verify recovery session exists
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) { toast.error("Please fill in all fields."); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match."); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }

    setSubmitting(true);
    try {
      await updatePassword(password);
      setSuccess(true);
      toast.success("Password updated successfully!");
      // Sign out to clear recovery session, force fresh login
      await supabase.auth.signOut();
      setTimeout(() => navigate({ to: "/login" }), 2500);
    } catch (err: any) {
      toast.error(err.message || "Failed to update password. The link may have expired.");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
  if (hasSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // No recovery session
  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-6 p-8 bg-card border border-border rounded-3xl shadow-elegant">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-poppins">Link Expired</h2>
            <p className="text-sm text-muted-foreground">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
          </div>
          <Link to="/forgot-password">
            <Button className="w-full rounded-xl">Request New Reset Link</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-6 p-8 bg-card border border-border rounded-3xl shadow-elegant">
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-poppins">Password Updated!</h2>
            <p className="text-sm text-muted-foreground">
              Your password has been changed successfully. Redirecting you to login…
            </p>
          </div>
          <div className="h-1 w-full bg-border rounded-full overflow-hidden">
            <div className="h-full bg-green-500 animate-[width_2.5s_ease-in-out]" style={{ animation: "countdown 2.5s linear forwards" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Link to="/">
            <img src={logoFallback} alt="Nomadik" className="h-14 w-14 rounded-2xl object-cover shadow-md" />
          </Link>
        </div>

        <div className="bg-card border border-border rounded-3xl p-8 shadow-elegant space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-poppins text-foreground">Set New Password</h1>
            <p className="text-sm text-muted-foreground">
              Choose a strong new password for your Nomadik account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-poppins font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Lock className="h-3 w-3" /> New Password
              </label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl pr-10"
                  required
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-poppins font-semibold uppercase tracking-wider text-muted-foreground">
                Confirm New Password
              </label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`h-12 rounded-xl ${confirmPassword && confirmPassword !== password ? "border-red-400" : ""}`}
                required
                autoComplete="new-password"
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-red-500">Passwords don't match</p>
              )}
            </div>

            <Button
              id="reset-password-btn"
              type="submit"
              className="w-full h-12 rounded-xl font-poppins font-semibold"
              disabled={submitting}
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
