import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GoNomadikLoadingScreen } from "./GoNomadikLoadingScreen";

export function RouteLoadingState() {
  return <GoNomadikLoadingScreen fullPage={true} statusText="Loading journeys" />;
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
