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
  X,
  ArrowUpRight,
  Eye,
} from 'lucide-react'
import type { Customer } from '@/types/supabase'
import { DataTable } from '@/components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const { data: result, isLoading } = useQuery({
    queryKey: ['customers_list', page, pageSize, search],
    queryFn: () => getCustomers({ page, pageSize, search }),
    placeholderData: (prev) => prev,
  })

  const { data: stats } = useQuery({
    queryKey: ['customer_stats'],
    queryFn: getCustomerStats,
  })

  // Queries for the selected customer's profile drawer
  const { data: customerBookings = [] } = useQuery({
    queryKey: ['customer_bookings', selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer?.id) return []
      const { data } = await supabase
        .from('bookings')
        .select('*, departures(departure_date, journeys(name))')
        .eq('customer_id', selectedCustomer.id)
        .order('created_at', { ascending: false })
      return data ?? []
    },
    enabled: !!selectedCustomer?.id,
  })

  const { data: customerPayments = [] } = useQuery({
    queryKey: ['customer_payments', selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer?.id) return []
      const { data } = await supabase
        .from('payments')
        .select('*, bookings!inner(booking_id, customer_id)')
        .eq('bookings.customer_id', selectedCustomer.id)
        .order('created_at', { ascending: false })
      return data ?? []
    },
    enabled: !!selectedCustomer?.id,
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
    {
      id: 'actions',
      header: '',
      size: 80,
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedCustomer(row.original)}
          className="text-xs font-semibold h-8 rounded-lg"
        >
          View Profile
        </Button>
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
          <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-poppins">{stats.total.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground">Total Customers</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
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

          <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
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

      {/* Slide-out CRM Customer Profile Overlay Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setSelectedCustomer(null)} />
          
          <div className="relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col border-l animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10">
              <div>
                <h3 className="font-bold font-poppins text-base text-primary">{selectedCustomer.name}</h3>
                <p className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">Customer CRM file</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(null)} className="h-8 w-8 rounded-lg">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl h-10 border mb-4">
                  <TabsTrigger value="profile" className="rounded-lg text-xs font-semibold py-1.5 font-poppins">Overview</TabsTrigger>
                  <TabsTrigger value="bookings" className="rounded-lg text-xs font-semibold py-1.5 font-poppins">Bookings ({selectedCustomer.total_bookings ?? 0})</TabsTrigger>
                  <TabsTrigger value="payments" className="rounded-lg text-xs font-semibold py-1.5 font-poppins">Payments Ledger</TabsTrigger>
                </TabsList>

                {/* OVERVIEW PANEL */}
                <TabsContent value="profile" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
                  <div className="bg-muted/10 border p-4 rounded-xl space-y-2 text-xs text-muted-foreground leading-relaxed">
                    <div className="flex justify-between border-b pb-1.5">
                      <span className="font-bold text-foreground">Phone Contact:</span>
                      <a href={`tel:${selectedCustomer.phone}`} className="text-primary hover:underline font-semibold flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> {selectedCustomer.phone}
                      </a>
                    </div>
                    {selectedCustomer.email && (
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="font-bold text-foreground">Email Address:</span>
                        <a href={`mailto:${selectedCustomer.email}`} className="text-primary hover:underline font-semibold flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" /> {selectedCustomer.email}
                        </a>
                      </div>
                    )}
                    {selectedCustomer.whatsapp && (
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="font-bold text-foreground">WhatsApp:</span>
                        <span>{selectedCustomer.whatsapp}</span>
                      </div>
                    )}
                    {selectedCustomer.gender && (
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="font-bold text-foreground">Gender category:</span>
                        <span>{selectedCustomer.gender}</span>
                      </div>
                    )}
                    {selectedCustomer.date_of_birth && (
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="font-bold text-foreground">Date of Birth:</span>
                        <span>{new Date(selectedCustomer.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    )}
                    {selectedCustomer.city && (
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="font-bold text-foreground">Location:</span>
                        <span>{selectedCustomer.city}, {selectedCustomer.state || 'N/A'}</span>
                      </div>
                    )}
                    {selectedCustomer.address && (
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="font-bold text-foreground">Billing address:</span>
                        <span>{selectedCustomer.address}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-bold text-foreground">First Joined:</span>
                      <span>{new Date(selectedCustomer.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 border rounded-xl bg-emerald-50 text-emerald-700">
                      <p className="font-bold text-[10px] uppercase tracking-wider text-emerald-600">Total Spent</p>
                      <p className="text-xl font-bold font-poppins mt-1">₹{(selectedCustomer.total_spent ?? 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="p-3 border rounded-xl bg-primary/5 text-primary">
                      <p className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Booking Count</p>
                      <p className="text-xl font-bold font-poppins mt-1">{selectedCustomer.total_bookings ?? 0} departures</p>
                    </div>
                  </div>
                </TabsContent>

                {/* BOOKINGS PANEL */}
                <TabsContent value="bookings" className="space-y-3 focus-visible:outline-none focus-visible:ring-0">
                  {customerBookings.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl">
                      No active bookings found.
                    </div>
                  ) : (
                    customerBookings.map((b: any) => (
                      <div key={b.id} className="p-3 border rounded-xl bg-white hover:bg-muted/10 transition-colors flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-primary">{b.booking_id ?? b.id.slice(0, 8).toUpperCase()}</span>
                            <Badge className="text-[9px] font-bold border-0 bg-primary/10 text-primary">{b.status}</Badge>
                          </div>
                          <p className="font-semibold truncate text-foreground">{(b.departures as any)?.journeys?.name ?? 'Trip'}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Departs: {new Date((b.departures as any)?.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5">
                          <Link to="/admin/bookings/$id" params={{ id: b.id }} onClick={() => setSelectedCustomer(null)}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                {/* PAYMENTS PANEL */}
                <TabsContent value="payments" className="space-y-3 focus-visible:outline-none focus-visible:ring-0">
                  {customerPayments.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl">
                      No transaction logs recorded.
                    </div>
                  ) : (
                    customerPayments.map((p: any) => (
                      <div key={p.id} className="p-3 border rounded-xl bg-white flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-bold text-foreground">₹{p.amount.toLocaleString('en-IN')}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {p.payment_type} via {p.payment_gateway} ({p.payment_method || 'UPI'})
                          </p>
                          {p.gateway_payment_id && (
                            <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{p.gateway_payment_id}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <Badge className="text-[9px] font-bold border-0 bg-emerald-50 text-emerald-700">{p.status}</Badge>
                          <p className="text-[9px] text-muted-foreground mt-1">
                            {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
