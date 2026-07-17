import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable, exportToCSV } from '@/components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { getFaqLibrary, createLibraryFaq, updateLibraryFaq, deleteLibraryFaq } from '@/lib/queries/cms'
import type { FaqLibraryItem } from '@/types/supabase'
import { toast } from 'sonner'
import {
  HelpCircle, Plus, Pencil, Trash2, Star, CheckCircle, XCircle, Search, Filter, Loader2, Download
} from 'lucide-react'

export const Route = createFileRoute('/admin/faqs')({
  component: FaqLibraryPage,
})

const CATEGORIES = [
  'Booking', 'Transport', 'Stay', 'Meals', 'Safety', 'Cancellation', 'Payment', 'Packing', 'Food', 'Weather', 'Activities'
]

const CATEGORY_COLORS: Record<string, string> = {
  Booking: 'bg-indigo-50 text-indigo-700 border-indigo-200/50',
  Transport: 'bg-blue-50 text-blue-700 border-blue-200/50',
  Stay: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
  Meals: 'bg-orange-50 text-orange-700 border-orange-200/50',
  Safety: 'bg-rose-50 text-rose-700 border-rose-200/50',
  Cancellation: 'bg-red-50 text-red-700 border-red-200/50',
  Payment: 'bg-amber-50 text-amber-700 border-amber-200/50',
  Packing: 'bg-purple-50 text-purple-700 border-purple-200/50',
  Food: 'bg-teal-50 text-teal-700 border-teal-200/50',
  Weather: 'bg-sky-50 text-sky-700 border-sky-200/50',
  Activities: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/50',
}

const EMPTY_FORM: Partial<FaqLibraryItem> = {
  question: '',
  answer: '',
  category: 'Booking',
  featured: false,
  status: 'active'
}

function FaqLibraryPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<FaqLibraryItem | null>(null)
  const [form, setForm] = useState<Partial<FaqLibraryItem>>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const { data: result, isLoading } = useQuery({
    queryKey: ['faq_library', page, pageSize, search, categoryFilter, sortBy, sortDir],
    queryFn: () => getFaqLibrary({
      page,
      pageSize,
      search,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      sortBy,
      sortDir
    }),
    placeholderData: (prev) => prev,
  })

  const faqs = result?.data ?? []

  const handleSort = useCallback((by: string, dir: 'asc' | 'desc') => {
    setSortBy(by)
    setSortDir(dir)
  }, [])

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (faq: FaqLibraryItem) => {
    setEditTarget(faq)
    setForm({ ...faq })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.question || !form.answer) {
      toast.error('Question and Answer are required')
      return
    }
    setSaving(true)
    try {
      if (editTarget) {
        await updateLibraryFaq(editTarget.id, form)
        toast.success('Library FAQ updated')
      } else {
        await createLibraryFaq(form)
        toast.success('Library FAQ created')
      }
      qc.invalidateQueries({ queryKey: ['faq_library'] })
      setDialogOpen(false)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ from the master library? This cannot be undone.')) return
    try {
      await deleteLibraryFaq(id)
      qc.invalidateQueries({ queryKey: ['faq_library'] })
      toast.success('Library FAQ deleted')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleExport = () => {
    exportToCSV(
      faqs.map((f) => ({
        question: f.question,
        answer: f.answer,
        category: f.category,
        featured: f.featured ? 'Yes' : 'No',
        status: f.status,
        used_in_packages: f.used_count || 0
      })),
      'faq-library'
    )
  }

  const columns: ColumnDef<FaqLibraryItem>[] = [
    {
      accessorKey: 'question',
      header: 'FAQ Details',
      cell: ({ row }) => {
        const f = row.original
        return (
          <div className="max-w-[450px] space-y-1 py-1">
            <p className="font-semibold text-sm text-primary flex items-start gap-1.5 leading-snug">
              {f.featured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500 shrink-0 mt-0.5" />}
              {f.question}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{f.answer}</p>
          </div>
        )
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ getValue }) => {
        const cat = getValue() as string
        return (
          <span className={`text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[cat] ?? 'bg-slate-50 text-slate-700 border-slate-200'}`}>
            {cat}
          </span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue() as string
        const isActive = status === 'active'
        return (
          <Badge variant={isActive ? 'outline' : 'secondary'} className={isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : ''}>
            {isActive ? <CheckCircle className="h-3 w-3 mr-1 text-emerald-600" /> : <XCircle className="h-3 w-3 mr-1 text-slate-400" />}
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'used_count',
      header: 'Used In',
      cell: ({ row }) => {
        const count = row.original.used_count || 0
        return (
          <Badge variant="outline" className={`font-mono font-bold text-xs ${count > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            {count} Packages
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)} className="h-8 w-8 p-0">
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.original.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            FAQ Library (Master)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage reusable, category-wise package FAQs globally for Nomadik's platforms.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExport} className="h-9 gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button size="sm" onClick={openCreate} className="h-9 gap-2 bg-primary hover:bg-primary/90 text-white shadow-soft">
            <Plus className="h-4 w-4" /> Create Master FAQ
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-border shadow-soft flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search questions or answers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-border shadow-soft overflow-hidden">
        <DataTable
          columns={columns}
          data={faqs}
          loading={isLoading}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          totalItems={result?.total ?? 0}
          onSort={handleSort}
          sortBy={sortBy}
          sortDir={sortDir}
        />
      </div>

      {/* Save Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editTarget ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editTarget ? 'Edit Master FAQ' : 'Add FAQ to Master Library'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 font-poppins">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Question</Label>
              <Input
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="e.g. Is it safe to travel solo?"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Answer Details</Label>
              <Textarea
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                placeholder="Write the detailed response..."
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Category Group</Label>
                <Select
                  value={form.category}
                  onValueChange={(val) => setForm({ ...form, category: val as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Display Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => setForm({ ...form, status: val as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Available)</SelectItem>
                    <SelectItem value="inactive">Inactive (Hidden)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Featured FAQ (⭐)</Label>
                <p className="text-[11px] text-muted-foreground">Mark this FAQ to highlight and show at the top of lists.</p>
              </div>
              <Switch
                checked={form.featured}
                onCheckedChange={(val) => setForm({ ...form, featured: val })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-white shadow-soft gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editTarget ? 'Update Preset' : 'Save Preset'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
