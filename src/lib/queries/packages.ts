import { supabase } from '@/lib/supabase'
import type {
  Journey,
  JourneyInsert,
  JourneyUpdate,
  ItineraryDay,
  ItineraryDayInsert,
  ItineraryDayUpdate,
  PaginatedResult,
  PaginationParams,
  PackagePerformance,
} from '@/types/supabase'

function normalizeItineraryDays(days: any[]): ItineraryDay[] {
  if (!days) return []
  return days.map(d => {
    let mealsObj = { breakfast: false, lunch: false, dinner: false };
    if (d.meals) {
      if (Array.isArray(d.meals)) {
        d.meals.forEach((m: string) => {
          const key = m.toLowerCase().trim();
          if (key === 'breakfast' || key === 'b') mealsObj.breakfast = true;
          if (key === 'lunch' || key === 'l') mealsObj.lunch = true;
          if (key === 'dinner' || key === 'd') mealsObj.dinner = true;
        });
      } else if (typeof d.meals === 'object') {
        mealsObj = {
          breakfast: !!d.meals.breakfast,
          lunch: !!d.meals.lunch,
          dinner: !!d.meals.dinner,
        };
      }
    }
    return {
      ...d,
      meals: mealsObj,
    };
  });
}

const JOURNEY_SELECT = `
  *,
  destinations(id, slug, name, state, country, hero_image),
  itinerary_days(*),
  package_faqs(id, display_order, faq_library(*)),
  custom_package_faqs(*),
  transport(*),
  hotels:hotels(*, hotel_rooms(*))
`

const JOURNEY_LIST_SELECT = `
  *,
  destinations(id, slug, name, state, country)
`

// ==========================================
// LIST (Admin — all statuses)
// ==========================================
export async function getPackages(
  params: PaginationParams & {
    status?: string
    destinationId?: string
    featured?: boolean
  } = {}
): Promise<PaginatedResult<Journey>> {
  const { page = 1, pageSize = 20, search, sortBy = 'created_at', sortDir = 'desc', status, destinationId, featured } = params

  let query = supabase.from('journeys').select(JOURNEY_LIST_SELECT, { count: 'exact' }).eq('is_deleted', false)

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,tagline.ilike.%${search}%`)
  }
  if (status) query = query.eq('status', status)
  if (destinationId) query = query.eq('destination_id', destinationId)
  if (featured !== undefined) query = query.eq('is_featured', featured)

  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as Journey[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

// ==========================================
// PUBLIC: Published packages for frontend
// ==========================================
export async function getPublishedPackages(destinationId?: string): Promise<Journey[]> {
  try {
    let query = supabase
      .from('journeys')
      .select(JOURNEY_LIST_SELECT)
      .eq('status', 'PUBLISHED')
      .order('priority', { ascending: false })

    if (destinationId) query = query.eq('destination_id', destinationId)

    const { data, error } = await query
    if (!error) return (data ?? []) as Journey[]
  } catch (e) {
    console.warn('Modern getPublishedPackages failed, falling back:', e)
  }

  // Fallback: legacy query (no status/priority columns)
  let fallbackQuery = supabase
    .from('journeys')
    .select('*, destinations(id, slug, name)')
  if (destinationId) fallbackQuery = fallbackQuery.eq('destination_id', destinationId)
  const { data: legacyData, error: legacyError } = await fallbackQuery
  if (legacyError) throw new Error(legacyError.message)
  return (legacyData ?? []) as any[]
}

export async function getFeaturedPackages(): Promise<Journey[]> {
  try {
    const { data, error } = await supabase
      .from('journeys')
      .select(JOURNEY_LIST_SELECT)
      .eq('status', 'PUBLISHED')
      .eq('is_featured', true)
      .order('priority', { ascending: false })
      .limit(6)

    if (!error) return (data ?? []) as Journey[]
  } catch (e) {
    console.warn('Modern getFeaturedPackages failed, falling back:', e)
  }

  // Fallback: legacy query
  const { data: legacyData, error: legacyError } = await supabase
    .from('journeys')
    .select('*, destinations(id, slug, name)')
    .limit(6)
  if (legacyError) throw new Error(legacyError.message)
  return (legacyData ?? []) as any[]
}

// ==========================================
// BY SLUG (full detail for package page)
// ==========================================
export async function getPackageBySlug(slug: string): Promise<Journey | null> {
  let journey: Journey | null = null

  // --- Attempt 1: join-based query (ideal) ---
  try {
    const { data, error } = await supabase
      .from('journeys')
      .select(JOURNEY_SELECT)
      .eq('slug', slug)
      .single()

    if (!error && data) {
      journey = data as Journey
    } else if (error && error.code !== 'PGRST116') {
      console.warn('[getPackageBySlug] join query failed, using fallback:', error.message)
    } else if (error?.code === 'PGRST116') {
      return null
    }
  } catch (e) {
    console.warn('[getPackageBySlug] exception during join query, using fallback:', e)
  }

  // --- Attempt 2: separate queries (when join fails due to missing relation) ---
  if (!journey) {
    const { data: baseData, error: baseError } = await supabase
      .from('journeys')
      .select('*, destinations(id, slug, name, state, country, hero_image)')
      .eq('slug', slug)
      .single()

    if (baseError) {
      if (baseError.code === 'PGRST116') return null
      throw new Error(baseError.message)
    }
    journey = baseData as any
  }

  if (!journey) return null

  // --- Ensure itinerary_days are loaded from its own table ---
  const hasRealDays = journey.itinerary_days && journey.itinerary_days.length > 0

  if (!hasRealDays) {
    try {
      const { data: days, error: daysError } = await supabase
        .from('itinerary_days')
        .select('*')
        .eq('journey_id', journey.id)
        .order('sort_order', { ascending: true })
        .order('day_number', { ascending: true })

      if (!daysError && days) {
        journey = { ...journey, itinerary_days: days as ItineraryDay[] }
      }
    } catch (e) {
      console.warn('[getPackageBySlug] Could not fetch itinerary_days separately:', e)
    }
  }

  // Ensure itinerary_days defaults to empty array if still null/undefined
  if (!journey.itinerary_days) {
    journey.itinerary_days = []
  } else {
    journey.itinerary_days = normalizeItineraryDays(journey.itinerary_days)
  }

  // Sort itinerary days
  if (journey.itinerary_days && journey.itinerary_days.length > 0) {
    journey.itinerary_days = [...journey.itinerary_days].sort(
      (a: ItineraryDay, b: ItineraryDay) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.day_number - b.day_number
    )
  }

  // Fetch transport separately if not present
  if (!journey.transport) {
    try {
      const { data: trans, error: transError } = await supabase
        .from('transport')
        .select('*')
        .eq('package_id', journey.id)
      if (!transError && trans) {
        journey = { ...journey, transport: trans as any[] }
      }
    } catch (e) {
      console.warn('[getPackageBySlug] Could not fetch transport separately:', e)
    }
  }

  // Fetch accommodation separately if not present
  if (!journey.accommodation) {
    try {
      const { data: acc, error: accError } = await supabase
        .from('accommodation')
        .select('*')
        .eq('package_id', journey.id)
      if (!accError && acc) {
        journey = { ...journey, accommodation: acc as any[] }
      }
    } catch (e) {
      console.warn('[getPackageBySlug] Could not fetch accommodation separately:', e)
    }
  }

  const j = journey as any
  if (j.price && !journey.starting_price) journey = { ...journey, starting_price: Number(j.price) }
  if (j.gallery?.length > 0 && !journey.hero_banner) journey = { ...journey, hero_banner: j.gallery[0] }

  return journey
}


// ==========================================
// BY ID (admin form)
// ==========================================
export async function getPackageById(id: string): Promise<Journey | null> {
  let journey: Journey | null = null

  // --- Attempt 1: join-based query ---
  try {
    const { data, error } = await supabase
      .from('journeys')
      .select(JOURNEY_SELECT)
      .eq('id', id)
      .single()

    if (!error && data) {
      journey = data as Journey
    } else if (error && error.code !== 'PGRST116') {
      console.warn('[getPackageById] join query failed, using fallback:', error.message)
    } else if (error?.code === 'PGRST116') {
      return null
    }
  } catch (e) {
    console.warn('[getPackageById] exception during join query, using fallback:', e)
  }

  // --- Attempt 2: separate base query ---
  if (!journey) {
    const { data: baseData, error: baseError } = await supabase
      .from('journeys')
      .select('*, destinations(id, slug, name, state, country, hero_image)')
      .eq('id', id)
      .single()

    if (baseError) {
      if (baseError.code === 'PGRST116') return null
      throw new Error(baseError.message)
    }
    journey = baseData as any
  }

  if (!journey) return null

  // --- Always fetch itinerary_days from its own table ---
  const hasRealDays = journey.itinerary_days && journey.itinerary_days.length > 0

  if (!hasRealDays) {
    try {
      const { data: days, error: daysError } = await supabase
        .from('itinerary_days')
        .select('*')
        .eq('journey_id', journey.id)
        .order('sort_order', { ascending: true })
        .order('day_number', { ascending: true })

      if (!daysError && days) {
        journey = { ...journey, itinerary_days: days as ItineraryDay[] }
      }
    } catch (e) {
      console.warn('[getPackageById] Could not fetch itinerary_days separately:', e)
    }
  }

  // Ensure itinerary_days defaults to empty array if still null/undefined
  if (!journey.itinerary_days) {
    journey.itinerary_days = []
  } else {
    journey.itinerary_days = normalizeItineraryDays(journey.itinerary_days)
  }

  // Sort
  if (journey.itinerary_days && journey.itinerary_days.length > 0) {
    journey.itinerary_days = [...journey.itinerary_days].sort(
      (a: ItineraryDay, b: ItineraryDay) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.day_number - b.day_number
    )
  }

  // Fetch transport separately if not present
  if (!journey.transport) {
    try {
      const { data: trans, error: transError } = await supabase
        .from('transport')
        .select('*')
        .eq('package_id', journey.id)
      if (!transError && trans) {
        journey = { ...journey, transport: trans as any[] }
      }
    } catch (e) {
      console.warn('[getPackageById] Could not fetch transport separately:', e)
    }
  }

  // Fetch accommodation separately if not present
  if (!journey.accommodation) {
    try {
      const { data: acc, error: accError } = await supabase
        .from('accommodation')
        .select('*')
        .eq('package_id', journey.id)
      if (!accError && acc) {
        journey = { ...journey, accommodation: acc as any[] }
      }
    } catch (e) {
      console.warn('[getPackageById] Could not fetch accommodation separately:', e)
    }
  }

  // Legacy price/banner compat
  const j = journey as any
  if (j.price && !journey.starting_price) journey = { ...journey, starting_price: Number(j.price) }
  if (j.gallery?.length > 0 && !journey.hero_banner) journey = { ...journey, hero_banner: j.gallery[0] }

  return journey
}


// ==========================================
// CREATE
// ==========================================
export async function createPackage(payload: JourneyInsert): Promise<Journey> {
  try {
    const { data, error } = await supabase
      .from('journeys')
      .insert(payload)
      .select('*')
      .single()

    if (!error) return data as Journey
  } catch (e) {
    console.warn('Modern createPackage failed, falling back:', e)
  }

  // Legacy fallback payload construction
  const legacyPayload = {
    destination_id: payload.destination_id,
    slug: payload.slug,
    name: payload.name,
    price: payload.starting_price ?? 0,
    duration: payload.duration,
    transport: payload.transport,
    difficulty: payload.difficulty || 'Easy',
    pickup_point: payload.pickup_point,
    drop_point: payload.drop_point,
    gallery: payload.hero_banner ? [payload.hero_banner] : [],
  }

  const { data: legacyData, error: legacyError } = await supabase
    .from('journeys')
    .insert(legacyPayload)
    .select('*')
    .single()

  if (legacyError) throw new Error(legacyError.message)
  return legacyData as Journey
}

// ==========================================
// UPDATE
// ==========================================
export async function updatePackage(id: string, payload: JourneyUpdate): Promise<Journey> {
  try {
    const { data, error } = await supabase
      .from('journeys')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (!error) return data as Journey
  } catch (e) {
    console.warn('Modern updatePackage failed, falling back:', e)
  }

  // Legacy fallback payload construction
  const legacyPayload = {
    destination_id: payload.destination_id,
    slug: payload.slug,
    name: payload.name,
    price: payload.starting_price ?? 0,
    duration: payload.duration,
    transport: payload.transport,
    difficulty: payload.difficulty || 'Easy',
    pickup_point: payload.pickup_point,
    drop_point: payload.drop_point,
    gallery: payload.hero_banner ? [payload.hero_banner] : [],
  }

  const { data: legacyData, error: legacyError } = await supabase
    .from('journeys')
    .update(legacyPayload)
    .eq('id', id)
    .select('*')
    .single()

  if (legacyError) throw new Error(legacyError.message)
  return legacyData as Journey
}

// ==========================================
// DELETE / ARCHIVE / PUBLISH
// ==========================================
export async function deletePackage(id: string): Promise<void> {
  const { error } = await supabase.from('journeys').update({ is_deleted: true, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function archivePackage(id: string): Promise<void> {
  const { error } = await supabase
    .from('journeys')
    .update({ status: 'ARCHIVED', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function publishPackage(id: string): Promise<void> {
  const { error } = await supabase
    .from('journeys')
    .update({ status: 'PUBLISHED', is_published: true, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// ==========================================
// BULK OPERATIONS
// ==========================================
export async function bulkDeletePackages(ids: string[]): Promise<void> {
  const { error } = await supabase.from('journeys').update({ is_deleted: true, updated_at: new Date().toISOString() }).in('id', ids)
  if (error) throw new Error(error.message)
}

export async function bulkUpdatePackagesStatus(ids: string[], status: string): Promise<void> {
  const { error } = await supabase
    .from('journeys')
    .update({ status, updated_at: new Date().toISOString() })
    .in('id', ids)
  if (error) throw new Error(error.message)
}

// ==========================================
// SLUG CHECK
// ==========================================
export async function checkPackageSlug(slug: string, excludeId?: string): Promise<boolean> {
  let query = supabase.from('journeys').select('id').eq('slug', slug)
  if (excludeId) query = query.neq('id', excludeId)
  const { data } = await query
  return (data?.length ?? 0) === 0
}

// ==========================================
// ITINERARY DAYS (separate table)
// ==========================================
export async function getItineraryDays(journeyId: string): Promise<ItineraryDay[]> {
  const { data, error } = await supabase
    .from('itinerary_days')
    .select('*')
    .eq('journey_id', journeyId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return normalizeItineraryDays(data ?? [])
}

export async function upsertItineraryDay(payload: ItineraryDayInsert): Promise<ItineraryDay> {
  const { data, error } = await supabase
    .from('itinerary_days')
    .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: 'journey_id,day_number' })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as ItineraryDay
}

export async function updateItineraryDay(id: string, payload: ItineraryDayUpdate): Promise<ItineraryDay> {
  const { data, error } = await supabase
    .from('itinerary_days')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as ItineraryDay
}

export async function deleteItineraryDay(id: string): Promise<void> {
  const { error } = await supabase.from('itinerary_days').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function replaceItineraryDays(journeyId: string, days: Omit<ItineraryDayInsert, 'journey_id'>[]): Promise<ItineraryDay[]> {
  console.log('[replaceItineraryDays] Starting save for Package ID:', journeyId)
  console.log('[replaceItineraryDays] Payload:', days)

  try {
    // 1. Delete all existing days
    const { error: deleteError } = await supabase.from('itinerary_days').delete().eq('journey_id', journeyId)
    if (deleteError) {
      console.error('[replaceItineraryDays] Delete error:', deleteError)
      throw new Error(`Failed to clear existing itinerary: ${deleteError.message}`)
    }

    if (days.length === 0) {
      console.log('[replaceItineraryDays] No days provided. Returning empty.')
      return []
    }

    // 2. Format payload
    const payload = days.map((d, i) => {
      const dayNum = d.day_number || (i + 1);

      // Convert meals to text[] array / JSON array for database compatibility
      let mealsArr: string[] = [];
      if (d.meals) {
        if (Array.isArray(d.meals)) {
          mealsArr = d.meals;
        } else if (typeof d.meals === 'object') {
          if ((d.meals as any).breakfast) mealsArr.push('breakfast');
          if ((d.meals as any).lunch) mealsArr.push('lunch');
          if ((d.meals as any).dinner) mealsArr.push('dinner');
        }
      }

      return {
        journey_id: journeyId,
        day_number: dayNum,
        title: d.title || `Day ${dayNum}`,
        description: d.description || '',
        meals: mealsArr,
        stay: d.stay || '',
        transport: d.transport || '',
        image_url: d.image_url || null,
        is_highlight: d.is_highlight || false,
        sort_order: i,
      }
    })

    // Log before saving as requested
    console.log("Itinerary payload", payload);
    console.log(Array.isArray(payload));

    // 3. Bulk insert to itinerary_days
    const { data, error: insertError } = await supabase
      .from('itinerary_days')
      .insert(payload)
      .select('*')

    console.log('[replaceItineraryDays] Supabase Response:', { data, error: insertError })

    if (insertError) {
      console.error('[replaceItineraryDays] Insert failed:', insertError)
      throw new Error(`Itinerary save failed: ${insertError.message}`)
    }

    // 4. Query again to verify count and data matches
    const { data: verifiedRows, error: verifyError } = await supabase
      .from('itinerary_days')
      .select('*')
      .eq('journey_id', journeyId)

    console.log('[replaceItineraryDays] Verified Returned Rows:', verifiedRows)

    if (verifyError) {
      console.error('[replaceItineraryDays] Verification query failed:', verifyError)
      throw new Error(`Itinerary verification query failed: ${verifyError.message}`)
    }

    if ((verifiedRows?.length ?? 0) !== payload.length) {
      console.error('[replaceItineraryDays] Count mismatch! Expected:', payload.length, 'Got:', verifiedRows?.length)
      throw new Error(`Itinerary validation mismatch: expected ${payload.length} records, database has ${verifiedRows?.length ?? 0}`)
    }

    return normalizeItineraryDays(verifiedRows ?? [])
  } catch (e: any) {
    console.error('[replaceItineraryDays] Unexpected exception:', e)
    throw e;
  }
}

// ==========================================
// ANALYTICS: Package performance
// ==========================================
export async function getPackagePerformance(): Promise<PackagePerformance[]> {
  const { data, error } = await supabase
    .from('v_package_performance')
    .select('*')
    .limit(10)

  if (error) throw new Error(error.message)
  return (data ?? []) as PackagePerformance[]
}

// ==========================================
// RELATED PACKAGES (by same destination)
// ==========================================
export async function getRelatedPackages(journeyId: string, destinationId: string, limit = 3): Promise<Journey[]> {
  try {
    const { data, error } = await supabase
      .from('journeys')
      .select(JOURNEY_LIST_SELECT)
      .eq('destination_id', destinationId)
      .eq('status', 'PUBLISHED')
      .neq('id', journeyId)
      .limit(limit)

    if (!error) return (data ?? []) as Journey[]
  } catch (e) {
    console.warn('Modern getRelatedPackages failed, falling back:', e)
  }

  // Fallback: legacy query
  const { data: legacyData, error: legacyError } = await supabase
    .from('journeys')
    .select('*, destinations(id, slug, name)')
    .eq('destination_id', destinationId)
    .neq('id', journeyId)
    .limit(limit)

  if (legacyError) throw new Error(legacyError.message)
  return (legacyData ?? []) as any[]
}

// ==========================================
// SAVE REVISION
// ==========================================
export async function savePackageRevision(journeyId: string, revisionData: Journey, adminId?: string): Promise<void> {
  const { error } = await supabase.from('package_revisions').insert({
    journey_id: journeyId,
    revision_data: revisionData as unknown as Record<string, unknown>,
    created_by: adminId ?? null,
  })
  if (error) console.error('Failed to save revision:', error.message)
}

// ==========================================
// GET REVISIONS
// ==========================================
export async function getPackageRevisions(journeyId: string) {
  const { data, error } = await supabase
    .from('package_revisions')
    .select('id, revision_note, created_at, admins(email, full_name)')
    .eq('journey_id', journeyId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw new Error(error.message)
  return data ?? []
}

// ==========================================
// DUPLICATE PACKAGE
// ==========================================
export async function duplicatePackage(id: string): Promise<Journey> {
  const original = await getPackageById(id)
  if (!original) throw new Error('Package not found')

  const uniqueSuffix = Math.random().toString(36).substring(2, 6)
  const newSlug = `${original.slug}-copy-${uniqueSuffix}`
  const newName = `${original.name} (Copy)`

  const {
    id: _,
    created_at: _2,
    updated_at: _3,
    avg_rating: _4,
    review_count: _5,
    booking_count: _6,
    itinerary_days: originalDays,
    destinations: _7,
    trip_captains: _8,
    ...rest
  } = original as any

  const payload = {
    ...rest,
    name: newName,
    slug: newSlug,
    status: 'DRAFT',
    is_published: false,
    is_featured: false,
  }

  const { data: newJourney, error: insertError } = await supabase
    .from('journeys')
    .insert(payload)
    .select('*')
    .single()

  if (insertError) throw new Error(`Failed to create duplicate package: ${insertError.message}`)

  if (originalDays && originalDays.length > 0) {
    const daysToInsert = originalDays.map((day: any) => {
      const { id: _dId, created_at: _dC, updated_at: _dU, journey_id: _dJ, ...dayRest } = day
      return {
        ...dayRest,
        journey_id: newJourney.id,
      }
    })

    const { error: daysError } = await supabase
      .from('itinerary_days')
      .insert(daysToInsert)

    if (daysError) {
      console.warn('Failed to duplicate itinerary days:', daysError.message)
    }
  }

  return newJourney as Journey
}
