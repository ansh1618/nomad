import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/components/site/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import logoFallback from "@/assets/logo.jpg";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password | Nomadik" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email address."); return; }

    setSubmitting(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Link to="/">
            <img src={logoFallback} alt="Nomadik" className="h-14 w-14 rounded-2xl object-cover shadow-md" />
          </Link>
        </div>

        {!sent ? (
          <div className="bg-card border border-border rounded-3xl p-8 shadow-elegant space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold font-poppins text-foreground">Reset your password</h1>
              <p className="text-sm text-muted-foreground">
                Enter your registered email and we'll send you a secure reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-poppins font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3 w-3" /> Email Address
                </label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <Button
                id="forgot-submit-btn"
                type="submit"
                className="w-full h-12 rounded-xl font-poppins font-semibold"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-poppins"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-3xl p-8 shadow-elegant text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold font-poppins text-foreground">Check Your Email</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We've sent a password reset link to <strong className="text-foreground">{email}</strong>.
                The link expires in 1 hour.
              </p>
            </div>
            <div className="bg-secondary/10 rounded-2xl p-4 text-left space-y-1.5">
              <p className="text-xs font-poppins font-semibold text-foreground">Next steps:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Open your email inbox</li>
                <li>Find the email from Nomadik</li>
                <li>Click "Reset Password"</li>
                <li>Set your new password</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Didn't receive it? Check spam or{" "}
                <button
                  className="text-accent font-semibold hover:underline"
                  onClick={() => setSent(false)}
                >
                  try again
                </button>
              </p>
              <Link to="/login">
                <Button variant="outline" className="w-full rounded-xl">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
