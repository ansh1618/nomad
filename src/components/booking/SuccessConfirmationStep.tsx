import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SuccessConfirmationStep({ data, journey, isSidebar = false }: any) {
  return (
    <div className="space-y-6 animate-fade-in flex flex-col items-center text-center py-10">
      <CheckCircle2 className="h-20 w-20 text-secondary mb-4" />
      <h2 className="text-3xl font-display font-bold text-primary">Booking Confirmed!</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        Your expedition to {journey.name} is confirmed. A confirmation email and WhatsApp message have been sent.
      </p>
      
      <div className="p-6 border border-border rounded-xl bg-muted/10 w-full max-w-sm mt-6 space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Booking ID</p>
        <p className="text-2xl font-mono font-bold">NOM-202607-0001</p>
      </div>

      <div className={cn("flex gap-4 pt-8", isSidebar && "flex-col w-full")}>
        <Button variant="outline" className={cn(isSidebar && "w-full h-10")}>Download Invoice</Button>
        <Link to="/account" className={cn(isSidebar && "w-full")}>
          <Button className={cn("bg-primary hover:bg-primary/90", isSidebar && "w-full h-10")}>View My Bookings</Button>
        </Link>
      </div>
    </div>
  );
}
