import { supabase } from '@/lib/supabase'

// ============================================================
// CMS TYPE DEFINITIONS
// ============================================================

export interface SiteSetting {
  id: string
  key: string
  value: string | null
  description: string | null
  updated_at: string
}

export interface SiteSettingsMap {
  company_name: string
  tagline: string
  support_phone: string
  support_phone_2: string
  support_email: string
  whatsapp_number: string
  address: string
  business_hours: string
  instagram_url: string
  youtube_url: string
  linkedin_url: string
  reddit_url: string
  facebook_url: string
  logo_url: string
  logo_dark_url: string
  favicon_url: string
  google_map_embed: string
  gst_number: string
  footer_copyright: string
  footer_quote: string
  [key: string]: string
}

export interface Faq {
  id: string
  question: string
  answer: string
  page: string
  category: string | null
  sort_order: number
  is_active: boolean
  destination_id: string | null
  journey_id: string | null
  created_at: string
  updated_at: string
}

export interface FaqInsert {
  question: string
  answer: string
  page?: string
  category?: string | null
  sort_order?: number
  is_active?: boolean
  destination_id?: string | null
  journey_id?: string | null
}

export interface NavItem {
  id: string
  label: string
  href: string
  sort_order: number
  is_active: boolean
  is_external: boolean
  parent_id: string | null
  icon: string | null
  created_at: string
  updated_at: string
}

export interface FooterSection {
  id: string
  section_key: string
  title: string
  links: Array<{ label: string; href: string; is_external?: boolean }>
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AnnouncementBar {
  id: string
  message: string
  link: string | null
  link_text: string | null
  bg_color: string
  text_color: string
  is_active: boolean
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface HomepageLayoutItem {
  id: string
  section_key: string
  label: string
  is_visible: boolean
  sort_order: number
  updated_at: string
}

export interface HeroSlide {
  id: string
  title: string
  subtitle: string | null
  media_url: string
  media_type: 'image' | 'video'
  cta_label: string
  cta_href: string
  cta2_label: string | null
  cta2_href: string | null
  overlay_opacity: number
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ThemeConfig {
  id: string
  key: string
  value: string | null
  label: string | null
}

export interface PageSeo {
  id: string
  page_key: string
  page_label: string
  title: string | null
  description: string | null
  og_image: string | null
  keywords: string | null
  canonical: string | null
  updated_at: string
}

export interface CmsSection {
  id: string
  section_key: string
  title: string | null
  subtitle: string | null
  media_url: string | null
  cta_label: string | null
  cta_href: string | null
  content: Record<string, unknown>
  is_enabled: boolean
  sort_order: number
  updated_by: string | null
  created_at: string
  updated_at: string
}

// ============================================================
// SITE SETTINGS
// ============================================================

export async function getSiteSettings(): Promise<SiteSettingsMap> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value')

  if (error) throw new Error(error.message)

  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    map[row.key] = row.value ?? ''
  }
  return map as SiteSettingsMap
}

export async function getSiteSetting(key: string): Promise<string> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .single()

  if (error) return ''
  return data?.value ?? ''
}

export async function updateSiteSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

  if (error) throw new Error(error.message)
}

export async function updateSiteSettings(settings: Partial<SiteSettingsMap>): Promise<void> {
  const rows = Object.entries(settings).map(([key, value]) => ({
    key,
    value: value ?? '',
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('site_settings')
    .upsert(rows, { onConflict: 'key' })

  if (error) throw new Error(error.message)
}

// ============================================================
// FAQs
// ============================================================

export async function getFaqs(page?: string, destinationId?: string): Promise<Faq[]> {
  let query = supabase
    .from('faqs')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (page) query = query.eq('page', page)
  if (destinationId) query = query.eq('destination_id', destinationId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Faq[]
}

export async function getAllFaqs(page?: string): Promise<Faq[]> {
  let query = supabase
    .from('faqs')
    .select('*')
    .order('sort_order', { ascending: true })

  if (page) query = query.eq('page', page)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Faq[]
}

export async function createFaq(data: FaqInsert): Promise<Faq> {
  const { data: faq, error } = await supabase
    .from('faqs')
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return faq as Faq
}

export async function updateFaq(id: string, data: Partial<FaqInsert>): Promise<void> {
  const { error } = await supabase
    .from('faqs')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteFaq(id: string): Promise<void> {
  const { error } = await supabase.from('faqs').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function reorderFaqs(items: Array<{ id: string; sort_order: number }>): Promise<void> {
  const updates = items.map(({ id, sort_order }) =>
    supabase.from('faqs').update({ sort_order }).eq('id', id)
  )
  await Promise.all(updates)
}

// ============================================================
// NAV ITEMS
// ============================================================

export async function getNavItems(): Promise<NavItem[]> {
  const { data, error } = await supabase
    .from('nav_items')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as NavItem[]
}

export async function getAllNavItems(): Promise<NavItem[]> {
  const { data, error } = await supabase
    .from('nav_items')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as NavItem[]
}

export async function upsertNavItem(item: Omit<NavItem, 'created_at' | 'updated_at'>): Promise<void> {
  const { error } = await supabase
    .from('nav_items')
    .upsert(item, { onConflict: 'id' })

  if (error) throw new Error(error.message)
}

export async function deleteNavItem(id: string): Promise<void> {
  const { error } = await supabase.from('nav_items').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function reorderNavItems(items: Array<{ id: string; sort_order: number }>): Promise<void> {
  const updates = items.map(({ id, sort_order }) =>
    supabase.from('nav_items').update({ sort_order }).eq('id', id)
  )
  await Promise.all(updates)
}

// ============================================================
// FOOTER SECTIONS
// ============================================================

export async function getFooterSections(): Promise<FooterSection[]> {
  const { data, error } = await supabase
    .from('footer_sections')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as FooterSection[]
}

export async function getAllFooterSections(): Promise<FooterSection[]> {
  const { data, error } = await supabase
    .from('footer_sections')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as FooterSection[]
}

export async function updateFooterSection(
  sectionKey: string,
  data: Partial<Pick<FooterSection, 'title' | 'links' | 'is_active' | 'sort_order'>>
): Promise<void> {
  const { error } = await supabase
    .from('footer_sections')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('section_key', sectionKey)

  if (error) throw new Error(error.message)
}

// ============================================================
// ANNOUNCEMENT BAR
// ============================================================

export async function getActiveAnnouncementBar(): Promise<AnnouncementBar | null> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('announcement_bar')
    .select('*')
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as AnnouncementBar | null
}

export async function getAllAnnouncementBars(): Promise<AnnouncementBar[]> {
  const { data, error } = await supabase
    .from('announcement_bar')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as AnnouncementBar[]
}

export async function upsertAnnouncementBar(data: Partial<AnnouncementBar> & { id?: string }): Promise<void> {
  const { error } = await supabase
    .from('announcement_bar')
    .upsert({ ...data, updated_at: new Date().toISOString() })

  if (error) throw new Error(error.message)
}

export async function deleteAnnouncementBar(id: string): Promise<void> {
  const { error } = await supabase.from('announcement_bar').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ============================================================
// HOMEPAGE LAYOUT
// ============================================================

export async function getHomepageLayout(): Promise<HomepageLayoutItem[]> {
  const { data, error } = await supabase
    .from('homepage_layout')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as HomepageLayoutItem[]
}

export async function updateHomepageLayoutItem(
  sectionKey: string,
  updates: Partial<Pick<HomepageLayoutItem, 'is_visible' | 'sort_order'>>
): Promise<void> {
  const { error } = await supabase
    .from('homepage_layout')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('section_key', sectionKey)

  if (error) throw new Error(error.message)
}

export async function reorderHomepageLayout(items: Array<{ section_key: string; sort_order: number }>): Promise<void> {
  const updates = items.map(({ section_key, sort_order }) =>
    supabase.from('homepage_layout').update({ sort_order }).eq('section_key', section_key)
  )
  await Promise.all(updates)
}

// ============================================================
// HERO SLIDES
// ============================================================

export async function getHeroSlides(): Promise<HeroSlide[]> {
  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as HeroSlide[]
}

export async function getAllHeroSlides(): Promise<HeroSlide[]> {
  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as HeroSlide[]
}

export async function upsertHeroSlide(slide: Partial<HeroSlide> & { id?: string }): Promise<HeroSlide> {
  const { data, error } = await supabase
    .from('hero_slides')
    .upsert({ ...slide, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as HeroSlide
}

export async function deleteHeroSlide(id: string): Promise<void> {
  const { error } = await supabase.from('hero_slides').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function reorderHeroSlides(items: Array<{ id: string; sort_order: number }>): Promise<void> {
  const updates = items.map(({ id, sort_order }) =>
    supabase.from('hero_slides').update({ sort_order }).eq('id', id)
  )
  await Promise.all(updates)
}

// ============================================================
// THEME CONFIG
// ============================================================

export async function getThemeConfig(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('theme_config').select('key, value')
  if (error) throw new Error(error.message)

  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    map[row.key] = row.value ?? ''
  }
  return map
}

export async function updateThemeConfig(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('theme_config')
    .upsert({ key, value }, { onConflict: 'key' })

  if (error) throw new Error(error.message)
}

export async function updateThemeConfigs(configs: Record<string, string>): Promise<void> {
  const rows = Object.entries(configs).map(([key, value]) => ({ key, value }))
  const { error } = await supabase.from('theme_config').upsert(rows, { onConflict: 'key' })
  if (error) throw new Error(error.message)
}

// ============================================================
// PAGE SEO
// ============================================================

export async function getPageSeo(pageKey: string): Promise<PageSeo | null> {
  const { data, error } = await supabase
    .from('page_seo')
    .select('*')
    .eq('page_key', pageKey)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as PageSeo | null
}

export async function getAllPageSeo(): Promise<PageSeo[]> {
  const { data, error } = await supabase
    .from('page_seo')
    .select('*')
    .order('page_key')

  if (error) throw new Error(error.message)
  return (data ?? []) as PageSeo[]
}

export async function updatePageSeo(pageKey: string, updates: Partial<PageSeo>): Promise<void> {
  const { error } = await supabase
    .from('page_seo')
    .upsert({ ...updates, page_key: pageKey, updated_at: new Date().toISOString() }, { onConflict: 'page_key' })

  if (error) throw new Error(error.message)
}

// ============================================================
// CMS SECTIONS
// ============================================================

export async function getCmsSection(sectionKey: string): Promise<CmsSection | null> {
  const { data, error } = await supabase
    .from('cms_sections')
    .select('*')
    .eq('section_key', sectionKey)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as CmsSection | null
}

export async function getAllCmsSections(): Promise<CmsSection[]> {
  const { data, error } = await supabase
    .from('cms_sections')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as CmsSection[]
}

export async function updateCmsSection(
  sectionKey: string,
  updates: Partial<Pick<CmsSection, 'title' | 'subtitle' | 'content' | 'media_url' | 'cta_label' | 'cta_href' | 'is_enabled'>>
): Promise<void> {
  const { error } = await supabase
    .from('cms_sections')
    .upsert(
      { ...updates, section_key: sectionKey, updated_at: new Date().toISOString() },
      { onConflict: 'section_key' }
    )

  if (error) throw new Error(error.message)
}

// ============================================================
// REVIEWS (for public website)
// ============================================================

export interface ApprovedReview {
  id: string
  author_name: string
  author_email: string | null
  rating: number
  title: string | null
  content: string
  photos: string[]
  trip_date: string | null
  is_verified: boolean
  is_featured: boolean
  created_at: string
  journeys?: { name: string } | null
}

export async function getApprovedReviews(limit = 6): Promise<ApprovedReview[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, journeys(name)')
    .eq('is_approved', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as ApprovedReview[]
}

// ============================================================
// STORIES (for public website)
// ============================================================

export interface PublishedStory {
  id: string
  slug: string
  title: string
  snippet: string
  image_url: string
  author: string
  read_time: number
  category: string
  is_featured: boolean
  published_at: string | null
  created_at: string
}

export async function getPublishedStories(limit = 6): Promise<PublishedStory[]> {
  const { data, error } = await supabase
    .from('stories')
    .select('id, slug, title, snippet, image_url, author, read_time, category, is_featured, published_at, created_at')
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as PublishedStory[]
}
