import { supabase } from '@/lib/supabase'
import type {
  Hotel,
  HotelInsert,
  HotelUpdate,
  HotelRoom,
  HotelRoomInsert,
  HotelRoomUpdate,
  Bus,
  BusInsert,
  BusUpdate,
  BusSeat,
  PaginatedResult,
  PaginationParams,
} from '@/types/supabase'

// ==========================================
// HOTELS
// ==========================================

const HOTEL_SELECT = `
  *,
  destinations(id, name, slug, state),
  hotel_rooms(*)
`

export async function getHotels(
  params: PaginationParams & { destinationId?: string; isActive?: boolean } = {}
): Promise<PaginatedResult<Hotel>> {
  const { page = 1, pageSize = 20, search, sortBy = 'name', sortDir = 'asc', destinationId, isActive } = params

  let query = supabase.from('hotels').select(HOTEL_SELECT, { count: 'exact' })

  if (search) query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%`)
  if (destinationId) query = query.eq('destination_id', destinationId)
  if (isActive !== undefined) query = query.eq('is_active', isActive)

  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as Hotel[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getHotelById(id: string): Promise<Hotel | null> {
  const { data, error } = await supabase
    .from('hotels')
    .select(HOTEL_SELECT)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Hotel
}

export async function getAllHotels(): Promise<Hotel[]> {
  const { data, error } = await supabase
    .from('hotels')
    .select('id, name, city, state, star_rating, is_active')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Hotel[]
}

export async function createHotel(payload: HotelInsert): Promise<Hotel> {
  const { data, error } = await supabase
    .from('hotels')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as Hotel
}

export async function updateHotel(id: string, payload: HotelUpdate): Promise<Hotel> {
  const { data, error } = await supabase
    .from('hotels')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as Hotel
}

export async function deleteHotel(id: string): Promise<void> {
  const { error } = await supabase.from('hotels').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ==========================================
// HOTEL ROOMS
// ==========================================
export async function getRoomsByHotel(hotelId: string): Promise<HotelRoom[]> {
  const { data, error } = await supabase
    .from('hotel_rooms')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('is_active', true)
    .order('room_type', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as HotelRoom[]
}

export async function createHotelRoom(payload: HotelRoomInsert): Promise<HotelRoom> {
  const { data, error } = await supabase
    .from('hotel_rooms')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as HotelRoom
}

export async function updateHotelRoom(id: string, payload: HotelRoomUpdate): Promise<HotelRoom> {
  const { data, error } = await supabase
    .from('hotel_rooms')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as HotelRoom
}

export async function deleteHotelRoom(id: string): Promise<void> {
  const { error } = await supabase.from('hotel_rooms').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function bulkDeleteHotels(ids: string[]): Promise<void> {
  const { error } = await supabase.from('hotels').delete().in('id', ids)
  if (error) throw new Error(error.message)
}

// ==========================================
// BUSES
// ==========================================

const BUS_SELECT = `
  *,
  bus_seats(*)
`

export async function getBuses(
  params: PaginationParams & { isActive?: boolean } = {}
): Promise<PaginatedResult<Bus>> {
  const { page = 1, pageSize = 20, search, sortBy = 'name', sortDir = 'asc', isActive } = params

  let query = supabase.from('buses').select(BUS_SELECT, { count: 'exact' })

  if (search) query = query.or(`name.ilike.%${search}%,registration_number.ilike.%${search}%`)
  if (isActive !== undefined) query = query.eq('is_active', isActive)

  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as Bus[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getBusById(id: string): Promise<Bus | null> {
  const { data, error } = await supabase
    .from('buses')
    .select(BUS_SELECT)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Bus
}

export async function getAllBuses(): Promise<Bus[]> {
  const { data, error } = await supabase
    .from('buses')
    .select('id, name, registration_number, bus_type, total_seats, is_active')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Bus[]
}

export async function createBus(payload: BusInsert): Promise<Bus> {
  const { data, error } = await supabase
    .from('buses')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as Bus
}

export async function updateBus(id: string, payload: BusUpdate): Promise<Bus> {
  const { data, error } = await supabase
    .from('buses')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as Bus
}

export async function deleteBus(id: string): Promise<void> {
  const { error } = await supabase.from('buses').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ==========================================
// BUS SEATS
// ==========================================
export async function getSeatsByBus(busId: string): Promise<BusSeat[]> {
  const { data, error } = await supabase
    .from('bus_seats')
    .select('*')
    .eq('bus_id', busId)
    .order('seat_number', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as BusSeat[]
}

export async function upsertBusSeats(busId: string, seats: Omit<BusSeat, 'id' | 'created_at'>[]): Promise<BusSeat[]> {
  // Clear existing seats first
  await supabase.from('bus_seats').delete().eq('bus_id', busId)

  if (seats.length === 0) return []

  const { data, error } = await supabase
    .from('bus_seats')
    .insert(seats)
    .select('*')

  if (error) throw new Error(error.message)
  return (data ?? []) as BusSeat[]
}

export async function bulkDeleteBuses(ids: string[]): Promise<void> {
  const { error } = await supabase.from('buses').delete().in('id', ids)
  if (error) throw new Error(error.message)
}
