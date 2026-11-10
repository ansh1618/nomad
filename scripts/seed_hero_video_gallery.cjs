const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://sgeffapbsrppzrgqfpec.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required to seed database.');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const INITIAL_VIDEO_CARDS = [
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
    loop: true
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
    loop: true
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
    loop: true
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
    loop: true
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
    loop: true
  }
];

const GLOBAL_SETTINGS = {
  is_enabled: true,
  max_visible_cards: 5,
  desktop_layout: 'collage', // 'collage' | 'grid' | 'featured_focus'
  mobile_layout: 'carousel', // 'carousel' | 'compact_grid' | 'single_featured'
  transition_duration: 500,
  auto_rotation_interval: 6000,
  enable_overlay: true,
  overlay_opacity: 0.65,
  badge_text: 'Curated Road Trips & Himalayan Treks',
  hero_heading: 'Your Next Adventure Begins Here.',
  hero_subtitle: 'Discover breathtaking destinations, unforgettable journeys and experiences worth remembering with India most trusted travel collective.',
  cta_primary_label: 'Explore Destinations',
  cta_primary_href: '/destinations',
  cta_secondary_label: 'Upcoming Trips',
  cta_secondary_href: '/destinations',
  fallback_media_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=90',
  fallback_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-camper-driving-on-a-mountain-road-42289-large.mp4'
};

async function seed() {
  console.log('Seeding Hero Video Gallery in cms_sections...');

  const sectionData = {
    section_key: 'hero_video_gallery',
    title: GLOBAL_SETTINGS.hero_heading,
    subtitle: GLOBAL_SETTINGS.hero_subtitle,
    media_url: GLOBAL_SETTINGS.fallback_media_url,
    cta_label: GLOBAL_SETTINGS.cta_primary_label,
    cta_href: GLOBAL_SETTINGS.cta_primary_href,
    is_enabled: true,
    sort_order: 0,
    content: {
      settings: GLOBAL_SETTINGS,
      cards: INITIAL_VIDEO_CARDS
    }
  };

  const { data, error } = await sb
    .from('cms_sections')
    .upsert(sectionData, { onConflict: 'section_key' });

  if (error) {
    console.error('Error seeding hero_video_gallery in cms_sections:', error);
  } else {
    console.log('Successfully seeded hero_video_gallery in cms_sections!');
  }

  // Also check if hero_video_gallery table exists
  try {
    const { error: tblErr } = await sb.from('hero_video_gallery').select('id').limit(1);
    if (!tblErr) {
      console.log('hero_video_gallery table exists! Inserting video cards into table...');
      for (const card of INITIAL_VIDEO_CARDS) {
        await sb.from('hero_video_gallery').upsert(card, { onConflict: 'id' });
      }
      console.log('Successfully synced cards to hero_video_gallery table!');
    } else {
      console.log('hero_video_gallery table not created yet (user can run migration_v49_hero_video_gallery.sql in Supabase SQL editor). Fallback to cms_sections is active and fully functional!');
    }
  } catch (e) {
    console.log('Table check error:', e.message);
  }
}

seed();

