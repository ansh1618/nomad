import { Compass, AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function RouteLoadingState() {
  return (
    <>
      {/* Top Gold Progress Bar (Non-blocking, instant visual feedback) */}
      <div className="fixed top-0 inset-x-0 z-[100] h-1 bg-gradient-to-r from-amber-500 via-[#C8A96A] to-amber-600 animate-pulse pointer-events-none" />

      {/* Non-Blocking Floating Pill Indicator (Never blocks viewport clicks) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-[#102A43]/95 text-white px-5 py-2.5 rounded-full shadow-2xl border border-amber-500/30 backdrop-blur-md flex items-center gap-3 font-poppins text-xs font-bold pointer-events-none animate-bounce">
        <Compass className="h-4 w-4 text-amber-400 animate-spin" />
        <span>Loading Journey Data...</span>
      </div>
    </>
  );
}

interface RouteErrorStateProps {
  error: Error;
  reset?: () => void;
}

export function RouteErrorState({ error, reset }: RouteErrorStateProps) {
  const router = useRouter();
  console.error("Route error boundary caught:", error);

  const handleRetry = () => {
    router.invalidate();
    if (reset) reset();
  };

  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 shadow-elegant text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold text-primary">Connection Interrupted</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This route is taking a scenic detour. Please refresh or return to our signature destinations.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            onClick={handleRetry}
            variant="hero"
            className="flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Retry Connection
          </Button>
          <Button
            variant="outline"
            asChild
            className="flex items-center justify-center gap-2"
          >
            <Link to="/">
              <Home className="h-4 w-4" /> Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
