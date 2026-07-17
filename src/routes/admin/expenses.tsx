import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable, exportToCSV } from '@/components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { getExpenses, createExpense, updateExpense, deleteExpense, getExpenseSummary } from '@/lib/queries/erp'
import type { Expense } from '@/lib/queries/erp'
import { toast } from 'sonner'
import {
  Receipt, Plus, Pencil, Trash2, Download, IndianRupee,
  Clock, CheckCircle, XCircle, Loader2, TrendingDown,
} from 'lucide-react'

export const Route = createFileRoute('/admin/expenses')({
  component: ExpensesPage,
})

const CATEGORY_COLORS: Record<string, string> = {
  HOTEL: 'bg-blue-100 text-blue-700',
  BUS_RENTAL: 'bg-purple-100 text-purple-700',
  DRIVER: 'bg-indigo-100 text-indigo-700',
  FUEL: 'bg-orange-100 text-orange-700',
  TOLL: 'bg-yellow-100 text-yellow-700',
  FOOD: 'bg-green-100 text-green-700',
  GUIDE: 'bg-teal-100 text-teal-700',
  ACTIVITY: 'bg-pink-100 text-pink-700',
  MARKETING: 'bg-rose-100 text-rose-700',
  SALARY: 'bg-red-100 text-red-700',
  OFFICE: 'bg-slate-100 text-slate-700',
  INSURANCE: 'bg-cyan-100 text-cyan-700',
  MISC: 'bg-gray-100 text-gray-700',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
}

const EMPTY_FORM: Partial<Expense> = {
  title: '', category: 'MISC', amount: undefined,
  expense_date: new Date().toISOString().split('T')[0],
  payment_method: 'Cash', status: 'PENDING',
  paid_to: '', notes: '',
}

function ExpensesPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('expense_date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Expense | null>(null)
  const [form, setForm] = useState<Partial<Expense>>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const { data: result, isLoading } = useQuery({
    queryKey: ['expenses', page, pageSize, search, sortBy, sortDir, filterStatus, filterCategory],
    queryFn: () => getExpenses({ page, pageSize, search, sortBy, sortDir, status: filterStatus || undefined, category: filterCategory || undefined }),
    placeholderData: (prev) => prev,
  })

  const { data: summary } = useQuery({
    queryKey: ['expense_summary'],
    queryFn: getExpenseSummary,
  })

  const expenses = result?.data ?? []

  const handleSort = useCallback((by: string, dir: 'asc' | 'desc') => {
    setSortBy(by); setSortDir(dir)
  }, [])

  const openCreate = () => { setEditTarget(null); setForm(EMPTY_FORM); setDialogOpen(true) }
  const openEdit = (exp: Expense) => { setEditTarget(exp); setForm({ ...exp }); setDialogOpen(true) }

  const handleSave = async () => {
    if (!form.title || !form.amount || !form.expense_date) {
      toast.error('Title, Amount and Date are required')
      return
    }
    setSaving(true)
    try {
      if (editTarget) {
        await updateExpense(editTarget.id, form)
        toast.success('Expense updated')
      } else {
        await createExpense(form)
        toast.success('Expense logged')
      }
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['expense_summary'] })
      setDialogOpen(false)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense record?')) return
    try {
      await deleteExpense(id)
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['expense_summary'] })
      toast.success('Expense deleted')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleExport = () => {
    exportToCSV(
      expenses.map((e) => ({
        title: e.title, category: e.category, amount: e.amount,
        date: e.expense_date, status: e.status,
        payment_method: e.payment_method ?? '', paid_to: e.paid_to ?? '',
      })),
      'expenses'
    )
  }

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: 'title',
      header: 'Expense',
      cell: ({ row }) => {
        const e = row.original
        return (
          <div>
            <p className="font-semibold text-sm">{e.title}</p>
            {e.paid_to && <p className="text-xs text-muted-foreground">To: {e.paid_to}</p>}
          </div>
        )
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ getValue }) => {
        const cat = getValue() as string
        return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-700'}`}>{cat.replace('_', ' ')}</span>
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ getValue }) => (
        <span className="font-bold text-sm">₹{(getValue() as number).toLocaleString('en-IN')}</span>
      ),
    },
    {
      accessorKey: 'expense_date',
      header: 'Date',
      cell: ({ getValue }) => (
        <span className="text-sm">{new Date(getValue() as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      ),
    },
    {
      accessorKey: 'payment_method',
      header: 'Payment',
      cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{getValue() as string}</span>,
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
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)} className="h-8 w-8 p-0"><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.original.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track all operational costs — hotels, buses, fuel, food, and more.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1.5" />Export</Button>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Log Expense</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Paid', value: `₹${(summary?.total ?? 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-red-600' },
          { label: 'Pending', value: `₹${(summary?.pending ?? 0).toLocaleString('en-IN')}`, icon: Clock, color: 'text-amber-600' },
          { label: 'Total Records', value: result?.total ?? 0, icon: Receipt, color: 'text-primary' },
          { label: 'This Page', value: expenses.length, icon: TrendingDown, color: 'text-slate-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-border rounded-xl p-4 flex items-center gap-4">
            <div className={`p-2 rounded-lg bg-muted ${color}`}><Icon className="h-5 w-5" /></div>
            <div><p className="text-lg font-bold font-poppins">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {['PENDING', 'APPROVED', 'PAID', 'REJECTED'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {Object.keys(CATEGORY_COLORS).map((c) => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns as any}
        data={expenses}
        isLoading={isLoading}
        searchPlaceholder="Search expenses..."
        onSearch={setSearch}
        onSort={handleSort}
        total={result?.total ?? 0}
        page={page}
        pageSize={pageSize}
        totalPages={result?.totalPages ?? 1}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Expense' : 'Log Expense'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Title *</Label>
                <Input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Hotel stay - Jibhi Riverside" />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category ?? 'MISC'} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(CATEGORY_COLORS).map((c) => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount (₹) *</Label>
                <Input type="number" value={form.amount ?? ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || undefined })} placeholder="15000" />
              </div>
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={form.expense_date ?? ''} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select value={form.payment_method ?? 'Cash'} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Cash', 'UPI', 'Bank Transfer', 'Card'].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Paid To</Label>
                <Input value={form.paid_to ?? ''} onChange={(e) => setForm({ ...form, paid_to: e.target.value })} placeholder="Vendor / Person name" />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status ?? 'PENDING'} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['PENDING', 'APPROVED', 'PAID', 'REJECTED'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Notes</Label>
                <Textarea rows={2} value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Saving...</> : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
