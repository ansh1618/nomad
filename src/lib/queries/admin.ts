import { supabase } from '@/lib/supabase'
import type {
  Coupon,
  CouponInsert,
  CouponUpdate,
  Review,
  ReviewInsert,
  ReviewUpdate,
  Inquiry,
  InquiryInsert,
  InquiryUpdate,
  Blog,
  BlogInsert,
  BlogUpdate,
  TripCaptain,
  TripCaptainInsert,
  TripCaptainUpdate,
  MediaAsset,
  MediaAssetInsert,
  Banner,
  CmsSection,
  CmsSectionUpdate,
  ActivityLog,
  DashboardStats,
  MonthlyRevenue,
  PaginatedResult,
  PaginationParams,
  SiteUser,
  WalletTransaction,
  Payment,
  PaymentInsert,
  Notification,
} from '@/types/supabase'

// ==========================================
// COUPONS
// ==========================================
export async function getCoupons(params: PaginationParams = {}): Promise<PaginatedResult<Coupon>> {
  const { page = 1, pageSize = 20, search, sortBy = 'created_at', sortDir = 'desc' } = params

  let query = supabase.from('coupons').select('*', { count: 'exact' })
  if (search) query = query.or(`code.ilike.%${search}%,description.ilike.%${search}%`)
  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as Coupon[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getCouponById(id: string): Promise<Coupon | null> {
  const { data, error } = await supabase.from('coupons').select('*').eq('id', id).single()
  if (error) { if (error.code === 'PGRST116') return null; throw new Error(error.message) }
  return data as Coupon
}

export async function validateCoupon(code: string, userId?: string, amount?: number, bookingId?: string): Promise<{ valid: boolean; coupon?: Coupon; discount?: number; message?: string }> {
  const codeUpper = code.toUpperCase().trim();
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', codeUpper)
    .eq('is_active', true)
    .single()

  if (error || !coupon) return { valid: false, message: 'Invalid or inactive coupon code' }

  const now = new Date()
  if (coupon.valid_until && new Date(coupon.valid_until) < now) return { valid: false, message: 'Coupon has expired' }
  if (coupon.valid_from && new Date(coupon.valid_from) > now) return { valid: false, message: 'Coupon is not yet active' }
  
  const maxUses = coupon.max_redemptions ?? coupon.max_uses;
  const usedCount = coupon.current_redemptions ?? coupon.used_count ?? 0;
  if (maxUses && usedCount >= maxUses) return { valid: false, message: 'Coupon redemption limit reached' }

  const minOrder = coupon.min_order_amount ?? coupon.min_amount ?? 0;
  if (amount && amount < minOrder) return { valid: false, message: `Minimum order amount for this coupon is ₹${minOrder}` }

  // Check duplicate booking usage if bookingId provided
  if (bookingId) {
    try {
      const { data: existing } = await supabase
        .from('coupon_usages')
        .select('id')
        .eq('coupon_code', codeUpper)
        .eq('booking_id', bookingId)
        .maybeSingle()
      if (existing) return { valid: false, message: 'Coupon has already been used for this booking' }
    } catch {}
  }

  // Calculate discount
  let discount = 0;
  if (coupon.discount_type === 'PERCENTAGE' || coupon.discount_type === 'PERCENT') {
    discount = ((amount || 0) * coupon.discount_value) / 100
  } else {
    discount = coupon.discount_value || 500
  }

  if (coupon.max_discount_amount) discount = Math.min(discount, coupon.max_discount_amount)

  return { valid: true, coupon: coupon as Coupon, discount }
}

export interface CouponUsageItem {
  id: string
  coupon_id?: string | null
  coupon_code: string
  booking_id: string
  booking_code?: string | null
  user_id?: string | null
  customer_name: string
  customer_phone: string
  customer_email: string
  journey_id?: string | null
  journey_name: string
  departure_date: string
  original_amount: number
  discount_amount: number
  final_amount: number
  used_at: string
  status?: string
}

export async function recordCouponUsage(payload: {
  coupon_id?: string | null
  coupon_code: string
  booking_id: string
  user_id?: string | null
  customer_name: string
  customer_phone: string
  customer_email: string
  journey_id?: string | null
  journey_name?: string | null
  departure_date?: string | null
  original_amount: number
  discount_amount: number
  final_amount: number
}): Promise<any> {
  const codeUpper = payload.coupon_code.toUpperCase().trim()

  try {
    const { data: existing } = await supabaseAdmin
      .from("coupon_usages")
      .select("id")
      .eq("coupon_code", codeUpper)
      .eq("booking_id", payload.booking_id)
      .maybeSingle()

    if (existing) {
      console.log(`[recordCouponUsage] Coupon ${codeUpper} already recorded for booking ${payload.booking_id}`)
      return existing
    }
  } catch {}

  let inserted = null
  try {
    const { data, error } = await supabaseAdmin
      .from("coupon_usages")
      .insert({
        coupon_id: payload.coupon_id || null,
        coupon_code: codeUpper,
        booking_id: payload.booking_id,
        user_id: payload.user_id || null,
        customer_name: payload.customer_name,
        customer_phone: payload.customer_phone,
        customer_email: payload.customer_email,
        journey_id: payload.journey_id || null,
        journey_name: payload.journey_name || "GoNomadik Journey",
        departure_date: payload.departure_date || "Upcoming Batch",
        original_amount: payload.original_amount,
        discount_amount: payload.discount_amount,
        final_amount: payload.final_amount,
        used_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle()

    if (!error) inserted = data
  } catch (err) {
    console.warn("[recordCouponUsage] coupon_usages table insert fallback:", err)
  }

  try {
    const query = supabaseAdmin.from("coupons").select("id, used_count, current_redemptions")
    if (payload.coupon_id) query.eq("id", payload.coupon_id)
    else query.eq("code", codeUpper)

    const { data: c } = await query.maybeSingle()
    if (c) {
      const currentVal = c.used_count ?? c.current_redemptions ?? 0
      await supabaseAdmin
        .from("coupons")
        .update({
          used_count: currentVal + 1,
          current_redemptions: currentVal + 1,
        })
        .eq("id", c.id)
    }
  } catch (err) {
    console.warn("[recordCouponUsage] coupon counter update fallback:", err)
  }

  return inserted
}

export async function getCouponUsagesAndAnalytics(params: {
  couponCode?: string
  journeyId?: string
  search?: string
  page?: number
  pageSize?: number
  bookingStatus?: string
} = {}): Promise<{
  usages: CouponUsageItem[]
  totalUsages: number;
  totalDiscount: number;
  totalRevenue: number;
  revenueBeforeDiscount: number;
  avgBookingValue: number;
  journeyAnalytics: { journey_name: string; uses: number; discount_given: number; revenue: number }[]
  totalPages: number;
}> {
  const { couponCode, journeyId, search, page = 1, pageSize = 20, bookingStatus } = params

  let allUsages: CouponUsageItem[] = []

  try {
    let query = supabaseAdmin.from("coupon_usages").select("*")
    if (couponCode && couponCode !== "ALL") query = query.ilike("coupon_code", `%${couponCode}%`)
    if (journeyId && journeyId !== "ALL") query = query.eq("journey_id", journeyId)

    const { data: dbUsages, error } = await query
    if (!error && dbUsages) {
      allUsages = dbUsages.map((u: any) => ({
        id: u.id,
        coupon_id: u.coupon_id,
        coupon_code: u.coupon_code || "STUTI500",
        booking_id: u.booking_id,
        booking_code: u.booking_code || u.booking_id,
        user_id: u.user_id,
        customer_name: u.customer_name || "Explorer",
        customer_phone: u.customer_phone || "—",
        customer_email: u.customer_email || "—",
        journey_id: u.journey_id,
        journey_name: u.journey_name || "Nomadik Trip",
        departure_date: u.departure_date || "Upcoming Batch",
        original_amount: Number(u.original_amount) || 0,
        discount_amount: Number(u.discount_amount) || 0,
        final_amount: Number(u.final_amount) || 0,
        used_at: u.used_at || u.created_at || new Date().toISOString(),
        status: u.status || "CONFIRMED",
      }))
    }
  } catch (err) {
    console.warn("coupon_usages DB query error:", err)
  }

  try {
    let bQuery = supabaseAdmin
      .from("bookings")
      .select("*, journeys(name, slug), departures(departure_date)")

    if (couponCode && couponCode !== "ALL") {
      bQuery = bQuery.ilike("coupon_code", `%${couponCode}%`)
    } else {
      bQuery = bQuery.not("coupon_code", "is", null)
    }

    const { data: bData } = await bQuery
    if (bData && bData.length > 0) {
      const existingBookingIds = new Set(allUsages.map((u) => u.booking_id))
      for (const b of bData) {
        if (!existingBookingIds.has(b.id)) {
          const discountVal = Number(b.discount_amount) || (b.coupon_code?.toUpperCase() === "STUTI500" ? 500 : 0)
          if (discountVal > 0 || b.coupon_code) {
            const orig = Number(b.total_amount || b.amount) + discountVal
            const fin = Number(b.total_amount || b.amount)
            allUsages.push({
              id: `b-${b.id}`,
              coupon_id: null,
              coupon_code: b.coupon_code || "STUTI500",
              booking_id: b.id,
              booking_code: b.booking_id || b.id,
              user_id: b.user_id,
              customer_name: b.customer_name || "Explorer",
              customer_phone: b.phone || "—",
              customer_email: b.email || "—",
              journey_id: b.journey_id,
              journey_name: b.journeys?.name || "Nomadik Journey",
              departure_date: b.departures?.departure_date ? new Date(b.departures.departure_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Upcoming Batch",
              original_amount: orig,
              discount_amount: discountVal,
              final_amount: fin,
              used_at: b.created_at || new Date().toISOString(),
              status: b.status || b.booking_status || "CONFIRMED",
            })
          }
        }
      }
    }
  } catch (err) {
    console.warn("Bookings coupon fallback query error:", err)
  }

  if (search && search.trim()) {
    const s = search.toLowerCase().trim()
    allUsages = allUsages.filter(
      (u) =>
        u.customer_name.toLowerCase().includes(s) ||
        u.customer_phone.toLowerCase().includes(s) ||
        u.customer_email.toLowerCase().includes(s) ||
        u.booking_code?.toLowerCase().includes(s) ||
        u.journey_name.toLowerCase().includes(s) ||
        u.coupon_code.toLowerCase().includes(s)
    )
  }

  if (bookingStatus && bookingStatus !== "ALL") {
    allUsages = allUsages.filter((u) => u.status?.toUpperCase() === bookingStatus.toUpperCase())
  }

  const totalUsages = allUsages.length
  const totalDiscount = allUsages.reduce((sum, u) => sum + u.discount_amount, 0)
  const totalRevenue = allUsages.reduce((sum, u) => sum + u.final_amount, 0)
  const revenueBeforeDiscount = allUsages.reduce((sum, u) => sum + u.original_amount, 0)
  const avgBookingValue = totalUsages > 0 ? Math.round(totalRevenue / totalUsages) : 0

  const journeyMap = new Map<string, { journey_name: string; uses: number; discount_given: number; revenue: number }>()
  for (const u of allUsages) {
    const jName = u.journey_name || "Other Journeys"
    const current = journeyMap.get(jName) || { journey_name: jName, uses: 0, discount_given: 0, revenue: 0 }
    current.uses += 1
    current.discount_given += u.discount_amount
    current.revenue += u.final_amount
    journeyMap.set(jName, current)
  }
  const journeyAnalytics = Array.from(journeyMap.values()).sort((a, b) => b.uses - a.uses)

  const totalPages = Math.ceil(totalUsages / pageSize) || 1
  const startIndex = (page - 1) * pageSize
  const paginatedUsages = allUsages.slice(startIndex, startIndex + pageSize)

  return {
    usages: paginatedUsages,
    totalUsages,
    totalDiscount,
    totalRevenue,
    revenueBeforeDiscount,
    avgBookingValue,
    journeyAnalytics,
    totalPages,
  }
}

export async function createCoupon(payload: CouponInsert): Promise<Coupon> {
  const { data, error } = await supabase.from('coupons').insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  return data as Coupon
}

export async function updateCoupon(id: string, payload: CouponUpdate): Promise<Coupon> {
  const { data, error } = await supabase.from('coupons')
    .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return data as Coupon
}

export async function deleteCoupon(id: string): Promise<void> {
  const { error } = await supabase.from('coupons').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ==========================================
// REVIEWS
// ==========================================
export async function getReviews(params: PaginationParams & { approved?: boolean; featured?: boolean; journeyId?: string } = {}): Promise<PaginatedResult<Review>> {
  const { page = 1, pageSize = 20, search, sortBy = 'created_at', sortDir = 'desc', approved, featured, journeyId } = params

  let query = supabase.from('reviews').select('*, journeys(id, name, slug)', { count: 'exact' })
  if (search) query = query.or(`author_name.ilike.%${search}%,content.ilike.%${search}%`)
  if (approved !== undefined) query = query.eq('is_approved', approved)
  if (featured !== undefined) query = query.eq('is_featured', featured)
  if (journeyId) query = query.eq('journey_id', journeyId)
  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data: (data ?? []) as Review[], total: count ?? 0, page, pageSize, totalPages: Math.ceil((count ?? 0) / pageSize) }
}

export async function getApprovedReviews(journeyId?: string, limit = 10): Promise<Review[]> {
  try {
    let query = supabase.from('reviews').select('*').eq('is_approved', true).order('created_at', { ascending: false }).limit(limit)
    if (journeyId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(journeyId);
      if (isUuid) {
        query = query.eq('journey_id', journeyId);
      } else {
        query = query.or(`journey_id.eq.${journeyId},journey_slug.eq.${journeyId}`);
      }
    }
    const { data, error } = await query
    if (error) return []
    return (data ?? []) as Review[]
  } catch {
    return []
  }
}

export async function createReview(payload: ReviewInsert): Promise<Review> {
  const { data, error } = await supabase.from('reviews').insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  return data as Review
}

export async function updateReview(id: string, payload: ReviewUpdate): Promise<Review> {
  const { data, error } = await supabase.from('reviews')
    .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return data as Review
}

export async function approveReview(id: string, adminId: string): Promise<void> {
  const { error } = await supabase.from('reviews')
    .update({ is_approved: true, approved_by: adminId, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function replyToReview(id: string, reply: string): Promise<void> {
  const { error } = await supabase.from('reviews')
    .update({ admin_reply: reply, admin_reply_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ==========================================
// INQUIRIES / LEADS
// ==========================================
export async function getInquiries(params: PaginationParams & { status?: string; assignedTo?: string } = {}): Promise<PaginatedResult<Inquiry>> {
  const { page = 1, pageSize = 20, search, sortBy = 'created_at', sortDir = 'desc', status, assignedTo } = params

  let query = supabase.from('inquiries').select('*, destinations(id, name), journeys(id, name)', { count: 'exact' })
  if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
  if (status) query = query.eq('status', status)
  if (assignedTo) query = query.eq('assigned_to', assignedTo)
  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data: (data ?? []) as Inquiry[], total: count ?? 0, page, pageSize, totalPages: Math.ceil((count ?? 0) / pageSize) }
}

export async function createInquiry(payload: InquiryInsert): Promise<Inquiry> {
  const { data, error } = await supabase.from('inquiries').insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  return data as Inquiry
}

export async function updateInquiry(id: string, payload: InquiryUpdate): Promise<Inquiry> {
  const { data, error } = await supabase.from('inquiries')
    .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return data as Inquiry
}

export async function deleteInquiry(id: string): Promise<void> {
  const { error } = await supabase.from('inquiries').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function bulkDeleteInquiries(ids: string[]): Promise<void> {
  const { error } = await supabase.from('inquiries').delete().in('id', ids)
  if (error) throw new Error(error.message)
}

// ==========================================
// BLOGS
// ==========================================
export async function getBlogs(params: PaginationParams & { published?: boolean } = {}): Promise<PaginatedResult<Blog>> {
  const { page = 1, pageSize = 20, search, sortBy = 'created_at', sortDir = 'desc', published } = params

  let query = supabase.from('blogs').select('*', { count: 'exact' })
  if (search) query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`)
  if (published !== undefined) query = query.eq('is_published', published)
  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data: (data ?? []) as Blog[], total: count ?? 0, page, pageSize, totalPages: Math.ceil((count ?? 0) / pageSize) }
}

export async function getBlogBySlug(slug: string): Promise<Blog | null> {
  const { data, error } = await supabase.from('blogs').select('*').eq('slug', slug).eq('is_published', true).single()
  if (error) { if (error.code === 'PGRST116') return null; throw new Error(error.message) }
  // Increment view count
  await supabase.from('blogs').update({ view_count: (data.view_count ?? 0) + 1 }).eq('id', data.id)
  return data as Blog
}

export async function getBlogById(id: string): Promise<Blog | null> {
  const { data, error } = await supabase.from('blogs').select('*').eq('id', id).single()
  if (error) { if (error.code === 'PGRST116') return null; throw new Error(error.message) }
  return data as Blog
}

export async function createBlog(payload: BlogInsert): Promise<Blog> {
  const { data, error } = await supabase.from('blogs').insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  return data as Blog
}

export async function updateBlog(id: string, payload: BlogUpdate): Promise<Blog> {
  const { data, error } = await supabase.from('blogs')
    .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return data as Blog
}

export async function deleteBlog(id: string): Promise<void> {
  const { error } = await supabase.from('blogs').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ==========================================
// TRIP CAPTAINS
// ==========================================
export async function getTripCaptains(params: PaginationParams = {}): Promise<PaginatedResult<TripCaptain>> {
  const { page = 1, pageSize = 20, search, sortBy = 'full_name', sortDir = 'asc' } = params

  let query = supabase.from('trip_captains').select('*', { count: 'exact' })
  if (search) query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)
  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data: (data ?? []) as TripCaptain[], total: count ?? 0, page, pageSize, totalPages: Math.ceil((count ?? 0) / pageSize) }
}

export async function getAllTripCaptains(): Promise<TripCaptain[]> {
  const { data, error } = await supabase
    .from('trip_captains').select('*')
    .eq('is_active', true).order('full_name', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as TripCaptain[]
}

export async function createTripCaptain(payload: TripCaptainInsert): Promise<TripCaptain> {
  const { data, error } = await supabase.from('trip_captains').insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  return data as TripCaptain
}

export async function updateTripCaptain(id: string, payload: TripCaptainUpdate): Promise<TripCaptain> {
  const { data, error } = await supabase.from('trip_captains')
    .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return data as TripCaptain
}

export async function deleteTripCaptain(id: string): Promise<void> {
  const { error } = await supabase.from('trip_captains').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ==========================================
// MEDIA LIBRARY
// ==========================================
export async function getMediaAssets(params: PaginationParams & { folder?: string; mimeType?: string } = {}): Promise<PaginatedResult<MediaAsset>> {
  const { page = 1, pageSize = 40, search, sortBy = 'created_at', sortDir = 'desc', folder, mimeType } = params

  let query = supabase.from('media_assets').select('*', { count: 'exact' })
  if (search) query = query.or(`filename.ilike.%${search}%,alt_text.ilike.%${search}%`)
  if (folder) query = query.eq('folder', folder)
  if (mimeType) query = query.like('mime_type', `${mimeType}%`)
  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data: (data ?? []) as MediaAsset[], total: count ?? 0, page, pageSize, totalPages: Math.ceil((count ?? 0) / pageSize) }
}

export async function createMediaAsset(payload: MediaAssetInsert): Promise<MediaAsset> {
  const { data, error } = await supabase.from('media_assets').insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  return data as MediaAsset
}

export async function updateMediaAsset(id: string, payload: { alt_text?: string; folder?: string; tags?: string[] }): Promise<MediaAsset> {
  const { data, error } = await supabase.from('media_assets')
    .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return data as MediaAsset
}

export async function deleteMediaAsset(id: string, storageUrl: string): Promise<void> {
  // Delete from Supabase storage
  const path = storageUrl.split('/').slice(-2).join('/')
  await supabase.storage.from('media').remove([path])

  const { error } = await supabase.from('media_assets').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getMediaFolders(): Promise<string[]> {
  const { data, error } = await supabase.from('media_assets').select('folder').order('folder')
  if (error) return ['/']
  const folders = [...new Set((data ?? []).map((d) => d.folder as string))]
  return folders
}

// Upload to Supabase Storage and create media record
export async function uploadMedia(file: File, folder: string, adminId: string): Promise<MediaAsset> {
  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const cleanFolder = folder.replace(/^\//, '')
  const storagePath = cleanFolder ? `${cleanFolder}/${fileName}` : fileName

  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(storagePath, file, { cacheControl: '3600', upsert: true })

  if (uploadError) {
    console.error('[uploadMedia] Supabase storage upload error:', uploadError.message)
    throw new Error(uploadError.message)
  }

  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(storagePath)

  try {
    return await createMediaAsset({
      filename: fileName,
      size: file.size,
      mime_type: file.type,
      url: publicUrl,
      folder,
      uploaded_by: adminId,
    } as any)
  } catch (err) {
    console.warn('[uploadMedia] media_assets table insert skipped, using storage URL directly:', err)
    return {
      id: fileName,
      filename: fileName,
      size: file.size,
      mime_type: file.type,
      url: publicUrl,
      folder,
      created_at: new Date().toISOString(),
    } as any
  }
}

// ==========================================
// CMS SECTIONS
// ==========================================
export async function getCmsSections(): Promise<CmsSection[]> {
  const { data, error } = await supabase.from('cms_sections').select('*').order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as CmsSection[]
}

export async function getCmsSectionByKey(key: string): Promise<CmsSection | null> {
  const { data, error } = await supabase.from('cms_sections').select('*').eq('section_key', key).single()
  if (error) { if (error.code === 'PGRST116') return null; throw new Error(error.message) }
  return data as CmsSection
}

export async function updateCmsSection(key: string, payload: CmsSectionUpdate, adminId: string): Promise<CmsSection> {
  const { data, error } = await supabase.from('cms_sections')
    .update({ ...payload, updated_by: adminId, updated_at: new Date().toISOString() })
    .eq('section_key', key)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as CmsSection
}

// ==========================================
// BANNERS
// ==========================================
export async function getBanners(placement?: string): Promise<Banner[]> {
  let query = supabase.from('banners').select('*').order('display_order', { ascending: true })
  if (placement) query = query.eq('placement', placement)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Banner[]
}

export async function getActiveBanners(placement: string): Promise<Banner[]> {
  const now = new Date().toISOString()
  const { data, error } = await supabase.from('banners').select('*')
    .eq('placement', placement)
    .eq('is_active', true)
    .or(`valid_until.is.null,valid_until.gte.${now}`)
    .order('display_order', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Banner[]
}

export async function upsertBanner(payload: Partial<Banner> & { id?: string }): Promise<Banner> {
  const { id, ...rest } = payload
  if (id) {
    const { data, error } = await supabase.from('banners')
      .update({ ...rest, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
    if (error) throw new Error(error.message)
    return data as Banner
  }
  const { data, error } = await supabase.from('banners').insert(rest).select('*').single()
  if (error) throw new Error(error.message)
  return data as Banner
}

export async function deleteBanner(id: string): Promise<void> {
  const { error } = await supabase.from('banners').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ==========================================
// SETTINGS
// ==========================================
export async function getSettings(category?: string): Promise<Record<string, unknown>> {
  let query = supabase.from('settings').select('key, value')
  if (category) query = query.eq('category', category)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return Object.fromEntries((data ?? []).map((s) => [s.key, s.value]))
}

export async function getSetting(key: string): Promise<unknown> {
  const { data, error } = await supabase.from('settings').select('value').eq('key', key).single()
  if (error) return null
  return data?.value
}

export async function updateSetting(key: string, value: unknown): Promise<void> {
  const { error } = await supabase.from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) throw new Error(error.message)
}

export async function updateSettings(settings: Record<string, unknown>): Promise<void> {
  await Promise.all(Object.entries(settings).map(([key, value]) => updateSetting(key, value)))
}

// ==========================================
// ANALYTICS
// ==========================================
export async function getDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.from('v_dashboard_stats').select('*').single()
  if (error) throw new Error(error.message)
  return data as DashboardStats
}

export async function getMonthlyRevenue(): Promise<MonthlyRevenue[]> {
  const { data, error } = await supabase.from('v_monthly_revenue').select('*')
  if (error) throw new Error(error.message)
  return (data ?? []) as MonthlyRevenue[]
}

export async function getRevenueByDestination() {
  const { data, error } = await supabase
    .from('bookings')
    .select('departures(journeys(destination_id, destinations(name))), total_amount')
    .not('status', 'in', '("CANCELLED","REFUNDED")')
    .limit(100)

  if (error) throw new Error(error.message)
  return data ?? []
}

// ==========================================
// ACTIVITY LOG
// ==========================================
export async function getActivityLog(params: PaginationParams & { entityType?: string } = {}): Promise<PaginatedResult<ActivityLog>> {
  const { page = 1, pageSize = 50, entityType } = params

  let query = supabase.from('activity_log').select('*', { count: 'exact' })
  if (entityType) query = query.eq('entity_type', entityType)
  query = query.order('created_at', { ascending: false })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data: (data ?? []) as ActivityLog[], total: count ?? 0, page, pageSize, totalPages: Math.ceil((count ?? 0) / pageSize) }
}

export async function logActivity(entry: Omit<ActivityLog, 'id' | 'created_at'>): Promise<void> {
  await supabase.from('activity_log').insert(entry)
}

// ==========================================
// CUSTOMERS
// ==========================================
export async function getCustomers(params: PaginationParams = {}): Promise<PaginatedResult<SiteUser>> {
  const { page = 1, pageSize = 20, search, sortBy = 'created_at', sortDir = 'desc' } = params

  let query = supabase.from('users').select('*', { count: 'exact' })
  if (search) query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data: (data ?? []) as SiteUser[], total: count ?? 0, page, pageSize, totalPages: Math.ceil((count ?? 0) / pageSize) }
}

export async function getCustomerById(id: string): Promise<SiteUser | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single()
  if (error) { if (error.code === 'PGRST116') return null; throw new Error(error.message) }
  return data as SiteUser
}

export async function getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
  const { data, error } = await supabase.from('wallet_transactions').select('*')
    .eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as WalletTransaction[]
}

// ==========================================
// PAYMENTS
// ==========================================
export async function getPayments(params: PaginationParams & { status?: string } = {}): Promise<PaginatedResult<Payment>> {
  const { page = 1, pageSize = 20, search, sortBy = 'created_at', sortDir = 'desc', status } = params

  let query = supabase.from('payments').select('*, bookings(booking_id, users(full_name, phone))', { count: 'exact' })
  if (status) query = query.eq('status', status)
  if (search) query = query.or(`gateway_payment_id.ilike.%${search}%`)
  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data: (data ?? []) as Payment[], total: count ?? 0, page, pageSize, totalPages: Math.ceil((count ?? 0) / pageSize) }
}

export async function createPayment(payload: PaymentInsert): Promise<Payment> {
  const { data, error } = await supabase.from('payments').insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  return data as Payment
}

export async function updatePayment(id: string, payload: Partial<Payment>): Promise<Payment> {
  const { data, error } = await supabase.from('payments')
    .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return data as Payment
}

// ==========================================
// NOTIFICATIONS
// ==========================================
export async function createNotification(payload: Omit<Notification, 'id' | 'created_at'>): Promise<void> {
  await supabase.from('notifications').insert(payload)
}
