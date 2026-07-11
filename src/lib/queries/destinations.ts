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
export async function getDestinationBySlug(slug: string): Promise<Destination | null> {
  const { data, error } = await supabase
    .from('destinations')
    .select(DESTINATIONS_SELECT)
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }

  if (!data) return null

  return {
    ...data,
    status: (data as any).is_published ? 'PUBLISHED' : 'DRAFT',
    is_featured: false,
    priority: 0
  } as Destination
}

// ==========================================
// BY ID (admin)
// ==========================================
export async function getDestinationById(id: string): Promise<Destination | null> {
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }

  if (!data) return null

  return {
    ...data,
    status: (data as any).is_published ? 'PUBLISHED' : 'DRAFT',
    is_featured: false,
    priority: 0
  } as Destination
}

// ==========================================
// CREATE
// ==========================================
export async function createDestination(payload: DestinationInsert): Promise<Destination> {
  const { status, is_featured, priority, ...allowedPayload } = payload as any
  const dbPayload = {
    ...allowedPayload,
    is_published: status === 'PUBLISHED'
  }

  const { data, error } = await supabase
    .from('destinations')
    .insert(dbPayload)
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  return {
    ...data,
    status: (data as any).is_published ? 'PUBLISHED' : 'DRAFT',
    is_featured: false,
    priority: 0
  } as Destination
}

// ==========================================
// UPDATE
// ==========================================
export async function updateDestination(id: string, payload: DestinationUpdate): Promise<Destination> {
  const { status, is_featured, priority, ...allowedPayload } = payload as any
  const dbPayload = {
    ...allowedPayload,
    is_published: status === 'PUBLISHED',
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('destinations')
    .update(dbPayload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  return {
    ...data,
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
