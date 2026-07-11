import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  IndianRupee,
  MapPin,
  Users,
  CreditCard,
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquare,
  Edit,
  PlusCircle,
  Plus,
  ArrowRight,
  TrendingDown,
} from 'lucide-react'
import {
  getBookingById,
  cancelBooking,
  updateBookingNotes,
  updateBooking,
  updateTraveller,
  addManualPayment,
} from '@/lib/queries/bookings'
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
import { useAdminAuth } from '@/hooks/use-admin-auth'
import type { Booking, BookingTraveller, Payment } from '@/types/supabase'

export const Route = createFileRoute('/admin/bookings_/$id')({
  component: BookingDetailPage,
})

const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  PAYMENT_PENDING: 'bg-amber-100 text-amber-700',
  PARTIAL_PAID: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
  CREATED: 'bg-gray-100 text-gray-600',
  SEAT_LOCKED: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CHECKED_IN: 'bg-teal-100 text-teal-700',
  REFUNDED: 'bg-red-100 text-red-600',
}

const PAYMENT_STATUS_BADGE: Record<string, string> = {
  SUCCESS: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-red-100 text-red-600',
}

type FullBooking = Booking & {
  users?: { full_name: string; phone: string; email: string | null; avatar_url: string | null; wallet_balance: number }
  departures?: {
    departure_date: string
    return_date: string
    base_price: number
    pickup_location: string | null
    drop_location: string | null
    journeys?: { name: string; slug: string; hero_banner: string | null; duration: string | null }
    buses?: { name: string; registration_number: string } | null
    hotels?: { name: string; city: string | null } | null
  }
  booking_travellers?: BookingTraveller[]
  payments?: Payment[]
  coupons?: { code: string; discount_type: string; discount_value: number } | null
}

function BookingDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { admin } = useAdminAuth()

  const [showCancel, setShowCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  // Edit Modals State
  const [showEditDetails, setShowEditDetails] = useState(false)
  const [editForm, setEditForm] = useState({
    status: '',
    room_preference: '',
    food_preference: '',
    special_requests: '',
    base_amount: 0,
    addon_amount: 0,
    discount_amount: 0,
    coupon_discount: 0,
  })

  const [showEditTraveler, setShowEditTraveler] = useState(false)
  const [selectedTraveler, setSelectedTraveler] = useState<BookingTraveller | null>(null)
  const [travelerForm, setTravelerForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    age: '',
    gender: 'Male',
    food_preference: '',
    seat_number: '',
    room_sharing: 'Triple',
  })

  const [showAddPayment, setShowAddPayment] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'UPI',
    transactionId: '',
    status: 'SUCCESS',
  })

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking_detail', id],
    queryFn: () => getBookingById(id),
  })

  const b = booking as FullBooking | null

  // Initialize Edit Form when details modal opens
  useEffect(() => {
    if (b) {
      setEditForm({
        status: b.status,
        room_preference: b.room_preference || '',
        food_preference: b.food_preference || '',
        special_requests: b.special_requests || '',
        base_amount: Number(b.base_amount || 0),
        addon_amount: Number(b.addon_amount || 0),
        discount_amount: Number(b.discount_amount || 0),
        coupon_discount: Number(b.coupon_discount || 0),
      })
    }
  }, [showEditDetails, b])

  // Initialize Traveler Form when traveler modal opens
  useEffect(() => {
    if (selectedTraveler) {
      setTravelerForm({
        full_name: selectedTraveler.full_name || '',
        phone: selectedTraveler.phone || '',
        email: selectedTraveler.email || '',
        age: selectedTraveler.age ? String(selectedTraveler.age) : '',
        gender: selectedTraveler.gender || 'Male',
        food_preference: selectedTraveler.food_preference || '',
        seat_number: selectedTraveler.seat_number || '',
        room_sharing: selectedTraveler.room_sharing || 'Triple',
      })
    }
  }, [selectedTraveler])

  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(id, cancelReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking_detail', id] })
      qc.invalidateQueries({ queryKey: ['bookings_list'] })
      toast.success('Booking cancelled')
      setShowCancel(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const editBookingMutation = useMutation({
    mutationFn: (payload: Partial<Booking>) => updateBooking(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking_detail', id] })
      qc.invalidateQueries({ queryKey: ['bookings_list'] })
      toast.success('Booking details updated successfully')
      setShowEditDetails(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const editTravellerMutation = useMutation({
    mutationFn: ({ travellerId, payload }: { travellerId: string; payload: any }) =>
      updateTraveller(travellerId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking_detail', id] })
      toast.success('Traveller details updated')
      setShowEditTraveler(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const addPaymentMutation = useMutation({
    mutationFn: (payload: { amount: number; paymentMethod: string; transactionId?: string; status: string; createdBy?: string }) =>
      addManualPayment({ bookingId: id, ...payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking_detail', id] })
      qc.invalidateQueries({ queryKey: ['bookings_list'] })
      toast.success('Payment logged successfully')
      setShowAddPayment(false)
      setPaymentForm({
        amount: '',
        paymentMethod: 'UPI',
        transactionId: '',
        status: 'SUCCESS',
      })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const saveNotes = async () => {
    setSavingNotes(true)
    try {
      await updateBookingNotes(id, notes)
      qc.invalidateQueries({ queryKey: ['booking_detail', id] })
      toast.success('Notes saved')
    } catch (e) {
      toast.error('Failed to save notes')
    } finally {
      setSavingNotes(false)
    }
  }

  // Set notes from loaded data
  useState(() => {
    if (b?.internal_notes && !notes) setNotes(b.internal_notes)
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!b) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Booking not found.</p>
        <Button variant="ghost" onClick={() => navigate({ to: '/admin/bookings' })} className="mt-4">
          ← Back to Bookings
        </Button>
      </div>
    )
  }

  const payments = b.payments ?? []

  const handleEditDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Recalculate financial breakdown
    const gstRate = Number(b.gst_rate || 5)
    const base = Number(editForm.base_amount)
    const addon = Number(editForm.addon_amount)
    const disc = Number(editForm.discount_amount)
    const coupon = Number(editForm.coupon_discount)
    const wallet = Number(b.wallet_amount_used || 0)

    const subtotal = base + addon - disc - coupon
    const gst = Math.round(subtotal * (gstRate / 100))
    const total = subtotal + gst - wallet

    const balance = Math.max(0, total - (b.amount_paid || 0))

    editBookingMutation.mutate({
      status: editForm.status as any,
      room_preference: editForm.room_preference,
      food_preference: editForm.food_preference,
      special_requests: editForm.special_requests,
      base_amount: base,
      addon_amount: addon,
      discount_amount: disc,
      coupon_discount: coupon,
      gst_amount: gst,
      total_amount: total,
      balance_due: balance,
    })
  }

  const handleEditTravelerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTraveler) return

    editTravellerMutation.mutate({
      travellerId: selectedTraveler.id,
      payload: {
        full_name: travelerForm.full_name,
        phone: travelerForm.phone || null,
        email: travelerForm.email || null,
        age: travelerForm.age ? parseInt(travelerForm.age) : null,
        gender: travelerForm.gender,
        food_preference: travelerForm.food_preference || null,
        seat_number: travelerForm.seat_number || null,
        room_sharing: travelerForm.room_sharing,
      },
    })
  }

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(paymentForm.amount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Invalid payment amount')
      return
    }

    addPaymentMutation.mutate({
      amount: amt,
      paymentMethod: paymentForm.paymentMethod,
      transactionId: paymentForm.transactionId || undefined,
      status: paymentForm.status,
      createdBy: admin?.id,
    })
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/admin/bookings' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-poppins font-mono">
              {b.booking_id ?? id.slice(0, 8).toUpperCase()}
            </h1>
            <Badge className={`${STATUS_BADGE[b.status] ?? 'bg-gray-100'} border-0 font-semibold`}>
              {b.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Created {new Date(b.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditDetails(true)}
            className="gap-1.5"
          >
            <Edit className="h-4 w-4" /> Edit Booking
          </Button>
          {b.status !== 'CANCELLED' && b.status !== 'REFUNDED' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowCancel(true)}
              className="gap-1.5"
            >
              <XCircle className="h-4 w-4" /> Cancel Booking
            </Button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Package Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Trip Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {b.departures?.journeys?.hero_banner && (
                <img
                  src={b.departures.journeys.hero_banner}
                  alt={b.departures.journeys.name}
                  className="w-full h-32 object-cover rounded-lg"
                />
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Package</p>
                  <p className="text-sm font-semibold">{b.departures?.journeys?.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{b.departures?.journeys?.duration ?? ''}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Departure</p>
                  <p className="text-sm font-semibold">
                    {b.departures?.departure_date
                      ? new Date(b.departures.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '—'}
                  </p>
                  {b.departures?.return_date && (
                    <p className="text-xs text-muted-foreground">
                      Return: {new Date(b.departures.return_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pickup</p>
                  <p className="text-sm">{b.departures?.pickup_location ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Drop</p>
                  <p className="text-sm">{b.departures?.drop_location ?? '—'}</p>
                </div>
                {b.departures?.buses && (
                  <div>
                    <p className="text-xs text-muted-foreground">Bus</p>
                    <p className="text-sm">{b.departures.buses.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{b.departures.buses.registration_number}</p>
                  </div>
                )}
                {b.departures?.hotels && (
                  <div>
                    <p className="text-xs text-muted-foreground">Hotel</p>
                    <p className="text-sm">{b.departures.hotels.name}</p>
                    <p className="text-xs text-muted-foreground">{b.departures.hotels.city}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Travellers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Travellers ({b.traveller_count})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(b.booking_travellers ?? []).map((traveller, i) => (
                <div key={traveller.id} className="p-3 rounded-lg border bg-muted/20 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                      {traveller.is_primary && (
                        <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-bold">Primary</Badge>
                      )}
                      <span className="font-medium text-sm">{traveller.full_name}</span>
                      {traveller.gender && (
                        <Badge variant="outline" className="text-[10px]">{traveller.gender}</Badge>
                      )}
                      {traveller.age && (
                        <span className="text-xs text-muted-foreground">Age: {traveller.age}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {traveller.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{traveller.phone}</span>}
                      {traveller.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{traveller.email}</span>}
                      {traveller.room_sharing && <span>Sharing: {traveller.room_sharing}</span>}
                      {traveller.seat_number && <span>Seat: {traveller.seat_number}</span>}
                      {traveller.food_preference && <span>Food: {traveller.food_preference}</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTraveler(traveller)
                      setShowEditTraveler(true)
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" /> Payment History
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddPayment(true)}
                className="h-8 gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Log Payment
              </Button>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No payments recorded.</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
                      <div>
                        <p className="text-sm font-semibold">₹{payment.amount.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-muted-foreground">
                          {payment.payment_type} via {payment.payment_gateway}
                          {payment.payment_method ? ` (${payment.payment_method})` : ''}
                        </p>
                        {payment.gateway_payment_id && (
                          <p className="text-xs text-muted-foreground font-mono">{payment.gateway_payment_id}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge className={`${PAYMENT_STATUS_BADGE[payment.status] ?? 'bg-gray-100'} border-0 text-xs`}>
                          {payment.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(payment.created_at).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" /> Internal Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={notes || b.internal_notes || ''}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes for this booking (not visible to customer)..."
                rows={4}
              />
              <Button size="sm" onClick={saveNotes} disabled={savingNotes}>
                {savingNotes ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-semibold">{b.users?.full_name ?? '—'}</p>
              {b.users?.phone && (
                <a href={`tel:${b.users.phone}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Phone className="h-3.5 w-3.5" />
                  {b.users.phone}
                </a>
              )}
              {b.users?.email && (
                <a href={`mailto:${b.users.email}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="h-3.5 w-3.5" />
                  {b.users.email}
                </a>
              )}
              {b.users?.wallet_balance !== undefined && b.users.wallet_balance > 0 && (
                <div className="text-sm bg-emerald-50 text-emerald-700 rounded-lg p-2 mt-2">
                  Wallet: ₹{b.users.wallet_balance.toLocaleString('en-IN')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-primary" /> Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Base Amount', value: b.base_amount },
                { label: 'Addon Amount', value: b.addon_amount },
                { label: `GST (${b.gst_rate}%)`, value: b.gst_amount },
                ...(b.discount_amount > 0 ? [{ label: 'Discount', value: -b.discount_amount }] : []),
                ...(b.coupon_discount > 0 ? [{ label: `Coupon (${b.coupons?.code ?? ''})`, value: -b.coupon_discount }] : []),
                ...(b.wallet_amount_used > 0 ? [{ label: 'Wallet Used', value: -b.wallet_amount_used }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={value < 0 ? 'text-emerald-600 font-medium' : 'font-medium'}>
                    {value < 0 ? '-' : ''}₹{Math.abs(value).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>₹{b.total_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm text-emerald-600 font-medium">
                <span>Amount Paid</span>
                <span>₹{b.amount_paid.toLocaleString('en-IN')}</span>
              </div>
              {b.balance_due > 0 && (
                <div className="flex justify-between text-sm text-amber-600 font-semibold">
                  <span>Balance Due</span>
                  <span>₹{b.balance_due.toLocaleString('en-IN')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preferences */}
          {(b.room_preference || b.food_preference || b.special_requests) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {b.room_preference && (
                  <div>
                    <span className="text-muted-foreground">Room: </span>
                    {b.room_preference}
                  </div>
                )}
                {b.food_preference && (
                  <div>
                    <span className="text-muted-foreground">Food: </span>
                    {b.food_preference}
                  </div>
                )}
                {b.special_requests && (
                  <div>
                    <span className="text-muted-foreground">Special: </span>
                    {b.special_requests}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Booking Details Edit Modal */}
      <Dialog open={showEditDetails} onOpenChange={setShowEditDetails}>
        <DialogContent className="max-w-md bg-white border max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleEditDetailsSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit Booking Details</DialogTitle>
              <DialogDescription>
                Modify parameters, travel choices, and financial adjustments for this booking.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label htmlFor="status">Booking Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(val) => setEditForm({ ...editForm, status: val })}
                >
                  <SelectTrigger className="w-full mt-1.5">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(STATUS_BADGE).map((st) => (
                      <SelectItem key={st} value={st}>
                        {st.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="base_amount">Base Amount (₹)</Label>
                  <Input
                    id="base_amount"
                    type="number"
                    value={editForm.base_amount}
                    onChange={(e) => setEditForm({ ...editForm, base_amount: parseFloat(e.target.value) || 0 })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="addon_amount">Addon Amount (₹)</Label>
                  <Input
                    id="addon_amount"
                    type="number"
                    value={editForm.addon_amount}
                    onChange={(e) => setEditForm({ ...editForm, addon_amount: parseFloat(e.target.value) || 0 })}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_amount">Discount Amount (₹)</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    value={editForm.discount_amount}
                    onChange={(e) => setEditForm({ ...editForm, discount_amount: parseFloat(e.target.value) || 0 })}
                    className="mt-1.5 text-emerald-600 font-semibold"
                  />
                </div>
                <div>
                  <Label htmlFor="coupon_discount">Coupon Discount (₹)</Label>
                  <Input
                    id="coupon_discount"
                    type="number"
                    value={editForm.coupon_discount}
                    onChange={(e) => setEditForm({ ...editForm, coupon_discount: parseFloat(e.target.value) || 0 })}
                    className="mt-1.5 text-emerald-600 font-semibold"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="room_preference">Room Sharing Preference</Label>
                <Input
                  id="room_preference"
                  value={editForm.room_preference}
                  onChange={(e) => setEditForm({ ...editForm, room_preference: e.target.value })}
                  placeholder="e.g. Double Sharing, Triple Sharing"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="food_preference">Food Preference</Label>
                <Input
                  id="food_preference"
                  value={editForm.food_preference}
                  onChange={(e) => setEditForm({ ...editForm, food_preference: e.target.value })}
                  placeholder="Veg / Non-Veg / Special request"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="special_requests">Special Requests</Label>
                <Textarea
                  id="special_requests"
                  value={editForm.special_requests}
                  onChange={(e) => setEditForm({ ...editForm, special_requests: e.target.value })}
                  placeholder="Add any medical requests, birthdays or extra arrangements..."
                  rows={2}
                  className="mt-1.5"
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditDetails(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editBookingMutation.isPending}>
                {editBookingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Traveler Modal */}
      <Dialog open={showEditTraveler} onOpenChange={setShowEditTraveler}>
        <DialogContent className="max-w-md bg-white border max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleEditTravelerSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit Traveller Details</DialogTitle>
              <DialogDescription>
                Modify details of traveler: {selectedTraveler?.full_name}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={travelerForm.full_name}
                  onChange={(e) => setTravelerForm({ ...travelerForm, full_name: e.target.value })}
                  className="mt-1.5"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={travelerForm.age}
                    onChange={(e) => setTravelerForm({ ...travelerForm, age: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={travelerForm.gender}
                    onValueChange={(val) => setTravelerForm({ ...travelerForm, gender: val })}
                  >
                    <SelectTrigger className="w-full mt-1.5">
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={travelerForm.phone}
                    onChange={(e) => setTravelerForm({ ...travelerForm, phone: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={travelerForm.email}
                    onChange={(e) => setTravelerForm({ ...travelerForm, email: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="room_sharing">Room Sharing Type</Label>
                  <Select
                    value={travelerForm.room_sharing}
                    onValueChange={(val) => setTravelerForm({ ...travelerForm, room_sharing: val })}
                  >
                    <SelectTrigger className="w-full mt-1.5">
                      <SelectValue placeholder="Sharing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Double">Double</SelectItem>
                      <SelectItem value="Triple">Triple</SelectItem>
                      <SelectItem value="Quad">Quad</SelectItem>
                      <SelectItem value="Dorm">Dorm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="seat_number">Seat Number</Label>
                  <Input
                    id="seat_number"
                    value={travelerForm.seat_number}
                    onChange={(e) => setTravelerForm({ ...travelerForm, seat_number: e.target.value })}
                    placeholder="e.g. 5A, 12B"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tf_food">Food Preference</Label>
                <Input
                  id="tf_food"
                  value={travelerForm.food_preference}
                  onChange={(e) => setTravelerForm({ ...travelerForm, food_preference: e.target.value })}
                  placeholder="Veg / Non-Veg / Special requirements"
                  className="mt-1.5"
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditTraveler(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editTravellerMutation.isPending}>
                {editTravellerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Save Details
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Log Manual Payment Modal */}
      <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
        <DialogContent className="max-w-md bg-white border max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleAddPaymentSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Log Manual Payment</DialogTitle>
              <DialogDescription>
                Manually record a payment made via Cash, UPI, or Bank Transfer for this booking.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label htmlFor="pay_amount">Payment Amount (₹)</Label>
                <Input
                  id="pay_amount"
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="e.g. 5000"
                  className="mt-1.5"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pay_method">Payment Method</Label>
                  <Select
                    value={paymentForm.paymentMethod}
                    onValueChange={(val) => setPaymentForm({ ...paymentForm, paymentMethod: val })}
                  >
                    <SelectTrigger className="w-full mt-1.5">
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pay_status">Payment Status</Label>
                  <Select
                    value={paymentForm.status}
                    onValueChange={(val) => setPaymentForm({ ...paymentForm, status: val })}
                  >
                    <SelectTrigger className="w-full mt-1.5">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUCCESS">Success</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="pay_txid">Transaction ID / Reference Number</Label>
                <Input
                  id="pay_txid"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                  placeholder="e.g. UPI Ref, Bank Transaction Reference"
                  className="mt-1.5"
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddPayment(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addPaymentMutation.isPending}>
                {addPaymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Log Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancel} onOpenChange={setShowCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel booking {b.booking_id ?? id.slice(0, 8)} and release all reserved seats/rooms.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <Label>Cancellation Reason</Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter the reason for cancellation..."
              rows={3}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending || !cancelReason.trim()}
            >
              {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
