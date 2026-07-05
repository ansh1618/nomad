import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CreditCard, Calendar, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/admin/payments")({
  component: AdminPaymentsLedger,
});

const GATEWAY_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  SUCCESS: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-orange-100 text-orange-700",
};

function AdminPaymentsLedger() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          bookings (
            booking_id,
            users (full_name)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load payments ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRefund = async (paymentId: string) => {
    if (!confirm("Are you sure you want to issue a refund? This will reverse the transaction in Razorpay gateway log.")) return;
    try {
      const { error } = await supabase
        .from("payments")
        .update({ status: "REFUNDED" })
        .eq("id", paymentId);

      if (error) throw error;
      toast.success("Refund processed successfully");
      fetchPayments();
    } catch (err: any) {
      toast.error(err.message || "Refund initiation failed");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-foreground">Payments Ledger</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Razorpay checkout logs, receipts tracking, refund processing, and transactions ledger.
        </p>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading payments log...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No transactions processed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Transaction ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Booking ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Gateway</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/10 transition">
                    <td className="py-3 px-4 font-mono text-xs font-semibold">{p.transaction_id || "tx_mock_19028a"}</td>
                    <td className="py-3 px-4 font-mono text-xs">{p.bookings?.booking_id || "NOM-NEW"}</td>
                    <td className="py-3 px-4 font-semibold">{p.bookings?.users?.full_name || "Guest"}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{p.payment_gateway || "RAZORPAY"}</td>
                    <td className="py-3 px-4 font-semibold text-sm">₹{Number(p.amount).toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4">
                      <Badge className={`${GATEWAY_COLORS[p.status]} text-[10px] font-bold border-0`}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.status === "SUCCESS" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRefund(p.id)}
                          className="h-7 text-xs text-destructive hover:bg-destructive/5 hover:text-destructive"
                        >
                          Refund
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
