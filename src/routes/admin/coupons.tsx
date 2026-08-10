import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { getCoupons, createCoupon, deleteCoupon, getCouponUsagesAndAnalytics } from '@/lib/queries/admin'
import { getPublishedDestinations } from '@/lib/queries/destinations'
import type { Coupon, CouponUsageItem } from '@/types/supabase'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Calendar,
  Loader2,
  TicketPercent,
  TrendingUp,
  DollarSign,
  Users,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Tag,
  ShoppingBag,
  MapPin
} from 'lucide-react'

export const Route = createFileRoute('/admin/coupons')({
  component: CouponsPage,
})

type CouponWithJoins = Coupon & {
  destinations?: { name: string }
}

function CouponsPage() {
  const qc = useQueryClient()
  
  // Tabs: 'analytics' | 'usages' | 'coupons'
  const [activeTab, setActiveTab] = useState<'analytics' | 'usages' | 'coupons'>('analytics')

  // Pagination & Filter States
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [selectedCouponFilter, setSelectedCouponFilter] = useState<string>('ALL')
  const [selectedJourneyFilter, setSelectedJourneyFilter] = useState<string>('ALL')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL')

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

  // 1. Fetch Configured Coupons
  const { data: couponsResult, isLoading: loadingCoupons } = useQuery({
    queryKey: ['coupons_list', page, pageSize, search],
    queryFn: () => getCoupons({ page, pageSize, search, sortBy: 'created_at', sortDir: 'desc' }),
    placeholderData: (prev) => prev,
  })

  // 2. Fetch Coupon Usages & Analytics
  const { data: analyticsResult, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['coupon_usages_analytics', selectedCouponFilter, selectedJourneyFilter, selectedStatusFilter, search, page, pageSize],
    queryFn: () => getCouponUsagesAndAnalytics({
      couponCode: selectedCouponFilter,
      journeyId: selectedJourneyFilter,
      bookingStatus: selectedStatusFilter,
      search,
      page,
      pageSize
    }),
    placeholderData: (prev) => prev,
  })

  // 3. Fetch Destinations for filter dropdown
  const { data: destinations = [] } = useQuery({
    queryKey: ['destinations_dropdown'],
    queryFn: getPublishedDestinations,
  })

  const coupons: CouponWithJoins[] = (couponsResult?.data ?? []) as CouponWithJoins[]
  const stuti500Coupon = coupons.find(c => c.code?.toUpperCase() === 'STUTI500')

  const createMutation = useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons_list'] })
      qc.invalidateQueries({ queryKey: ['coupon_usages_analytics'] })
      toast.success('Coupon configured successfully')
      setOpen(false)
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
      qc.invalidateQueries({ queryKey: ['coupon_usages_analytics'] })
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
      destination_id: destId === 'ALL' ? null : destId || null,
      is_active: true,
      current_redemptions: 0,
      per_user_limit: 1,
    } as any)
  }

  const handleExportUsagesCSV = () => {
    const usages = analyticsResult?.usages ?? []
    exportToCSV(
      usages.map((u) => ({
        customer_name: u.customer_name,
        customer_phone: u.customer_phone,
        customer_email: u.customer_email,
        coupon_code: u.coupon_code,
        journey_name: u.journey_name,
        departure_date: u.departure_date,
        original_amount: `₹${u.original_amount.toLocaleString('en-IN')}`,
        discount_amount: `-₹${u.discount_amount.toLocaleString('en-IN')}`,
        final_amount: `₹${u.final_amount.toLocaleString('en-IN')}`,
        used_at: new Date(u.used_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        booking_id: u.booking_code || u.booking_id,
        status: u.status,
      })),
      'coupon_usage_analytics'
    )
  }

  // Columns for Individual Usages Table
  const usageColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'customer_name',
      header: 'Customer',
      cell: ({ row }) => {
        const u = row.original
        return (
          <div>
            <p className="font-bold text-sm text-[#102A43]">{u.customer_name}</p>
            <p className="text-xs text-muted-foreground">{u.customer_phone} · {u.customer_email}</p>
          </div>
        )
      },
    },
    {
      accessorKey: 'coupon_code',
      header: 'Coupon',
      cell: ({ row }) => (
        <Badge className="bg-[#102A43] text-[#C8A96A] font-mono font-bold text-xs uppercase px-2.5 py-1">
          {row.original.coupon_code}
        </Badge>
      ),
    },
    {
      accessorKey: 'journey_name',
      header: 'Trip / Journey',
      cell: ({ row }) => {
        const u = row.original
        return (
          <div>
            <p className="font-semibold text-xs text-[#102A43]">{u.journey_name}</p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {u.departure_date}
            </p>
          </div>
        )
      },
    },
    {
      accessorKey: 'original_amount',
      header: 'Pricing & Discount',
      cell: ({ row }) => {
        const u = row.original
        return (
          <div className="text-xs space-y-0.5">
            <p className="text-muted-foreground line-through">₹{u.original_amount?.toLocaleString('en-IN')}</p>
            <p className="text-emerald-700 font-semibold">-₹{u.discount_amount?.toLocaleString('en-IN')}</p>
            <p className="font-bold text-[#102A43]">Final: ₹{u.final_amount?.toLocaleString('en-IN')}</p>
          </div>
        )
      },
    },
    {
      accessorKey: 'used_at',
      header: 'Used At & Booking ID',
      cell: ({ row }) => {
        const u = row.original
        return (
          <div className="text-xs space-y-0.5">
            <p className="font-mono text-muted-foreground">{u.booking_code || u.booking_id}</p>
            <p className="text-[11px] text-slate-500">
              {new Date(u.used_at).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )
      },
    },
  ]

  // Columns for Configured Coupons Table
  const couponColumns: ColumnDef<CouponWithJoins>[] = [
    {
      accessorKey: 'code',
      header: 'Promo Code',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <TicketPercent className="h-4 w-4 text-primary" />
          <span className="font-mono font-bold text-sm tracking-wide uppercase text-primary">
            {row.original.code}
          </span>
          {row.original.code?.toUpperCase() === 'STUTI500' && (
            <Badge variant="outline" className="text-[10px] border-emerald-400 bg-emerald-50 text-emerald-800 font-bold">
              Featured STUTI500
            </Badge>
          )}
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
            {c.discount_type === 'PERCENTAGE' || c.discount_type === 'PERCENT'
              ? `${c.discount_value}% OFF`
              : `₹${c.discount_value} FLAT`}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'min_order_amount',
      header: 'Threshold Rules',
      cell: ({ row }) => {
        const c = row.original
        const minVal = c.min_order_amount ?? c.min_amount ?? 0
        return (
          <div className="text-xs space-y-0.5">
            <p>Min order: ₹{minVal.toLocaleString('en-IN')}</p>
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
      accessorKey: 'used_count',
      header: 'Redemptions',
      cell: ({ row }) => {
        const c = row.original
        const used = c.used_count ?? c.current_redemptions ?? 0
        const max = c.max_uses ?? c.max_redemptions
        return (
          <span className="text-xs font-semibold">
            {used} {max ? `/ ${max}` : 'used'}
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

  const totalUses = analyticsResult?.totalUsages ?? 0
  const totalDiscount = analyticsResult?.totalDiscount ?? 0
  const totalRevenue = analyticsResult?.totalRevenue ?? 0
  const revenueBeforeDiscount = analyticsResult?.revenueBeforeDiscount ?? 0
  const avgBookingValue = analyticsResult?.avgBookingValue ?? 0
  const journeyAnalytics = analyticsResult?.journeyAnalytics ?? []

  return (
    <div className="space-y-6 font-poppins">
      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-[#102A43] flex items-center gap-2">
            <TicketPercent className="h-6 w-6 text-emerald-600" /> Coupons & Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure promo codes like <span className="font-mono font-bold text-primary">STUTI500</span> and track real-time redemption analytics across all journeys.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportUsagesCSV} className="gap-2 text-xs">
            <Download className="h-4 w-4" /> Export Usage CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#102A43] text-white hover:bg-[#102A43]/90 gap-1.5 text-xs font-semibold">
                <Plus className="h-4 w-4" /> Add Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display font-bold text-lg text-[#102A43]">
                  Configure Promo Coupon
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCoupon} className="space-y-4 pt-3 text-xs font-poppins">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-slate-700">Coupon Code *</Label>
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      placeholder="e.g. STUTI500"
                      className="uppercase font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-slate-700">Discount Type</Label>
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
                    <Label className="font-semibold text-slate-700">Discount Value *</Label>
                    <Input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      required
                      placeholder="500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-slate-700">Min Order (₹)</Label>
                    <Input
                      type="number"
                      value={minOrder}
                      onChange={(e) => setMinOrder(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-slate-700">Max Discount (₹)</Label>
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
                    <Label className="font-semibold text-slate-700">Valid From</Label>
                    <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-slate-700">Valid Until</Label>
                    <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-slate-700">Max Redemptions</Label>
                    <Input
                      type="number"
                      value={maxRedemptions}
                      onChange={(e) => setMaxRedemptions(e.target.value)}
                      placeholder="Unlimited"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-slate-700">Destination Scope</Label>
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
                  <Button type="submit" disabled={createMutation.isPending} className="bg-[#102A43] text-white">
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                    Create Coupon
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Featured STUTI500 Highlight Card */}
      <div className="bg-gradient-to-r from-[#102A43] via-[#1A365D] to-[#0F2942] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl z-10">
          <div className="flex items-center gap-2">
            <span className="bg-[#C8A96A] text-slate-950 font-mono font-extrabold text-sm px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              STUTI500
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              ✓ ACTIVE ON ALL TRIPS
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
            ₹500 FIXED Discount Code Active
          </h2>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-poppins">
            Customers entering <span className="font-mono font-bold text-[#C8A96A]">STUTI500</span> receive ₹500 discount on package subtotal. Applied before 5% GST calculation.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/10 p-4 rounded-2xl border border-white/15 shrink-0 font-poppins">
          <div>
            <p className="text-[10px] uppercase text-white/60 font-semibold tracking-wider">Total Uses</p>
            <p className="text-lg font-bold text-white">{totalUses}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-white/60 font-semibold tracking-wider">Total Discount</p>
            <p className="text-lg font-bold text-[#C8A96A]">₹{totalDiscount.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-white/60 font-semibold tracking-wider">Bookings</p>
            <p className="text-lg font-bold text-white">{totalUses}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-white/60 font-semibold tracking-wider">Revenue Gen.</p>
            <p className="text-lg font-bold text-emerald-300">₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Overview Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Redemptions</span>
            <Users className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-display text-[#102A43]">{totalUses} Uses</p>
          <p className="text-[11px] text-muted-foreground">{totalUses} completed bookings</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Discount Given</span>
            <Tag className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-display text-amber-600">₹{totalDiscount.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-muted-foreground">Total promotional savings</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Net Revenue Generated</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold font-display text-primary">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-muted-foreground">Before discount: ₹{revenueBeforeDiscount.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Avg. Booking Value</span>
            <ShoppingBag className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold font-display text-purple-700">₹{avgBookingValue.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-muted-foreground">Average revenue per order</p>
        </div>
      </div>

      {/* Main Tab Navigation & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3">
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'analytics' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('analytics')}
              className={activeTab === 'analytics' ? 'bg-[#102A43] text-white text-xs font-bold' : 'text-xs font-semibold'}
            >
              Journey-Wise Analytics
            </Button>
            <Button
              variant={activeTab === 'usages' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('usages')}
              className={activeTab === 'usages' ? 'bg-[#102A43] text-white text-xs font-bold' : 'text-xs font-semibold'}
            >
              Individual Usage Logs ({totalUses})
            </Button>
            <Button
              variant={activeTab === 'coupons' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('coupons')}
              className={activeTab === 'coupons' ? 'bg-[#102A43] text-white text-xs font-bold' : 'text-xs font-semibold'}
            >
              Configured Coupons ({coupons.length})
            </Button>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedCouponFilter} onValueChange={setSelectedCouponFilter}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Coupon Code" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Coupons</SelectItem>
                <SelectItem value="STUTI500">STUTI500</SelectItem>
                {coupons.filter(c => c.code?.toUpperCase() !== 'STUTI500').map((c) => (
                  <SelectItem key={c.id} value={c.code}>{c.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="Booking Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
                <SelectItem value="PAYMENT_PENDING">PAYMENT_PENDING</SelectItem>
                <SelectItem value="PENDING">PENDING</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tab 1: Journey-Wise Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-4 font-poppins pt-1">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-[#102A43] flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" /> Journey-Wise Redemption Performance
              </h3>
              <span className="text-xs text-muted-foreground font-semibold">
                Grouped by active trips & road packages
              </span>
            </div>

            {journeyAnalytics.length === 0 ? (
              <div className="bg-slate-50 rounded-xl p-8 text-center border border-dashed border-slate-200 text-slate-500 space-y-1">
                <TicketPercent className="h-8 w-8 mx-auto text-slate-400 mb-1" />
                <p className="font-bold text-sm text-[#102A43]">No Redemptions Recorded Yet</p>
                <p className="text-xs text-muted-foreground">When customers enter STUTI500 on bookings, journey breakdowns will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {journeyAnalytics.map((j) => (
                  <div key={j.journey_name} className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#C8A96A]/40 transition-all shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h4 className="font-bold text-sm text-[#102A43] truncate">{j.journey_name}</h4>
                      <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                        {j.uses} {j.uses === 1 ? 'Use' : 'Uses'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Discount Given</p>
                        <p className="font-bold text-amber-600">₹{j.discount_given.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Revenue Generated</p>
                        <p className="font-bold text-[#102A43]">₹{j.revenue.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Individual Usage Logs Table */}
        {activeTab === 'usages' && (
          <DataTable
            columns={usageColumns}
            data={analyticsResult?.usages ?? []}
            total={analyticsResult?.totalUsages ?? 0}
            page={page}
            pageSize={pageSize}
            totalPages={analyticsResult?.totalPages ?? 1}
            isLoading={loadingAnalytics}
            searchPlaceholder="Search by customer name, phone, email or booking ID..."
            searchValue={search}
            onSearchChange={setSearch}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          />
        )}

        {/* Tab 3: Configured Coupons Table */}
        {activeTab === 'coupons' && (
          <DataTable
            columns={couponColumns as any}
            data={coupons}
            total={couponsResult?.total ?? 0}
            page={page}
            pageSize={pageSize}
            totalPages={couponsResult?.totalPages ?? 1}
            isLoading={loadingCoupons}
            searchPlaceholder="Search coupon code..."
            searchValue={search}
            onSearchChange={setSearch}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          />
        )}
      </div>
    </div>
  )
}
