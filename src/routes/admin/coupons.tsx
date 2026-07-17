import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, exportToCSV } from '@/components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { getCoupons, createCoupon, deleteCoupon } from '@/lib/queries/admin'
import { getPublishedDestinations } from '@/lib/queries/destinations'
import type { Coupon } from '@/types/supabase'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Calendar,
  Loader2,
  TicketPercent,
} from 'lucide-react'

export const Route = createFileRoute('/admin/coupons')({
  component: CouponsPage,
})

type CouponWithJoins = Coupon & {
  destinations?: { name: string }
}

function CouponsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [open, setOpen] = useState(false)

  // Form states for new coupon
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('FLAT')
  const [discountValue, setDiscountValue] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [maxDiscount, setMaxDiscount] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [maxRedemptions, setMaxRedemptions] = useState('')
  const [destId, setDestId] = useState('')

  const { data: result, isLoading } = useQuery({
    queryKey: ['coupons_list', page, pageSize, search, sortBy, sortDir],
    queryFn: () => getCoupons({ page, pageSize, search, sortBy, sortDir }),
    placeholderData: (prev) => prev,
  })

  const { data: destinations = [] } = useQuery({
    queryKey: ['destinations_dropdown'],
    queryFn: getPublishedDestinations,
  })

  const coupons: CouponWithJoins[] = (result?.data ?? []) as CouponWithJoins[]

  const createMutation = useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons_list'] })
      toast.success('Coupon configured successfully')
      setOpen(false)
      // Reset form
      setCode('')
      setDiscountValue('')
      setMinOrder('')
      setMaxDiscount('')
      setValidFrom('')
      setValidUntil('')
      setMaxRedemptions('')
      setDestId('')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons_list'] })
      toast.success('Coupon deleted successfully')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !discountValue) {
      toast.error('Code and Value are required')
      return
    }

    createMutation.mutate({
      code: code.toUpperCase().trim(),
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      min_order_amount: minOrder ? parseFloat(minOrder) : 0,
      max_discount_amount: maxDiscount ? parseFloat(maxDiscount) : null,
      valid_from: validFrom ? new Date(validFrom).toISOString() : new Date().toISOString(),
      valid_until: validUntil ? new Date(validUntil).toISOString() : null,
      max_redemptions: maxRedemptions ? parseInt(maxRedemptions) : null,
      destination_id: destId || null,
      is_active: true,
      current_redemptions: 0,
      per_user_limit: 1,
    } as any)
  }

  const handleSort = useCallback((by: string, dir: 'asc' | 'desc') => {
    setSortBy(by)
    setSortDir(dir)
  }, [])

  const handleExport = () => {
    exportToCSV(
      coupons.map((c) => ({
        code: c.code,
        discount_type: c.discount_type,
        discount_value: c.discount_value,
        min_order: c.min_order_amount,
        max_discount: c.max_discount_amount ?? '',
        valid_from: c.valid_from,
        valid_until: c.valid_until ?? '',
        max_redemptions: c.max_redemptions ?? '',
        current_redemptions: c.current_redemptions,
      })),
      'coupons'
    )
  }

  const columns: ColumnDef<CouponWithJoins>[] = [
    {
      accessorKey: 'code',
      header: 'Promo Code',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <TicketPercent className="h-4 w-4 text-primary" />
          <span className="font-mono font-bold text-sm tracking-wide uppercase text-primary">
            {row.original.code}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'discount_value',
      header: 'Discount Offer',
      cell: ({ row }) => {
        const c = row.original
        return (
          <Badge className="bg-primary/10 text-primary border-0 font-semibold text-xs">
            {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `₹${c.discount_value} FLAT`}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'min_order_amount',
      header: 'Threshold Rules',
      cell: ({ row }) => {
        const c = row.original
        return (
          <div className="text-xs space-y-0.5">
            <p>Min order: ₹{c.min_order_amount.toLocaleString('en-IN')}</p>
            {c.max_discount_amount && (
              <p className="text-muted-foreground">Max Discount: ₹{c.max_discount_amount.toLocaleString('en-IN')}</p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'valid_until',
      header: 'Validity Period',
      cell: ({ row }) => {
        const c = row.original
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {c.valid_until
                ? new Date(c.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Never Expires'}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'current_redemptions',
      header: 'Redemptions',
      cell: ({ row }) => {
        const c = row.original
        return (
          <span className="text-xs font-semibold">
            {c.current_redemptions} {c.max_redemptions ? `/ ${c.max_redemptions}` : 'used'}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      size: 60,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (confirm('Permanently delete this coupon code?')) {
              deleteMutation.mutate(row.original.id)
            }
          }}
          className="h-8 w-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
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
          <h1 className="text-2xl font-bold font-poppins">Coupons</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {result?.total ?? 0} active coupon code{(result?.total ?? 0) !== 1 ? 's' : ''} total
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" /> Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Configure Promo Coupon</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCoupon} className="space-y-4 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Coupon Code</Label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    placeholder="e.g. MONSOON20"
                    className="uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Discount Type</Label>
                  <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'PERCENTAGE' | 'FLAT')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FLAT">FLAT ₹</SelectItem>
                      <SelectItem value="PERCENTAGE">PERCENTAGE %</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label>Discount Value</Label>
                  <Input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    required
                    placeholder="e.g. 500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Min Order (₹)</Label>
                  <Input
                    type="number"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    placeholder="e.g. 5000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Max Discount (₹)</Label>
                  <Input
                    type="number"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Valid From</Label>
                  <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Valid Until</Label>
                  <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Max Redemptions</Label>
                  <Input
                    type="number"
                    value={maxRedemptions}
                    onChange={(e) => setMaxRedemptions(e.target.value)}
                    placeholder="e.g. 100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Destination Scope</Label>
                  <Select value={destId} onValueChange={setDestId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Destinations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Destinations</SelectItem>
                      {destinations.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  Create Coupon
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <DataTable
          data={coupons}
          columns={columns as any}
          total={result?.total ?? 0}
          page={page}
          pageSize={pageSize}
          totalPages={result?.totalPages ?? 1}
          isLoading={isLoading}
          searchPlaceholder="Search coupon code..."
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          onSearch={(s) => { setSearch(s); setPage(1) }}
          onSort={handleSort}
          onRefresh={() => qc.invalidateQueries({ queryKey: ['coupons_list'] })}
          onExportCSV={handleExport}
          emptyMessage="No coupons found."
        />
      </motion.div>
    </div>
  )
}
