import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, exportToCSV } from '@/components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { getBookings } from '@/lib/queries/bookings'
import type { Booking } from '@/types/supabase'
import {
  MoreHorizontal,
  Eye,
  X,
  CheckCircle,
  Loader2,
  CalendarDays,
  Users,
  IndianRupee,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

  const { data: result, isLoading } = useQuery({
    queryKey: ['bookings_list', page, pageSize, search, sortBy, sortDir, statusFilter],
    queryFn: () =>
      getBookings({ page, pageSize, search, sortBy, sortDir, status: statusFilter || undefined }),
    placeholderData: (prev) => prev,
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
        customer: b.users?.full_name ?? '',
        phone: b.users?.phone ?? '',
        package: b.departures?.journeys?.name ?? '',
        departure_date: b.departures?.departure_date ?? '',
        travellers: b.traveller_count,
        total: b.total_amount,
        paid: b.amount_paid,
        balance: b.balance_due,
        status: b.status,
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
      accessorKey: 'users.full_name',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.users?.full_name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{row.original.users?.phone ?? ''}</p>
        </div>
      ),
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
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={`${STATUS_BADGE[row.original.status] ?? 'bg-gray-100 text-gray-700'} border-0 text-xs font-semibold`}>
          {row.original.status.replace(/_/g, ' ')}
        </Badge>
      ),
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
          <h1 className="text-2xl font-bold font-poppins">Bookings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {result?.total ?? 0} booking{(result?.total ?? 0) !== 1 ? 's' : ''} total
          </p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <DataTable
          data={bookings}
          columns={columns}
          total={result?.total ?? 0}
          page={page}
          pageSize={pageSize}
          totalPages={result?.totalPages ?? 1}
          isLoading={isLoading}
          searchPlaceholder="Search by booking ID..."
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          onSearch={(s) => { setSearch(s); setPage(1) }}
          onSort={handleSort}
          onRefresh={() => qc.invalidateQueries({ queryKey: ['bookings_list'] })}
          onExportCSV={handleExport}
          filterComponent={
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-44 h-9">
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
          }
          emptyMessage="No bookings found."
        />
      </motion.div>
    </div>
  )
}
