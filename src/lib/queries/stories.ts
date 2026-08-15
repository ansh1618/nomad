import { supabase } from '@/lib/supabase'
import type {
  Story,
  StoryInsert,
  StoryUpdate,
  PaginatedResult,
  PaginationParams,
} from '@/types/supabase'

const STORY_SELECT = `*`

function mapStory(raw: any): Story {
  if (!raw) return raw
  let authorObj: any = null
  if (typeof raw.author === 'object' && raw.author !== null) {
    authorObj = raw.author
  } else if (typeof raw.author === 'string' && raw.author.startsWith('{')) {
    try {
      authorObj = JSON.parse(raw.author)
    } catch {
      authorObj = null
    }
  }

  const authorStr = typeof raw.author === 'string' && !raw.author.startsWith('{') ? raw.author : null

  return {
    ...raw,
    id: raw.id,
    slug: raw.slug || `story-${raw.id}`,
    title: raw.title || "Nomadik Traveler Story",
    category: raw.category || "Adventure",
    content: raw.content || raw.snippet || "",
    excerpt: raw.excerpt || raw.snippet || "",
    cover_image: raw.cover_image || raw.featured_image || raw.image_url || "/images/manali/manali-snow-valley.jpg",
    author_name: raw.author_name || authorObj?.name || authorStr || "Nomadik Captain",
    author_image: raw.author_image || raw.seo?.author_image || authorObj?.avatar || "/nomadik-favicon.png",
    author_designation: authorObj?.role || raw.author_designation || "Trip Captain",
    college_name: authorObj?.college || raw.college_name || "Nomadik Traveler",
    reading_time: typeof raw.read_time === 'number' ? raw.read_time : parseInt(String(raw.read_time || raw.reading_time || 4)) || 4,
    views: typeof raw.views === 'number' ? raw.views : 250,
    likes_count: typeof raw.likes_count === 'number' ? raw.likes_count : 18,
    rating: typeof raw.rating === 'number' ? raw.rating : 4.9,
    is_published: !!raw.is_published,
    is_featured: !!raw.is_featured,
    published_at: raw.published_at || raw.created_at || new Date().toISOString(),
  }
}

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
    query = query.or(`title.ilike.%${search}%,snippet.ilike.%${search}%,category.ilike.%${search}%`)
  }
  if (status === 'PUBLISHED') query = query.eq('is_published', true)
  else if (status === 'DRAFT') query = query.eq('is_published', false)
  if (category && category !== 'ALL') query = query.eq('category', category)
  if (featured !== undefined) query = query.eq('is_featured', featured)

  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []).map(mapStory),
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
    featured,
  } = params

  // 1. Primary Source of Truth: Supabase 'blogs' table
  try {
    let query = supabase.from('blogs').select('*', { count: 'exact' }).eq('is_published', true)

    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,category.ilike.%${search}%`)
    }
    if (category && category !== 'ALL') {
      query = query.ilike('category', `%${category}%`)
    }
    if (featured !== undefined) {
      query = query.eq('is_featured', featured)
    }

    query = query.order('created_at', { ascending: false })
    query = query.range((page - 1) * pageSize, page * pageSize - 1)

    const { data, error, count } = await query
    if (!error && data && data.length > 0) {
      const mappedBlogs: Story[] = data.map((b: any) => ({
        id: b.id,
        slug: b.slug,
        title: b.title,
        category: b.category || "ADVENTURE",
        content: b.content || b.excerpt || "",
        excerpt: b.excerpt || "",
        cover_image: b.cover_image || b.featured_image || "/images/manali/manali-snow-valley.jpg",
        author_name: b.author_name || "Nomadik Captain",
        author_image: b.author_image || b.seo?.author_image || "/nomadik-favicon.png",
        author_designation: "Trip Captain",
        college_name: "Nomadik Explorer",
        reading_time: 4,
        views: 280,
        likes_count: 24,
        rating: 4.9,
        is_published: !!b.is_published,
        is_featured: !!b.is_featured,
        published_at: b.published_at || b.created_at || new Date().toISOString(),
      }))

      return {
        data: mappedBlogs,
        total: count ?? mappedBlogs.length,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? mappedBlogs.length) / pageSize),
      }
    }
  } catch (err) {
    console.warn("[getPublishedStories] Exception reading from 'blogs' table:", err)
  }

  // 2. Secondary fallback: 'stories' table
  try {
    let query = supabase
      .from('stories')
      .select(STORY_SELECT, { count: 'exact' })
      .eq('is_published', true)

    if (search) {
      query = query.or(`title.ilike.%${search}%,snippet.ilike.%${search}%`)
    }
    if (category && category !== 'ALL') query = query.eq('category', category)
    if (featured !== undefined) query = query.eq('is_featured', featured)

    query = query.order(sortBy, { ascending: sortDir === 'asc', nullsFirst: false })
    query = query.range((page - 1) * pageSize, page * pageSize - 1)

    const { data, error, count } = await query
    if (!error && data && data.length > 0) {
      return {
        data: (data ?? []).map(mapStory),
        total: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      }
    }
  } catch (err) {
    console.warn("[getPublishedStories] Exception reading from 'stories' table:", err)
  }

  return {
    data: [],
    total: 0,
    page: 1,
    pageSize,
    totalPages: 0,
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
  return mapStory(data)
}

// ==========================================
// GET BY SLUG — Public
// ==========================================
export async function getStoryBySlug(slug: string): Promise<Story | null> {
  const cleanSlug = (slug || "").toLowerCase().trim()

  // 1. Primary Source of Truth: 'blogs' table
  try {
    const { data: blogData } = await supabase
      .from('blogs')
      .select('*')
      .eq('slug', cleanSlug)
      .maybeSingle()

    if (blogData) {
      return {
        id: blogData.id,
        slug: blogData.slug,
        title: blogData.title,
        category: blogData.category || "ADVENTURE",
        content: blogData.content || blogData.excerpt || "",
        excerpt: blogData.excerpt || "",
        cover_image: blogData.cover_image || blogData.featured_image || "/images/manali/manali-snow-valley.jpg",
        featured_image: blogData.featured_image || blogData.cover_image || "",
        author_name: blogData.author_name || "Nomadik Captain",
        author_image: blogData.author_image || blogData.seo?.author_image || "/nomadik-favicon.png",
        author_designation: "Trip Captain",
        college_name: "Nomadik Explorer",
        reading_time: 4,
        views: 280,
        likes_count: 24,
        rating: 4.9,
        is_published: !!blogData.is_published,
        is_featured: !!blogData.is_featured,
        published_at: blogData.published_at || blogData.created_at || new Date().toISOString(),
        seo_title: blogData.seo?.title || blogData.title,
        seo_description: blogData.seo?.description || blogData.excerpt
      } as any
    }
  } catch (err) {
    console.warn("[getStoryBySlug] Exception reading from 'blogs' table:", err)
  }

  // 2. Secondary fallback: 'stories' table
  try {
    const { data, error } = await supabase
      .from('stories')
      .select(STORY_SELECT)
      .eq('slug', cleanSlug)
      .maybeSingle()

    if (data) return mapStory(data)
  } catch {}

  return null
}

// ==========================================
// GET STORIES BY PACKAGE — Public (for package page)
// ==========================================
export async function getStoriesByPackage(packageId: string, limit = 3): Promise<Story[]> {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('is_published', true)
      .limit(limit)
    if (error) return []
    return (data ?? []).map(mapStory)
  } catch {
    return []
  }
}

// ==========================================
// GET RELATED STORIES — Public
// ==========================================
export async function getRelatedStories(storyId: string, options: { packageId?: string | null, category?: string, limit?: number } = {}): Promise<Story[]> {
  const { category, limit = 3 } = options
  let query = supabase
    .from('stories')
    .select(STORY_SELECT)
    .eq('is_published', true)
    .neq('id', storyId)
    .limit(limit)

  if (category && category !== 'ALL') {
    query = query.eq('category', category)
  }

  query = query.order('published_at', { ascending: false })
  const { data, error } = await query
  if (error) return []
  return (data ?? []).map(mapStory)
}
export async function createStory(payload: any): Promise<Story> {
  const dbPayload = {
    title: payload.title,
    slug: payload.slug,
    category: payload.category || 'Adventure',
    snippet: payload.excerpt || payload.snippet || '',
    content: payload.content || '',
    image_url: payload.cover_image || payload.image_url || '/images/destinations/chopta-tungnath-snow.jpg',
    author: {
      name: payload.author_name || 'Nomadik Captain',
      avatar: payload.author_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
      college: payload.college_name || 'DU / IIT',
      role: payload.author_designation || 'Trip Captain',
    },
    read_time: typeof payload.reading_time === 'number' ? payload.reading_time : parseInt(String(payload.reading_time || 4)) || 4,
    rating: payload.rating || 4.9,
    is_published: !!payload.is_published,
    is_featured: !!payload.is_featured,
    published_at: payload.is_published ? new Date().toISOString() : null,
  }

  const { data, error } = await supabase
    .from('stories')
    .insert(dbPayload)
    .select(STORY_SELECT)
    .single()
  if (error) throw new Error(error.message)
  return mapStory(data)
}

// ==========================================
// UPDATE
// ==========================================
export async function updateStory(id: string, payload: any): Promise<Story> {
  const dbPayload: any = {}
  if (payload.title !== undefined) dbPayload.title = payload.title
  if (payload.slug !== undefined) dbPayload.slug = payload.slug
  if (payload.category !== undefined) dbPayload.category = payload.category
  if (payload.excerpt !== undefined || payload.snippet !== undefined) dbPayload.snippet = payload.excerpt || payload.snippet
  if (payload.content !== undefined) dbPayload.content = payload.content
  if (payload.cover_image !== undefined || payload.image_url !== undefined) dbPayload.image_url = payload.cover_image || payload.image_url
  if (payload.author_name !== undefined || payload.author_image !== undefined || payload.college_name !== undefined) {
    dbPayload.author = {
      name: payload.author_name || 'Nomadik Captain',
      avatar: payload.author_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
      college: payload.college_name || 'DU / IIT',
      role: payload.author_designation || 'Trip Captain',
    }
  }
  if (payload.reading_time !== undefined) {
    dbPayload.read_time = typeof payload.reading_time === 'number' ? payload.reading_time : parseInt(String(payload.reading_time || 4)) || 4
  }
  if (payload.rating !== undefined) dbPayload.rating = payload.rating
  if (payload.is_published !== undefined) {
    dbPayload.is_published = payload.is_published
    if (payload.is_published) dbPayload.published_at = new Date().toISOString()
  }
  if (payload.is_featured !== undefined) dbPayload.is_featured = payload.is_featured

  const { data, error } = await supabase
    .from('stories')
    .update(dbPayload)
    .eq('id', id)
    .select(STORY_SELECT)
    .single()
  if (error) throw new Error(error.message)
  return mapStory(data)
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
