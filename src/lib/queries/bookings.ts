import { supabase } from '@/lib/supabase'
import type {
  Booking,
  BookingInsert,
  BookingUpdate,
  BookingTraveller,
  BookingTravellerInsert,
  PaginatedResult,
  PaginationParams,
} from '@/types/supabase'

const BOOKING_SELECT = `
  *,
  customers(id, name, email, phone, total_bookings, total_spent),
  users(id, full_name, phone, email, avatar_url, gender, dob, city, emergency_contact),
  departures(
    id, departure_date, return_date, base_price, available_seats,
    journeys(id, slug, name, hero_banner, duration),
    buses(id, name, registration_number),
    hotels(id, name, city)
  ),
  assigned_hotel:hotels(*),
  booking_travellers(*),
  payments(*),
  booking_timeline(id, event, description, actor, created_at),
  booking_documents(*),
  coupons(id, code, discount_type, discount_value)
`

// ==========================================
// LIST (Admin)
// ==========================================
export async function getBookings(
  params: PaginationParams & {
    status?: string
    bookingStatus?: string
    paymentStatus?: string
    departureId?: string
    destinationId?: string
    userId?: string
    fromDate?: string
    toDate?: string
  } = {}
): Promise<PaginatedResult<Booking>> {
  const {
    page = 1,
    pageSize = 20,
    search,
    sortBy = 'created_at',
    sortDir = 'desc',
    status,
    bookingStatus,
    paymentStatus,
    departureId,
    destinationId,
    userId,
    fromDate,
    toDate,
  } = params

  let query = supabase.from('bookings').select(BOOKING_SELECT, { count: 'exact' })

  if (status) query = query.eq('status', status)
  if (bookingStatus) query = query.eq('booking_status', bookingStatus)
  if (paymentStatus) query = query.eq('payment_status', paymentStatus)
  if (departureId) query = query.eq('departure_id', departureId)
  if (destinationId) query = query.eq('destination_id', destinationId)
  if (userId) query = query.eq('user_id', userId)
  if (fromDate) query = query.gte('created_at', fromDate)
  if (toDate) query = query.lte('created_at', toDate)
  if (search) {
    query = query.or(
      `booking_id.ilike.%${search}%,` +
      `customer_name.ilike.%${search}%,` +
      `phone.ilike.%${search}%,` +
      `email.ilike.%${search}%,` +
      `cashfree_order_id.ilike.%${search}%,` +
      `cashfree_payment_id.ilike.%${search}%,` +
      `transaction_id.ilike.%${search}%`
    )
  }

  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as Booking[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

// ==========================================
// BY ID (admin detail)
// ==========================================
export async function getBookingById(id: string): Promise<Booking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Booking
}

// ==========================================
// BY BOOKING_ID (NOM-202506-00001)
// ==========================================
export async function getBookingByDisplayId(bookingId: string): Promise<Booking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('booking_id', bookingId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Booking
}

// ==========================================
// USER'S BOOKINGS (account page)
// ==========================================
export async function getUserBookings(userId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Booking[]
}

// ==========================================
// CREATE BOOKING
// ==========================================
export async function createBooking(payload: BookingInsert): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .insert(payload)
    .select('id, booking_id, status, total_amount')
    .single()

  if (error) throw new Error(error.message)
  return data as Booking
}

// ==========================================
// UPDATE BOOKING
// ==========================================
export async function updateBooking(id: string, payload: BookingUpdate): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as Booking
}

// ==========================================
// CONFIRM BOOKING (after payment)
// ==========================================
export async function confirmBooking(
  id: string,
  razorpayPaymentId: string,
  razorpayOrderId: string,
  razorpaySignature: string,
  amountPaid: number
): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'CONFIRMED',
      razorpay_payment_id: razorpayPaymentId,
      razorpay_order_id: razorpayOrderId,
      razorpay_signature: razorpaySignature,
      amount_paid: amountPaid,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ==========================================
// CANCEL BOOKING
// ==========================================
export async function cancelBooking(id: string, reason: string, adminId?: string): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'CANCELLED',
      cancellation_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  // Release seat inventory
  await supabase
    .from('departure_inventory')
    .update({ status: 'AVAILABLE', booking_id: null })
    .eq('booking_id', id)
}

// ==========================================
// TRAVELLERS
// ==========================================
export async function insertTravellers(travellers: BookingTravellerInsert[]): Promise<BookingTraveller[]> {
  const { data, error } = await supabase
    .from('booking_travellers')
    .insert(travellers)
    .select('*')

  if (error) throw new Error(error.message)
  return (data ?? []) as BookingTraveller[]
}

export async function updateTraveller(id: string, payload: Partial<BookingTravellerInsert>): Promise<void> {
  const { error } = await supabase
    .from('booking_travellers')
    .update(payload)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function getTravellersByBooking(bookingId: string): Promise<BookingTraveller[]> {
  const { data, error } = await supabase
    .from('booking_travellers')
    .select('*')
    .eq('booking_id', bookingId)
    .order('is_primary', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as BookingTraveller[]
}

// ==========================================
// ADMIN: Update internal notes
// ==========================================
export async function updateBookingNotes(id: string, notes: string): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({ internal_notes: notes, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ==========================================
// BULK OPERATIONS
// ==========================================
export async function bulkUpdateBookingStatus(ids: string[], status: string): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .in('id', ids)

  if (error) throw new Error(error.message)
}

// ==========================================
// MANUAL PAYMENTS
// ==========================================
export async function addManualPayment(payload: {
  bookingId: string
  amount: number
  paymentMethod: string
  transactionId?: string
  status: string
  createdBy?: string
}): Promise<void> {
  const { error: payError } = await supabase
    .from('payments')
    .insert({
      booking_id: payload.bookingId,
      amount: payload.amount,
      payment_method: payload.paymentMethod,
      transaction_id: payload.transactionId || null,
      status: payload.status,
      created_by: payload.createdBy || null,
    })

  if (payError) throw new Error(payError.message)

  if (payload.status === 'SUCCESS') {
    const { data: booking, error: getErr } = await supabase
      .from('bookings')
      .select('amount_paid, total_amount')
      .eq('id', payload.bookingId)
      .single()

    if (getErr) throw new Error(getErr.message)

    if (booking) {
      const newPaid = Number(booking.amount_paid || 0) + Number(payload.amount)
      const newBalance = Math.max(0, Number(booking.total_amount || 0) - newPaid)
      const newStatus = newBalance === 0 ? 'CONFIRMED' : 'PARTIAL_PAID'

      const { error: updErr } = await supabase
        .from('bookings')
        .update({
          amount_paid: newPaid,
          balance_due: newBalance,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.bookingId)

      if (updErr) throw new Error(updErr.message)
    }
  }
}

export async function assignBus(bookingId: string, busId: string | null): Promise<void> {
  const { data: bus } = busId
    ? await supabase.from('buses').select('name').eq('id', busId).single()
    : { data: null }

  const { error } = await supabase
    .from('bookings')
    .update({ assigned_bus_id: busId, updated_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (error) throw new Error(error.message)

  await supabase.from('booking_timeline').insert({
    booking_id: bookingId,
    event: 'BUS_ASSIGNED',
    description: bus ? `Bus assigned: ${bus.name}` : 'Bus unassigned',
    actor: 'ADMIN',
  })
}

export async function assignHotel(bookingId: string, hotelId: string | null): Promise<void> {
  const { data: hotel } = hotelId
    ? await supabase.from('hotels').select('name').eq('id', hotelId).single()
    : { data: null }

  const { error } = await supabase
    .from('bookings')
    .update({ assigned_hotel_id: hotelId, updated_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (error) throw new Error(error.message)

  await supabase.from('booking_timeline').insert({
    booking_id: bookingId,
    event: 'HOTEL_ASSIGNED',
    description: hotel ? `Hotel assigned: ${hotel.name}` : 'Hotel unassigned',
    actor: 'ADMIN',
  })
}

export async function assignTripCaptain(bookingId: string, captainId: string | null): Promise<void> {
  const { data: captain } = captainId
    ? await supabase.from('trip_captains').select('full_name').eq('id', captainId).single()
    : { data: null }

  const { error } = await supabase
    .from('bookings')
    .update({ assigned_trip_captain_id: captainId, updated_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (error) throw new Error(error.message)

  await supabase.from('booking_timeline').insert({
    booking_id: bookingId,
    event: 'CAPTAIN_ASSIGNED',
    description: captain ? `Trip Captain assigned: ${captain.full_name}` : 'Trip Captain unassigned',
    actor: 'ADMIN',
  })
}

export async function addBookingDocument(payload: {
  bookingId: string
  name: string
  fileUrl: string
  fileType: string
  uploadedBy?: string
}): Promise<void> {
  const { error } = await supabase.from('booking_documents').insert({
    booking_id: payload.bookingId,
    name: payload.name,
    file_url: payload.fileUrl,
    file_type: payload.fileType,
    uploaded_by: payload.uploadedBy || null,
  })

  if (error) throw new Error(error.message)

  await supabase.from('booking_timeline').insert({
    booking_id: payload.bookingId,
    event: 'DOCUMENT_UPLOADED',
    description: `Uploaded document: ${payload.name} (${payload.fileType})`,
    actor: 'ADMIN',
  })
}

export async function deleteBookingDocument(documentId: string, bookingId: string, name: string): Promise<void> {
  const { error } = await supabase.from('booking_documents').delete().eq('id', documentId)
  if (error) throw new Error(error.message)

  await supabase.from('booking_timeline').insert({
    booking_id: bookingId,
    event: 'DOCUMENT_DELETED',
    description: `Deleted document: ${name}`,
    actor: 'ADMIN',
  })
}

