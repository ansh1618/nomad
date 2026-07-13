import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  IndianRupee,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
} from 'lucide-react'
import type { Customer } from '@/types/supabase'
import { DataTable } from '@/components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'

export const Route = createFileRoute('/admin/customers')({
  component: CustomersPage,
})

async function getCustomers(params: {
  page: number
  pageSize: number
  search?: string
}) {
  const { page, pageSize, search } = params
  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return {
    data: (data ?? []) as Customer[],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

async function getCustomerStats() {
  const { data, error } = await supabase
    .from('customers')
    .select('total_bookings, total_spent')

  if (error) return { total: 0, totalSpent: 0, repeatCustomers: 0 }
  const total = data?.length ?? 0
  const totalSpent = data?.reduce((s, c) => s + (c.total_spent ?? 0), 0) ?? 0
  const repeatCustomers = data?.filter((c) => (c.total_bookings ?? 0) > 1).length ?? 0
  return { total, totalSpent, repeatCustomers }
}

function CustomersPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [search, setSearch] = useState('')

  const { data: result, isLoading } = useQuery({
    queryKey: ['customers_list', page, pageSize, search],
    queryFn: () => getCustomers({ page, pageSize, search }),
    placeholderData: (prev) => prev,
  })

  const { data: stats } = useQuery({
    queryKey: ['customer_stats'],
    queryFn: getCustomerStats,
  })

  const customers = result?.data ?? []

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'name',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-semibold">{row.original.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{row.original.phone}</p>
          </div>
          {row.original.email && (
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground truncate max-w-[160px]">{row.original.email}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'total_bookings',
      header: 'Bookings',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-primary">{row.original.total_bookings ?? 0}</span>
          {(row.original.total_bookings ?? 0) > 1 && (
            <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px] font-bold px-1.5">
              Repeat
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'total_spent',
      header: 'Total Spent',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm font-semibold">
          <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
          {(row.original.total_spent ?? 0).toLocaleString('en-IN')}
        </div>
      ),
    },
    {
      accessorKey: 'last_booking_at',
      header: 'Last Booking',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {row.original.last_booking_at
            ? new Date(row.original.last_booking_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '—'}
        </div>
      ),
    },
    {
      accessorKey: 'referral_source',
      header: 'Source',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.referral_source ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Joined',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
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
          <h1 className="text-2xl font-bold font-poppins">Customers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {result?.total ?? 0} total customers
          </p>
        </div>
      </motion.div>

      {stats && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4"
        >
          <div className="bg-white rounded-xl border border-[#E4E2DA] p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-poppins">{stats.total.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground">Total Customers</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E4E2DA] p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#C8A96A]/10 flex items-center justify-center">
              <IndianRupee className="h-5 w-5 text-[#C8A96A]" />
            </div>
            <div>
              <p className="text-2xl font-bold font-poppins">
                ₹{stats.totalSpent >= 100000
                  ? `${(stats.totalSpent / 100000).toFixed(1)}L`
                  : stats.totalSpent.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E4E2DA] p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold font-poppins">{stats.repeatCustomers}</p>
              <p className="text-xs text-muted-foreground">Repeat Customers</p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <DataTable
          data={customers}
          columns={columns}
          total={result?.total ?? 0}
          page={page}
          pageSize={pageSize}
          totalPages={result?.totalPages ?? 1}
          isLoading={isLoading}
          searchPlaceholder="Search by name, phone, or email..."
          onPageChange={setPage}
          onPageSizeChange={() => {}}
          onSearch={(s) => { setSearch(s); setPage(1) }}
          onSort={() => {}}
          emptyMessage="No customers yet. Customers appear here after their first booking."
        />
      </motion.div>
    </div>
  )
}
