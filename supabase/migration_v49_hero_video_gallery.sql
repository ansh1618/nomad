-- ============================================================
-- GONOMADIK CMS MIGRATION v49: Hero Video Gallery & Dynamic CMS
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/sgeffapbsrppzrgqfpec/sql/new
-- ============================================================

-- 1. Create hero_video_gallery table
CREATE TABLE IF NOT EXISTS public.hero_video_gallery (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  destination_name text,
  instagram_url text,
  video_url text,
  thumbnail_url text,
  caption text,
  cta_url text DEFAULT '/destinations',
  card_size text DEFAULT 'medium', -- 'large' | 'medium' | 'portrait' | 'wide' | 'small'
  layout_position text DEFAULT 'center', -- 'center' | 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right'
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  autoplay boolean DEFAULT true,
  loop boolean DEFAULT true,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE public.hero_video_gallery ENABLE ROW LEVEL SECURITY;

-- 3. Public read policy
DROP POLICY IF EXISTS "Hero video gallery public read" ON public.hero_video_gallery;
CREATE POLICY "Hero video gallery public read" ON public.hero_video_gallery
  FOR SELECT TO anon, authenticated USING (true);

-- 4. Admin full access policy
DROP POLICY IF EXISTS "Hero video gallery admin write" ON public.hero_video_gallery;
CREATE POLICY "Hero video gallery admin write" ON public.hero_video_gallery
  FOR ALL USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean,
      false
    ) = true
    OR
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'superadmin')
    )
  );

-- 5. Seed initial 5 curated cinematic travel videos
INSERT INTO public.hero_video_gallery (
  id,
  title,
  destination_name,
  instagram_url,
  video_url,
  thumbnail_url,
  caption,
  cta_url,
  card_size,
  layout_position,
  display_order,
  is_active,
  autoplay,
  loop
)
VALUES
(
  '11111111-1111-4111-a111-111111111111',
  'Epic Himalayan Expeditions',
  'Spiti Valley & Kinnaur',
  'https://www.instagram.com/gonomadik.in',
  'https://assets.mixkit.co/videos/preview/mixkit-camper-driving-on-a-mountain-road-42289-large.mp4',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
  'Caravans traversing world highest motorable passes and rugged mountain gorges.',
  '/destinations',
  'large',
  'center',
  0,
  true,
  true,
  true
),
(
  '22222222-2222-4222-a222-222222222222',
  'Winter Snow Peaks & High Glaciers',
  'Kedarkantha & Manali',
  'https://www.instagram.com/gonomadik.in',
  'https://assets.mixkit.co/videos/preview/mixkit-snow-covered-pine-forest-and-mountains-42296-large.mp4',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
  'Crisp winter powder, snow treks to 12,500 ft, and panoramic Himalayan summits.',
  '/destinations',
  'portrait',
  'top_right',
  1,
  true,
  true,
  true
),
(
  '33333333-3333-4333-a333-333333333333',
  'Campfire Nights Under Starlit Skies',
  'Jibhi Riverside Valley',
  'https://www.instagram.com/gonomadik.in',
  'https://assets.mixkit.co/videos/preview/mixkit-bonfire-burning-in-the-snow-at-night-42299-large.mp4',
  'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80',
  'Acoustic sessions, cozy riverside camps, and warm hot-chocolate conversations.',
  '/destinations',
  'small',
  'bottom_right',
  2,
  true,
  true,
  true
),
(
  '44444444-4444-4444-a444-444444444444',
  'Winding Valley Drives & Waterfalls',
  'Munsiyari & Kumaon',
  'https://www.instagram.com/gonomadik.in',
  'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-winding-mountain-road-42291-large.mp4',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
  'Endless pine switchbacks, cascading Birthi falls, and breathtaking Johar valley vistas.',
  '/destinations',
  'medium',
  'bottom_left',
  3,
  true,
  true,
  true
),
(
  '55555555-5555-4555-a555-555555555555',
  'Solo Travelers Turned Lifelong Tribe',
  'Kasol & Kheerganga',
  'https://www.instagram.com/gonomadik.in',
  'https://assets.mixkit.co/videos/preview/mixkit-hikers-walking-along-a-mountain-trail-42293-large.mp4',
  'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&w=1200&q=80',
  'Curated community batches, certified Trip Captains, and safe, vibrant group journeys.',
  '/destinations',
  'portrait',
  'top_left',
  4,
  true,
  true,
  true
)
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  destination_name = EXCLUDED.destination_name,
  instagram_url = EXCLUDED.instagram_url,
  video_url = EXCLUDED.video_url,
  thumbnail_url = EXCLUDED.thumbnail_url,
  caption = EXCLUDED.caption,
  cta_url = EXCLUDED.cta_url,
  card_size = EXCLUDED.card_size,
  layout_position = EXCLUDED.layout_position,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  autoplay = EXCLUDED.autoplay,
  loop = EXCLUDED.loop,
  updated_at = timezone('utc'::text, now());

