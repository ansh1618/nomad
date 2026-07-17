import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  FileText,
  Trash2,
  Activity,
  FileImage,
  Bus,
  Bed,
  Check,
  Download,
  AlertCircle,
} from 'lucide-react'
import {
  getBookingById,
  cancelBooking,
  updateBookingNotes,
  updateBooking,
  updateTraveller,
  addManualPayment,
  assignBus,
  assignHotel,
  assignTripCaptain,
  addBookingDocument,
  deleteBookingDocument,
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
import type { Booking, BookingTraveller, Payment, BookingDocument } from '@/types/supabase'

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
  users?: {
    full_name: string
    phone: string
    email: string | null
    avatar_url: string | null
    wallet_balance: number
    gender?: string | null
    dob?: string | null
    city?: string | null
    emergency_contact?: string | null
  }
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
  booking_timeline?: any[]
  booking_documents?: BookingDocument[]
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

  // Allocations lookups & lists
  const { data: buses = [] } = useQuery({
    queryKey: ['buses_dropdown'],
    queryFn: async () => {
      const { data } = await supabase.from('buses').select('id, name, total_seats').order('name')
      return data ?? []
    }
  })

  const { data: hotels = [] } = useQuery({
    queryKey: ['hotels_dropdown'],
    queryFn: async () => {
      const { data } = await supabase.from('hotels').select('id, name, city').order('name')
      return data ?? []
    }
  })

  const { data: captains = [] } = useQuery({
    queryKey: ['captains_dropdown'],
    queryFn: async () => {
      const { data } = await supabase.from('trip_captains').select('id, full_name').order('full_name')
      return data ?? []
    }
  })

  const { data: occupiedSeats = [], refetch: refetchOccupiedSeats } = useQuery({
    queryKey: ['departure_occupied_seats', b?.departure_id],
    queryFn: async () => {
      if (!b?.departure_id) return []
      const { data } = await supabase
        .from('booking_travellers')
        .select('seat_number, full_name, gender, booking:bookings(booking_id)')
        .eq('booking.departure_id', b.departure_id)
      return (data as any[])?.filter(t => t.seat_number) ?? []
    },
    enabled: !!b?.departure_id
  })

  const { data: occupiedRooms = [], refetch: refetchOccupiedRooms } = useQuery({
    queryKey: ['departure_occupied_rooms', b?.departure_id],
    queryFn: async () => {
      if (!b?.departure_id) return []
      const { data } = await supabase
        .from('booking_travellers')
        .select('room_number, full_name, gender, booking:bookings(booking_id)')
        .eq('booking.departure_id', b.departure_id)
      return (data as any[])?.filter(t => t.room_number) ?? []
    },
    enabled: !!b?.departure_id
  })

  // Modal allocations states
  const [showSeatModal, setShowSeatModal] = useState(false)
  const [seatModalTraveler, setSeatModalTraveler] = useState<BookingTraveller | null>(null)

  const [showRoomModal, setShowRoomModal] = useState(false)
  const [roomModalTraveler, setRoomModalTraveler] = useState<BookingTraveller | null>(null)
  const [roomInput, setRoomInput] = useState('')

  // Mutations
  const updateSeatMutation = useMutation({
    mutationFn: (seatNumber: string | null) => {
      if (!seatModalTraveler) throw new Error("No traveler selected")
      return updateTraveller(seatModalTraveler.id, { seat_number: seatNumber })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking_detail', id] })
      refetchOccupiedSeats()
      toast.success("Seat allocation updated successfully")
      setShowSeatModal(false)
      setSeatModalTraveler(null)
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const updateRoomMutation = useMutation({
    mutationFn: (roomNumber: string | null) => {
      if (!roomModalTraveler) throw new Error("No traveler selected")
      return updateTraveller(roomModalTraveler.id, { room_number: roomNumber })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking_detail', id] })
      refetchOccupiedRooms()
      toast.success("Room allocation updated successfully")
      setShowRoomModal(false)
      setRoomModalTraveler(null)
      setRoomInput('')
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const addDocMutation = useMutation({
    mutationFn: addBookingDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking_detail', id] })
      toast.success("Document saved successfully")
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const deleteDocMutation = useMutation({
    mutationFn: (payload: { documentId: string; name: string }) =>
      deleteBookingDocument(payload.documentId, id, payload.name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking_detail', id] })
      toast.success("Document deleted successfully")
    },
    onError: (err: Error) => toast.error(err.message)
  })


  const handleViewDocument = async (path: string) => {
    try {
      if (path.startsWith('http://') || path.startsWith('https://')) {
        window.open(path, '_blank', 'noreferrer')
        return
      }
      
      const { data, error } = await supabase.storage
        .from('traveler_documents')
        .createSignedUrl(path, 300)
        
      if (error || !data?.signedUrl) {
        throw error || new Error('Failed to generate signed URL')
      }
      
      window.open(data.signedUrl, '_blank', 'noreferrer')
    } catch (err: any) {
      console.error('Error opening document:', err)
      toast.error('Failed to open document: ' + err.message)
    }
  }

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
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 border-b pb-4 bg-background/50 backdrop-blur sticky top-14 z-30"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/admin/bookings' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-poppins font-mono text-primary">
              {b.booking_id ?? id.slice(0, 8).toUpperCase()}
            </h1>
            <Badge className={`${STATUS_BADGE[b.status] ?? 'bg-gray-100'} border-0 font-semibold text-xs`}>
              {b.status.replace(/_/g, ' ')}
            </Badge>
            {b.booking_source && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground font-semibold">
                {b.booking_source}
              </Badge>
            )}
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
            className="gap-1.5 h-9"
          >
            <Edit className="h-4 w-4" /> Edit Booking
          </Button>
          {b.status !== 'CANCELLED' && b.status !== 'REFUNDED' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowCancel(true)}
              className="gap-1.5 h-9"
            >
              <XCircle className="h-4 w-4" /> Cancel Booking
            </Button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main tabs content */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl h-11 border">
              <TabsTrigger value="overview" className="rounded-lg text-xs font-semibold py-2 font-poppins">Overview</TabsTrigger>
              <TabsTrigger value="travellers" className="rounded-lg text-xs font-semibold py-2 font-poppins">Travellers ({b.traveller_count})</TabsTrigger>
              <TabsTrigger value="docs_timeline" className="rounded-lg text-xs font-semibold py-2 font-poppins">Docs & Timeline</TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-4 mt-4 focus-visible:outline-none focus-visible:ring-0">
              {/* Trip details */}
              <Card className="border shadow-none">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> Trip Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {b.departures?.journeys?.hero_banner && (
                    <img
                      src={b.departures.journeys.hero_banner}
                      alt={b.departures.journeys.name}
                      className="w-full h-40 object-cover rounded-xl border"
                    />
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Package / Destination</p>
                      <p className="text-sm font-semibold mt-0.5 text-foreground">{b.departures?.journeys?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">{b.departures?.journeys?.duration ?? ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Departure Date</p>
                      <p className="text-sm font-semibold mt-0.5 text-foreground">
                        {b.departures?.departure_date
                          ? new Date(b.departures.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                          : '—'}
                      </p>
                      {b.departures?.return_date && (
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          Return: {new Date(b.departures.return_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Pickup Point</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{b.pickup_point ?? b.departures?.pickup_location ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Drop Point</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{b.drop_point ?? b.departures?.drop_location ?? '—'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preferences */}
              {(b.room_preference || b.food_preference || b.special_requests) && (
                <Card className="border shadow-none">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Settings className="h-4 w-4 text-primary" /> Special Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                    {b.room_preference && (
                      <div>
                        <span className="font-bold text-foreground">Room Sharing configuration: </span>
                        {b.room_preference}
                      </div>
                    )}
                    {b.food_preference && (
                      <div>
                        <span className="font-bold text-foreground">Meals request: </span>
                        {b.food_preference}
                      </div>
                    )}
                    {b.special_requests && (
                      <div>
                        <span className="font-bold text-foreground">Special Request details: </span>
                        {b.special_requests}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Internal notes */}
              <Card className="border shadow-none">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" /> Private CRM Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add internal notes for this booking (visible only to admins)..."
                    rows={4}
                    className="text-xs rounded-xl"
                  />
                  <Button size="sm" onClick={saveNotes} disabled={savingNotes} className="rounded-lg h-9">
                    {savingNotes ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                    Save CRM Notes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TRAVELLERS TAB */}
            <TabsContent value="travellers" className="space-y-4 mt-4 focus-visible:outline-none focus-visible:ring-0">
              <Card className="border shadow-none">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span>Active Explorers ({b.traveller_count})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(b.booking_travellers ?? []).map((traveller, i) => (
                    <div key={traveller.id} className="p-4 rounded-xl border bg-muted/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground bg-muted border px-1.5 py-0.5 rounded">#0{i + 1}</span>
                          {traveller.is_primary && (
                            <Badge className="bg-primary text-primary-foreground border-0 text-[9px] font-bold px-1.5 h-4 flex items-center justify-center">Primary</Badge>
                          )}
                          <span className="font-semibold text-sm font-poppins">{traveller.full_name}</span>
                          {traveller.gender && (
                            <Badge variant="secondary" className="text-[10px] font-medium h-4">{traveller.gender}</Badge>
                          )}
                          {traveller.age && (
                            <span className="text-xs text-muted-foreground font-medium">Age: {traveller.age}</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                          {traveller.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" />{traveller.phone}</span>}
                          {traveller.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3 shrink-0" />{traveller.email}</span>}
                          {traveller.room_sharing && <span>Sharing Option: {traveller.room_sharing}</span>}
                          {traveller.seat_number && (
                            <span className="text-primary font-bold flex items-center gap-1">
                              <Bus className="h-3.5 w-3.5" /> Seat: {traveller.seat_number}
                            </span>
                          )}
                          {traveller.room_number && (
                            <span className="text-indigo-600 font-bold flex items-center gap-1">
                              <Bed className="h-3.5 w-3.5" /> Room: {traveller.room_number}
                            </span>
                          )}
                          {traveller.id_proof_type && <span>ID: {traveller.id_proof_type} ({traveller.id_proof_number})</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 border-t pt-3 md:border-t-0 md:pt-0">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            setSeatModalTraveler(traveller)
                            setShowSeatModal(true)
                          }}
                          className="h-8 text-[11px] gap-1 rounded-lg"
                        >
                          <Bus className="h-3 w-3" /> Assign Seat
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            setRoomModalTraveler(traveller)
                            setRoomInput(traveller.room_number || '')
                            setShowRoomModal(true)
                          }}
                          className="h-8 text-[11px] gap-1 rounded-lg"
                        >
                          <Bed className="h-3 w-3" /> Assign Room
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTraveler(traveller)
                            setShowEditTraveler(true)
                          }}
                          className="h-8 w-8 rounded-lg"
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* DOCS & TIMELINE TAB */}
            <TabsContent value="docs_timeline" className="space-y-4 mt-4 focus-visible:outline-none focus-visible:ring-0">
              {/* Documents */}
              <Card className="border shadow-none">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Document Repository</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* File Upload inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-xl border bg-muted/20">
                    <div>
                      <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Select Doc Category</Label>
                      <Select defaultValue="Aadhaar" id="upload-doc-type">
                        <SelectTrigger className="w-full h-8 text-xs mt-1">
                          <SelectValue placeholder="Doc Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Aadhaar">Aadhaar Card</SelectItem>
                          <SelectItem value="Passport">Passport</SelectItem>
                          <SelectItem value="Student ID">Student ID</SelectItem>
                          <SelectItem value="Visa">Visa File</SelectItem>
                          <SelectItem value="Tickets">Travel Tickets</SelectItem>
                          <SelectItem value="Invoice">Booking Invoice</SelectItem>
                          <SelectItem value="Hotel Voucher">Hotel Voucher</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Select File Upload</Label>
                      <input
                        type="file"
                        onChange={(e) => {
                          const docType = (document.getElementById('upload-doc-type') as HTMLButtonElement)?.innerText?.trim() || 'Aadhaar';
                          // Standardize text
                          let formattedType = 'Aadhaar';
                          if (docType.includes('Passport')) formattedType = 'Passport';
                          else if (docType.includes('Student')) formattedType = 'Student ID';
                          else if (docType.includes('Visa')) formattedType = 'Visa';
                          else if (docType.includes('Ticket')) formattedType = 'Tickets';
                          else if (docType.includes('Invoice')) formattedType = 'Invoice';
                          else if (docType.includes('Hotel')) formattedType = 'Hotel Voucher';
                          
                          handleDocumentUpload(e, formattedType);
                        }}
                        className="w-full text-xs border rounded-lg p-1.5 bg-white cursor-pointer mt-1"
                      />
                    </div>
                  </div>

                  {/* Documents List */}
                  {(b.booking_documents ?? []).length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                      No documents stored yet. Upload copies of traveler Aadhaars, Passports, or tickets here.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {(b.booking_documents ?? []).map((doc) => (
                        <div key={doc.id} className="p-3 rounded-lg border flex items-center justify-between gap-3 bg-white">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                              <FileText className="h-4.5 w-4.5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate text-foreground">{doc.name}</p>
                              <Badge variant="secondary" className="text-[9px] font-bold px-1.5 mt-0.5">{doc.file_type}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDocument(doc.file_url)}
                              className="h-8 w-8"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteDocMutation.mutate({ documentId: doc.id, name: doc.name })}
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Booking Timeline */}
              <Card className="border shadow-none">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> Audit Activity Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(!b.booking_timeline || b.booking_timeline.length === 0) ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No events logged in the timeline.</p>
                  ) : (
                    <div className="relative border-l pl-4 ml-2 space-y-4 text-xs">
                      {b.booking_timeline.map((event) => (
                        <div key={event.id} className="relative">
                          {/* Dot indicator */}
                          <span className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 bg-primary rounded-full border border-white" />
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-primary uppercase text-[10px] tracking-wider bg-primary/10 px-1.5 py-0.5 rounded">
                              {event.event.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-mono">
                              {new Date(event.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-muted-foreground mt-1 font-medium">{event.description}</p>
                          <p className="text-[9px] text-muted-foreground/60 font-mono mt-0.5">actor: {event.actor}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-4">
          {/* Customer profile snippet */}
          <Card className="border shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Customer profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div>
                <p className="font-semibold text-sm text-foreground">{b.customers?.name ?? b.users?.full_name ?? '—'}</p>
                <p className="text-[10px] text-muted-foreground font-bold mt-0.5">Purchasing Customer</p>
              </div>
              {b.customers?.phone && (
                <a href={`tel:${b.customers.phone}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors font-medium">
                  <Phone className="h-3.5 w-3.5" />
                  {b.customers.phone}
                </a>
              )}
              {b.customers?.email && (
                <a href={`mailto:${b.customers.email}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors font-medium">
                  <Mail className="h-3.5 w-3.5" />
                  {b.customers.email}
                </a>
              )}

              {/* Extra details loader */}
              {b.users && (
                <div className="border-t pt-2 mt-2 space-y-1 text-muted-foreground">
                  {b.users.gender && <div><span className="font-bold text-foreground">Gender:</span> {b.users.gender}</div>}
                  {b.users.dob && <div><span className="font-bold text-foreground">DOB:</span> {new Date(b.users.dob).toLocaleDateString('en-IN')}</div>}
                  {b.users.city && <div><span className="font-bold text-foreground">City:</span> {b.users.city}</div>}
                  {b.users.emergency_contact && <div><span className="font-bold text-foreground">Emergency:</span> {b.users.emergency_contact}</div>}
                </div>
              )}

              {b.users?.wallet_balance !== undefined && b.users.wallet_balance > 0 && (
                <div className="text-xs bg-emerald-50 text-emerald-700 rounded-lg p-2 font-semibold">
                  Wallet Balance: ₹{b.users.wallet_balance.toLocaleString('en-IN')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Operational Allocations sidebar dropdowns */}
          <Card className="border shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bus className="h-4 w-4 text-primary" /> Operational Assignments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bus Assignment */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Assign Coach/Vehicle</Label>
                <Select
                  value={b.assigned_bus_id || 'NONE'}
                  onValueChange={(v) => assignBusMutation.mutate(v === 'NONE' ? null : v)}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-white border">
                    <SelectValue placeholder="No Coach Assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No Coach Assigned</SelectItem>
                    {buses.map((bus: any) => (
                      <SelectItem key={bus.id} value={bus.id}>{bus.name} ({bus.total_seats} seats)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Hotel Assignment */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Assign Stays/Hotel</Label>
                <Select
                  value={b.assigned_hotel_id || 'NONE'}
                  onValueChange={(v) => assignHotelMutation.mutate(v === 'NONE' ? null : v)}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-white border">
                    <SelectValue placeholder="No Hotel Assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No Hotel Assigned</SelectItem>
                    {hotels.map((h: any) => (
                      <SelectItem key={h.id} value={h.id}>{h.name} ({h.city})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Captain Assignment */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Assign Trip Captain</Label>
                <Select
                  value={b.assigned_trip_captain_id || 'NONE'}
                  onValueChange={(v) => assignCaptainMutation.mutate(v === 'NONE' ? null : v)}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-white border">
                    <SelectValue placeholder="No Captain Assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No Captain Assigned</SelectItem>
                    {captains.map((cap: any) => (
                      <SelectItem key={cap.id} value={cap.id}>{cap.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Ledger summary card */}
          <Card className="border shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-primary" /> Financial ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {[
                { label: 'Base Invoice price', value: b.base_amount },
                { label: 'Addon charge total', value: b.addon_amount },
                { label: `GST (${b.gst_rate}%)`, value: b.gst_amount },
                ...(b.discount_amount > 0 ? [{ label: 'Referral discount', value: -b.discount_amount }] : []),
                ...(b.coupon_discount > 0 ? [{ label: `Coupon discount (${b.coupons?.code ?? ''})`, value: -b.coupon_discount }] : []),
                ...(b.wallet_amount_used > 0 ? [{ label: 'Wallet balance applied', value: -b.wallet_amount_used }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between font-medium text-muted-foreground">
                  <span>{label}</span>
                  <span className={value < 0 ? 'text-emerald-600 font-bold' : ''}>
                    {value < 0 ? '-' : ''}₹{Math.abs(value).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between text-sm font-bold text-foreground">
                <span>Total Amount Due</span>
                <span>₹{b.total_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Amount Paid Logged</span>
                <span>₹{b.amount_paid.toLocaleString('en-IN')}</span>
              </div>
              {b.balance_due > 0 && (
                <div className="flex justify-between text-amber-600 font-bold">
                  <span>Remaining Balance</span>
                  <span>₹{b.balance_due.toLocaleString('en-IN')}</span>
                </div>
              )}
            </CardContent>
          </Card>
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

              <div className="pt-3 border-t space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Traveler Documents</Label>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="block font-medium text-slate-500">Aadhar Card:</span>
                    {selectedTraveler?.aadhaar_doc_url ? (
                      <button
                        type="button"
                        onClick={() => handleViewDocument(selectedTraveler.aadhaar_doc_url!)}
                        className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5 mt-1"
                      >
                        View Document <span className="text-[10px]">↗</span>
                      </button>
                    ) : (
                      <span className="text-muted-foreground italic mt-1 block">Not uploaded</span>
                    )}
                  </div>
                  <div>
                    <span className="block font-medium text-slate-500">Profile Photo:</span>
                    {selectedTraveler?.photo_url ? (
                      <button
                        type="button"
                        onClick={() => handleViewDocument(selectedTraveler.photo_url!)}
                        className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5 mt-1"
                      >
                        View Photo <span className="text-[10px]">↗</span>
                      </button>
                    ) : (
                      <span className="text-muted-foreground italic mt-1 block">Not uploaded</span>
                    )}
                  </div>
                </div>
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

      {/* Visual Seat Allocation Dialog */}
      <Dialog open={showSeatModal} onOpenChange={(open) => { if(!open) { setShowSeatModal(false); setSeatModalTraveler(null); } }}>
        <DialogContent className="max-w-2xl bg-white border max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-poppins font-bold flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" /> Visual Seat Allocator
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign a coach seat for <span className="font-bold text-foreground">{seatModalTraveler?.full_name}</span>. Red seats are occupied by other explorers.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex justify-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5"><span className="w-4 h-4 bg-muted border rounded" /> Available</div>
              <div className="flex items-center gap-1.5"><span className="w-4 h-4 bg-destructive/10 border-destructive border rounded" /> Occupied</div>
              <div className="flex items-center gap-1.5"><span className="w-4 h-4 bg-emerald-500 rounded text-white" /> Selected</div>
            </div>

            {/* Coach layout layout */}
            <div className="w-64 mx-auto border-2 border-border rounded-3xl p-4 bg-muted/5 relative">
              {/* Steering wheel */}
              <div className="flex justify-between items-center pb-6 border-b mb-6 border-dashed">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Front of Coach</span>
                <span className="w-6 h-6 rounded-full border-4 border-muted-foreground flex items-center justify-center font-bold text-[8px] text-muted-foreground">W</span>
              </div>

              {/* Grid map */}
              <div className="grid grid-cols-4 gap-2 text-center">
                {Array.from({ length: 10 }, (_, rowIdx) => {
                  const cols = ['A', 'B', 'C', 'D'];
                  return cols.map((col, colIdx) => {
                    const seatNum = `${rowIdx + 1}${col}`;
                    const isOccupied = occupiedSeats.find(s => String(s.seat_number) === seatNum);
                    const isCurrent = seatModalTraveler?.seat_number === seatNum;

                    return (
                      <div key={seatNum} className="flex flex-col items-center">
                        {colIdx === 2 && <div className="w-4" /> /* Isle spacer */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isOccupied) {
                              toast.info(`Occupied by: ${isOccupied.full_name} (${isOccupied.gender || 'N/A'})`);
                            } else {
                              updateSeatMutation.mutate(seatNum);
                            }
                          }}
                          disabled={updateSeatMutation.isPending}
                          className={`w-9 h-9 text-[10px] font-bold rounded-lg flex flex-col items-center justify-center transition-all ${
                            isCurrent
                              ? 'bg-emerald-500 text-white shadow-soft shadow-emerald-500/30'
                              : isOccupied
                              ? 'bg-destructive/10 border border-destructive text-destructive cursor-not-allowed hover:bg-destructive/15'
                              : 'bg-white border border-border hover:border-primary hover:bg-primary/5 text-foreground'
                          }`}
                        >
                          <span>{seatNum}</span>
                        </button>
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            {seatModalTraveler?.seat_number && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => updateSeatMutation.mutate(null)}
                disabled={updateSeatMutation.isPending}
                className="h-9 rounded-lg text-xs"
              >
                Clear Seat Assignment
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => { setShowSeatModal(false); setSeatModalTraveler(null); }}
              className="h-9 rounded-lg text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room Allocation Dialog */}
      <Dialog open={showRoomModal} onOpenChange={(open) => { if(!open) { setShowRoomModal(false); setRoomModalTraveler(null); } }}>
        <DialogContent className="max-w-md bg-white border max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-poppins font-bold flex items-center gap-2">
              <Bed className="h-5 w-5 text-primary" /> Room Allocator
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign hotel room numbers for <span className="font-bold text-foreground">{roomModalTraveler?.full_name}</span>. Maintains room-sharing checks.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div>
              <Label className="text-xs font-semibold">Input Room Code / Room Number</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  placeholder="e.g. Room 101, Room 204-A"
                  className="h-9 text-xs rounded-xl"
                />
                <Button
                  onClick={() => updateRoomMutation.mutate(roomInput)}
                  disabled={updateRoomMutation.isPending || !roomInput.trim()}
                  className="h-9 rounded-xl text-xs"
                >
                  Save Room
                </Button>
              </div>
            </div>

            {/* Occupants list helper */}
            {roomInput.trim() && (
              <div className="p-3 border rounded-xl bg-muted/10 space-y-1.5">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Current Roommates in {roomInput}</p>
                {occupiedRooms.filter(r => String(r.room_number).toLowerCase() === roomInput.toLowerCase().trim()).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Room is currently empty.</p>
                ) : (
                  <div className="space-y-1 text-xs">
                    {occupiedRooms
                      .filter(r => String(r.room_number).toLowerCase() === roomInput.toLowerCase().trim())
                      .map((occ, oIdx) => (
                        <div key={oIdx} className="flex justify-between font-medium">
                          <span>{occ.full_name}</span>
                          <span className="text-muted-foreground">({occ.gender || 'N/A'})</span>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            )}

            {/* Quick rooms selector suggestions */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Quick suggestion rooms</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {['Room 101', 'Room 102', 'Room 103', 'Room 104', 'Room 105', 'Room 201', 'Room 202'].map((rm) => (
                  <button
                    key={rm}
                    type="button"
                    onClick={() => setRoomInput(rm)}
                    className={`px-2.5 py-1 text-xs rounded-lg border text-medium transition-colors ${
                      roomInput === rm ? 'bg-primary text-white border-primary' : 'bg-white hover:bg-muted/30 text-foreground'
                    }`}
                  >
                    {rm}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            {roomModalTraveler?.room_number && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => updateRoomMutation.mutate(null)}
                disabled={updateRoomMutation.isPending}
                className="h-9 rounded-lg text-xs"
              >
                Unassign Room
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => { setShowRoomModal(false); setRoomModalTraveler(null); }}
              className="h-9 rounded-lg text-xs"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
