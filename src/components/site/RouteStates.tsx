import { Compass, AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function RouteLoadingState() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-20 w-20 rounded-full border-4 border-gold/20 border-t-gold animate-spin" />
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gold-gradient text-gold-foreground shadow-gold">
            <Compass className="h-7 w-7 animate-pulse" />
          </div>
        </div>
        <span className="font-display text-xl font-bold tracking-wide text-primary">
          Finding Your Path...
        </span>
        <p className="text-xs text-muted-foreground max-w-[200px]">
          Mapping the roads and fetching the latest convoys from the mountains.
        </p>
      </div>
    </div>
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
          <h2 className="font-display text-2xl font-bold text-primary">Connection Lost</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We couldn't reach the mountains. Please check your internet connection and try again.
          </p>
          {error.message && (
            <div className="text-[10px] bg-muted p-2 rounded-lg text-left text-muted-foreground/80 break-all font-mono">
              Error details: {error.message}
            </div>
          )}
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
