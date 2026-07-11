import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { DataTable, exportToCSV } from '@/components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { getCustomers } from '@/lib/queries/admin'
import type { SiteUser } from '@/types/supabase'
import {
  Users,
  Compass,
  CreditCard,
  Mail,
  Phone,
} from 'lucide-react'

export const Route = createFileRoute('/admin/customers')({
  component: CustomersPage,
})

function CustomersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const { data: result, isLoading } = useQuery({
    queryKey: ['customers_list', page, pageSize, search, sortBy, sortDir],
    queryFn: () => getCustomers({ page, pageSize, search, sortBy, sortDir }),
    placeholderData: (prev) => prev,
  })

  const customers = result?.data ?? []

  const handleSort = useCallback((by: string, dir: 'asc' | 'desc') => {
    setSortBy(by)
    setSortDir(dir)
  }, [])

  const handleExport = () => {
    exportToCSV(
      customers.map((c) => ({
        name: c.full_name,
        email: c.email ?? '',
        phone: c.phone,
        city: c.city ?? '',
        state: c.state ?? '',
        wallet_balance: c.wallet_balance,
        created_at: c.created_at,
      })),
      'customers'
    )
  }

  const columns: ColumnDef<SiteUser>[] = [
    {
      accessorKey: 'full_name',
      header: 'Explorer Customer',
      cell: ({ row }) => {
        const c = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {c.full_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm">{c.full_name}</p>
              {c.email && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {c.email}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone Contact',
      cell: ({ row }) => (
        <span className="text-sm font-mono text-muted-foreground flex items-center gap-1">
          <Phone className="h-3 w-3" />
          {row.original.phone}
        </span>
      ),
    },
    {
      accessorKey: 'wallet_balance',
      header: 'Wallet Balance',
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-emerald-600">
          ₹{row.original.wallet_balance.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      accessorKey: 'city',
      header: 'Location',
      cell: ({ row }) => {
        const c = row.original
        return (
          <span className="text-xs text-muted-foreground">
            {c.city ? `${c.city}${c.state ? `, ${c.state}` : ''}` : '—'}
          </span>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Joined Date',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
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
          <h1 className="text-2xl font-bold font-poppins">Customers CRM</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {result?.total ?? 0} registered customer{(result?.total ?? 0) !== 1 ? 's' : ''} total
          </p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <DataTable
          data={customers}
          columns={columns}
          total={result?.total ?? 0}
          page={page}
          pageSize={pageSize}
          totalPages={result?.totalPages ?? 1}
          isLoading={isLoading}
          searchPlaceholder="Search customer profiles..."
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          onSearch={(s) => { setSearch(s); setPage(1) }}
          onSort={handleSort}
          onRefresh={() => qc.invalidateQueries({ queryKey: ['customers_list'] })}
          onExportCSV={handleExport}
          emptyMessage="No customers profiles found."
        />
      </motion.div>
    </div>
  )
}
