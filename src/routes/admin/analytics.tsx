import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
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
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  Users,
  Compass,
  CreditCard,
  Percent,
  Calendar,
} from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

const METRICS = [
  { title: "Total Revenue", value: "₹45,89,320", trend: "+12.5%", color: "text-green-600", desc: "Gross margins" },
  { title: "Total Bookings", value: "542", trend: "+8.3%", color: "text-blue-600", desc: "Completed trips" },
  { title: "Active Customers", value: "812", trend: "+15.2%", color: "text-purple-600", desc: "Unique explorers" },
  { title: "Conversion Rate", value: "3.42%", trend: "+0.8%", color: "text-amber-600", desc: "Lead-to-Booking funnel" },
];

const MONTHLY_TRENDS = [
  { name: "Jan", revenue: 240000, bookings: 32 },
  { name: "Feb", revenue: 320000, bookings: 40 },
  { name: "Mar", revenue: 450000, bookings: 55 },
  { name: "Apr", revenue: 610000, bookings: 78 },
  { name: "May", revenue: 820000, bookings: 98 },
  { name: "Jun", revenue: 950000, bookings: 110 },
  { name: "Jul", revenue: 1200000, bookings: 129 },
];

const DESTINATIONS_PIE = [
  { name: "Jibhi Valley", value: 40, color: "#163A5F" },
  { name: "Manali Explorer", value: 30, color: "#244B3D" },
  { name: "Udaipur Heritage", value: 20, color: "#C8A96A" },
  { name: "McLeodganj Trek", value: 10, color: "#5e6b77" },
];

function AdminAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-foreground">Advanced Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track sales metrics, funnel conversions, popular trips, and customer growth trends.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((m) => (
          <Card key={m.title} className="border border-border shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground font-semibold uppercase">{m.title}</p>
              <div className="flex items-baseline justify-between mt-2">
                <p className="text-2xl font-bold font-poppins tracking-tight">{m.value}</p>
                <Badge variant="outline" className={`${m.color} bg-muted/20 border-transparent text-xs font-bold`}>
                  {m.trend}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{m.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly chart line */}
      <Card className="border border-border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-poppins font-semibold flex items-center justify-between">
            <span>Sales & Revenue Trends</span>
            <Badge variant="secondary" className="text-[10px] font-normal">Last 7 months</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={MONTHLY_TRENDS}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E2DA" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#5e6b77" />
              <YAxis tick={{ fontSize: 11 }} stroke="#5e6b77" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} />
              <Line type="monotone" dataKey="revenue" stroke="#163A5F" strokeWidth={3} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Secondary charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bookings bar chart */}
        <Card className="border border-border shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-poppins font-semibold">Bookings Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={MONTHLY_TRENDS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E2DA" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#5e6b77" />
                <YAxis tick={{ fontSize: 11 }} stroke="#5e6b77" />
                <Tooltip />
                <Bar dataKey="bookings" fill="#244B3D" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie destination breakdown */}
        <Card className="border border-border shadow-none flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-poppins font-semibold">Destination Share</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center flex-1">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={DESTINATIONS_PIE} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                  {DESTINATIONS_PIE.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v}%`, "Occupancy Share"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
          <div className="px-6 pb-6 flex flex-wrap gap-4 justify-center border-t border-border/40 pt-4">
            {DESTINATIONS_PIE.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-muted-foreground font-medium">{d.name} ({d.value}%)</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
