import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, exportToCSV } from '@/components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { getBookings } from '@/lib/queries/bookings'
import { useRealtimeBookings } from '@/hooks/use-realtime-bookings'
import type { Booking } from '@/types/supabase'
import { supabase } from '@/lib/supabase'
import {
  MoreHorizontal,
  Eye,
  X,
  CheckCircle,
  Loader2,
  CalendarDays,
  Users,
  IndianRupee,
  TrendingUp,
  XCircle,
  Calendar,
  CreditCard,
  Plane,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin/bookings')({
  component: BookingsPage,
})

const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  PAYMENT_PENDING: 'bg-amber-100 text-amber-700',
  PARTIAL_PAID: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
  CREATED: 'bg-gray-100 text-gray-600',
  SEAT_LOCKED: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CHECKED_IN: 'bg-teal-100 text-teal-700',
  REFUNDED: 'bg-red-100 text-red-600',
}

type BookingWithJoins = Booking & {
  customers?: { name: string; phone: string; email: string | null }
  users?: { full_name: string; phone: string }
  departures?: { departure_date: string; journeys?: { name: string } }
}

function BookingsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = useState('')
  const [destinationFilter, setDestinationFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Subscribe to realtime booking changes — no polling needed
  useRealtimeBookings()

  const { data: result, isLoading } = useQuery({
    queryKey: ['bookings_list', page, pageSize, search, sortBy, sortDir, statusFilter, destinationFilter, fromDate, toDate],
    queryFn: () =>
      getBookings({
        page,
        pageSize,
        search,
        sortBy,
        sortDir,
        status: statusFilter || undefined,
        destinationId: destinationFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      }),
    placeholderData: (prev) => prev,
  })

  // Load aggregate stats dynamically from DB
  const { data: stats } = useQuery({
    queryKey: ['bookings_dashboard_stats'],
    queryFn: async () => {
      const { count: total } = await supabase.from('bookings').select('*', { count: 'exact', head: true })
      const { count: confirmed } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('booking_status', 'CONFIRMED')
      const { count: pending } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('booking_status', 'PENDING')
      const { count: cancelled } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('booking_status', 'CANCELLED')
      
      const { data: rev } = await supabase.from('bookings').select('amount_paid')
      const revenue = rev?.reduce((s, b) => s + Number(b.amount_paid || 0), 0) ?? 0

      const { data: travs } = await supabase.from('bookings').select('traveller_count')
      const travellers = travs?.reduce((s, b) => s + Number(b.traveller_count || 1), 0) ?? 0

      return { total: total ?? 0, confirmed: confirmed ?? 0, pending: pending ?? 0, cancelled: cancelled ?? 0, revenue, travellers }
    },
    refetchInterval: 10_000,
  })

  // Load destinations list for dropdown filter
  const { data: destinations = [] } = useQuery({
    queryKey: ['destinations_list_dropdown'],
    queryFn: async () => {
      const { data } = await supabase.from('destinations').select('id, name').order('name')
      return data ?? []
    }
  })

  const bulkConfirmMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'CONFIRMED', booking_status: 'CONFIRMED', updated_at: new Date().toISOString() })
        .in('id', ids)
      if (error) throw error
    },
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: ['bookings_list'] })
      qc.invalidateQueries({ queryKey: ['bookings_dashboard_stats'] })
      toast.success(`${ids.length} booking(s) confirmed successfully`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const bulkCancelMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'CANCELLED', booking_status: 'CANCELLED', updated_at: new Date().toISOString() })
        .in('id', ids)
      if (error) throw error
    },
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: ['bookings_list'] })
      qc.invalidateQueries({ queryKey: ['bookings_dashboard_stats'] })
      toast.success(`${ids.length} booking(s) cancelled successfully`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const bookings: BookingWithJoins[] = (result?.data ?? []) as BookingWithJoins[]

  const handleSort = useCallback((by: string, dir: 'asc' | 'desc') => {
    setSortBy(by)
    setSortDir(dir)
  }, [])

  const handleExport = () => {
    exportToCSV(
      bookings.map((b) => ({
        booking_id: b.booking_id ?? b.id,
        customer: b.customers?.name ?? b.users?.full_name ?? '',
        phone: b.customers?.phone ?? b.users?.phone ?? '',
        email: b.customers?.email ?? '',
        package: b.departures?.journeys?.name ?? '',
        departure_date: b.departures?.departure_date ?? '',
        travellers: b.traveller_count,
        total: b.total_amount,
        paid: b.amount_paid,
        balance: b.balance_due,
        booking_status: b.booking_status ?? b.status,
        payment_status: b.payment_status,
        created: b.created_at,
      })),
      'bookings'
    )
  }

  const columns: ColumnDef<BookingWithJoins>[] = [
    {
      accessorKey: 'booking_id',
      header: 'Booking ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-primary">
          {row.original.booking_id ?? row.original.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      accessorKey: 'customers.name',
      header: 'Customer',
      cell: ({ row }) => {
        const name = row.original.customers?.name ?? row.original.users?.full_name ?? '—'
        const phone = row.original.customers?.phone ?? row.original.users?.phone ?? ''
        const email = row.original.customers?.email ?? ''
        return (
          <div>
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-xs text-muted-foreground">{phone}</p>
            {email && <p className="text-xs text-muted-foreground truncate max-w-[140px]">{email}</p>}
          </div>
        )
      },
    },
    {
      accessorKey: 'departures.journeys.name',
      header: 'Package',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium truncate max-w-[160px]">
            {row.original.departures?.journeys?.name ?? '—'}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {row.original.departures?.departure_date
              ? new Date(row.original.departures.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'traveller_count',
      header: 'Travellers',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          {row.original.traveller_count}
        </div>
      ),
    },
    {
      accessorKey: 'total_amount',
      header: 'Amount',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-semibold">₹{row.original.total_amount.toLocaleString('en-IN')}</p>
          {row.original.balance_due > 0 && (
            <p className="text-xs text-amber-600">₹{row.original.balance_due.toLocaleString('en-IN')} due</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'booking_status',
      header: 'Booking',
      cell: ({ row }) => {
        const s = row.original.booking_status ?? row.original.status
        return (
          <Badge className={`${STATUS_BADGE[s] ?? 'bg-gray-100 text-gray-700'} border-0 text-xs font-semibold`}>
            {s?.replace(/_/g, ' ')}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'payment_status',
      header: 'Payment',
      cell: ({ row }) => {
        const ps = row.original.payment_status
        const colors: Record<string, string> = {
          SUCCESS: 'bg-emerald-100 text-emerald-700',
          PENDING: 'bg-amber-100 text-amber-700',
          FAILED: 'bg-red-100 text-red-700',
          REFUNDED: 'bg-blue-100 text-blue-700',
        }
        return ps ? (
          <Badge className={`${colors[ps] ?? 'bg-gray-100 text-gray-700'} border-0 text-xs font-semibold`}>
            {ps}
          </Badge>
        ) : null
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 60,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem asChild>
              <Link to="/admin/bookings/$id" params={{ id: row.original.id }}>
                <Eye className="h-3.5 w-3.5 mr-2" /> View Details
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-poppins text-foreground">Bookings CRM</h1>
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-poppins font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage booking lifecycles, seats, rooms, and payments sync.
          </p>
        </div>
      </motion.div>

      {/* Aggregate Stats Row */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          <div className="bg-white border rounded-xl p-4 flex flex-col justify-between shadow-soft hover:shadow-soft-lg transition-all">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Bookings</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-bold font-poppins text-primary">{stats.total}</span>
              <span className="text-xs text-muted-foreground">files</span>
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4 flex flex-col justify-between shadow-soft hover:shadow-soft-lg transition-all">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Revenue</span>
            <div className="flex items-baseline gap-1 mt-2 text-emerald-600">
              <span className="text-2xl font-bold font-poppins">₹{stats.revenue.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4 flex flex-col justify-between shadow-soft hover:shadow-soft-lg transition-all">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Travellers</span>
            <div className="flex items-baseline gap-1.5 mt-2 text-blue-600">
              <span className="text-2xl font-bold font-poppins">{stats.travellers}</span>
              <span className="text-xs text-muted-foreground">explorers</span>
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4 flex flex-col justify-between shadow-soft hover:shadow-soft-lg transition-all">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Confirmed Slots</span>
            <div className="flex items-baseline gap-1.5 mt-2 text-emerald-600">
              <span className="text-2xl font-bold font-poppins">{stats.confirmed}</span>
              <span className="text-xs text-muted-foreground">confirmed</span>
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4 flex flex-col justify-between shadow-soft hover:shadow-soft-lg transition-all">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Pending Payments</span>
            <div className="flex items-baseline gap-1.5 mt-2 text-amber-600">
              <span className="text-2xl font-bold font-poppins">{stats.pending}</span>
              <span className="text-xs text-muted-foreground">pending</span>
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4 flex flex-col justify-between shadow-soft hover:shadow-soft-lg transition-all">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Cancelled Files</span>
            <div className="flex items-baseline gap-1.5 mt-2 text-red-500">
              <span className="text-2xl font-bold font-poppins">{stats.cancelled}</span>
              <span className="text-xs text-muted-foreground">void</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Advanced Toolbar Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <DataTable
          data={bookings}
          columns={columns}
          total={result?.total ?? 0}
          page={page}
          pageSize={pageSize}
          totalPages={result?.totalPages ?? 1}
          isLoading={isLoading}
          searchPlaceholder="Search Name, Phone, Email, IDs..."
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          onSearch={(s) => { setSearch(s); setPage(1) }}
          onSort={handleSort}
          onRefresh={() => {
            qc.invalidateQueries({ queryKey: ['bookings_list'] });
            qc.invalidateQueries({ queryKey: ['bookings_dashboard_stats'] });
          }}
          onExportCSV={handleExport}
          filterComponent={
            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1) }}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="PAYMENT_PENDING">Payment Pending</SelectItem>
                  <SelectItem value="PARTIAL_PAID">Partial Paid</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>

              <Select value={destinationFilter} onValueChange={(v) => { setDestinationFilter(v === 'ALL' ? '' : v); setPage(1) }}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder="All Destinations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Destinations</SelectItem>
                  {destinations.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1.5 bg-white border rounded-lg px-2 py-1 h-9">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
                  className="text-xs bg-transparent border-0 focus:outline-none w-28 focus:ring-0"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-white border rounded-lg px-2 py-1 h-9">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => { setToDate(e.target.value); setPage(1) }}
                  className="text-xs bg-transparent border-0 focus:outline-none w-28 focus:ring-0"
                />
              </div>

              {(statusFilter || destinationFilter || fromDate || toDate || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('');
                    setDestinationFilter('');
                    setFromDate('');
                    setToDate('');
                    setSearch('');
                    setPage(1);
                  }}
                  className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30"
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Reset
                </Button>
              )}
            </div>
          }
          emptyMessage="No bookings found matching criteria."
          bulkActions={[
            {
              label: 'Confirm Selected',
              icon: <CheckCircle className="h-3.5 w-3.5 mr-1.5" />,
              onClick: (ids) => bulkConfirmMutation.mutateAsync(ids),
            },
            {
              label: 'Cancel Selected',
              icon: <XCircle className="h-3.5 w-3.5 mr-1.5 text-destructive" />,
              variant: 'destructive',
              onClick: (ids) => bulkCancelMutation.mutateAsync(ids),
            },
          ]}
        />
      </motion.div>
    </div>
  )
}
