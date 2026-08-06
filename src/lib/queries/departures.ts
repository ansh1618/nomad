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

  console.time("[Departures Query]");
  try {
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
    console.timeEnd("[Departures Query]");

    if (error) {
      console.error("[Departures Query] Error:", error.message);
    }

    const resData = (data ?? []) as Departure[];
    return {
      data: resData,
      total: count ?? resData.length,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? resData.length) / pageSize) || 1,
    }
  } catch (err) {
    console.timeEnd("[Departures Query]");
    console.error("[Departures Query] Exception caught:", err);
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 1,
    }
  }
}

// ==========================================
// GENERATE SCHEDULED DEPARTURES (RULE-BASED)
// ==========================================
export function generateScheduledDepartures(
  journey: { id: string; name?: string; slug?: string; starting_price?: number },
  existingDepartures: Departure[] = []
): Departure[] {
  if (!journey || !journey.id) return existingDepartures;

  const journeyName = (journey.name || '').toLowerCase();
  const journeySlug = (journey.slug || '').toLowerCase();

  // Special case for Udaipur Royal Weekend: return ONLY the real deduplicated DB departures (Thursdays & Fridays)
  if (journeySlug === 'udaipur-weekend' || journeyName.includes('udaipur')) {
    const uniqueMap = new Map<string, Departure>();
    existingDepartures.forEach((d) => {
      const key = d.departure_date ? d.departure_date.split('T')[0] : d.id;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, d);
      }
    });
    return Array.from(uniqueMap.values()).sort((a, b) =>
      (a.departure_date || '') > (b.departure_date || '') ? 1 : -1
    );
  }

  // Deduplicate existing departures first
  const existingMap = new Map<string, Departure>();
  existingDepartures.forEach((d) => {
    const key = d.departure_date ? d.departure_date.split('T')[0] : d.id;
    if (!existingMap.has(key)) {
      existingMap.set(key, d);
    }
  });

  const existingDatesSet = new Set(Array.from(existingMap.keys()));
  const generatedList: Departure[] = Array.from(existingMap.values());
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1); // Start from tomorrow

  const totalDaysToGenerate = 90;

  // Daily availability for Chopta, Tungnath, and Manali trips
  const isDaily =
    journeyName.includes('chopta') ||
    journeyName.includes('tungnath') ||
    journeyName.includes('manali') ||
    journeySlug.includes('chopta') ||
    journeySlug.includes('tungnath') ||
    journeySlug.includes('manali');

  for (let i = 0; i < totalDaysToGenerate; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    const dateStr = currentDate.toISOString().split('T')[0];

    if (existingDatesSet.has(dateStr)) {
      continue; // Keep existing database departure for this date
    }

    const dayOfWeek = currentDate.getDay(); // 0 = Sun, 5 = Fri

    if (isDaily || dayOfWeek === 5) {
      // Daily for Chopta / Tungnath / Manali; Every Friday for all other trips
      generatedList.push({
        id: `dep-gen-${journey.id}-${dateStr}`,
        journey_id: journey.id,
        departure_date: dateStr,
        return_date: dateStr,
        base_price: journey.starting_price || 6499,
        dynamic_price: journey.starting_price || 6499,
        available_seats: 18,
        max_capacity: 18,
        is_sold_out: false,
        is_visible: true,
        is_cancelled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any);
    }
  }

  // Sort by departure_date ascending
  return generatedList.sort((a, b) =>
    (a.departure_date || '') > (b.departure_date || '') ? 1 : -1
  );
}

// ==========================================
// UPCOMING (for package page departure picker)
// ==========================================
export async function getUpcomingDepartures(journeyIdOrSlug: string): Promise<Departure[]> {
  if (!journeyIdOrSlug) return [];
  const today = new Date().toISOString().split('T')[0];

  let resolvedJourneyId = journeyIdOrSlug;
  let journeyInfo: { id: string; name?: string; slug?: string; starting_price?: number } | null = null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(journeyIdOrSlug);

  try {
    let q = supabase.from('journeys').select('id, name, slug, starting_price');
    if (isUuid) {
      q = q.eq('id', journeyIdOrSlug);
    } else {
      q = q.eq('slug', journeyIdOrSlug);
    }
    const { data: jData } = await q.maybeSingle();

    if (jData) {
      journeyInfo = jData;
      resolvedJourneyId = jData.id;
    }
  } catch (jErr) {
    console.warn('[getUpcomingDepartures] Failed to fetch journey info:', jErr);
  }

  let existingDeps: Departure[] = [];

  try {
    const { data, error } = await supabase
      .from('departures')
      .select('*')
      .eq('journey_id', resolvedJourneyId)
      .eq('is_visible', true)
      .eq('is_cancelled', false)
      .gte('departure_date', today)
      .order('departure_date', { ascending: true });

    if (!error && data) {
      existingDeps = data as Departure[];
    }
  } catch (e) {
    console.warn('Modern getUpcomingDepartures failed, falling back to trip_batches:', e);
  }

  if (existingDeps.length === 0) {
    // Fallback to legacy trip_batches table
    try {
      const { data: batches } = await supabase
        .from('trip_batches')
        .select('*')
        .eq('journey_id', resolvedJourneyId)
        .neq('status', 'CANCELLED')
        .gte('departure_date', today)
        .order('departure_date', { ascending: true });

      if (batches && batches.length > 0) {
        existingDeps = batches.map((batch: any) => ({
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
        })) as any[];
      }
    } catch (batchErr) {
      console.warn('Error fetching legacy trip_batches:', batchErr);
    }
  }

  console.log(`[getUpcomingDepartures] journeyId: ${resolvedJourneyId}, returned ${existingDeps.length} DB departures`);

  if (journeyInfo) {
    return generateScheduledDepartures(journeyInfo, existingDeps);
  }

  return existingDeps;
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
    max_capacity: (payload as any).max_capacity ?? 18,
    remaining_seats: (payload as any).max_capacity ?? 18,
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
    max_capacity: (payload as any).max_capacity,
    remaining_seats: (payload as any).available_seats,
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
  // Release any expired locks first (lazy cleanup)
  await supabase
    .from('departure_inventory')
    .update({ status: 'AVAILABLE', booking_id: null, locked_by: null, locked_at: null, locked_until: null })
    .eq('status', 'LOCKED')
    .lt('locked_until', new Date().toISOString())

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
  // Release any expired locks first (lazy cleanup)
  await supabase
    .from('departure_inventory')
    .update({ status: 'AVAILABLE', booking_id: null, locked_by: null, locked_at: null, locked_until: null })
    .eq('status', 'LOCKED')
    .lt('locked_until', new Date().toISOString())

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

// ==========================================
// RECURRING GENERATOR TYPES & ENGINE
// ==========================================
export interface RecurringConfig {
  journeyId: string
  startDate: string
  endDate: string
  repeatPattern: 'EVERY_DAY' | 'EVERY_WEEK' | 'THURSDAY' | 'FRIDAY' | 'THURSDAY_FRIDAY' | 'SATURDAY_SUNDAY' | 'CUSTOM'
  customDays?: number[]
  price: number
  totalSeats: number
  tripCaptainId?: string | null
  busId?: string | null
  hotelId?: string | null
  status?: string
  isVisible?: boolean
  bookingOpensDays?: number
  bookingClosesHours?: number
}

export interface DryRunItem {
  date: string
  dayName: string
  returnDate: string
  status: 'TO_CREATE' | 'SKIPPED_EXISTING'
  existingId?: string
}

export interface DryRunResult {
  items: DryRunItem[]
  willCreateCount: number
  willSkipCount: number
  journeyName: string
}

export async function dryRunRecurringDepartures(config: RecurringConfig): Promise<DryRunResult> {
  const { journeyId, startDate, endDate, repeatPattern, customDays = [] } = config

  const { data: journey } = await supabase
    .from('journeys')
    .select('id, name, starting_price, price, duration')
    .eq('id', journeyId)
    .maybeSingle()

  const journeyName = journey?.name || 'Journey'
  let durationDays = 4
  if (journey?.duration) {
    const match = journey.duration.match(/(\d+)\s*Days?/i)
    if (match) durationDays = parseInt(match[1], 10)
  }

  const { data: existingDeps } = await supabase
    .from('departures')
    .select('id, departure_date')
    .eq('journey_id', journeyId)
    .gte('departure_date', startDate)
    .lte('departure_date', endDate)

  const existingDatesMap = new Map<string, string>()
  ;(existingDeps || []).forEach((d) => {
    if (d.departure_date) {
      const formatted = d.departure_date.split('T')[0]
      existingDatesMap.set(formatted, d.id)
    }
  })

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const start = new Date(startDate)
  const end = new Date(endDate)
  const items: DryRunItem[] = []

  let willCreateCount = 0
  let willSkipCount = 0
  const curr = new Date(start)
  let safetyLimit = 0

  while (curr <= end && safetyLimit < 400) {
    safetyLimit++
    const dateStr = curr.toISOString().split('T')[0]
    const dayOfWeek = curr.getDay()

    let matches = false
    switch (repeatPattern) {
      case 'EVERY_DAY':
        matches = true
        break
      case 'THURSDAY':
        matches = dayOfWeek === 4
        break
      case 'FRIDAY':
        matches = dayOfWeek === 5
        break
      case 'THURSDAY_FRIDAY':
        matches = dayOfWeek === 4 || dayOfWeek === 5
        break
      case 'SATURDAY_SUNDAY':
        matches = dayOfWeek === 6 || dayOfWeek === 0
        break
      case 'EVERY_WEEK':
        matches = dayOfWeek === start.getDay()
        break
      case 'CUSTOM':
        matches = customDays.includes(dayOfWeek)
        break
    }

    if (matches) {
      const retDateObj = new Date(curr)
      retDateObj.setDate(retDateObj.getDate() + Math.max(1, durationDays - 1))
      const returnDateStr = retDateObj.toISOString().split('T')[0]

      const existingId = existingDatesMap.get(dateStr)
      if (existingId) {
        items.push({
          date: dateStr,
          dayName: dayNames[dayOfWeek],
          returnDate: returnDateStr,
          status: 'SKIPPED_EXISTING',
          existingId,
        })
        willSkipCount++
      } else {
        items.push({
          date: dateStr,
          dayName: dayNames[dayOfWeek],
          returnDate: returnDateStr,
          status: 'TO_CREATE',
        })
        willCreateCount++
      }
    }

    curr.setDate(curr.getDate() + 1)
  }

  return {
    items,
    willCreateCount,
    willSkipCount,
    journeyName,
  }
}

export async function executeRecurringDeparturesBatch(
  config: RecurringConfig,
  dryRunItems: DryRunItem[]
): Promise<{ createdCount: number; skippedCount: number }> {
  const toCreate = dryRunItems.filter((i) => i.status === 'TO_CREATE')

  if (toCreate.length === 0) {
    return { createdCount: 0, skippedCount: dryRunItems.length }
  }

  const payloadArray = toCreate.map((item) => ({
    journey_id: config.journeyId,
    departure_date: item.date,
    return_date: item.returnDate,
    base_price: config.price,
    dynamic_price: config.price,
    total_seats: config.totalSeats,
    available_seats: config.totalSeats,
    booked_seats: 0,
    trip_captain_id: config.tripCaptainId || null,
    bus_id: config.busId || null,
    hotel_id: config.hotelId || null,
    status: config.status || 'UPCOMING',
    is_visible: config.isVisible ?? true,
    is_closed: false,
    is_cancelled: false,
    is_sold_out: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))

  const { data: createdRecords, error } = await supabase
    .from('departures')
    .insert(payloadArray as any)
    .select('id, bus_id')

  if (error) {
    throw new Error(`Failed to generate departures batch: ${error.message}`)
  }

  const createdList = (createdRecords ?? []) as { id: string; bus_id?: string | null }[]

  if (config.busId && createdList.length > 0) {
    for (const dep of createdList) {
      try {
        await generateSeatInventory(dep.id, config.busId).catch(() => null)
      } catch (invErr) {
        console.warn(`[Auto Inventory] Failed for departure ${dep.id}:`, invErr)
      }
    }
  }

  return {
    createdCount: createdList.length,
    skippedCount: dryRunItems.length - toCreate.length,
  }
}

export async function bulkUpdateDepartures(
  ids: string[],
  updates: {
    base_price?: number
    total_seats?: number
    trip_captain_id?: string | null
    bus_id?: string | null
    hotel_id?: string | null
    status?: string
    is_visible?: boolean
  }
): Promise<number> {
  if (!ids || ids.length === 0) return 0

  const payload: any = { updated_at: new Date().toISOString() }

  if (typeof updates.base_price === 'number') {
    payload.base_price = updates.base_price
    payload.dynamic_price = updates.base_price
  }
  if (typeof updates.total_seats === 'number') {
    payload.total_seats = updates.total_seats
    payload.available_seats = updates.total_seats
  }
  if (updates.trip_captain_id !== undefined) payload.trip_captain_id = updates.trip_captain_id
  if (updates.bus_id !== undefined) payload.bus_id = updates.bus_id
  if (updates.hotel_id !== undefined) payload.hotel_id = updates.hotel_id
  if (updates.status) payload.status = updates.status
  if (updates.is_visible !== undefined) payload.is_visible = updates.is_visible

  const { error } = await supabase
    .from('departures')
    .update(payload)
    .in('id', ids)

  if (error) throw new Error(error.message)
  return ids.length
}

export async function bulkChangeVisibilityDepartures(ids: string[], isVisible: boolean): Promise<number> {
  if (!ids || ids.length === 0) return 0
  const { error } = await supabase
    .from('departures')
    .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
    .in('id', ids)

  if (error) throw new Error(error.message)
  return ids.length
}

