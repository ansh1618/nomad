import { supabase } from '@/lib/supabase'
import type {
  Departure,
  DepartureInsert,
  DepartureUpdate,
  DepartureInventory,
  PaginatedResult,
  PaginationParams,
} from '@/types/supabase'

const DEPARTURE_SELECT = `
  *,
  journeys(id, slug, name, starting_price, duration, hero_banner),
  trip_captains(id, full_name, photo_url, phone),
  buses(id, name, registration_number, bus_type, total_seats),
  hotels(id, name, star_rating, city),
  departure_rooms(
    id, allocated_count, price_override,
    hotel_rooms(id, room_type, sharing_type, capacity, price_modifier)
  ),
  pricing_tiers(*)
`

// ==========================================
// LIST (Admin)
// ==========================================
export async function getDepartures(
  params: PaginationParams & {
    journeyId?: string
    status?: string
    fromDate?: string
    toDate?: string
  } = {}
): Promise<PaginatedResult<Departure>> {
  const { page = 1, pageSize = 20, search, sortBy = 'departure_date', sortDir = 'asc', journeyId, status, fromDate, toDate } = params

  let query = supabase
    .from('departures')
    .select(DEPARTURE_SELECT, { count: 'exact' })

  if (journeyId) query = query.eq('journey_id', journeyId)
  if (status) query = query.eq('status', status)
  if (fromDate) query = query.gte('departure_date', fromDate)
  if (toDate) query = query.lte('departure_date', toDate)
  if (search) {
    query = query.or(`pickup_location.ilike.%${search}%,drop_location.ilike.%${search}%`)
  }

  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as Departure[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

// ==========================================
// UPCOMING (for package page departure picker)
// ==========================================
export async function getUpcomingDepartures(journeyId: string): Promise<Departure[]> {
  const today = new Date().toISOString().split('T')[0]

  try {
    const { data, error } = await supabase
      .from('departures')
      .select(DEPARTURE_SELECT)
      .eq('journey_id', journeyId)
      .eq('is_visible', true)
      .eq('is_cancelled', false)
      .gte('departure_date', today)
      .order('departure_date', { ascending: true })

    if (!error) return (data ?? []) as Departure[]
  } catch (e) {
    console.warn('Modern getUpcomingDepartures failed, falling back to trip_batches:', e)
  }

  // Fallback to legacy trip_batches table
  const { data: batches, error: batchesError } = await supabase
    .from('trip_batches')
    .select('*')
    .eq('journey_id', journeyId)
    .neq('status', 'CANCELLED')
    .gte('departure_date', today)
    .order('departure_date', { ascending: true })

  if (batchesError) {
    console.error('Error fetching legacy trip_batches:', batchesError)
    return []
  }

  // Map trip_batches fields to Departure model structure
  return (batches ?? []).map((batch: any) => ({
    id: batch.id,
    journey_id: batch.journey_id,
    departure_date: batch.departure_date,
    return_date: batch.return_date || batch.departure_date,
    base_price: Number(batch.price || 0),
    dynamic_price: Number(batch.price || 0),
    available_seats: batch.remaining_seats ?? batch.max_capacity ?? 18,
    max_capacity: batch.max_capacity ?? 18,
    is_sold_out: (batch.remaining_seats ?? 1) <= 0,
    is_visible: true,
    is_cancelled: false,
    created_at: batch.created_at,
    updated_at: batch.updated_at,
  })) as any[]
}

// ==========================================
// BY ID
// ==========================================
export async function getDepartureById(id: string): Promise<Departure | null> {
  try {
    const { data, error } = await supabase
      .from('departures')
      .select(DEPARTURE_SELECT)
      .eq('id', id)
      .single()

    if (!error) return data as Departure
  } catch (e) {
    console.warn('Modern getDepartureById failed, falling back:', e)
  }

  // Fallback: legacy trip_batches fetch
  const { data: batch, error: batchError } = await supabase
    .from('trip_batches')
    .select('*')
    .eq('id', id)
    .single()

  if (batchError) {
    if (batchError.code === 'PGRST116') return null
    throw new Error(batchError.message)
  }

  return {
    id: batch.id,
    journey_id: batch.journey_id,
    departure_date: batch.departure_date,
    return_date: batch.return_date || batch.departure_date,
    base_price: Number(batch.price || 0),
    dynamic_price: Number(batch.price || 0),
    available_seats: batch.remaining_seats ?? batch.max_capacity ?? 18,
    max_capacity: batch.max_capacity ?? 18,
    is_sold_out: (batch.remaining_seats ?? 1) <= 0,
    is_visible: true,
    is_cancelled: false,
    created_at: batch.created_at,
    updated_at: batch.updated_at,
  } as any
}

// ==========================================
// CREATE
// ==========================================
export async function createDeparture(payload: DepartureInsert): Promise<Departure> {
  try {
    const { data, error } = await supabase
      .from('departures')
      .insert(payload)
      .select('*')
      .single()

    if (!error) return data as Departure
  } catch (e) {
    console.warn('Modern createDeparture failed, falling back:', e)
  }

  // Fallback payload: trip_batches table
  const legacyPayload = {
    journey_id: payload.journey_id,
    departure_date: payload.departure_date,
    return_date: payload.return_date,
    price: payload.base_price,
    max_capacity: payload.max_capacity ?? 18,
    remaining_seats: payload.max_capacity ?? 18,
  }

  const { data: legacyData, error: legacyError } = await supabase
    .from('trip_batches')
    .insert(legacyPayload)
    .select('*')
    .single()

  if (legacyError) throw new Error(legacyError.message)
  
  return {
    id: legacyData.id,
    journey_id: legacyData.journey_id,
    departure_date: legacyData.departure_date,
    return_date: legacyData.return_date || legacyData.departure_date,
    base_price: Number(legacyData.price || 0),
    dynamic_price: Number(legacyData.price || 0),
    available_seats: legacyData.remaining_seats ?? legacyData.max_capacity ?? 18,
    max_capacity: legacyData.max_capacity ?? 18,
    is_sold_out: (legacyData.remaining_seats ?? 1) <= 0,
    is_visible: true,
    is_cancelled: false,
    created_at: legacyData.created_at,
    updated_at: legacyData.updated_at,
  } as any
}

// ==========================================
// UPDATE
// ==========================================
export async function updateDeparture(id: string, payload: DepartureUpdate): Promise<Departure> {
  try {
    const { data, error } = await supabase
      .from('departures')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (!error) return data as Departure
  } catch (e) {
    console.warn('Modern updateDeparture failed, falling back:', e)
  }

  // Fallback payload: trip_batches table
  const legacyPayload = {
    journey_id: payload.journey_id,
    departure_date: payload.departure_date,
    return_date: payload.return_date,
    price: payload.base_price,
    max_capacity: payload.max_capacity,
    remaining_seats: payload.available_seats,
  }

  const { data: legacyData, error: legacyError } = await supabase
    .from('trip_batches')
    .update(legacyPayload)
    .eq('id', id)
    .select('*')
    .single()

  if (legacyError) throw new Error(legacyError.message)

  return {
    id: legacyData.id,
    journey_id: legacyData.journey_id,
    departure_date: legacyData.departure_date,
    return_date: legacyData.return_date || legacyData.departure_date,
    base_price: Number(legacyData.price || 0),
    dynamic_price: Number(legacyData.price || 0),
    available_seats: legacyData.remaining_seats ?? legacyData.max_capacity ?? 18,
    max_capacity: legacyData.max_capacity ?? 18,
    is_sold_out: (legacyData.remaining_seats ?? 1) <= 0,
    is_visible: true,
    is_cancelled: false,
    created_at: legacyData.created_at,
    updated_at: legacyData.updated_at,
  } as any
}

// ==========================================
// DELETE
// ==========================================
export async function deleteDeparture(id: string): Promise<void> {
  const { error } = await supabase.from('departures').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ==========================================
// STATUS CHANGES
// ==========================================
export async function cancelDeparture(id: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('departures')
    .update({
      status: 'CANCELLED',
      is_cancelled: true,
      cancellation_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function closeDeparture(id: string): Promise<void> {
  const { error } = await supabase
    .from('departures')
    .update({ is_closed: true, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function markSoldOut(id: string): Promise<void> {
  const { error } = await supabase
    .from('departures')
    .update({ is_sold_out: true, available_seats: 0, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// ==========================================
// DUPLICATE DEPARTURE
// ==========================================
export async function duplicateDeparture(id: string, newDepartureDate: string, newReturnDate: string): Promise<Departure> {
  const source = await getDepartureById(id)
  if (!source) throw new Error('Departure not found')

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, created_at, updated_at, booked_seats, ...rest } = source as Departure & { departure_rooms?: unknown; pricing_tiers?: unknown; journeys?: unknown; trip_captains?: unknown; buses?: unknown; hotels?: unknown }

  const newDeparture = await createDeparture({
    ...(rest as DepartureInsert),
    departure_date: newDepartureDate,
    return_date: newReturnDate,
    available_seats: source.total_seats,
    booked_seats: 0,
    status: 'UPCOMING',
    is_closed: false,
    is_cancelled: false,
    is_sold_out: false,
  })

  return newDeparture
}

// ==========================================
// INVENTORY MANAGEMENT
// ==========================================
export async function getDepartureInventory(departureId: string): Promise<DepartureInventory[]> {
  const { data, error } = await supabase
    .from('departure_inventory')
    .select('*, bus_seats(seat_number, seat_type, row_number, column_letter), hotel_rooms(room_type, sharing_type)')
    .eq('departure_id', departureId)
    .order('label', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as DepartureInventory[]
}

export async function generateSeatInventory(departureId: string, busId: string): Promise<void> {
  // Get bus seats
  const { data: seats, error: seatsError } = await supabase
    .from('bus_seats')
    .select('*')
    .eq('bus_id', busId)
    .order('seat_number', { ascending: true })

  if (seatsError) throw new Error(seatsError.message)
  if (!seats?.length) throw new Error('No seats found for this bus')

  // Remove existing seat inventory for this departure
  await supabase
    .from('departure_inventory')
    .delete()
    .eq('departure_id', departureId)
    .eq('inventory_type', 'SEAT')

  // Insert new inventory
  const inventory = seats.map((seat) => ({
    departure_id: departureId,
    inventory_type: 'SEAT' as const,
    bus_seat_id: seat.id,
    label: seat.seat_number,
    status: seat.seat_type === 'DRIVER' ? 'BLOCKED' : 'AVAILABLE',
    price_modifier: seat.price_modifier ?? 0,
  }))

  const { error } = await supabase.from('departure_inventory').insert(inventory)
  if (error) throw new Error(error.message)
}

// ==========================================
// SEAT LOCKING (with expiry)
// ==========================================
export async function lockSeats(
  departureId: string,
  inventoryIds: string[],
  userId: string,
  lockMinutes = 15
): Promise<void> {
  const lockedUntil = new Date(Date.now() + lockMinutes * 60 * 1000).toISOString()

  // Check availability first
  const { data: available } = await supabase
    .from('departure_inventory')
    .select('id, status')
    .in('id', inventoryIds)
    .eq('departure_id', departureId)
    .eq('status', 'AVAILABLE')

  if (!available || available.length !== inventoryIds.length) {
    throw new Error('Some selected seats are no longer available. Please refresh and try again.')
  }

  const { error } = await supabase
    .from('departure_inventory')
    .update({
      status: 'LOCKED',
      locked_by: userId,
      locked_at: new Date().toISOString(),
      locked_until: lockedUntil,
    })
    .in('id', inventoryIds)
    .eq('status', 'AVAILABLE')

  if (error) throw new Error(error.message)
}

export async function releaseUserLocks(userId: string): Promise<void> {
  const { error } = await supabase
    .from('departure_inventory')
    .update({ status: 'AVAILABLE', locked_by: null, locked_at: null, locked_until: null })
    .eq('locked_by', userId)
    .eq('status', 'LOCKED')

  if (error) throw new Error(error.message)
}

export async function confirmInventoryBooking(bookingId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('departure_inventory')
    .update({ status: 'BOOKED', booking_id: bookingId })
    .eq('locked_by', userId)
    .eq('status', 'LOCKED')

  if (error) throw new Error(error.message)
}

// ==========================================
// BULK DELETE
// ==========================================
export async function bulkDeleteDepartures(ids: string[]): Promise<void> {
  const { error } = await supabase.from('departures').delete().in('id', ids)
  if (error) throw new Error(error.message)
}
