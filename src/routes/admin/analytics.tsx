import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { getRealAdminAnalytics } from "@/lib/queries/analytics";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

function AdminAnalytics() {
  const [periodKey, setPeriodKey] = useState<string>("6m");

  const {
    data: analyticsData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["admin_analytics", periodKey],
    queryFn: () => getRealAdminAnalytics(periodKey),
    staleTime: 60 * 1000,
  });

  return (
    <div className="space-y-6 font-poppins">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Advanced Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time business performance, revenue trends, booking volume, and destination share.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <select
            value={periodKey}
            onChange={(e) => setPeriodKey(e.target.value)}
            className="h-9 px-3 py-1 bg-background border border-input rounded-md text-xs font-semibold text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="3m">Last 3 months</option>
            <option value="6m">Last 7 months</option>
            <option value="12m">Last 12 months</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <Card className="border-red-500/30 bg-red-500/5 shadow-none">
          <CardContent className="p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-600">Unable to load analytics data</p>
                <p className="text-xs text-red-500/80">{(error as Error)?.message || "Database connection error"}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="border-red-300 text-red-600">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border border-border shadow-none">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border border-border shadow-none">
            <CardContent className="p-6">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real Data Dashboard */}
      {!isLoading && !isError && analyticsData && (
        <>
          {/* Top Metrics Row — 3 Cards Only (Lead-to-Booking Funnel Removed) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analyticsData.metrics.map((m) => (
              <Card key={m.title} className="border border-border shadow-none">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">{m.title}</p>
                  <div className="flex items-baseline justify-between mt-2">
                    <p className="text-2xl font-bold tracking-tight text-foreground">{m.value}</p>
                    <Badge variant="outline" className={`${m.color} bg-muted/20 border-transparent text-xs font-bold`}>
                      {m.trend}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium">{m.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sales & Revenue Trends Chart */}
          <Card className="border border-border shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Sales & Revenue Trends</span>
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {analyticsData.periodLabel}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.monthlyTrends.every((t) => t.revenue === 0) ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-center p-6 bg-muted/10 rounded-xl border border-dashed border-border">
                  <p className="text-sm font-semibold text-foreground">No confirmed revenue for this period</p>
                  <p className="text-xs text-muted-foreground mt-1">Confirmed payments and bookings will appear here automatically.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E2DA" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#5e6b77" />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="#5e6b77"
                      tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
                    />
                    <Tooltip
                      formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#163A5F"
                      strokeWidth={3}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Secondary Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bookings Volume Bar Chart */}
            <Card className="border border-border shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Bookings Volume</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData.monthlyTrends.every((t) => t.bookings === 0) ? (
                  <div className="h-[240px] flex flex-col items-center justify-center text-center p-6 bg-muted/10 rounded-xl border border-dashed border-border">
                    <p className="text-sm font-semibold text-foreground">No confirmed bookings in this period</p>
                    <p className="text-xs text-muted-foreground mt-1">Confirmed booking entries will populate this chart.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={analyticsData.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E4E2DA" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#5e6b77" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#5e6b77" allowDecimals={false} />
                      <Tooltip
                        formatter={(v: number) => [`${v} bookings`, "Confirmed Bookings"]}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                      />
                      <Bar dataKey="bookings" fill="#244B3D" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Destination Share Pie Chart */}
            <Card className="border border-border shadow-none flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Destination Share</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center items-center flex-1">
                {analyticsData.destinationShare.length === 0 ? (
                  <div className="h-[180px] w-full flex flex-col items-center justify-center text-center p-4 bg-muted/10 rounded-xl border border-dashed border-border">
                    <p className="text-sm font-semibold text-foreground">No destination booking data</p>
                    <p className="text-xs text-muted-foreground mt-1">Destination distribution will display when bookings are created.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={analyticsData.destinationShare}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {analyticsData.destinationShare.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number, name: string, item: any) => [
                          `${v}% (${item?.payload?.count || 0} bookings)`,
                          "Share",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
              {analyticsData.destinationShare.length > 0 && (
                <div className="px-6 pb-6 flex flex-wrap gap-4 justify-center border-t border-border/40 pt-4">
                  {analyticsData.destinationShare.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-muted-foreground font-medium">
                        {d.name} ({d.value}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
