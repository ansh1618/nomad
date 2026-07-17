import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable, exportToCSV } from '@/components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '@/lib/queries/erp'
import type { Employee } from '@/lib/queries/erp'
import { toast } from 'sonner'
import {
  Users, Plus, Pencil, Trash2, Phone, Mail, Briefcase,
  UserCheck, UserX, Download, Loader2,
} from 'lucide-react'

export const Route = createFileRoute('/admin/employees')({
  component: EmployeesPage,
})

const ROLE_COLORS: Record<string, string> = {
  TRIP_CAPTAIN: 'bg-purple-100 text-purple-700',
  DRIVER: 'bg-blue-100 text-blue-700',
  GUIDE: 'bg-green-100 text-green-700',
  PHOTOGRAPHER: 'bg-pink-100 text-pink-700',
  OPERATIONS: 'bg-orange-100 text-orange-700',
  SUPPORT: 'bg-yellow-100 text-yellow-700',
  SALES: 'bg-teal-100 text-teal-700',
  HR: 'bg-red-100 text-red-700',
  ACCOUNTANT: 'bg-gray-100 text-gray-700',
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  ON_LEAVE: 'bg-amber-100 text-amber-700',
  INACTIVE: 'bg-slate-100 text-slate-700',
  TERMINATED: 'bg-red-100 text-red-700',
}

const EMPTY_FORM: Partial<Employee> = {
  full_name: '', email: '', phone: '', role: 'OPERATIONS',
  employment_status: 'ACTIVE', city: '', salary: undefined,
  notes: '', emergency_contact_name: '', emergency_contact_phone: '',
}

function EmployeesPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Employee | null>(null)
  const [form, setForm] = useState<Partial<Employee>>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const { data: result, isLoading } = useQuery({
    queryKey: ['employees', page, pageSize, search, sortBy, sortDir],
    queryFn: () => getEmployees({ page, pageSize, search, sortBy, sortDir }),
    placeholderData: (prev) => prev,
  })

  const employees = result?.data ?? []

  const handleSort = useCallback((by: string, dir: 'asc' | 'desc') => {
    setSortBy(by); setSortDir(dir)
  }, [])

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (emp: Employee) => {
    setEditTarget(emp)
    setForm({ ...emp })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.full_name || !form.phone) {
      toast.error('Full Name and Phone are required')
      return
    }
    setSaving(true)
    try {
      if (editTarget) {
        await updateEmployee(editTarget.id, form)
        toast.success('Employee updated')
      } else {
        await createEmployee(form)
        toast.success('Employee created')
      }
      qc.invalidateQueries({ queryKey: ['employees'] })
      setDialogOpen(false)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this employee? This cannot be undone.')) return
    try {
      await deleteEmployee(id)
      qc.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee deleted')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleExport = () => {
    exportToCSV(
      employees.map((e) => ({
        name: e.full_name, email: e.email ?? '', phone: e.phone,
        role: e.role, status: e.employment_status, city: e.city ?? '',
        salary: e.salary ?? '', joining_date: e.joining_date ?? '',
      })),
      'employees'
    )
  }

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: 'full_name',
      header: 'Employee',
      cell: ({ row }) => {
        const e = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {e.full_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm">{e.full_name}</p>
              {e.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{e.email}</p>}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ getValue }) => (
        <a href={`tel:${getValue()}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
          <Phone className="h-3 w-3" />{getValue() as string}
        </a>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ getValue }) => {
        const role = getValue() as string
        return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-700'}`}>{role.replace('_', ' ')}</span>
      },
    },
    {
      accessorKey: 'employment_status',
      header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue() as string
        return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[s] ?? 'bg-gray-100 text-gray-700'}`}>{s.replace('_', ' ')}</span>
      },
    },
    {
      accessorKey: 'city',
      header: 'City',
      cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{(getValue() as string) || '—'}</span>,
    },
    {
      accessorKey: 'salary',
      header: 'Salary',
      cell: ({ getValue }) => {
        const v = getValue() as number | null
        return <span className="text-sm font-medium">{v ? `₹${v.toLocaleString('en-IN')}` : '—'}</span>
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

  const active = employees.filter((e) => e.employment_status === 'ACTIVE').length
  const onLeave = employees.filter((e) => e.employment_status === 'ON_LEAVE').length
  const captains = employees.filter((e) => e.role === 'TRIP_CAPTAIN').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground">Employees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your team — captains, drivers, guides, and operations staff.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1.5" />Export</Button>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Add Employee</Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: result?.total ?? 0, icon: Users, color: 'text-primary' },
          { label: 'Active', value: active, icon: UserCheck, color: 'text-emerald-600' },
          { label: 'On Leave', value: onLeave, icon: UserX, color: 'text-amber-600' },
          { label: 'Captains', value: captains, icon: Briefcase, color: 'text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-border rounded-xl p-4 flex items-center gap-4">
            <div className={`p-2 rounded-lg bg-muted ${color}`}><Icon className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold font-poppins">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
          </motion.div>
        ))}
      </div>

      <DataTable
        columns={columns as any}
        data={employees}
        isLoading={isLoading}
        searchPlaceholder="Search employees..."
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Full Name *</Label>
                <Input value={form.full_name ?? ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Rahul Sharma" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone *</Label>
                <Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="rahul@gonomadik.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={form.role ?? 'OPERATIONS'} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['TRIP_CAPTAIN', 'DRIVER', 'GUIDE', 'PHOTOGRAPHER', 'OPERATIONS', 'SUPPORT', 'SALES', 'HR', 'ACCOUNTANT'].map((r) => (
                      <SelectItem key={r} value={r}>{r.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.employment_status ?? 'ACTIVE'} onValueChange={(v) => setForm({ ...form, employment_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['ACTIVE', 'ON_LEAVE', 'INACTIVE', 'TERMINATED'].map((s) => (
                      <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={form.city ?? ''} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Delhi" />
              </div>
              <div className="space-y-1.5">
                <Label>Monthly Salary (₹)</Label>
                <Input type="number" value={form.salary ?? ''} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) || undefined })} placeholder="25000" />
              </div>
              <div className="space-y-1.5">
                <Label>Emergency Contact Name</Label>
                <Input value={form.emergency_contact_name ?? ''} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Emergency Contact Phone</Label>
                <Input value={form.emergency_contact_phone ?? ''} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Notes</Label>
                <Textarea rows={3} value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional information..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Saving...</> : 'Save Employee'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
