import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search,
  Users,
  Compass,
  CreditCard,
  Star,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select(`
          *,
          bookings (id)
        `);

      if (error) throw error;
      setCustomers(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load customers list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-foreground">Customer Relationship Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          View explorer profiles, booking history metrics, and reviews.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer profiles..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading explorers profile metrics...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No customers profiles found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Explorer</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Phone</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Wallet Balance</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Completed Trips</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/10 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {c.full_name?.slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{c.full_name}</p>
                          <p className="text-xs text-muted-foreground">{c.email || "No Email"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{c.phone}</td>
                    <td className="py-3 px-4 font-semibold text-green-600">
                      ₹{Number(c.wallet_balance || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {c.bookings?.length || 0} Trips
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString('en-IN')}
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
