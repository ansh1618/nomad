import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: (search.code as string) ?? "",
    type: (search.type as string) ?? "",
    returnTo: (search.returnTo as string) ?? "/",
    error: (search.error as string) ?? "",
    error_description: (search.error_description as string) ?? "",
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { code, type, returnTo, error, error_description } = useSearch({ from: "/auth/callback" });
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Completing authentication…");

  useEffect(() => {
    async function handleCallback() {
      try {
        if (error) {
          throw new Error(error_description || error || "Authentication failed.");
        }
        // ── Password Recovery ──────────────────────────────────
        if (type === "recovery") {
          // Supabase has already set the recovery session from the URL hash
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setStatus("success");
            setMessage("Identity verified. Redirecting to reset your password…");
            setTimeout(() => navigate({ to: "/reset-password" }), 1200);
          } else {
            // Try exchanging code for session (PKCE flow)
            if (code) {
              const { error } = await supabase.auth.exchangeCodeForSession(code);
              if (error) throw error;
            }
            setStatus("success");
            setMessage("Redirecting to reset your password…");
            setTimeout(() => navigate({ to: "/reset-password" }), 1200);
          }
          return;
        }

        // ── OAuth / Email Confirmation ─────────────────────────
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        // Confirm session is established
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Session could not be established. Please try again.");
        }

        setStatus("success");
        setMessage("Login successful! Redirecting…");
        toast.success("Welcome to Nomadik! 🎉");

        // Honour returnTo param (e.g. /login?returnTo=/book/udaipur)
        const destination = returnTo && returnTo !== "/" ? returnTo : "/";
        setTimeout(() => navigate({ to: destination as any }), 1000);

      } catch (err: any) {
        console.error("[AuthCallback]", err);
        setStatus("error");
        setMessage(err.message || "Authentication failed. Please try again.");
      }
    }

    handleCallback();
  }, [code, type, returnTo, error, error_description, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-secondary/30 px-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 max-w-sm w-full text-center space-y-6 border border-white/20">
        {/* Logo */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
          <span className="text-2xl font-bold text-white font-poppins">N</span>
        </div>

        {status === "loading" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <div className="space-y-2">
              <h2 className="text-lg font-bold font-poppins text-gray-900">Verifying…</h2>
              <p className="text-sm text-gray-500">{message}</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-lg font-bold font-poppins text-gray-900">All Good!</h2>
              <p className="text-sm text-gray-500">{message}</p>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-lg font-bold font-poppins text-gray-900">Something went wrong</h2>
              <p className="text-sm text-red-500">{message}</p>
            </div>
            <Button
              className="w-full"
              onClick={() => navigate({ to: "/login" })}
            >
              Back to Login
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
