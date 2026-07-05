import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

export function SuccessConfirmationStep({ data, journey }: any) {
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

      <div className="flex gap-4 pt-8">
        <Button variant="outline">Download Invoice</Button>
        <Link to="/account">
          <Button className="bg-primary hover:bg-primary/90">View My Bookings</Button>
        </Link>
      </div>
    </div>
  );
}
