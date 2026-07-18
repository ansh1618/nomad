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
import { getHotels, deleteHotel, bulkDeleteHotels } from '@/lib/queries/hotels-buses'
import type { Hotel } from '@/types/supabase'
import { toast } from 'sonner'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Hotel as HotelIcon,
  Loader2,
  MapPin,
  Star,
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

export const Route = createFileRoute('/admin/hotels')({
  component: HotelsPage,
})

type HotelWithJoins = Hotel & {
  destinations?: { name: string }
}

function HotelsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [activeFilter, setActiveFilter] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: result, isLoading } = useQuery({
    queryKey: ['hotels_list', page, pageSize, search, sortBy, sortDir, activeFilter],
    queryFn: () =>
      getHotels({
        page,
        pageSize,
        search,
        sortBy,
        sortDir,
        isActive: activeFilter === 'ACTIVE' ? true : activeFilter === 'INACTIVE' ? false : undefined,
      }),
    placeholderData: (prev) => prev,
  })

  const hotels: HotelWithJoins[] = (result?.data ?? []) as HotelWithJoins[]

  const deleteMutation = useMutation({
    mutationFn: deleteHotel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hotels_list'] })
      toast.success('Hotel deleted successfully')
      setDeleteId(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteHotels,
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: ['hotels_list'] })
      toast.success(`${ids.length} hotel${ids.length !== 1 ? 's' : ''} deleted`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSort = useCallback((by: string, dir: 'asc' | 'desc') => {
    setSortBy(by)
    setSortDir(dir)
  }, [])

  const handleExport = () => {
    exportToCSV(
      hotels.map((h) => ({
        name: h.name,
        destination: h.destinations?.name ?? '',
        city: h.city ?? '',
        state: h.state ?? '',
        star_rating: h.star_rating ?? '',
        contact_name: h.contact_name ?? '',
        contact_phone: h.contact_phone ?? '',
        is_active: h.is_active,
      })),
      'hotels'
    )
  }

  const columns: ColumnDef<HotelWithJoins>[] = [
    {
      accessorKey: 'name',
      header: 'Hotel Name',
      cell: ({ row }) => {
        const h = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <HotelIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">{h.name}</p>
              {h.city && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {h.city}{h.state ? `, ${h.state}` : ''}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'destinations.name',
      header: 'Destination',
      cell: ({ row }) => <span className="text-sm">{row.original.destinations?.name ?? '—'}</span>,
    },
    {
      accessorKey: 'star_rating',
      header: 'Rating',
      cell: ({ row }) =>
        row.original.star_rating ? (
          <div className="flex items-center gap-0.5 text-amber-500">
            {Array.from({ length: row.original.star_rating }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-current" />
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'contact_name',
      header: 'Vendor Contact',
      cell: ({ row }) => {
        const h = row.original
        return h.contact_name ? (
          <div>
            <p className="text-sm">{h.contact_name}</p>
            <p className="text-xs text-muted-foreground font-mono">{h.contact_phone}</p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No contact added</span>
        )
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 60,
      cell: ({ row }) => {
        const h = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild>
                <Link to="/admin/hotels_/$id" params={{ id: h.id }}>
                  <Pencil className="h-3.5 w-3.5 mr-2" /> Edit Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteId(h.id)}
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

  const filters = (
    <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v === 'ALL' ? '' : v); setPage(1) }}>
      <SelectTrigger className="w-36 h-9">
        <SelectValue placeholder="All Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All Status</SelectItem>
        <SelectItem value="ACTIVE">Active</SelectItem>
        <SelectItem value="INACTIVE">Inactive</SelectItem>
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
          <h1 className="text-2xl font-bold font-poppins">Stays / Hotels</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {result?.total ?? 0} hotel vendor{(result?.total ?? 0) !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link to="/admin/hotels_/$id" params={{ id: 'new' }}>
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Hotel Stay
          </Button>
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <DataTable
          data={hotels}
          columns={columns as any}
          total={result?.total ?? 0}
          page={page}
          pageSize={pageSize}
          totalPages={result?.totalPages ?? 1}
          isLoading={isLoading}
          searchPlaceholder="Search hotel name or city..."
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          onSearch={(s) => { setSearch(s); setPage(1) }}
          onSort={handleSort}
          onRefresh={() => qc.invalidateQueries({ queryKey: ['hotels_list'] })}
          onExportCSV={handleExport}
          filterComponent={filters}
          emptyMessage="No stays found."
          bulkActions={[
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
            <AlertDialogTitle>Delete Hotel Stay?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this hotel stay vendor? This will also delete all rooms associated with this stay.
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
