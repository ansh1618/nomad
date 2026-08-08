import { supabase } from '@/lib/supabase'
import type {
  Destination,
  DestinationInsert,
  DestinationUpdate,
  PaginatedResult,
  PaginationParams,
} from '@/types/supabase'

const DESTINATIONS_SELECT = `
  *,
  journeys(id, slug, name, starting_price, duration, difficulty, status, is_published)
`

// ==========================================
// LIST
// ==========================================
export async function getDestinations(
  params: PaginationParams & {
    status?: string
    featured?: boolean
  } = {}
): Promise<PaginatedResult<Destination>> {
  const { page = 1, pageSize = 20, search, sortBy = 'priority', sortDir = 'desc', status, featured } = params

  let query = supabase.from('destinations').select('*', { count: 'exact' }).eq('is_deleted', false)

  if (search) {
    query = query.or(`name.ilike.%${search}%,state.ilike.%${search}%,country.ilike.%${search}%`)
  }
  
  if (status) {
    query = query.eq('is_published', status === 'PUBLISHED')
  }

  // Fallback sorting since priority column does not exist
  const actualSortBy = sortBy === 'priority' ? 'name' : sortBy
  query = query.order(actualSortBy, { ascending: sortDir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  const mappedData = (data ?? []).map((d: any) => ({
    ...d,
    status: d.is_published ? 'PUBLISHED' : 'DRAFT',
    is_featured: false,
    priority: 0
  })) as Destination[]

  return {
    data: mappedData,
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

// ==========================================
// PUBLIC: Published destinations for frontend
// ==========================================
export async function getPublishedDestinations(): Promise<Destination[]> {
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('is_published', true)
    .eq('is_deleted', false)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((d: any) => ({
    ...d,
    status: d.is_published ? 'PUBLISHED' : 'DRAFT',
    is_featured: false,
    priority: 0
  })) as Destination[]
}

export async function getFeaturedDestinations(): Promise<Destination[]> {
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('is_published', true)
    .eq('is_deleted', false)
    .order('name', { ascending: true })
    .limit(6)

  if (error) throw new Error(error.message)

  return (data ?? []).map((d: any) => ({
    ...d,
    status: d.is_published ? 'PUBLISHED' : 'DRAFT',
    is_featured: false,
    priority: 0
  })) as Destination[]
}

// ==========================================
// BY SLUG
// ==========================================
export async function getDestinationBySlug(slug: any): Promise<Destination | null> {
  const cleanSlug = String(slug ?? "").toLowerCase().trim();

  // Attempt 1: Exact slug match
  let { data, error } = await supabase
    .from('destinations')
    .select(DESTINATIONS_SELECT)
    .eq('slug', cleanSlug)
    .maybeSingle();

  // Attempt 2: Prefix / partial match on slug
  if (!data) {
    const { data: prefixData } = await supabase
      .from('destinations')
      .select(DESTINATIONS_SELECT)
      .ilike('slug', `${cleanSlug}%`)
      .limit(1);

    if (prefixData && prefixData.length > 0) {
      data = prefixData[0];
    }
  }

  // Attempt 3: Match on name
  if (!data) {
    const { data: nameData } = await supabase
      .from('destinations')
      .select(DESTINATIONS_SELECT)
      .ilike('name', `%${cleanSlug}%`)
      .limit(1);

    if (nameData && nameData.length > 0) {
      data = nameData[0];
    }
  }

  if (!data) return null;

  return {
    ...data,
    region: (data as any).region ?? null,
    faqs: (data as any).faqs ?? [],
    gallery: Array.isArray((data as any).gallery) ? (data as any).gallery : [],
    things_to_do: Array.isArray((data as any).things_to_do) ? (data as any).things_to_do : [],
    status: (data as any).is_published ? 'PUBLISHED' : 'DRAFT',
    is_featured: false,
    priority: 0
  } as Destination;
}

// ==========================================
// BY ID (admin)
// ==========================================
export async function getDestinationById(id: string): Promise<Destination | null> {
  let { data, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.warn('[getDestinationById] Select * failed, retrying core select:', error.message)
    const { data: fallbackData } = await supabase
      .from('destinations')
      .select('id, name, slug, subtitle, description, hero_image, hero_video, gallery, things_to_do, country, state, is_published, created_at, updated_at')
      .eq('id', id)
      .maybeSingle()
    if (fallbackData) {
      data = fallbackData
    }
  }

  if (!data) return null

  return {
    ...data,
    region: (data as any).region ?? null,
    faqs: (data as any).faqs ?? [],
    gallery: Array.isArray((data as any).gallery) ? (data as any).gallery : [],
    things_to_do: Array.isArray((data as any).things_to_do) ? (data as any).things_to_do : [],
    status: (data as any).is_published ? 'PUBLISHED' : 'DRAFT',
    is_featured: false,
    priority: 0
  } as Destination
}

// ==========================================
// CREATE
// ==========================================
export async function createDestination(payload: DestinationInsert): Promise<Destination> {
  const p = payload as any
  const fullPayload: any = {
    name: p.name,
    slug: p.slug,
    subtitle: p.subtitle || null,
    country: p.country || 'India',
    state: p.state || null,
    description: p.description || null,
    hero_image: p.hero_image || null,
    hero_video: p.hero_video || null,
    gallery: Array.isArray(p.gallery) ? p.gallery : [],
    things_to_do: Array.isArray(p.things_to_do) ? p.things_to_do : [],
    is_published: (p.status || 'DRAFT').toString().toUpperCase().trim() === 'PUBLISHED',
  }
  if (p.created_by) fullPayload.created_by = p.created_by
  if (p.updated_by) fullPayload.updated_by = p.updated_by

  let res = await supabase
    .from('destinations')
    .insert(fullPayload)
    .select('*')
    .single()

  if (res.error && (res.error.message?.includes('column') || res.error.message?.includes('schema cache'))) {
    console.warn('[createDestination] Initial payload failed, retrying safe payload:', res.error.message)
    const safePayload = {
      name: p.name,
      slug: p.slug,
      subtitle: p.subtitle || null,
      description: p.description || null,
      hero_image: p.hero_image || null,
      gallery: Array.isArray(p.gallery) ? p.gallery : [],
      things_to_do: Array.isArray(p.things_to_do) ? p.things_to_do : [],
      is_published: (p.status || 'DRAFT').toString().toUpperCase().trim() === 'PUBLISHED',
    }
    res = await supabase
      .from('destinations')
      .insert(safePayload)
      .select('*')
      .single()
  }

  if (res.error) throw new Error(res.error.message)

  const data = res.data
  return {
    ...data,
    region: (data as any).region ?? null,
    faqs: (data as any).faqs ?? [],
    gallery: Array.isArray((data as any).gallery) ? (data as any).gallery : [],
    things_to_do: Array.isArray((data as any).things_to_do) ? (data as any).things_to_do : [],
    status: (data as any).is_published ? 'PUBLISHED' : 'DRAFT',
    is_featured: false,
    priority: 0
  } as Destination
}

// ==========================================
// UPDATE
// ==========================================
export async function updateDestination(id: string, payload: DestinationUpdate): Promise<Destination> {
  const p = payload as any
  const fullPayload: any = {
    name: p.name,
    slug: p.slug,
    subtitle: p.subtitle || null,
    country: p.country || 'India',
    state: p.state || null,
    description: p.description || null,
    hero_image: p.hero_image || null,
    hero_video: p.hero_video || null,
    gallery: Array.isArray(p.gallery) ? p.gallery : [],
    things_to_do: Array.isArray(p.things_to_do) ? p.things_to_do : [],
    is_published: (p.status || 'DRAFT').toString().toUpperCase().trim() === 'PUBLISHED',
    updated_at: new Date().toISOString()
  }
  if (p.updated_by) fullPayload.updated_by = p.updated_by

  let res = await supabase
    .from('destinations')
    .update(fullPayload)
    .eq('id', id)
    .select('*')
    .single()

  if (res.error && (res.error.message?.includes('column') || res.error.message?.includes('schema cache'))) {
    console.warn('[updateDestination] Initial update failed, retrying safe payload:', res.error.message)
    const safePayload = {
      name: p.name,
      slug: p.slug,
      subtitle: p.subtitle || null,
      description: p.description || null,
      hero_image: p.hero_image || null,
      gallery: Array.isArray(p.gallery) ? p.gallery : [],
      things_to_do: Array.isArray(p.things_to_do) ? p.things_to_do : [],
      is_published: (p.status || 'DRAFT').toString().toUpperCase().trim() === 'PUBLISHED',
      updated_at: new Date().toISOString()
    }
    res = await supabase
      .from('destinations')
      .update(safePayload)
      .eq('id', id)
      .select('*')
      .single()
  }

  if (res.error) throw new Error(res.error.message)

  const data = res.data
  return {
    ...data,
    region: (data as any).region ?? null,
    faqs: (data as any).faqs ?? [],
    gallery: Array.isArray((data as any).gallery) ? (data as any).gallery : [],
    things_to_do: Array.isArray((data as any).things_to_do) ? (data as any).things_to_do : [],
    status: (data as any).is_published ? 'PUBLISHED' : 'DRAFT',
    is_featured: false,
    priority: 0
  } as Destination
}

// ==========================================
// DELETE
// ==========================================
export async function deleteDestination(id: string): Promise<void> {
  const { error } = await supabase
    .from('destinations')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// Soft delete = archive
export async function archiveDestination(id: string): Promise<void> {
  const { error } = await supabase
    .from('destinations')
    .update({ is_published: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function publishDestination(id: string): Promise<void> {
  const { error } = await supabase
    .from('destinations')
    .update({ is_published: true, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ==========================================
// BULK OPERATIONS
// ==========================================
export async function bulkDeleteDestinations(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('destinations')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .in('id', ids)

  if (error) throw new Error(error.message)
}

export async function bulkUpdateDestinationsStatus(ids: string[], status: string): Promise<void> {
  const { error } = await supabase
    .from('destinations')
    .update({ is_published: status === 'PUBLISHED', updated_at: new Date().toISOString() })
    .in('id', ids)

  if (error) throw new Error(error.message)
}

// ==========================================
// SLUG CHECK
// ==========================================
export async function checkDestinationSlug(slug: string, excludeId?: string): Promise<boolean> {
  let query = supabase.from('destinations').select('id').eq('slug', slug)
  if (excludeId) query = query.neq('id', excludeId)

  const { data } = await query
  return (data?.length ?? 0) === 0 // true = available
}
