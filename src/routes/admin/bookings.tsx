import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search,
  Eye,
  Calendar,
  IndianRupee,
  Users,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/admin/bookings")({
  component: AdminBookings,
});

const STATUS_COLORS: Record<string, string> = {
  CREATED: "bg-gray-100 text-gray-700",
  SEAT_LOCKED: "bg-purple-100 text-purple-700",
  PAYMENT_PENDING: "bg-yellow-100 text-yellow-700",
  PARTIAL_PAID: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CHECKED_IN: "bg-teal-100 text-teal-700",
  COMPLETED: "bg-indigo-100 text-indigo-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-orange-100 text-orange-700",
};

function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("bookings")
        .select(`
          *,
          users (full_name, phone),
          departures (
            departure_date,
            journeys (name)
          )
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "ALL") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setBookings(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const filtered = bookings.filter(b => {
    const term = search.toLowerCase();
    return (
      b.booking_id?.toLowerCase().includes(term) ||
      b.users?.full_name?.toLowerCase().includes(term) ||
      b.users?.phone?.toLowerCase().includes(term) ||
      b.departures?.journeys?.name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-foreground">Booking Lifecycle</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Process payments, confirm seat mappings, issue invoices, and manage statuses.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-xl border border-border">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search booking ID, customer name or phone..."
            className="pl-9"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {Object.keys(STATUS_COLORS).map(status => (
                <SelectItem key={status} value={status}>{status.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading bookings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No bookings found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Booking ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Trip details</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Pax</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Amount Paid</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-muted/10 transition">
                    <td className="py-3 px-4 font-mono text-xs font-semibold">{b.booking_id || "NOM-NEW"}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold">{b.users?.full_name || "Guest"}</p>
                        <p className="text-xs text-muted-foreground">{b.users?.phone || "N/A"}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <div>
                          <p className="font-semibold text-foreground">{b.departures?.journeys?.name || "Stay Package"}</p>
                          <p>{new Date(b.departures?.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-semibold">{b.traveller_count} Pax</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold">₹{Number(b.total_amount).toLocaleString("en-IN")}</p>
                        <p className="text-[10px] text-muted-foreground">Paid: ₹{Number(b.amount_paid).toLocaleString("en-IN")}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`${STATUS_COLORS[b.status]} text-[10px] font-bold border-0`}>
                        {b.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link to="/admin/bookings/$id" params={{ id: b.id }}>
                        <Button variant="ghost" size="sm" className="text-xs gap-1">
                          <Eye className="h-4 w-4" /> View
                        </Button>
                      </Link>
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
