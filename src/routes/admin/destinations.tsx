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
  getDestinations,
  deleteDestination,
  publishDestination,
  archiveDestination,
  bulkDeleteDestinations,
  bulkUpdateDestinationsStatus,
} from '@/lib/queries/destinations'
import type { Destination } from '@/types/supabase'
import { toast } from 'sonner'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Archive,
  CheckCircle2,
  Globe,
  Loader2,
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

export const Route = createFileRoute('/admin/destinations')({
  component: DestinationsPage,
})

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  ARCHIVED: 'bg-red-100 text-red-600',
}

function DestinationsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('priority')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: result, isLoading } = useQuery({
    queryKey: ['destinations', page, pageSize, search, sortBy, sortDir, statusFilter],
    queryFn: () => getDestinations({ page, pageSize, search, sortBy, sortDir, status: statusFilter || undefined }),
    placeholderData: (prev) => prev,
  })

  const destinations = result?.data ?? []

  const deleteMutation = useMutation({
    mutationFn: deleteDestination,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['destinations'] })
      toast.success('Destination deleted successfully')
      setDeleteId(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const publishMutation = useMutation({
    mutationFn: publishDestination,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['destinations'] })
      toast.success('Destination published')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const archiveMutation = useMutation({
    mutationFn: archiveDestination,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['destinations'] })
      toast.success('Destination archived')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteDestinations,
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: ['destinations'] })
      toast.success(`${ids.length} destination${ids.length !== 1 ? 's' : ''} deleted`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const bulkPublishMutation = useMutation({
    mutationFn: (ids: string[]) => bulkUpdateDestinationsStatus(ids, 'PUBLISHED'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['destinations'] })
      toast.success('Destinations published')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSort = useCallback((by: string, dir: 'asc' | 'desc') => {
    setSortBy(by)
    setSortDir(dir)
  }, [])

  const handleExport = () => {
    exportToCSV(
      destinations.map((d) => ({
        name: d.name,
        slug: d.slug,
        state: d.state ?? '',
        country: d.country,
        status: d.status,
        is_featured: d.is_featured,
        priority: d.priority,
        created_at: d.created_at,
      })),
      'destinations'
    )
  }

  const columns: ColumnDef<Destination>[] = [
    {
      accessorKey: 'name',
      header: 'Destination',
      cell: ({ row }) => {
        const d = row.original
        return (
          <div className="flex items-center gap-3">
            {d.hero_image ? (
              <img
                src={d.hero_image}
                alt={d.name}
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Globe className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-semibold text-sm">{d.name}</p>
              <p className="text-xs text-muted-foreground font-mono">/{d.slug}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'state',
      header: 'Location',
      cell: ({ row }) => (
        <div className="text-sm">
          <span>{row.original.state ?? '—'}</span>
          {row.original.country && row.original.country !== 'India' && (
            <span className="text-muted-foreground">, {row.original.country}</span>
          )}
        </div>
      ),
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
            const { updateDestination } = await import('@/lib/queries/destinations')
            await updateDestination(row.original.id, { is_featured: checked })
            qc.invalidateQueries({ queryKey: ['destinations'] })
            toast.success(`${row.original.name} ${checked ? 'featured' : 'unfeatured'}`)
          }}
        />
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => <span className="text-sm font-mono">{row.original.priority}</span>,
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 60,
      cell: ({ row }) => {
        const d = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link to="/admin/destinations/$id" params={{ id: d.id }}>
                  <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`/destinations/${d.slug}`} target="_blank" rel="noreferrer">
                  <Eye className="h-3.5 w-3.5 mr-2" /> Preview
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {d.status !== 'PUBLISHED' && (
                <DropdownMenuItem onClick={() => publishMutation.mutate(d.id)}>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" /> Publish
                </DropdownMenuItem>
              )}
              {d.status !== 'ARCHIVED' && (
                <DropdownMenuItem onClick={() => archiveMutation.mutate(d.id)}>
                  <Archive className="h-3.5 w-3.5 mr-2 text-amber-600" /> Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteId(d.id)}
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

  const filterComponent = (
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
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold font-poppins">Destinations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {result?.total ?? 0} destination{(result?.total ?? 0) !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link to="/admin/destinations/$id" params={{ id: 'new' }}>
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Destination
          </Button>
        </Link>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <DataTable
          data={destinations}
          columns={columns}
          total={result?.total ?? 0}
          page={page}
          pageSize={pageSize}
          totalPages={result?.totalPages ?? 1}
          isLoading={isLoading}
          searchPlaceholder="Search destinations..."
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          onSearch={(s) => { setSearch(s); setPage(1) }}
          onSort={handleSort}
          onRefresh={() => qc.invalidateQueries({ queryKey: ['destinations'] })}
          onExportCSV={handleExport}
          filterComponent={filterComponent}
          emptyMessage="No destinations found. Create your first destination."
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

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Destination?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the destination and all associated packages. This action cannot be undone.
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
