import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable, exportToCSV } from '@/components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import {
  getPackages,
  deletePackage,
  publishPackage,
  archivePackage,
  bulkDeletePackages,
  bulkUpdatePackagesStatus,
  duplicatePackage,
} from '@/lib/queries/packages'
import type { Journey } from '@/types/supabase'
import { toast } from 'sonner'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Archive,
  CheckCircle2,
  Package,
  Loader2,
  Star,
  Calendar,
  Copy,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const Route = createFileRoute('/admin/packages')({
  component: PackagesPage,
})

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  ARCHIVED: 'bg-red-100 text-red-600',
}

const DIFFICULTY_BADGE: Record<string, string> = {
  EASY: 'bg-green-100 text-green-700',
  MODERATE: 'bg-amber-100 text-amber-700',
  DIFFICULT: 'bg-orange-100 text-orange-700',
  EXTREME: 'bg-red-100 text-red-700',
}

function PackagesPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: result, isLoading } = useQuery({
    queryKey: ['packages', page, pageSize, search, sortBy, sortDir, statusFilter],
    queryFn: () => getPackages({ page, pageSize, search, sortBy, sortDir, status: statusFilter || undefined }),
    placeholderData: (prev) => prev,
  })

  const packages = result?.data ?? []

  const deleteMutation = useMutation({
    mutationFn: deletePackage,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['packages'] })
      toast.success('Package deleted')
      setDeleteId(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const publishMutation = useMutation({
    mutationFn: publishPackage,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['packages'] }); toast.success('Package published') },
    onError: (err: Error) => toast.error(err.message),
  })

  const archiveMutation = useMutation({
    mutationFn: archivePackage,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['packages'] }); toast.success('Package archived') },
    onError: (err: Error) => toast.error(err.message),
  })

  const duplicateMutation = useMutation({
    mutationFn: duplicatePackage,
    onSuccess: (newPkg) => {
      qc.invalidateQueries({ queryKey: ['packages'] })
      toast.success(`Duplicated successfully as DRAFT: ${newPkg.name}`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeletePackages,
    onSuccess: (_, ids) => { qc.invalidateQueries({ queryKey: ['packages'] }); toast.success(`${ids.length} package${ids.length !== 1 ? 's' : ''} deleted`) },
    onError: (err: Error) => toast.error(err.message),
  })

  const bulkPublishMutation = useMutation({
    mutationFn: (ids: string[]) => bulkUpdatePackagesStatus(ids, 'PUBLISHED'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['packages'] }); toast.success('Packages published') },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSort = useCallback((by: string, dir: 'asc' | 'desc') => {
    setSortBy(by); setSortDir(dir)
  }, [])

  const handleExport = () => {
    exportToCSV(packages.map((p) => ({
      name: p.name,
      slug: p.slug,
      destination: (p as Journey & { destinations?: { name: string } }).destinations?.name ?? '',
      duration: p.duration ?? '',
      starting_price: p.starting_price ?? '',
      difficulty: p.difficulty ?? '',
      status: p.status,
      is_featured: p.is_featured,
      avg_rating: p.avg_rating,
      booking_count: p.booking_count,
    })), 'packages')
  }

  const columns: ColumnDef<Journey>[] = [
    {
      accessorKey: 'name',
      header: 'Package',
      cell: ({ row }) => {
        const p = row.original as Journey & { destinations?: { name: string } }
        return (
          <div className="flex items-center gap-3">
            {p.hero_banner ? (
              <img src={p.hero_banner} alt={p.name} className="w-12 h-9 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-12 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-semibold text-sm">{p.name}</p>
              <div className="flex items-center gap-2">
                {p.destinations?.name && (
                  <span className="text-xs text-muted-foreground">{p.destinations.name}</span>
                )}
                {p.difficulty && (
                  <Badge className={`${DIFFICULTY_BADGE[p.difficulty] ?? 'bg-gray-100'} border-0 text-[9px] font-bold`}>
                    {p.difficulty}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'duration',
      header: 'Duration',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {row.original.duration ?? `${row.original.duration_days ?? '?'}D/${row.original.duration_nights ?? '?'}N`}
        </div>
      ),
    },
    {
      accessorKey: 'starting_price',
      header: 'Price',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.starting_price ? (
            <span className="font-semibold">₹{row.original.starting_price.toLocaleString('en-IN')}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'avg_rating',
      header: 'Rating',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {row.original.avg_rating > 0 ? (
            <>
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium">{row.original.avg_rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({row.original.review_count})</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">No reviews</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'booking_count',
      header: 'Bookings',
      cell: ({ row }) => <span className="text-sm font-mono">{row.original.booking_count}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={`${STATUS_BADGE[row.original.status] ?? 'bg-gray-100 text-gray-700'} border-0 text-xs font-semibold`}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'is_featured',
      header: 'Featured',
      cell: ({ row }) => (
        <Switch
          checked={row.original.is_featured}
          onCheckedChange={async (checked) => {
            const { updatePackage } = await import('@/lib/queries/packages')
            await updatePackage(row.original.id, { is_featured: checked })
            qc.invalidateQueries({ queryKey: ['packages'] })
            toast.success(`${row.original.name} ${checked ? 'featured' : 'unfeatured'}`)
          }}
        />
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 60,
      cell: ({ row }) => {
        const p = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link to="/admin/packages/$id" params={{ id: p.id }}>
                  <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicateMutation.mutate(p.id)} disabled={duplicateMutation.isPending}>
                {duplicateMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-2" />
                )}
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`/packages/${p.slug}`} target="_blank" rel="noreferrer">
                  <Eye className="h-3.5 w-3.5 mr-2" /> Preview
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {p.status !== 'PUBLISHED' && (
                <DropdownMenuItem onClick={() => publishMutation.mutate(p.id)}>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" /> Publish
                </DropdownMenuItem>
              )}
              {p.status !== 'ARCHIVED' && (
                <DropdownMenuItem onClick={() => archiveMutation.mutate(p.id)}>
                  <Archive className="h-3.5 w-3.5 mr-2 text-amber-600" /> Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteId(p.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
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
          <h1 className="text-2xl font-bold font-poppins">Packages</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {result?.total ?? 0} package{(result?.total ?? 0) !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link to="/admin/packages/$id" params={{ id: 'new' }}>
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Package
          </Button>
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <DataTable
          data={packages}
          columns={columns}
          total={result?.total ?? 0}
          page={page}
          pageSize={pageSize}
          totalPages={result?.totalPages ?? 1}
          isLoading={isLoading}
          searchPlaceholder="Search packages..."
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          onSearch={(s) => { setSearch(s); setPage(1) }}
          onSort={handleSort}
          onRefresh={() => qc.invalidateQueries({ queryKey: ['packages'] })}
          onExportCSV={handleExport}
          filterComponent={
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          }
          emptyMessage="No packages found. Create your first travel package."
          bulkActions={[
            {
              label: 'Publish',
              icon: <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />,
              variant: 'outline',
              onClick: (ids) => bulkPublishMutation.mutateAsync(ids),
            },
            {
              label: 'Delete',
              icon: <Trash2 className="h-3.5 w-3.5 mr-1.5" />,
              variant: 'destructive',
              onClick: (ids) => bulkDeleteMutation.mutateAsync(ids),
            },
          ]}
        />
      </motion.div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Package?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the package along with its itinerary and all related departures. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
