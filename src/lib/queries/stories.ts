import { supabase } from '@/lib/supabase'
import type {
  Story,
  StoryInsert,
  StoryUpdate,
  PaginatedResult,
  PaginationParams,
} from '@/types/supabase'

const STORY_SELECT = `
  *,
  package:journeys(id, name, slug),
  destination:destinations(id, name, slug)
`

// ==========================================
// LIST — Admin (all statuses)
// ==========================================
export async function getStories(
  params: PaginationParams & {
    status?: string
    category?: string
    packageId?: string
    destinationId?: string
    featured?: boolean
  } = {}
): Promise<PaginatedResult<Story>> {
  const {
    page = 1,
    pageSize = 20,
    search,
    sortBy = 'created_at',
    sortDir = 'desc',
    status,
    category,
    packageId,
    destinationId,
    featured,
  } = params

  let query = supabase
    .from('stories')
    .select(STORY_SELECT, { count: 'exact' })

  if (search) {
    query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,author_name.ilike.%${search}%,college_name.ilike.%${search}%`)
  }
  if (status === 'PUBLISHED') query = query.eq('is_published', true)
  else if (status === 'DRAFT') query = query.eq('is_published', false)
  if (category && category !== 'ALL') query = query.eq('category', category)
  if (packageId) query = query.eq('package_id', packageId)
  if (destinationId) query = query.eq('destination_id', destinationId)
  if (featured !== undefined) query = query.eq('is_featured', featured)

  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as Story[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

// ==========================================
// LIST — Public (published only)
// ==========================================
export async function getPublishedStories(
  params: PaginationParams & {
    category?: string
    packageId?: string
    destinationId?: string
    featured?: boolean
  } = {}
): Promise<PaginatedResult<Story>> {
  const {
    page = 1,
    pageSize = 12,
    search,
    sortBy = 'published_at',
    sortDir = 'desc',
    category,
    packageId,
    destinationId,
    featured,
  } = params

  let query = supabase
    .from('stories')
    .select(STORY_SELECT, { count: 'exact' })
    .eq('is_published', true)

  if (search) {
    query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`)
  }
  if (category && category !== 'ALL') query = query.eq('category', category)
  if (packageId) query = query.eq('package_id', packageId)
  if (destinationId) query = query.eq('destination_id', destinationId)
  if (featured !== undefined) query = query.eq('is_featured', featured)

  query = query.order(sortBy, { ascending: sortDir === 'asc', nullsFirst: false })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as Story[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

// ==========================================
// GET BY ID — Admin
// ==========================================
export async function getStoryById(id: string): Promise<Story | null> {
  const { data, error } = await supabase
    .from('stories')
    .select(STORY_SELECT)
    .eq('id', id)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Story
}

// ==========================================
// GET BY SLUG — Public
// ==========================================
export async function getStoryBySlug(slug: string): Promise<Story | null> {
  const { data, error } = await supabase
    .from('stories')
    .select(STORY_SELECT)
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Story
}

// ==========================================
// GET STORIES BY PACKAGE — Public (for package page)
// ==========================================
export async function getStoriesByPackage(packageId: string, limit = 3): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories')
    .select(STORY_SELECT)
    .eq('package_id', packageId)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []) as Story[]
}

// ==========================================
// GET RELATED STORIES — Public
// ==========================================
export async function getRelatedStories(storyId: string, options: { packageId?: string | null, category?: string, limit?: number } = {}): Promise<Story[]> {
  const { packageId, category, limit = 3 } = options
  let query = supabase
    .from('stories')
    .select(STORY_SELECT)
    .eq('is_published', true)
    .neq('id', storyId)
    .limit(limit)

  if (packageId) {
    query = query.eq('package_id', packageId)
  } else if (category) {
    query = query.eq('category', category)
  }

  query = query.order('published_at', { ascending: false })
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Story[]
}

// ==========================================
// CREATE
// ==========================================
export async function createStory(payload: StoryInsert): Promise<Story> {
  const { data, error } = await supabase
    .from('stories')
    .insert(payload)
    .select(STORY_SELECT)
    .single()
  if (error) throw new Error(error.message)
  return data as Story
}

// ==========================================
// UPDATE
// ==========================================
export async function updateStory(id: string, payload: StoryUpdate): Promise<Story> {
  const { data, error } = await supabase
    .from('stories')
    .update(payload)
    .eq('id', id)
    .select(STORY_SELECT)
    .single()
  if (error) throw new Error(error.message)
  return data as Story
}

// ==========================================
// DELETE
// ==========================================
export async function deleteStory(id: string): Promise<void> {
  const { error } = await supabase.from('stories').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ==========================================
// PUBLISH
// ==========================================
export async function publishStory(id: string): Promise<void> {
  const { error } = await supabase
    .from('stories')
    .update({ is_published: true, published_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// ==========================================
// UNPUBLISH
// ==========================================
export async function unpublishStory(id: string): Promise<void> {
  const { error } = await supabase
    .from('stories')
    .update({ is_published: false })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// ==========================================
// FEATURE / UNFEATURE
// ==========================================
export async function featureStory(id: string, featured: boolean): Promise<void> {
  const { error } = await supabase
    .from('stories')
    .update({ is_featured: featured })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// ==========================================
// DUPLICATE
// ==========================================
export async function duplicateStory(id: string): Promise<Story> {
  const { data: original, error: fetchErr } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .single()
  if (fetchErr || !original) throw new Error(fetchErr?.message ?? 'Story not found')

  const suffix = `-copy-${Date.now().toString(36)}`
  const { id: _id, created_at, updated_at, published_at, views, likes_count, shares_count, ...rest } = original

  const { data, error } = await supabase
    .from('stories')
    .insert({
      ...rest,
      title: `${original.title} (Copy)`,
      slug: `${original.slug}${suffix}`,
      is_published: false,
      is_featured: false,
      published_at: null,
    })
    .select(STORY_SELECT)
    .single()

  if (error) throw new Error(error.message)
  return data as Story
}

// ==========================================
// RECORD VIEW
// ==========================================
export async function recordStoryView(storyId: string, meta?: { userId?: string; device?: string; browser?: string }): Promise<void> {
  try {
    // Insert view record
    await supabase.from('story_views').insert({
      story_id: storyId,
      user_id: meta?.userId ?? null,
      device: meta?.device ?? null,
      browser: meta?.browser ?? null,
    })

    // Increment counter via RPC
    await supabase.rpc('increment_story_views', { p_story_id: storyId })
  } catch (_) {
    // silently fail — analytics should not break UX
  }
}

// ==========================================
// TOGGLE LIKE
// ==========================================
export async function toggleStoryLike(storyId: string, userId: string): Promise<'liked' | 'unliked'> {
  // Check if already liked
  const { data: existing } = await supabase
    .from('story_likes')
    .select('id')
    .eq('story_id', storyId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('story_likes')
      .delete()
      .eq('story_id', storyId)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
    return 'unliked'
  } else {
    const { error } = await supabase
      .from('story_likes')
      .insert({ story_id: storyId, user_id: userId })
    if (error) throw new Error(error.message)
    return 'liked'
  }
}

// ==========================================
// CHECK IF LIKED
// ==========================================
export async function isStoryLiked(storyId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('story_likes')
    .select('id')
    .eq('story_id', storyId)
    .eq('user_id', userId)
    .single()
  return !!data
}

// ==========================================
// ADMIN STATS
// ==========================================
export async function getStoryStats(): Promise<{
  total: number
  published: number
  draft: number
  featured: number
  totalViews: number
}> {
  const { data, error } = await supabase
    .from('stories')
    .select('is_published, is_featured, views')

  if (error) throw new Error(error.message)

  const stories = data ?? []
  return {
    total: stories.length,
    published: stories.filter((s) => s.is_published).length,
    draft: stories.filter((s) => !s.is_published).length,
    featured: stories.filter((s) => s.is_featured).length,
    totalViews: stories.reduce((acc, s) => acc + (s.views || 0), 0),
  }
}

// ==========================================
// BULK DELETE
// ==========================================
export async function bulkDeleteStories(ids: string[]): Promise<void> {
  const { error } = await supabase.from('stories').delete().in('id', ids)
  if (error) throw new Error(error.message)
}

// ==========================================
// BULK STATUS UPDATE
// ==========================================
export async function bulkUpdateStoriesStatus(ids: string[], published: boolean): Promise<void> {
  const { error } = await supabase
    .from('stories')
    .update({
      is_published: published,
      ...(published ? { published_at: new Date().toISOString() } : {}),
    })
    .in('id', ids)
  if (error) throw new Error(error.message)
}
