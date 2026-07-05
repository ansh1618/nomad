import { createFileRoute } from "@tanstack/react-router";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getDashboardStatsFn } from "@/lib/server-fns";
import {
  CalendarDays,
  IndianRupee,
  TrendingUp,
  Users,
  Armchair,
  MessageSquare,
  CreditCard,
  MapPin,
  Package,
  Plus,
  ArrowUpRight,
  Eye,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-700",
  PAYMENT_PENDING: "bg-yellow-100 text-yellow-700",
  PARTIAL_PAID: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
  ON_TIME: "bg-green-100 text-green-700",
  DELAYED: "bg-red-100 text-red-700",
  CREATED: "bg-gray-100 text-gray-700",
  SEAT_LOCKED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
};

const PIE_COLORS = ["#163A5F", "#244B3D", "#C8A96A", "#5e6b77", "#E4E2DA", "#8B5E3C", "#3A7CA5", "#D4A843", "#6B4C3B", "#4A7C59"];

function AdminDashboard() {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const result = await getDashboardStatsFn();
        setStats(result);
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const statCards = [
    { title: "Today's Bookings", value: stats?.todayBookings ?? 0, icon: CalendarDays, color: "text-blue-600 bg-blue-50" },
    { title: "Total Revenue", value: `₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: "text-green-600 bg-green-50" },
    { title: "Upcoming Trips", value: stats?.upcomingTrips ?? 0, icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
    { title: "Available Seats", value: stats?.availableSeats ?? 0, icon: Armchair, color: "text-amber-600 bg-amber-50" },
    { title: "New Inquiries", value: stats?.newInquiries ?? 0, icon: MessageSquare, color: "text-rose-600 bg-rose-50" },
    { title: "Pending Payments", value: `₹${(stats?.pendingPayments ?? 0).toLocaleString('en-IN')}`, icon: CreditCard, color: "text-orange-600 bg-orange-50" },
  ];

  const destData = (stats?.destinationStats || [])
    .filter((d: any) => d.journeyCount > 0)
    .map((d: any, i: number) => ({
      name: d.name,
      value: d.journeyCount,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, {admin?.email?.split("@")[0] || "Admin"}. Here's what's happening today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/destinations">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <MapPin className="h-3.5 w-3.5" /> Add Destination
            </Button>
          </Link>
          <Link to="/admin/departures">
            <Button size="sm" className="gap-1.5 text-xs bg-primary">
              <Plus className="h-3.5 w-3.5" /> New Departure
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border border-border shadow-none hover:shadow-soft transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-poppins tracking-tight">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Popular Destinations Pie + Today's Departures */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <Card className="border border-border shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-poppins font-semibold">Destinations by Packages</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {destData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8">No destination data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={destData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {destData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => [`${v} packages`, name]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
          {destData.length > 0 && (
            <div className="px-6 pb-4 flex flex-wrap gap-3 justify-center">
              {destData.map((d: any) => (
                <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Today's Departures */}
        <Card className="border border-border shadow-none lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-poppins font-semibold flex items-center justify-between">
              <span>Today's Departures</span>
              <Link to="/admin/departures">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View All <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(stats?.todayDepartures || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No departures scheduled for today.</p>
            ) : (
              <div className="space-y-3">
                {(stats?.todayDepartures || []).map((dep: any) => (
                  <div key={dep.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{dep.journeys?.name || "Journey"}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(dep.departure_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${STATUS_COLORS[dep.status] || "bg-gray-100 text-gray-700"} text-[10px] font-bold border-0`}>
                      {(dep.status || "SCHEDULED").replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings Table */}
      <Card className="border border-border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-poppins font-semibold flex items-center justify-between">
            <span>Recent Bookings</span>
            <Link to="/admin/bookings">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View All <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(stats?.recentBookings || []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Booking ID</th>
                    <th className="text-left py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Travellers</th>
                    <th className="text-left py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                    <th className="text-left py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="text-right py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recentBookings || []).map((b: any) => (
                    <tr key={b.id} className="border-b border-border/50 hover:bg-muted/20 transition">
                      <td className="py-3 px-3 font-mono text-xs font-semibold">{b.booking_id || b.id.slice(0, 8)}</td>
                      <td className="py-3 px-3">{b.traveller_count || 1}</td>
                      <td className="py-3 px-3 font-semibold">₹{(b.total_amount || 0).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3">
                        <Badge className={`${STATUS_COLORS[b.status] || "bg-gray-100 text-gray-700"} text-[10px] font-bold border-0`}>
                          {(b.status || "CREATED").replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground text-xs">
                        {new Date(b.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link to="/admin/bookings/$id" params={{ id: b.id }}>
                          <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
                            <Eye className="h-3 w-3" /> View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
