/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Download,
  Calendar,
  Globe,
  Smartphone,
  Tag,
  ArrowDownRight,
  Search,
  MessageCircle,
  PhoneCall,
  Activity,
  Layers,
  Filter,
} from "lucide-react";
import { getFullAnalyticsDashboard } from "@/lib/queries/analytics";
import { exportToCsv } from "@/lib/csv-export";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalyticsDashboard,
});

const BRAND_COLORS = ["#163A5F", "#C8A96A", "#244B3D", "#5E6B77", "#3B82F6", "#E05688", "#10B981", "#8B5CF6"];

function AdminAnalyticsDashboard() {
  const [periodKey, setPeriodKey] = useState<string>("30d");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  const {
    data: dashboard,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["admin_analytics_v2", periodKey, customStart, customEnd],
    queryFn: () =>
      getFullAnalyticsDashboard({
        periodKey,
        customStartDate: customStart || undefined,
        customEndDate: customEnd || undefined,
      }),
    staleTime: 60 * 1000,
  });

  return (
    <div className="space-y-6 font-poppins text-foreground pb-12">
      {/* Header & Date Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Marketing & Analytics Intelligence</h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
              Live Production Data
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time business performance, traffic sources, booking funnel drop-offs, campaign attributions, and revenue.
          </p>
        </div>

        {/* Date Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-1.5 text-xs font-semibold border-border"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <select
            value={periodKey}
            onChange={(e) => setPeriodKey(e.target.value)}
            className="h-9 px-3 py-1 bg-background border border-input rounded-md text-xs font-semibold text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="this_year">This Year</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {periodKey === "custom" && (
            <div className="flex items-center gap-1.5 bg-white border border-input p-1 rounded-md">
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-7 text-[11px] px-1.5 border-none shadow-none"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-7 text-[11px] px-1.5 border-none shadow-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <Card className="border-red-500/30 bg-red-500/5 shadow-none">
          <CardContent className="p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-600">Analytics data temporarily unavailable</p>
                <p className="text-xs text-red-500/80">{(error as Error)?.message || "Database query error"}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="border-red-300 text-red-600">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border border-border shadow-none">
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-20" />
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

      {/* Real Production Analytics Tabs */}
      {!isLoading && !isError && dashboard && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto p-1 bg-muted/30 border border-border rounded-xl gap-1">
            <TabsTrigger value="overview" className="text-xs font-semibold px-3 py-1.5">Overview</TabsTrigger>
            <TabsTrigger value="traffic" className="text-xs font-semibold px-3 py-1.5">Traffic & Campaigns</TabsTrigger>
            <TabsTrigger value="funnel" className="text-xs font-semibold px-3 py-1.5">Booking Funnel</TabsTrigger>
            <TabsTrigger value="content" className="text-xs font-semibold px-3 py-1.5">Pages & Content</TabsTrigger>
            <TabsTrigger value="devices" className="text-xs font-semibold px-3 py-1.5">Devices & Geo</TabsTrigger>
            <TabsTrigger value="financials" className="text-xs font-semibold px-3 py-1.5">Revenue & Coupons</TabsTrigger>
            <TabsTrigger value="leads" className="text-xs font-semibold px-3 py-1.5">Leads</TabsTrigger>
            <TabsTrigger value="seo" className="text-xs font-semibold px-3 py-1.5">SEO (Search Console)</TabsTrigger>
            <TabsTrigger value="realtime" className="text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Visitors
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {dashboard.overview.metrics.map((m) => (
                <Card key={m.title} className="border border-border shadow-none bg-white">
                  <CardContent className="p-4">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{m.title}</p>
                    <p className="text-xl font-bold tracking-tight text-foreground mt-1">{m.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{m.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Revenue Trend Line Chart */}
            <Card className="border border-border shadow-none bg-white">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">Revenue & Booking Trends</CardTitle>
                  <CardDescription className="text-xs">Gross collected revenue over time</CardDescription>
                </div>
                <Badge variant="secondary" className="text-[10px] font-semibold">{dashboard.periodLabel}</Badge>
              </CardHeader>
              <CardContent>
                {dashboard.revenueTrends.every((t) => t.revenue === 0) ? (
                  <div className="h-[260px] flex flex-col items-center justify-center text-center p-6 bg-muted/10 rounded-xl border border-dashed border-border">
                    <p className="text-sm font-semibold text-foreground">No data available for this period</p>
                    <p className="text-xs text-muted-foreground mt-1">Confirmed payments and bookings will populate this trend line automatically.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={dashboard.revenueTrends}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#163A5F" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#163A5F" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E4E2DA" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#5e6b77" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#5e6b77" tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)} />
                      <Tooltip formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} />
                      <Area type="monotone" dataKey="revenue" stroke="#163A5F" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: TRAFFIC & CAMPAIGNS */}
          <TabsContent value="traffic" className="space-y-6">
            {/* Traffic Sources Table */}
            <Card className="border border-border shadow-none bg-white">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">Traffic Acquisition Channels</CardTitle>
                  <CardDescription className="text-xs">Visitors and bookings grouped by traffic source and referrer</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs border-border"
                  onClick={() =>
                    exportToCsv(
                      `traffic_sources_${dashboard.periodLabel}`,
                      ["Source", "Visitors", "Sessions", "Bookings", "Revenue (INR)", "Conversion Rate (%)"],
                      dashboard.trafficSources.map((t) => [t.source, t.visitors, t.sessions, t.bookings, t.revenue, t.conversionRate])
                    )
                  }
                >
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-y border-border text-muted-foreground uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-3">Traffic Source</th>
                      <th className="p-3">Visitors</th>
                      <th className="p-3">Sessions</th>
                      <th className="p-3">Bookings</th>
                      <th className="p-3">Revenue</th>
                      <th className="p-3 text-right">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dashboard.trafficSources.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-muted-foreground italic">
                          No data available for this period
                        </td>
                      </tr>
                    ) : (
                      dashboard.trafficSources.map((t) => (
                        <tr key={t.source} className="hover:bg-muted/10">
                          <td className="p-3 font-semibold text-foreground">{t.source}</td>
                          <td className="p-3">{t.visitors.toLocaleString("en-IN")}</td>
                          <td className="p-3">{t.sessions.toLocaleString("en-IN")}</td>
                          <td className="p-3 font-semibold">{t.bookings}</td>
                          <td className="p-3 font-semibold text-emerald-700">₹{t.revenue.toLocaleString("en-IN")}</td>
                          <td className="p-3 text-right font-bold">{t.conversionRate}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Campaign Breakdown Table */}
            <Card className="border border-border shadow-none bg-white">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">UTM & Instagram Social Campaigns</CardTitle>
                  <CardDescription className="text-xs">Campaign attribution (utm_campaign, utm_source, utm_medium)</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs border-border"
                  onClick={() =>
                    exportToCsv(
                      `campaigns_${dashboard.periodLabel}`,
                      ["Campaign", "Source", "Medium", "Visitors", "Bookings", "Revenue (INR)", "Conversion Rate (%)"],
                      dashboard.campaigns.map((c) => [c.campaign, c.source, c.medium, c.visitors, c.bookings, c.revenue, c.conversionRate])
                    )
                  }
                >
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-y border-border text-muted-foreground uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-3">Campaign</th>
                      <th className="p-3">Source</th>
                      <th className="p-3">Medium</th>
                      <th className="p-3">Visitors</th>
                      <th className="p-3">Bookings</th>
                      <th className="p-3">Revenue</th>
                      <th className="p-3 text-right">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dashboard.campaigns.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-muted-foreground italic">
                          No UTM campaign data available for this period. Try visiting with ?utm_source=instagram&utm_campaign=udaipur_august
                        </td>
                      </tr>
                    ) : (
                      dashboard.campaigns.map((c) => (
                        <tr key={c.campaign} className="hover:bg-muted/10">
                          <td className="p-3 font-semibold text-primary">{c.campaign}</td>
                          <td className="p-3"><Badge variant="outline" className="text-[10px]">{c.source}</Badge></td>
                          <td className="p-3"><Badge variant="secondary" className="text-[10px]">{c.medium}</Badge></td>
                          <td className="p-3">{c.visitors.toLocaleString("en-IN")}</td>
                          <td className="p-3 font-semibold">{c.bookings}</td>
                          <td className="p-3 font-semibold text-emerald-700">₹{c.revenue.toLocaleString("en-IN")}</td>
                          <td className="p-3 text-right font-bold">{c.conversionRate}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: BOOKING FUNNEL */}
          <TabsContent value="funnel" className="space-y-6">
            <Card className="border border-border shadow-none bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">Step-by-Step Booking Funnel Drop-off Analysis</CardTitle>
                <CardDescription className="text-xs">Tracks user progression from journey discovery to confirmed payment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {dashboard.funnel.map((step) => (
                    <div key={step.step} className={`p-4 rounded-xl border ${step.isBiggestDropOff ? 'border-red-300 bg-red-50/30' : 'border-border bg-white'} space-y-1.5`}>
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="flex items-center gap-2">
                          <span className="text-primary font-bold">{step.label}</span>
                          {step.isBiggestDropOff && (
                            <Badge variant="destructive" className="text-[9px] uppercase px-1.5 py-0">
                              Biggest Drop-Off ({step.dropOffPercentage}%)
                            </Badge>
                          )}
                        </span>
                        <span className="text-muted-foreground font-mono">
                          {step.count.toLocaleString("en-IN")} users ({step.percentageOfFirst}% of Step 1)
                        </span>
                      </div>
                      {/* Bar Visualization */}
                      <div className="w-full h-3 bg-muted/40 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${step.isBiggestDropOff ? 'bg-red-500' : 'bg-primary'}`}
                          style={{ width: `${Math.max(2, step.percentageOfFirst)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: PAGES & CONTENT */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Destinations */}
              <Card className="border border-border shadow-none bg-white">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold">Top Destinations</CardTitle>
                    <CardDescription className="text-xs">Views and bookings per destination</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs border-border"
                    onClick={() =>
                      exportToCsv(
                        `top_destinations_${dashboard.periodLabel}`,
                        ["Destination", "Views", "Booking Starts", "Bookings", "Revenue (INR)", "Conversion Rate (%)"],
                        dashboard.destinations.map((d) => [d.name, d.views, d.bookingStarts, d.bookings, d.revenue, d.conversionRate])
                      )
                    }
                  >
                    <Download className="h-3.5 w-3.5" /> CSV
                  </Button>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-y border-border text-muted-foreground uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Destination</th>
                        <th className="p-3">Views</th>
                        <th className="p-3">Bookings</th>
                        <th className="p-3">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {dashboard.destinations.length === 0 ? (
                        <tr><td colSpan={4} className="p-4 text-center text-muted-foreground italic">No data available for this period</td></tr>
                      ) : (
                        dashboard.destinations.map((d) => (
                          <tr key={d.slug} className="hover:bg-muted/10">
                            <td className="p-3 font-semibold text-primary">{d.name}</td>
                            <td className="p-3">{d.views}</td>
                            <td className="p-3 font-semibold">{d.bookings}</td>
                            <td className="p-3 font-semibold text-emerald-700">₹{d.revenue.toLocaleString("en-IN")}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Top Journeys */}
              <Card className="border border-border shadow-none bg-white">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold">Top Journeys</CardTitle>
                    <CardDescription className="text-xs">Views and bookings per route</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs border-border"
                    onClick={() =>
                      exportToCsv(
                        `top_journeys_${dashboard.periodLabel}`,
                        ["Journey", "Slug", "Views", "Booking Starts", "Bookings", "Revenue (INR)", "Conversion Rate (%)"],
                        dashboard.journeys.map((j) => [j.title, j.slug, j.views, j.bookingStarts, j.bookings, j.revenue, j.conversionRate])
                      )
                    }
                  >
                    <Download className="h-3.5 w-3.5" /> CSV
                  </Button>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-y border-border text-muted-foreground uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Journey</th>
                        <th className="p-3">Views</th>
                        <th className="p-3">Bookings</th>
                        <th className="p-3">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {dashboard.journeys.length === 0 ? (
                        <tr><td colSpan={4} className="p-4 text-center text-muted-foreground italic">No data available for this period</td></tr>
                      ) : (
                        dashboard.journeys.map((j) => (
                          <tr key={j.slug} className="hover:bg-muted/10">
                            <td className="p-3 font-semibold text-primary">{j.title}</td>
                            <td className="p-3">{j.views}</td>
                            <td className="p-3 font-semibold">{j.bookings}</td>
                            <td className="p-3 font-semibold text-emerald-700">₹{j.revenue.toLocaleString("en-IN")}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 5: DEVICES & GEOGRAPHY */}
          <TabsContent value="devices" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Breakdown */}
              <Card className="border border-border shadow-none bg-white">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold">Device Category Breakdown</CardTitle></CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-y border-border text-muted-foreground uppercase text-[10px] font-bold">
                      <tr><th className="p-3">Device</th><th className="p-3">Visitors</th><th className="p-3">Bookings</th><th className="p-3 text-right">Conv. Rate</th></tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {dashboard.deviceAnalytics.byCategory.map((d) => (
                        <tr key={d.category} className="hover:bg-muted/10">
                          <td className="p-3 font-semibold text-foreground">{d.category}</td>
                          <td className="p-3">{d.users}</td>
                          <td className="p-3 font-semibold">{d.bookings}</td>
                          <td className="p-3 text-right font-bold">{d.conversionRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Top Browsers */}
              <Card className="border border-border shadow-none bg-white">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold">Top Browsers</CardTitle></CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-y border-border text-muted-foreground uppercase text-[10px] font-bold">
                      <tr><th className="p-3">Browser</th><th className="p-3">Events</th><th className="p-3 text-right">Share</th></tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {dashboard.deviceAnalytics.browsers.length === 0 ? (
                        <tr><td colSpan={3} className="p-4 text-center text-muted-foreground italic">No browser data available</td></tr>
                      ) : (
                        dashboard.deviceAnalytics.browsers.map((b) => (
                          <tr key={b.name} className="hover:bg-muted/10">
                            <td className="p-3 font-semibold">{b.name}</td>
                            <td className="p-3">{b.count}</td>
                            <td className="p-3 text-right font-bold">{b.percentage}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 6: REVENUE & COUPONS */}
          <TabsContent value="financials" className="space-y-6">
            {/* Financial Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border border-border shadow-none bg-white">
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Gross Booking Value</p>
                  <p className="text-lg font-bold mt-1 text-foreground">₹{dashboard.financials.grossBookingValue.toLocaleString("en-IN")}</p>
                </CardContent>
              </Card>
              <Card className="border border-border shadow-none bg-white">
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Discounts Applied</p>
                  <p className="text-lg font-bold mt-1 text-emerald-600">₹{dashboard.financials.totalDiscounts.toLocaleString("en-IN")}</p>
                </CardContent>
              </Card>
              <Card className="border border-border shadow-none bg-white">
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">GST Collected (5%)</p>
                  <p className="text-lg font-bold mt-1 text-blue-600">₹{dashboard.financials.totalGst.toLocaleString("en-IN")}</p>
                </CardContent>
              </Card>
              <Card className="border border-border shadow-none bg-white">
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Net Collected</p>
                  <p className="text-lg font-bold mt-1 text-primary">₹{dashboard.financials.netCollected.toLocaleString("en-IN")}</p>
                </CardContent>
              </Card>
            </div>

            {/* Coupons Performance Table (Supports STUTI500 & all codes) */}
            <Card className="border border-border shadow-none bg-white">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">Coupon Code Performance (STUTI500 & Active Codes)</CardTitle>
                  <CardDescription className="text-xs">Redemptions, discounts given, and net generated revenue</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs border-border"
                  onClick={() =>
                    exportToCsv(
                      `coupons_analytics_${dashboard.periodLabel}`,
                      ["Coupon Code", "Uses", "Discount Given (INR)", "Revenue Before Disc (INR)", "Revenue After Disc (INR)", "Bookings"],
                      dashboard.coupons.map((c) => [c.code, c.uses, c.discountGiven, c.revenueBeforeDiscount, c.revenueAfterDiscount, (c as any).bookingsGenerated ?? c.uses])
                    )
                  }
                >
                  <Download className="h-3.5 w-3.5" /> CSV
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-y border-border text-muted-foreground uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-3">Coupon Code</th>
                      <th className="p-3">Uses</th>
                      <th className="p-3">Discount Given</th>
                      <th className="p-3">Revenue Before Disc</th>
                      <th className="p-3">Net Collected</th>
                      <th className="p-3 text-right">Bookings Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dashboard.coupons.length === 0 ? (
                      <tr><td colSpan={6} className="p-6 text-center text-muted-foreground italic">No coupon redemptions recorded for this period</td></tr>
                    ) : (
                      dashboard.coupons.map((c) => (
                        <tr key={c.code} className="hover:bg-muted/10">
                          <td className="p-3 font-mono font-bold text-accent">{c.code}</td>
                          <td className="p-3 font-semibold">{c.uses}</td>
                          <td className="p-3 text-red-600 font-semibold">₹{c.discountGiven.toLocaleString("en-IN")}</td>
                          <td className="p-3">₹{c.revenueBeforeDiscount.toLocaleString("en-IN")}</td>
                          <td className="p-3 font-semibold text-emerald-700">₹{c.revenueAfterDiscount.toLocaleString("en-IN")}</td>
                          <td className="p-3 text-right font-bold">{(c as any).bookingsGenerated ?? c.uses}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 7: LEADS */}
          <TabsContent value="leads" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border border-border shadow-none bg-white">
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">WhatsApp Leads</p>
                  <p className="text-xl font-bold mt-1 text-emerald-600">{dashboard.leads.whatsappLeads}</p>
                </CardContent>
              </Card>
              <Card className="border border-border shadow-none bg-white">
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Phone Call Leads</p>
                  <p className="text-xl font-bold mt-1 text-blue-600">{dashboard.leads.callLeads}</p>
                </CardContent>
              </Card>
              <Card className="border border-border shadow-none bg-white">
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Form Enquiries</p>
                  <p className="text-xl font-bold mt-1 text-purple-600">{dashboard.leads.formLeads}</p>
                </CardContent>
              </Card>
              <Card className="border border-border shadow-none bg-white">
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Total Leads</p>
                  <p className="text-xl font-bold mt-1 text-primary">{dashboard.leads.totalLeads}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 8: SEO (SEARCH CONSOLE) */}
          <TabsContent value="seo" className="space-y-6">
            {!dashboard.seo.configured ? (
              <Card className="border border-border shadow-none bg-white p-8 text-center space-y-3">
                <Search className="h-10 w-10 mx-auto text-muted-foreground/60" />
                <h3 className="text-base font-bold text-foreground">Google Search Console Not Configured</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  To view Search Console SEO keywords, clicks, CTR, and positions here, configure `SEARCH_CONSOLE_CLIENT_EMAIL` and `SEARCH_CONSOLE_PRIVATE_KEY` in server environment variables.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border border-border shadow-none bg-white"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Clicks</p><p className="text-lg font-bold">{dashboard.seo.clicks || 0}</p></CardContent></Card>
                  <Card className="border border-border shadow-none bg-white"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Impressions</p><p className="text-lg font-bold">{dashboard.seo.impressions || 0}</p></CardContent></Card>
                  <Card className="border border-border shadow-none bg-white"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avg CTR</p><p className="text-lg font-bold">{dashboard.seo.ctr || 0}%</p></CardContent></Card>
                  <Card className="border border-border shadow-none bg-white"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avg Position</p><p className="text-lg font-bold">{dashboard.seo.position || 0}</p></CardContent></Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 9: REALTIME ACTIVE VISITORS */}
          <TabsContent value="realtime" className="space-y-6">
            <Card className="border border-border shadow-none bg-white">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active Visitors — Last 5 Minutes
                  </CardTitle>
                  <CardDescription className="text-xs">Live active sessions currently exploring GoNomadik</CardDescription>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">Updated: {dashboard.realtime.lastUpdated}</span>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase text-emerald-800 tracking-wider">Current Active Visitors</p>
                    <p className="text-4xl font-extrabold text-emerald-700 mt-1">{dashboard.realtime.activeVisitors}</p>
                  </div>
                  <Activity className="h-10 w-10 text-emerald-600 animate-pulse opacity-80" />
                </div>

                {dashboard.realtime.activeVisitors === 0 ? (
                  <p className="text-xs text-center text-muted-foreground py-8 italic">No active visitors right now</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <h4 className="font-bold text-foreground mb-2">Active Pages</h4>
                      <div className="space-y-1.5">
                        {dashboard.realtime.activePages.map((p) => (
                          <div key={p.path} className="flex justify-between p-2 bg-muted/20 rounded-lg">
                            <span className="font-mono truncate">{p.path}</span>
                            <span className="font-bold">{p.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground mb-2">Active Sources</h4>
                      <div className="space-y-1.5">
                        {dashboard.realtime.sources.map((s) => (
                          <div key={s.source} className="flex justify-between p-2 bg-muted/20 rounded-lg">
                            <span>{s.source}</span>
                            <span className="font-bold">{s.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
