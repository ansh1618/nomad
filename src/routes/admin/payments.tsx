import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, exportToCSV } from '@/components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { getPayments } from '@/lib/queries/admin'
import { initiateRefundFn } from '@/lib/mutations/payment'
import type { Payment } from '@/types/supabase'
import { toast } from 'sonner'
import {
  CreditCard,
  Calendar,
  Loader2,
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const Route = createFileRoute('/admin/payments')({
  component: PaymentsPage,
})

const GATEWAY_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  SUCCESS: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-orange-100 text-orange-700',
}

type PaymentWithJoins = Payment & {
  bookings?: {
    booking_id: string
    users?: { full_name: string; phone: string }
  }
}

function PaymentsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: result, isLoading } = useQuery({
    queryKey: ['payments_list', page, pageSize, search, sortBy, sortDir, statusFilter],
    queryFn: () => getPayments({ page, pageSize, search, sortBy, sortDir, status: statusFilter || undefined }),
    placeholderData: (prev) => prev,
  })

  const payments = (result?.data ?? []) as PaymentWithJoins[]

  const refundMutation = useMutation({
    mutationFn: initiateRefundFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments_list'] })
      toast.success('Refund processed successfully')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleRefund = (payment: PaymentWithJoins) => {
    if (!payment.gateway_payment_id) {
      toast.error('No gateway payment ID found to refund')
      return
    }
    if (confirm(`Refund ₹${payment.amount} for booking ${payment.bookings?.booking_id}?`)) {
      refundMutation.mutate({
        data: {
          paymentId: payment.id,
          amount: payment.amount,
          bookingId: payment.booking_id,
        }
      })
    }
  }

  const handleSort = useCallback((by: string, dir: 'asc' | 'desc') => {
    setSortBy(by)
    setSortDir(dir)
  }, [])

  const handleExport = () => {
    exportToCSV(
      payments.map((p) => ({
        transaction_id: p.gateway_payment_id ?? '',
        order_id: p.gateway_order_id ?? '',
        booking_id: p.bookings?.booking_id ?? '',
        customer: p.bookings?.users?.full_name ?? '',
        amount: p.amount,
        status: p.status,
        created_at: p.created_at,
      })),
      'payments'
    )
  }

  const columns: ColumnDef<PaymentWithJoins>[] = [
    {
      accessorKey: 'gateway_payment_id',
      header: 'Transaction ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-primary">
          {row.original.gateway_payment_id ?? row.original.gateway_order_id ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'bookings.booking_id',
      header: 'Booking ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold">
          {row.original.bookings?.booking_id ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'bookings.users.full_name',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-semibold">{row.original.bookings?.users?.full_name ?? 'Guest'}</p>
          <p className="text-xs text-muted-foreground">{row.original.bookings?.users?.phone ?? ''}</p>
        </div>
      ),
    },
    {
      accessorKey: 'payment_gateway',
      header: 'Gateway',
      cell: ({ row }) => <span className="text-xs text-muted-foreground font-semibold">{row.original.payment_gateway}</span>,
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="text-sm font-semibold">₹{row.original.amount.toLocaleString('en-IN')}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={`${GATEWAY_COLORS[row.original.status] ?? 'bg-gray-100'} border-0 font-semibold text-xs`}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(row.original.created_at).toLocaleDateString('en-IN')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 80,
      cell: ({ row }) => {
        const p = row.original
        return (
          p.status === 'SUCCESS' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRefund(p)}
              disabled={refundMutation.isPending}
              className="text-xs text-destructive hover:bg-destructive/5 hover:text-destructive h-7"
            >
              Refund
            </Button>
          )
        )
      },
    },
  ]

  const filters = (
    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1) }}>
      <SelectTrigger className="w-36 h-9">
        <SelectValue placeholder="All Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All Status</SelectItem>
        <SelectItem value="SUCCESS">Success</SelectItem>
        <SelectItem value="PENDING">Pending</SelectItem>
        <SelectItem value="FAILED">Failed</SelectItem>
        <SelectItem value="REFUNDED">Refunded</SelectItem>
      </SelectContent>
    </Select>
  )

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold font-poppins">Payments Ledger</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {result?.total ?? 0} transaction{(result?.total ?? 0) !== 1 ? 's' : ''} total
          </p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <DataTable
          data={payments}
          columns={columns}
          total={result?.total ?? 0}
          page={page}
          pageSize={pageSize}
          totalPages={result?.totalPages ?? 1}
          isLoading={isLoading}
          searchPlaceholder="Search payment gateway ID..."
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          onSearch={(s) => { setSearch(s); setPage(1) }}
          onSort={handleSort}
          onRefresh={() => qc.invalidateQueries({ queryKey: ['payments_list'] })}
          onExportCSV={handleExport}
          filterComponent={filters}
          emptyMessage="No payments recorded."
        />
      </motion.div>
    </div>
  )
}
