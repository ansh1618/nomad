import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, exportToCSV } from '@/components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { getInvoices, updateInvoice } from '@/lib/queries/erp'
import type { Invoice } from '@/lib/queries/erp'
import { toast } from 'sonner'
import {
  FileText, Download, IndianRupee, CheckCircle, Clock,
  AlertCircle, ExternalLink,
} from 'lucide-react'

export const Route = createFileRoute('/admin/invoices')({
  component: InvoicesPage,
})

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ISSUED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  VOID: 'bg-slate-100 text-slate-500 line-through',
  REFUNDED: 'bg-red-100 text-red-700',
}

function InvoicesPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState('')

  const { data: result, isLoading } = useQuery({
    queryKey: ['invoices', page, pageSize, search, sortBy, sortDir, filterStatus],
    queryFn: () => getInvoices({ page, pageSize, search, sortBy, sortDir, status: filterStatus || undefined }),
    placeholderData: (prev) => prev,
  })

  const invoices = result?.data ?? []

  const handleMarkPaid = async (inv: Invoice) => {
    try {
      await updateInvoice(inv.id, { status: 'PAID', paid_at: new Date().toISOString(), amount_paid: inv.total_amount, balance_due: 0 })
      qc.invalidateQueries({ queryKey: ['invoices'] })
      toast.success(`Invoice ${inv.invoice_number} marked as paid`)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleExport = () => {
    exportToCSV(
      invoices.map((inv) => ({
        invoice_number: inv.invoice_number ?? '',
        customer: inv.customer_name,
        trip: inv.trip_name ?? '',
        base: inv.base_amount,
        gst: inv.gst_amount,
        total: inv.total_amount,
        status: inv.status,
        issued: inv.issued_at ?? '',
      })),
      'invoices'
    )
  }

  const totalRevenue = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.total_amount, 0)
  const totalPending = invoices.filter((i) => i.status === 'ISSUED').reduce((s, i) => s + i.balance_due, 0)

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoice_number',
      header: 'Invoice #',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs font-bold text-primary">{(getValue() as string) || '—'}</span>
      ),
    },
    {
      accessorKey: 'customer_name',
      header: 'Customer',
      cell: ({ row }) => {
        const inv = row.original
        return (
          <div>
            <p className="font-semibold text-sm">{inv.customer_name}</p>
            {inv.customer_phone && <p className="text-xs text-muted-foreground">{inv.customer_phone}</p>}
          </div>
        )
      },
    },
    {
      accessorKey: 'trip_name',
      header: 'Trip',
      cell: ({ getValue }) => <span className="text-sm">{(getValue() as string) || '—'}</span>,
    },
    {
      accessorKey: 'total_amount',
      header: 'Total',
      cell: ({ getValue }) => (
        <span className="font-bold text-sm">₹{(getValue() as number).toLocaleString('en-IN')}</span>
      ),
    },
    {
      accessorKey: 'gst_amount',
      header: 'GST',
      cell: ({ row }) => {
        const inv = row.original
        return <span className="text-xs text-muted-foreground">₹{inv.gst_amount.toLocaleString('en-IN')} ({inv.gst_rate}%)</span>
      },
    },
    {
      accessorKey: 'balance_due',
      header: 'Balance Due',
      cell: ({ getValue }) => {
        const v = getValue() as number
        return <span className={`text-sm font-semibold ${v > 0 ? 'text-red-600' : 'text-emerald-600'}`}>₹{v.toLocaleString('en-IN')}</span>
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue() as string
        return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[s] ?? 'bg-gray-100 text-gray-700'}`}>{s}</span>
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const inv = row.original
        return (
          <div className="flex items-center gap-2">
            {inv.pdf_url && (
              <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><ExternalLink className="h-3.5 w-3.5" /></Button>
              </a>
            )}
            {inv.status === 'ISSUED' && (
              <Button variant="ghost" size="sm" onClick={() => handleMarkPaid(inv)} className="h-8 px-2 text-emerald-600 hover:text-emerald-700 text-xs">
                <CheckCircle className="h-3.5 w-3.5 mr-1" />Mark Paid
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">GST-compliant invoices for all confirmed bookings.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1.5" />Export</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoices', value: result?.total ?? 0, icon: FileText, color: 'text-primary' },
          { label: 'Revenue Collected', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-emerald-600' },
          { label: 'Pending Collection', value: `₹${totalPending.toLocaleString('en-IN')}`, icon: Clock, color: 'text-amber-600' },
          { label: 'Paid Invoices', value: invoices.filter((i) => i.status === 'PAID').length, icon: CheckCircle, color: 'text-green-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-border rounded-xl p-4 flex items-center gap-4">
            <div className={`p-2 rounded-lg bg-muted ${color}`}><Icon className="h-5 w-5" /></div>
            <div><p className="text-lg font-bold font-poppins">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
          </motion.div>
        ))}
      </div>

      {/* Filter */}
      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder="All Statuses" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Statuses</SelectItem>
          {['DRAFT', 'ISSUED', 'PAID', 'VOID', 'REFUNDED'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      <DataTable
        columns={columns}
        data={invoices}
        isLoading={isLoading}
        searchPlaceholder="Search by invoice # or customer..."
        onSearch={setSearch}
        onSort={(by, dir) => { setSortBy(by); setSortDir(dir) }}
        pagination={{ page, pageSize, total: result?.total ?? 0, totalPages: result?.totalPages ?? 1, onPageChange: setPage, onPageSizeChange: setPageSize }}
      />
    </div>
  )
}
