'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table'
import { motion, AnimatePresence } from 'motion/react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Loader2,
  FileDown,
  RefreshCw,
  X,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

export interface DataTableProps<TData extends { id: string }> {
  data: TData[]
  columns: ColumnDef<TData>[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  isLoading?: boolean
  searchPlaceholder?: string
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onSearch: (search: string) => void
  onSort?: (sortBy: string, sortDir: 'asc' | 'desc') => void
  onRefresh?: () => void
  onExportCSV?: () => void
  bulkActions?: BulkAction[]
  filterComponent?: React.ReactNode
  emptyMessage?: string
}

export interface BulkAction {
  label: string
  icon?: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline'
  onClick: (selectedIds: string[]) => void | Promise<void>
}

export function DataTable<TData extends { id: string }>({
  data,
  columns,
  total,
  page,
  pageSize,
  totalPages,
  isLoading = false,
  searchPlaceholder = 'Search...',
  onPageChange,
  onPageSizeChange,
  onSearch,
  onSort,
  onRefresh,
  onExportCSV,
  bulkActions,
  filterComponent,
  emptyMessage = 'No records found.',
}: DataTableProps<TData>) {
  const [search, setSearch] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [bulkLoading, setBulkLoading] = useState(false)

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).map((idx) => data[parseInt(idx)]?.id).filter(Boolean),
    [rowSelection, data]
  )

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value)
      onSearch(value)
    },
    [onSearch]
  )

  const handleSortChange = useCallback(
    (newSorting: SortingState) => {
      setSorting(newSorting)
      if (onSort && newSorting.length > 0) {
        onSort(newSorting[0].id, newSorting[0].desc ? 'desc' : 'asc')
      }
    },
    [onSort]
  )

  // Add selection column
  const tableColumns = useMemo<ColumnDef<TData>[]>(() => {
    if (!bulkActions?.length) return columns
    return [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Select row"
          />
        ),
        size: 40,
      },
      ...columns,
    ]
  }, [columns, bulkActions])

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: handleSortChange as React.Dispatch<React.SetStateAction<SortingState>>,
    onRowSelectionChange: setRowSelection,
    state: { sorting, rowSelection },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: totalPages,
    enableRowSelection: !!bulkActions?.length,
  })

  const handleBulkAction = async (action: BulkAction) => {
    if (!selectedIds.length) return
    setBulkLoading(true)
    try {
      await action.onClick(selectedIds)
      setRowSelection({})
    } finally {
      setBulkLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
            {search && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {filterComponent}
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button variant="outline" size="icon" onClick={onRefresh} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          {onExportCSV && (
            <Button variant="outline" size="sm" onClick={onExportCSV}>
              <FileDown className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && bulkActions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg"
          >
            <Badge variant="secondary" className="font-medium">
              {selectedIds.length} selected
            </Badge>
            <div className="flex items-center gap-2">
              {bulkActions.map((action, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant={action.variant ?? 'outline'}
                  onClick={() => handleBulkAction(action)}
                  disabled={bulkLoading}
                >
                  {bulkLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRowSelection({})}
              className="ml-auto"
            >
              Clear selection
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total.toLocaleString()} records
        </span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50, 100].map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-soft">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/30 hover:bg-muted/30">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    className="font-semibold text-foreground/70 text-xs uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? 'flex items-center gap-1 cursor-pointer select-none hover:text-foreground transition-colors'
                            : ''
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="ml-1 opacity-50">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-48 text-center">
                  <p className="text-muted-foreground text-sm">{emptyMessage}</p>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  className="transition-colors hover:bg-muted/20 data-[state=selected]:bg-primary/5"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(1)}
            disabled={page === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, totalPages - 4))
            const p = start + i
            if (p > totalPages) return null
            return (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8 text-sm"
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            )
          })}

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// CSV EXPORT UTILITY
// ==========================================
export function exportToCSV<T extends Record<string, unknown>>(data: T[], filename: string): void {
  if (!data.length) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h]
          if (val === null || val === undefined) return ''
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str
        })
        .join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
