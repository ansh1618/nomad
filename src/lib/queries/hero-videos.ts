import { supabase } from '@/lib/supabase'

export interface HeroVideoCard {
  id: string
  title: string
  destination_name: string
  instagram_url?: string | null
  video_url: string
  thumbnail_url: string
  caption?: string | null
  cta_url?: string | null
  card_size: 'large' | 'medium' | 'portrait' | 'wide' | 'small'
  layout_position: 'center' | 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right'
  display_order: number
  is_active: boolean
  autoplay: boolean
  loop: boolean
  created_at?: string
  updated_at?: string
}

export interface HeroVideoSettings {
  is_enabled: boolean
  max_visible_cards: number
  desktop_layout: 'collage' | 'grid' | 'carousel' | 'featured_focus'
  mobile_layout: 'carousel' | 'compact_grid' | 'single_featured'
  transition_duration: number
  auto_rotation_interval: number
  enable_overlay: boolean
  overlay_opacity: number
  badge_text: string
  hero_heading: string
  hero_subtitle: string
  cta_primary_label: string
  cta_primary_href: string
  cta_secondary_label: string
  cta_secondary_href: string
  fallback_media_url: string
  fallback_video_url: string
}

export const DEFAULT_HERO_SETTINGS: HeroVideoSettings = {
  is_enabled: true,
  max_visible_cards: 5,
  desktop_layout: 'collage',
  mobile_layout: 'carousel',
  transition_duration: 500,
  auto_rotation_interval: 6000,
  enable_overlay: true,
  overlay_opacity: 0.65,
  badge_text: 'Curated Road Trips & Himalayan Treks',
  hero_heading: 'Your Next Adventure Begins Here.',
  hero_subtitle: 'Discover breathtaking destinations, unforgettable journeys and experiences worth remembering with India\'s most trusted travel collective.',
  cta_primary_label: 'Explore Destinations',
  cta_primary_href: '/destinations',
  cta_secondary_label: 'Upcoming Trips',
  cta_secondary_href: '/destinations',
  fallback_media_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=90',
  fallback_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-camper-driving-on-a-mountain-road-42289-large.mp4',
}

export const FALLBACK_VIDEO_CARDS: HeroVideoCard[] = [
  {
    id: '11111111-1111-4111-a111-111111111111',
    title: 'Epic Himalayan Expeditions',
    destination_name: 'Spiti Valley & Kinnaur',
    instagram_url: 'https://www.instagram.com/gonomadik.in',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-camper-driving-on-a-mountain-road-42289-large.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
    caption: 'Caravans traversing world highest motorable passes and rugged mountain gorges.',
    cta_url: '/destinations',
    card_size: 'large',
    layout_position: 'center',
    display_order: 0,
    is_active: true,
    autoplay: true,
    loop: true,
  },
  {
    id: '22222222-2222-4222-a222-222222222222',
    title: 'Winter Snow Peaks & High Glaciers',
    destination_name: 'Kedarkantha & Manali',
    instagram_url: 'https://www.instagram.com/gonomadik.in',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-snow-covered-pine-forest-and-mountains-42296-large.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    caption: 'Crisp winter powder, snow treks to 12,500 ft, and panoramic Himalayan summits.',
    cta_url: '/destinations',
    card_size: 'portrait',
    layout_position: 'top_right',
    display_order: 1,
    is_active: true,
    autoplay: true,
    loop: true,
  },
  {
    id: '33333333-3333-4333-a333-333333333333',
    title: 'Campfire Nights Under Starlit Skies',
    destination_name: 'Jibhi Riverside Valley',
    instagram_url: 'https://www.instagram.com/gonomadik.in',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-bonfire-burning-in-the-snow-at-night-42299-large.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80',
    caption: 'Acoustic sessions, cozy riverside camps, and warm hot-chocolate conversations.',
    cta_url: '/destinations',
    card_size: 'small',
    layout_position: 'bottom_right',
    display_order: 2,
    is_active: true,
    autoplay: true,
    loop: true,
  },
  {
    id: '44444444-4444-4444-a444-444444444444',
    title: 'Winding Valley Drives & Waterfalls',
    destination_name: 'Munsiyari & Kumaon',
    instagram_url: 'https://www.instagram.com/gonomadik.in',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-winding-mountain-road-42291-large.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
    caption: 'Endless pine switchbacks, cascading Birthi falls, and breathtaking Johar valley vistas.',
    cta_url: '/destinations',
    card_size: 'medium',
    layout_position: 'bottom_left',
    display_order: 3,
    is_active: true,
    autoplay: true,
    loop: true,
  },
  {
    id: '55555555-5555-4555-a555-555555555555',
    title: 'Solo Travelers Turned Lifelong Tribe',
    destination_name: 'Kasol & Kheerganga',
    instagram_url: 'https://www.instagram.com/gonomadik.in',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-hikers-walking-along-a-mountain-trail-42293-large.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&w=1200&q=80',
    caption: 'Curated community batches, certified Trip Captains, and safe, vibrant group journeys.',
    cta_url: '/destinations',
    card_size: 'portrait',
    layout_position: 'top_left',
    display_order: 4,
    is_active: true,
    autoplay: true,
    loop: true,
  },
]

// ============================================================
// DATA FETCHING FUNCTIONS
// ============================================================

/**
 * Fetch all video cards for hero collage.
 * Tries hero_video_gallery table first; falls back to cms_sections.
 */
export async function getHeroVideoGallery(): Promise<HeroVideoCard[]> {
  try {
    const { data, error } = await supabase
      .from('hero_video_gallery')
      .select('*')
      .order('display_order', { ascending: true })

    if (!error && Array.isArray(data) && data.length > 0) {
      return data as HeroVideoCard[]
    }
  } catch {
    // ignore table not found
  }

  // Fallback to cms_sections
  try {
    const { data: section } = await supabase
      .from('cms_sections')
      .select('content')
      .eq('section_key', 'hero_video_gallery')
      .maybeSingle()

    if (section?.content?.cards && Array.isArray(section.content.cards) && section.content.cards.length > 0) {
      return (section.content.cards as HeroVideoCard[]).sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
      )
    }
  } catch (err) {
    console.warn('[getHeroVideoGallery] Fallback failed:', err)
  }

  return FALLBACK_VIDEO_CARDS
}

/**
 * Fetch global Hero Video Gallery settings
 */
export async function getHeroVideoSettings(): Promise<HeroVideoSettings> {
  try {
    const { data: section } = await supabase
      .from('cms_sections')
      .select('content, title, subtitle, media_url, cta_label, cta_href')
      .eq('section_key', 'hero_video_gallery')
      .maybeSingle()

    if (section?.content?.settings) {
      return {
        ...DEFAULT_HERO_SETTINGS,
        ...section.content.settings,
        hero_heading: section.title || section.content.settings.hero_heading || DEFAULT_HERO_SETTINGS.hero_heading,
        hero_subtitle: section.subtitle || section.content.settings.hero_subtitle || DEFAULT_HERO_SETTINGS.hero_subtitle,
        cta_primary_label: section.cta_label || section.content.settings.cta_primary_label || DEFAULT_HERO_SETTINGS.cta_primary_label,
        cta_primary_href: section.cta_href || section.content.settings.cta_primary_href || DEFAULT_HERO_SETTINGS.cta_primary_href,
      }
    }
  } catch (err) {
    console.warn('[getHeroVideoSettings] Error loading settings:', err)
  }

  return DEFAULT_HERO_SETTINGS
}

// ============================================================
// MUTATION FUNCTIONS
// ============================================================

/**
 * Upsert a single video card
 */
export async function upsertHeroVideoCard(card: Partial<HeroVideoCard> & { title: string; video_url: string }): Promise<HeroVideoCard> {
  const cardId = card.id || crypto.randomUUID()
  const payload: HeroVideoCard = {
    id: cardId,
    title: card.title,
    destination_name: card.destination_name || 'Himalayan Adventure',
    instagram_url: card.instagram_url || null,
    video_url: card.video_url,
    thumbnail_url: card.thumbnail_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
    caption: card.caption || '',
    cta_url: card.cta_url || '/destinations',
    card_size: card.card_size || 'medium',
    layout_position: card.layout_position || 'center',
    display_order: card.display_order ?? 0,
    is_active: card.is_active ?? true,
    autoplay: card.autoplay ?? true,
    loop: card.loop ?? true,
    updated_at: new Date().toISOString(),
  }

  // 1. Try upserting to hero_video_gallery table
  let tableSuccess = false
  try {
    const { error } = await supabase
      .from('hero_video_gallery')
      .upsert(payload, { onConflict: 'id' })
    if (!error) {
      tableSuccess = true
    }
  } catch {
    // ignore if table doesn't exist
  }

  // 2. Also keep cms_sections in sync
  try {
    const { data: section } = await supabase
      .from('cms_sections')
      .select('content')
      .eq('section_key', 'hero_video_gallery')
      .maybeSingle()

    const currentCards: HeroVideoCard[] = section?.content?.cards || FALLBACK_VIDEO_CARDS
    const existingIndex = currentCards.findIndex((c) => c.id === cardId)
    let updatedCards: HeroVideoCard[]
    if (existingIndex >= 0) {
      updatedCards = [...currentCards]
      updatedCards[existingIndex] = { ...updatedCards[existingIndex], ...payload }
    } else {
      updatedCards = [...currentCards, payload]
    }

    await supabase
      .from('cms_sections')
      .upsert(
        {
          section_key: 'hero_video_gallery',
          content: {
            ...(section?.content || {}),
            cards: updatedCards,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'section_key' }
      )
  } catch (err) {
    console.error('[upsertHeroVideoCard] cms_sections sync error:', err)
    if (!tableSuccess) throw err
  }

  return payload
}

/**
 * Delete a video card
 */
export async function deleteHeroVideoCard(id: string): Promise<void> {
  // 1. Try deleting from hero_video_gallery table
  try {
    await supabase.from('hero_video_gallery').delete().eq('id', id)
  } catch {
    // ignore
  }

  // 2. Update cms_sections
  try {
    const { data: section } = await supabase
      .from('cms_sections')
      .select('content')
      .eq('section_key', 'hero_video_gallery')
      .maybeSingle()

    if (section?.content?.cards) {
      const filtered = section.content.cards.filter((c: any) => c.id !== id)
      await supabase
        .from('cms_sections')
        .update({
          content: {
            ...section.content,
            cards: filtered,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('section_key', 'hero_video_gallery')
    }
  } catch (err) {
    console.error('[deleteHeroVideoCard] cms_sections error:', err)
  }
}

/**
 * Reorder video cards
 */
export async function reorderHeroVideoCards(orderedCards: HeroVideoCard[]): Promise<void> {
  // 1. Try updating table
  try {
    const updates = orderedCards.map((card, index) =>
      supabase
        .from('hero_video_gallery')
        .update({ display_order: index, updated_at: new Date().toISOString() })
        .eq('id', card.id)
    )
    await Promise.all(updates)
  } catch {
    // ignore
  }

  // 2. Update cms_sections
  try {
    const { data: section } = await supabase
      .from('cms_sections')
      .select('content')
      .eq('section_key', 'hero_video_gallery')
      .maybeSingle()

    const cardsWithOrder = orderedCards.map((card, index) => ({
      ...card,
      display_order: index,
    }))

    await supabase
      .from('cms_sections')
      .upsert(
        {
          section_key: 'hero_video_gallery',
          content: {
            ...(section?.content || {}),
            cards: cardsWithOrder,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'section_key' }
      )
  } catch (err) {
    console.error('[reorderHeroVideoCards] Error:', err)
  }
}

/**
 * Update global Hero Video Gallery settings
 */
export async function updateHeroVideoSettings(settings: Partial<HeroVideoSettings>): Promise<void> {
  const { data: section } = await supabase
    .from('cms_sections')
    .select('content, title, subtitle')
    .eq('section_key', 'hero_video_gallery')
    .maybeSingle()

  const currentSettings: HeroVideoSettings = section?.content?.settings || DEFAULT_HERO_SETTINGS
  const newSettings: HeroVideoSettings = {
    ...currentSettings,
    ...settings,
  }

  // Update hero_video_gallery section
  await supabase
    .from('cms_sections')
    .upsert(
      {
        section_key: 'hero_video_gallery',
        title: newSettings.hero_heading,
        subtitle: newSettings.hero_subtitle,
        media_url: newSettings.fallback_media_url,
        cta_label: newSettings.cta_primary_label,
        cta_href: newSettings.cta_primary_href,
        is_enabled: newSettings.is_enabled,
        content: {
          ...(section?.content || {}),
          settings: newSettings,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'section_key' }
    )

  // Also sync headline/subtitle to 'hero' cms_section so both remain synchronized
  try {
    const { data: heroMain } = await supabase
      .from('cms_sections')
      .select('content')
      .eq('section_key', 'hero')
      .maybeSingle()

    if (heroMain) {
      await supabase
        .from('cms_sections')
        .update({
          title: newSettings.hero_heading,
          subtitle: newSettings.hero_subtitle,
          cta_label: newSettings.cta_primary_label,
          cta_href: newSettings.cta_primary_href,
          content: {
            ...(heroMain.content || {}),
            badge_text: newSettings.badge_text,
            cta_primary_label: newSettings.cta_primary_label,
            cta_primary_href: newSettings.cta_primary_href,
            cta_secondary_label: newSettings.cta_secondary_label,
            cta_secondary_href: newSettings.cta_secondary_href,
            video_url: newSettings.fallback_video_url,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('section_key', 'hero')
    }
  } catch (err) {
    console.warn('[updateHeroVideoSettings] Syncing to hero section:', err)
  }
}

