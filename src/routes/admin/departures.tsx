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
  getDepartures,
  deleteDeparture,
  cancelDeparture,
  closeDeparture,
  bulkDeleteDepartures,
  bulkChangeVisibilityDepartures,
} from '@/lib/queries/departures'
import type { Departure } from '@/types/supabase'
import { toast } from 'sonner'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  Eye,
  XCircle,
  CheckCircle,
  Loader2,
  Users,
  Zap,
  LayoutGrid,
  Table as TableIcon,
  EyeOff,
  Edit3,
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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RecurringDepartureModal } from '@/components/admin/RecurringDepartureModal'
import { DepartureCalendarView } from '@/components/admin/DepartureCalendarView'
import { BulkEditDeparturesModal } from '@/components/admin/BulkEditDeparturesModal'

export const Route = createFileRoute('/admin/departures')({
  component: DeparturesPage,
})

const STATUS_BADGE: Record<string, string> = {
  UPCOMING: 'bg-primary/10 text-primary',
  ONGOING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  SOLD_OUT: 'bg-amber-100 text-amber-700',
  CLOSED: 'bg-gray-100 text-gray-700',
}

type DepartureWithJoins = Departure & {
  journeys?: { id: string; name: string; slug: string }
  trip_captains?: { id: string; full_name: string }
  buses?: { id: string; name: string; total_seats: number }
  hotels?: { id: string; name: string }
}

function DeparturesPage() {
  const qc = useQueryClient()
  const [viewMode, setViewMode] = useState<'TABLE' | 'CALENDAR'>('TABLE')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('departure_date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState('')
  const [journeyFilter, setJourneyFilter] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  // Modals state
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false)
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false)
  const [selectedBulkIds, setSelectedBulkIds] = useState<string[]>([])

  const { data: result, isLoading } = useQuery({
    queryKey: ['departures_list', page, pageSize, search, sortBy, sortDir, statusFilter, journeyFilter],
    queryFn: () =>
      getDepartures({
        page,
        pageSize,
        search,
        sortBy,
        sortDir,
        status: statusFilter || undefined,
        journeyId: journeyFilter || undefined,
      }),
    placeholderData: (prev) => prev,
  })

  const { data: journeys = [] } = useQuery({
    queryKey: ['journeys_dropdown'],
    queryFn: async () => {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.from('journeys').select('id, name').order('name')
      return data ?? []
    },
  })

  const departures: DepartureWithJoins[] = (result?.data ?? []) as DepartureWithJoins[]

  const deleteMutation = useMutation({
    mutationFn: deleteDeparture,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departures_list'] })
      toast.success('Departure date deleted successfully')
      setDeleteId(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelDeparture(cancelId!, cancelReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departures_list'] })
      toast.success('Departure date marked as cancelled')
      setCancelId(null)
      setCancelReason('')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const closeMutation = useMutation({
    mutationFn: closeDeparture,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departures_list'] })
      toast.success('Departure marked as closed')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteDepartures,
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: ['departures_list'] })
      toast.success(`${ids.length} departure${ids.length !== 1 ? 's' : ''} deleted`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const undoBatchMutation = useMutation({
    mutationFn: async () => {
      if (!lastBatch?.batchId) throw new Error('No recent generation batch found to undo')
      return undoLastGenerationBatch(lastBatch.batchId)
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['departures_list'] })
      refetchLastBatch()
      toast.success(`Successfully rolled back last batch (${res.deletedCount} new departures removed).`)
      setIsUndoConfirmOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSort = useCallback((by: string, dir: 'asc' | 'desc') => {
    setSortBy(by)
    setSortDir(dir)
  }, [])

  const handleExport = () => {
    exportToCSV(
      departures.map((d) => ({
        journey: d.journeys?.name ?? '',
        departure_date: d.departure_date,
        return_date: d.return_date,
        base_price: d.base_price,
        dynamic_price: d.dynamic_price ?? '',
        available_seats: d.available_seats,
        booked_seats: d.booked_seats ?? 0,
        status: d.status,
        captain: d.trip_captains?.full_name ?? '',
        bus: d.buses?.name ?? '',
      })),
      'departures'
    )
  }

  const columns: ColumnDef<DepartureWithJoins>[] = [
    {
      accessorKey: 'departure_date',
      header: 'Departure Date',
      cell: ({ row }) => {
        const d = row.original
        return (
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-sm">
                {new Date(d.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-xs text-muted-foreground">
                Return: {new Date(d.return_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'journeys.name',
      header: 'Package / Journey',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-sm">{row.original.journeys?.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">Base Price: ₹{row.original.base_price.toLocaleString('en-IN')}</p>
        </div>
      ),
    },
    {
      accessorKey: 'trip_captains.full_name',
      header: 'Captain / Guide',
      cell: ({ row }) => <span className="text-sm">{row.original.trip_captains?.full_name ?? '—'}</span>,
    },
    {
      accessorKey: 'available_seats',
      header: 'Seats (Booked / Total)',
      cell: ({ row }) => {
        const d = row.original
        const total = d.total_seats
        const booked = d.booked_seats ?? 0
        return (
          <div className="space-y-1">
            <span className="text-sm font-medium flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              {booked} / {total}
            </span>
            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.min((booked / Math.max(1, total)) * 100, 100)}%` }}
              />
            </div>
          </div>
        )
      },
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
      accessorKey: 'is_visible',
      header: 'Visible',
      cell: ({ row }) => (
        <Switch
          checked={row.original.is_visible}
          onCheckedChange={async (checked) => {
            const { updateDeparture } = await import('@/lib/queries/departures')
            await updateDeparture(row.original.id, { is_visible: checked })
            qc.invalidateQueries({ queryKey: ['departures_list'] })
            toast.success(`Departure visibility set to ${checked ? 'visible' : 'hidden'}`)
          }}
        />
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
                <Link to="/admin/departures/$id" params={{ id: d.id }}>
                  <Pencil className="h-3.5 w-3.5 mr-2" /> Edit Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`/packages/${d.journeys?.slug}`} target="_blank" rel="noreferrer">
                  <Eye className="h-3.5 w-3.5 mr-2" /> Preview
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {d.status !== 'CLOSED' && d.status !== 'CANCELLED' && (
                <DropdownMenuItem onClick={() => closeMutation.mutate(d.id)}>
                  <CheckCircle className="h-3.5 w-3.5 mr-2 text-emerald-600" /> Close Reg.
                </DropdownMenuItem>
              )}
              {d.status !== 'CANCELLED' && (
                <DropdownMenuItem onClick={() => setCancelId(d.id)}>
                  <XCircle className="h-3.5 w-3.5 mr-2 text-destructive" /> Cancel Trip
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

  const filters = (
    <div className="flex items-center gap-2">
      <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1) }}>
        <SelectTrigger className="w-36 h-9 rounded-xl">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="ALL">All Status</SelectItem>
          <SelectItem value="UPCOMING">Upcoming</SelectItem>
          <SelectItem value="ONGOING">Ongoing</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
          <SelectItem value="SOLD_OUT">Sold Out</SelectItem>
          <SelectItem value="CLOSED">Closed</SelectItem>
          <SelectItem value="CANCELLED">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <Select value={journeyFilter} onValueChange={(v) => { setJourneyFilter(v === 'ALL' ? '' : v); setPage(1) }}>
        <SelectTrigger className="w-44 h-9 rounded-xl">
          <SelectValue placeholder="All Packages" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="ALL">All Packages</SelectItem>
          {journeys.map((j) => (
            <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header & CRM Controls */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-border shadow-xs"
      >
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground flex items-center gap-2">
            Departures Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {result?.total ?? 0} scheduled departures total across active packages
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
            <Button
              type="button"
              variant={viewMode === 'TABLE' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('TABLE')}
              className="h-8 px-3 rounded-lg text-xs font-semibold"
            >
              <TableIcon className="h-3.5 w-3.5 mr-1.5" /> Table
            </Button>
            <Button
              type="button"
              variant={viewMode === 'CALENDAR' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('CALENDAR')}
              className="h-8 px-3 rounded-lg text-xs font-semibold"
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1.5" /> Calendar
            </Button>
          </div>

          {/* Generate Recurring Departures Modal Trigger */}
          <Button
            type="button"
            onClick={() => setIsRecurringModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-9 px-4 rounded-xl shadow-xs text-xs"
          >
            <Zap className="h-3.5 w-3.5 mr-1.5" /> Generate Departures
          </Button>

          {/* Add Single Departure */}
          <Link to="/admin/departures/$id" params={{ id: 'new' }}>
            <Button className="h-9 px-4 rounded-xl text-xs gap-1.5 bg-primary text-white">
              <Plus className="h-3.5 w-3.5" /> Single Date
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Main View Area */}
      {viewMode === 'TABLE' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <DataTable
            data={departures}
            columns={columns}
            total={result?.total ?? 0}
            page={page}
            pageSize={pageSize}
            totalPages={result?.totalPages ?? 1}
            isLoading={isLoading}
            searchPlaceholder="Search locations..."
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
            onSearch={(s) => { setSearch(s); setPage(1) }}
            onSort={handleSort}
            onRefresh={() => {
              qc.invalidateQueries({ queryKey: ['departures_list'] })
              refetchLastBatch()
            }}
            onExportCSV={handleExport}
            filterComponent={filters}
            emptyMessage="No departures found."
            bulkActions={[
              {
                label: 'Bulk Edit',
                icon: <Edit3 className="h-3.5 w-3.5 mr-1.5" />,
                onClick: (ids) => {
                  setSelectedBulkIds(ids)
                  setIsBulkEditModalOpen(true)
                },
              },
              {
                label: 'Publish (Make Visible)',
                icon: <Eye className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />,
                onClick: async (ids) => {
                  await bulkChangeVisibilityDepartures(ids, true)
                  qc.invalidateQueries({ queryKey: ['departures_list'] })
                  toast.success(`Published ${ids.length} selected departures!`)
                },
              },
              {
                label: 'Hide (Make Draft)',
                icon: <EyeOff className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />,
                onClick: async (ids) => {
                  await bulkChangeVisibilityDepartures(ids, false)
                  qc.invalidateQueries({ queryKey: ['departures_list'] })
                  toast.success(`Hidden ${ids.length} selected departures!`)
                },
              },
              {
                label: 'Delete Selected',
                icon: <Trash2 className="h-3.5 w-3.5 mr-1.5" />,
                variant: 'destructive',
                onClick: (ids) => bulkDeleteMutation.mutateAsync(ids),
              },
            ]}
          />
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <DepartureCalendarView />
        </motion.div>
      )}

      {/* RECURRING GENERATOR MODAL */}
      <RecurringDepartureModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['departures_list'] })
          refetchLastBatch()
        }}
      />

      {/* BULK EDIT MODAL */}
      <BulkEditDeparturesModal
        isOpen={isBulkEditModalOpen}
        selectedIds={selectedBulkIds}
        onClose={() => setIsBulkEditModalOpen(false)}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['departures_list'] })
          setSelectedBulkIds([])
        }}
      />


      {/* Cancel Trip Dialog */}
      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Trip Departure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this trip? This will mark status as CANCELLED and release seat inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label className="text-xs uppercase font-semibold text-muted-foreground">Cancellation Reason</Label>
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Inclement weather / low registration"
              className="mt-1.5 rounded-xl h-11"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Keep Trip</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white rounded-xl"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending || !cancelReason.trim()}
            >
              {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Cancel Trip
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Single Departure Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Departure Date?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this specific departure date row. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white rounded-xl"
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
