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
import { getBuses, deleteBus, bulkDeleteBuses } from '@/lib/queries/hotels-buses'
import type { Bus } from '@/types/supabase'
import { toast } from 'sonner'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Bus as BusIcon,
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

export const Route = createFileRoute('/admin/buses')({
  component: BusesPage,
})

function BusesPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [activeFilter, setActiveFilter] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: result, isLoading } = useQuery({
    queryKey: ['buses_list', page, pageSize, search, sortBy, sortDir, activeFilter],
    queryFn: () =>
      getBuses({
        page,
        pageSize,
        search,
        sortBy,
        sortDir,
        isActive: activeFilter === 'ACTIVE' ? true : activeFilter === 'INACTIVE' ? false : undefined,
      }),
    placeholderData: (prev) => prev,
  })

  const buses = result?.data ?? []

  const deleteMutation = useMutation({
    mutationFn: deleteBus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['buses_list'] })
      toast.success('Vehicle configuration deleted successfully')
      setDeleteId(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteBuses,
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: ['buses_list'] })
      toast.success(`${ids.length} vehicle${ids.length !== 1 ? 's' : ''} deleted`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSort = useCallback((by: string, dir: 'asc' | 'desc') => {
    setSortBy(by)
    setSortDir(dir)
  }, [])

  const handleExport = () => {
    exportToCSV(
      buses.map((b) => ({
        name: b.name,
        registration_number: b.registration_number,
        bus_type: b.bus_type,
        total_seats: b.total_seats,
        driver_name: b.driver_name ?? '',
        driver_phone: b.driver_phone ?? '',
        is_active: b.is_active,
      })),
      'vehicles'
    )
  }

  const columns: ColumnDef<Bus>[] = [
    {
      accessorKey: 'name',
      header: 'Vehicle',
      cell: ({ row }) => {
        const b = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <BusIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">{b.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{b.registration_number}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'bus_type',
      header: 'Layout Type',
      cell: ({ row }) => <span className="text-sm font-semibold uppercase">{row.original.bus_type}</span>,
    },
    {
      accessorKey: 'total_seats',
      header: 'Capacity',
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.total_seats} seats</span>,
    },
    {
      accessorKey: 'driver_name',
      header: 'Driver',
      cell: ({ row }) => {
        const b = row.original
        return b.driver_name ? (
          <div>
            <p className="text-sm">{b.driver_name}</p>
            <p className="text-xs text-muted-foreground">{b.driver_phone}</p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No driver assigned</span>
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
        const b = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild>
                <Link to="/admin/buses/$id" params={{ id: b.id }}>
                  <Pencil className="h-3.5 w-3.5 mr-2" /> Edit layout
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteId(b.id)}
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
          <h1 className="text-2xl font-bold font-poppins">Vehicles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {result?.total ?? 0} vehicle configuration{(result?.total ?? 0) !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link to="/admin/buses/$id" params={{ id: 'new' }}>
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" /> Configure Vehicle
          </Button>
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <DataTable
          data={buses}
          columns={columns as any}
          total={result?.total ?? 0}
          page={page}
          pageSize={pageSize}
          totalPages={result?.totalPages ?? 1}
          isLoading={isLoading}
          searchPlaceholder="Search vehicles..."
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          onSearch={(s) => { setSearch(s); setPage(1) }}
          onSort={handleSort}
          onRefresh={() => qc.invalidateQueries({ queryKey: ['buses_list'] })}
          onExportCSV={handleExport}
          filterComponent={filters}
          emptyMessage="No vehicles configured."
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
            <AlertDialogTitle>Delete Vehicle Layout?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this vehicle layout? All departure maps linked to this layout will need re-configuring.
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
