import { createFileRoute } from '@tanstack/react-router'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { getDashboardStats, getMonthlyRevenue } from '@/lib/queries/admin'
import { getBookings } from '@/lib/queries/bookings'
import { getDepartures } from '@/lib/queries/departures'
import { getPackagePerformance } from '@/lib/queries/packages'
import {
  CalendarDays,
  IndianRupee,
  TrendingUp,
  Users,
  MessageSquare,
  CreditCard,
  MapPin,
  Package,
  Plus,
  ArrowUpRight,
  Eye,
  Loader2,
  Plane,
  Star,
  CheckCircle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Booking, Departure } from '@/types/supabase'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  PAYMENT_PENDING: 'bg-amber-100 text-amber-700',
  PARTIAL_PAID: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
  ON_TIME: 'bg-green-100 text-green-700',
  DELAYED: 'bg-red-100 text-red-700',
  CREATED: 'bg-gray-100 text-gray-700',
  SEAT_LOCKED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  UPCOMING: 'bg-primary/10 text-primary',
}

const PIE_COLORS = ['#163A5F', '#244B3D', '#C8A96A', '#5e6b77', '#8B5E3C', '#3A7CA5']

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  change,
  delay = 0,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  color: string
  change?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="border border-border shadow-none hover:shadow-soft transition-all duration-300 hover:-translate-y-0.5 group">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-poppins tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{title}</p>
          {change && (
            <p className="text-xs text-emerald-600 font-medium mt-1">{change}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function AdminDashboard() {
  const { admin } = useAdminAuth()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: getDashboardStats,
    refetchInterval: 60_000, // Refresh every minute
  })

  const { data: monthlyRevenue = [] } = useQuery({
    queryKey: ['monthly_revenue'],
    queryFn: getMonthlyRevenue,
  })

  const { data: recentBookingsResult, isLoading: bookingsLoading } = useQuery({
    queryKey: ['recent_bookings'],
    queryFn: () => getBookings({ page: 1, pageSize: 8, sortBy: 'created_at', sortDir: 'desc' }),
  })

  const { data: upcomingDepsResult, isLoading: depsLoading } = useQuery({
    queryKey: ['upcoming_departures_dash'],
    queryFn: () => getDepartures({ page: 1, pageSize: 5, status: 'UPCOMING', sortBy: 'departure_date', sortDir: 'asc' }),
  })

  const { data: packagePerf = [] } = useQuery({
    queryKey: ['package_performance'],
    queryFn: getPackagePerformance,
  })

  const recentBookings: Booking[] = recentBookingsResult?.data ?? []
  const upcomingDepartures: Departure[] = upcomingDepsResult?.data ?? []

  // Format monthly data for chart
  const chartData = monthlyRevenue.map((m) => ({
    month: new Date(m.month).toLocaleDateString('en-IN', { month: 'short' }),
    revenue: m.revenue,
    bookings: m.bookings,
  }))

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: "Today's Revenue",
      value: `₹${((stats?.today_revenue ?? 0) as number).toLocaleString('en-IN')}`,
      icon: IndianRupee,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Monthly Revenue',
      value: `₹${((stats?.monthly_revenue ?? 0) as number).toLocaleString('en-IN')}`,
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: "Today's Bookings",
      value: (stats?.today_bookings ?? 0) as number,
      icon: CalendarDays,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      title: 'Confirmed',
      value: (stats?.confirmed_bookings ?? 0) as number,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50',
    },
    {
      title: 'Pending Payment',
      value: (stats?.pending_bookings ?? 0) as number,
      icon: CreditCard,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      title: 'Total Customers',
      value: (stats?.total_customers ?? 0) as number,
      icon: Users,
      color: 'text-rose-600 bg-rose-50',
    },
    {
      title: 'Active Packages',
      value: (stats?.active_packages ?? 0) as number,
      icon: Package,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      title: "Today's Leads",
      value: (stats?.today_leads ?? 0) as number,
      icon: MessageSquare,
      color: 'text-orange-600 bg-orange-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold font-poppins">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, <span className="font-medium text-foreground">{admin?.email?.split('@')[0] ?? 'Admin'}</span>. Here's what's happening today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/destinations/$id" params={{ id: 'new' }}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <MapPin className="h-3.5 w-3.5" /> Add Destination
            </Button>
          </Link>
          <Link to="/admin/departures/$id" params={{ id: 'new' }}>
            <Button size="sm" className="gap-1.5 text-xs bg-primary">
              <Plus className="h-3.5 w-3.5" /> New Departure
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {statCards.map((stat, i) => (
          <StatCard key={stat.title} {...stat} delay={i * 0.05} />
        ))}
      </div>

      {/* Conversion + Upcoming */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[#163A5F] to-[#0d2540] text-white rounded-2xl p-5"
        >
          <p className="text-white/60 text-xs uppercase tracking-wider">Lead Conversion</p>
          <p className="text-4xl font-bold font-poppins mt-1">
            {stats?.lead_conversion_rate ?? 0}%
          </p>
          <p className="text-white/60 text-xs mt-2">
            {stats?.week_leads ?? 0} leads this week
          </p>
          <div className="mt-3 h-1.5 bg-white/20 rounded-full">
            <div
              className="h-full bg-gold rounded-full"
              style={{ width: `${Math.min(stats?.lead_conversion_rate ?? 0, 100)}%` }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-br from-[#244B3D] to-[#163529] text-white rounded-2xl p-5"
        >
          <p className="text-white/60 text-xs uppercase tracking-wider">Upcoming Departures</p>
          <p className="text-4xl font-bold font-poppins mt-1">
            {stats?.upcoming_departures ?? 0}
          </p>
          <p className="text-white/60 text-xs mt-2">trips scheduled ahead</p>
          <Link to="/admin/departures">
            <p className="text-white/80 text-xs mt-3 flex items-center gap-1 hover:text-white transition-colors">
              View all <ArrowUpRight className="h-3 w-3" />
            </p>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-[#8B5E3C] to-[#6b4830] text-white rounded-2xl p-5"
        >
          <p className="text-white/60 text-xs uppercase tracking-wider">Completed Trips</p>
          <p className="text-4xl font-bold font-poppins mt-1">
            {stats?.completed_trips ?? 0}
          </p>
          <p className="text-white/60 text-xs mt-2">all-time successful trips</p>
          <Link to="/admin/bookings">
            <p className="text-white/80 text-xs mt-3 flex items-center gap-1 hover:text-white transition-colors">
              View bookings <ArrowUpRight className="h-3 w-3" />
            </p>
          </Link>
        </motion.div>
      </div>

      {/* Revenue Chart + Package Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="border border-border shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-poppins font-semibold">Revenue (Last 12 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                  No revenue data yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#163A5F" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#163A5F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#163A5F"
                      strokeWidth={2}
                      fill="url(#revenueGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Packages */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="border border-border shadow-none h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-poppins font-semibold flex items-center justify-between">
                Top Packages
                <Link to="/admin/packages">
                  <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
                    View All <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {packagePerf.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
              ) : (
                <div className="space-y-3">
                  {packagePerf.slice(0, 5).map((pkg, i) => (
                    <div key={pkg.id} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{pkg.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{pkg.booking_count} bookings</span>
                          {pkg.avg_rating > 0 && (
                            <span className="text-xs flex items-center gap-0.5 text-amber-500">
                              <Star className="h-3 w-3 fill-amber-500" />
                              {pkg.avg_rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold">₹{pkg.total_revenue.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Upcoming Departures + Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Departures */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border border-border shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-poppins font-semibold flex items-center justify-between">
                Upcoming Departures
                <Link to="/admin/departures">
                  <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
                    View All <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {depsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : upcomingDepartures.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No upcoming departures.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingDepartures.map((dep) => (
                    <div key={dep.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Plane className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">
                            {(dep as Departure & { journeys?: { name: string } }).journeys?.name ?? 'Journey'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(dep.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' · '}
                            {dep.available_seats} seats left
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">₹{dep.base_price.toLocaleString('en-IN')}</p>
                        <Badge className={`${STATUS_COLORS[dep.status] ?? 'bg-gray-100 text-gray-700'} text-[10px] font-bold border-0 mt-0.5`}>
                          {dep.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Bookings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <Card className="border border-border shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-poppins font-semibold flex items-center justify-between">
                Recent Bookings
                <Link to="/admin/bookings">
                  <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
                    View All <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : recentBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No bookings yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentBookings.map((b) => (
                    <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/20 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-primary">
                            {b.booking_id ?? b.id.slice(0, 8).toUpperCase()}
                          </span>
                          <Badge className={`${STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-700'} text-[9px] font-bold border-0`}>
                            {b.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {b.traveller_count} traveller{b.traveller_count !== 1 ? 's' : ''} · {new Date(b.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <p className="text-sm font-semibold">₹{b.total_amount.toLocaleString('en-IN')}</p>
                        <Link to="/admin/bookings/$id" params={{ id: b.id }}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
