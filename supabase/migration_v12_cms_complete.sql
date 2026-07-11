-- ============================================================
-- NOMADIK ERP — MIGRATION v12: Complete CMS Tables
-- Makes website 100% database-driven from Admin panel.
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/sgeffapbsrppzrgqfpec/sql/new
-- Safe: all statements use IF NOT EXISTS / ON CONFLICT DO NOTHING
-- ============================================================

-- ============================================================
-- 1. HELPER: Ensure updated_at trigger function exists
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. EXTEND cms_sections (if exists from v6)
-- ============================================================
ALTER TABLE public.cms_sections ADD COLUMN IF NOT EXISTS title       text;
ALTER TABLE public.cms_sections ADD COLUMN IF NOT EXISTS subtitle    text;
ALTER TABLE public.cms_sections ADD COLUMN IF NOT EXISTS media_url   text;
ALTER TABLE public.cms_sections ADD COLUMN IF NOT EXISTS cta_label   text;
ALTER TABLE public.cms_sections ADD COLUMN IF NOT EXISTS cta_href    text;
ALTER TABLE public.cms_sections ADD COLUMN IF NOT EXISTS is_enabled  boolean DEFAULT true;
ALTER TABLE public.cms_sections ADD COLUMN IF NOT EXISTS sort_order  integer DEFAULT 0;

-- RLS on cms_sections: public can read, admins can write
ALTER TABLE public.cms_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CMS sections: public read" ON public.cms_sections;
CREATE POLICY "CMS sections: public read" ON public.cms_sections
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "CMS sections: admin write" ON public.cms_sections;
CREATE POLICY "CMS sections: admin write" ON public.cms_sections
  FOR ALL USING (public.is_admin());

-- ============================================================
-- 3. SITE SETTINGS (key-value store)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  key         text        UNIQUE NOT NULL,
  value       text,
  description text,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Site settings: public read" ON public.site_settings;
CREATE POLICY "Site settings: public read" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Site settings: admin write" ON public.site_settings;
CREATE POLICY "Site settings: admin write" ON public.site_settings
  FOR ALL USING (public.is_admin());

-- Seed default site settings
INSERT INTO public.site_settings (key, value, description) VALUES
  ('company_name',       'Nomadik Travels',                     'Company display name'),
  ('tagline',            'Some Roads Change You Forever.',       'Hero tagline / motto'),
  ('support_phone',      '+91 99999 88888',                     'Primary support phone'),
  ('support_phone_2',    '',                                     'Secondary support phone'),
  ('support_email',      'bookings@gonomadik.com',              'Support email address'),
  ('whatsapp_number',    '919999988888',                        'WhatsApp number (no +/spaces)'),
  ('address',            'Delhi NCR, India',                    'Office / mailing address'),
  ('business_hours',     'Mon-Sat: 9AM - 7PM',                  'Business operating hours'),
  ('instagram_url',      'https://instagram.com/gonomadik',     'Instagram profile URL'),
  ('youtube_url',        'https://youtube.com/@gonomadik',      'YouTube channel URL'),
  ('linkedin_url',       '',                                     'LinkedIn page URL'),
  ('reddit_url',         'https://reddit.com/user/gonomadik',   'Reddit profile URL'),
  ('facebook_url',       '',                                     'Facebook page URL'),
  ('logo_url',           '',                                     'Main logo image URL'),
  ('logo_dark_url',      '',                                     'Dark mode logo image URL'),
  ('favicon_url',        '',                                     'Favicon URL'),
  ('google_map_embed',   '',                                     'Google Maps embed URL'),
  ('gst_number',         '',                                     'GSTIN number'),
  ('cashfree_app_id',    '',                                     'Cashfree App ID'),
  ('ga4_measurement_id', '',                                     'Google Analytics 4 ID'),
  ('footer_copyright',   '© 2025 The Nomadik Traveller. All rights reserved.', 'Footer copyright text'),
  ('footer_quote',       'Life is short. Take the scenic route.', 'Footer inspirational quote')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 4. FAQS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.faqs (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  question       text        NOT NULL,
  answer         text        NOT NULL,
  page           text        NOT NULL DEFAULT 'homepage', -- homepage, about, contact, destination, booking
  category       text,                                    -- General, Safety, Payments, etc.
  sort_order     integer     DEFAULT 0,
  is_active      boolean     DEFAULT true,
  destination_id uuid        REFERENCES public.destinations(id) ON DELETE CASCADE,
  journey_id     uuid        REFERENCES public.journeys(id) ON DELETE CASCADE,
  created_at     timestamptz DEFAULT now() NOT NULL,
  updated_at     timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_faqs_page        ON public.faqs(page);
CREATE INDEX IF NOT EXISTS idx_faqs_active      ON public.faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_faqs_order       ON public.faqs(sort_order);
CREATE INDEX IF NOT EXISTS idx_faqs_destination ON public.faqs(destination_id);

DROP TRIGGER IF EXISTS faqs_updated_at ON public.faqs;
CREATE TRIGGER faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "FAQs: public read" ON public.faqs;
CREATE POLICY "FAQs: public read" ON public.faqs
  FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "FAQs: admin full access" ON public.faqs;
CREATE POLICY "FAQs: admin full access" ON public.faqs
  FOR ALL USING (public.is_admin());

-- Seed default homepage FAQs
INSERT INTO public.faqs (question, answer, page, category, sort_order) VALUES
  ('Is it safe to travel solo with Nomadik?',
   'Absolutely. Over 60% of our explorers are solo travelers. Every trip is led by an experienced Trip Captain, runs in GPS-tracked vehicles, and includes 24×7 support from our Delhi NCR operations team. We''ve safely hosted 15,000+ travelers across 120+ trips.',
   'homepage', 'Safety', 1),
  ('Where is the pickup and drop point?',
   'Most trips depart from Delhi NCR (Majnu Ka Tila or Kashmere Gate). Chandigarh pickup is available for Himachal trips. Exact pickup details are shared 48 hours before departure via WhatsApp.',
   'homepage', 'Logistics', 2),
  ('Are meals included in the journey price?',
   'Breakfast and dinner are included on all trips. Lunch is on your own so you can explore local eateries and street food — that''s part of the adventure!',
   'homepage', 'Inclusions', 3),
  ('Can I customize an itinerary or do a private group trip?',
   'Yes! We offer custom itineraries for private groups of 6+ explorers. Contact our Trip Planning team via WhatsApp or the website form and we''ll design a personalized journey within 24 hours.',
   'homepage', 'Customization', 4),
  ('Do you offer EMI or split payment options?',
   'Yes. You can secure your seat with a token amount of ₹2,000 and pay the rest in installments before the trip date. We support UPI, bank transfers, and select EMI options.',
   'homepage', 'Payments', 5),
  ('What about safety for women travelers?',
   'Women safety is our top priority. All Trip Captains are background-verified. Our groups maintain a healthy gender ratio. We have a dedicated women''s safety helpline, and female Trip Captains are available on select departures.',
   'homepage', 'Safety', 6),
  ('What is the cancellation and refund policy?',
   'Full refund if cancelled 15+ days before departure. 50% refund for 7-14 days. No refund within 7 days, but you can transfer your seat to someone else. Trip date changes are free if done 10+ days in advance, subject to availability.',
   'homepage', 'Payments', 7),
  ('What should I pack for a mountain road trip?',
   'We share a detailed packing checklist via WhatsApp 5 days before your trip. Essentials include layered clothing, comfortable trekking shoes, a rain jacket, sunscreen, and a power bank.',
   'homepage', 'General', 8)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. NAV ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.nav_items (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  label       text        NOT NULL,
  href        text        NOT NULL,
  sort_order  integer     DEFAULT 0,
  is_active   boolean     DEFAULT true,
  is_external boolean     DEFAULT false,
  parent_id   uuid        REFERENCES public.nav_items(id) ON DELETE SET NULL,
  icon        text,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nav_items_order  ON public.nav_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_nav_items_active ON public.nav_items(is_active);

DROP TRIGGER IF EXISTS nav_items_updated_at ON public.nav_items;
CREATE TRIGGER nav_items_updated_at
  BEFORE UPDATE ON public.nav_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Nav items: public read" ON public.nav_items;
CREATE POLICY "Nav items: public read" ON public.nav_items
  FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "Nav items: admin write" ON public.nav_items;
CREATE POLICY "Nav items: admin write" ON public.nav_items
  FOR ALL USING (public.is_admin());

-- Seed default nav items
INSERT INTO public.nav_items (label, href, sort_order) VALUES
  ('Destinations',  '/destinations', 1),
  ('Journeys',      '/destinations', 2),
  ('Stories',       '/stories',      3),
  ('About',         '/about',        4),
  ('Contact',       '/contact',      5)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. FOOTER SECTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.footer_sections (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key text        UNIQUE NOT NULL,  -- 'destinations', 'company', 'support', 'legal'
  title       text        NOT NULL,
  links       jsonb       DEFAULT '[]',     -- [{label, href, is_external}]
  sort_order  integer     DEFAULT 0,
  is_active   boolean     DEFAULT true,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

DROP TRIGGER IF EXISTS footer_sections_updated_at ON public.footer_sections;
CREATE TRIGGER footer_sections_updated_at
  BEFORE UPDATE ON public.footer_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.footer_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Footer sections: public read" ON public.footer_sections;
CREATE POLICY "Footer sections: public read" ON public.footer_sections
  FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "Footer sections: admin write" ON public.footer_sections;
CREATE POLICY "Footer sections: admin write" ON public.footer_sections
  FOR ALL USING (public.is_admin());

-- Seed default footer sections
INSERT INTO public.footer_sections (section_key, title, links, sort_order) VALUES
  ('destinations', 'Destinations', '[
    {"label": "Manali",           "href": "/manali"},
    {"label": "Jibhi",            "href": "/jibhi"},
    {"label": "Chopta & Tungnath","href": "/chopta-tungnath"},
    {"label": "McLeod Ganj",      "href": "/mcleodganj"},
    {"label": "Udaipur",          "href": "/udaipur"}
  ]'::jsonb, 1),
  ('company', 'Company', '[
    {"label": "About Nomadik", "href": "/about"},
    {"label": "Stories",       "href": "/stories"},
    {"label": "Contact Us",    "href": "/contact"},
    {"label": "Blog",          "href": "/blog"}
  ]'::jsonb, 2),
  ('legal', 'Legal', '[
    {"label": "Privacy Policy",      "href": "/privacy"},
    {"label": "Terms of Service",    "href": "/terms"},
    {"label": "Refund Policy",       "href": "/cancellation"}
  ]'::jsonb, 3)
ON CONFLICT (section_key) DO NOTHING;

-- ============================================================
-- 7. ANNOUNCEMENT BAR TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.announcement_bar (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  message     text        NOT NULL,
  link        text,
  link_text   text,
  bg_color    text        DEFAULT '#1e3a5f',  -- hex color
  text_color  text        DEFAULT '#ffffff',
  is_active   boolean     DEFAULT false,
  expires_at  timestamptz,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

DROP TRIGGER IF EXISTS announcement_bar_updated_at ON public.announcement_bar;
CREATE TRIGGER announcement_bar_updated_at
  BEFORE UPDATE ON public.announcement_bar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.announcement_bar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Announcement: public read" ON public.announcement_bar;
CREATE POLICY "Announcement: public read" ON public.announcement_bar
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Announcement: admin write" ON public.announcement_bar;
CREATE POLICY "Announcement: admin write" ON public.announcement_bar
  FOR ALL USING (public.is_admin());

-- ============================================================
-- 8. HOMEPAGE LAYOUT (section show/hide/reorder)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.homepage_layout (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key text        UNIQUE NOT NULL,
  label       text        NOT NULL,
  is_visible  boolean     DEFAULT true,
  sort_order  integer     DEFAULT 0,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

DROP TRIGGER IF EXISTS homepage_layout_updated_at ON public.homepage_layout;
CREATE TRIGGER homepage_layout_updated_at
  BEFORE UPDATE ON public.homepage_layout
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.homepage_layout ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Homepage layout: public read" ON public.homepage_layout;
CREATE POLICY "Homepage layout: public read" ON public.homepage_layout
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Homepage layout: admin write" ON public.homepage_layout;
CREATE POLICY "Homepage layout: admin write" ON public.homepage_layout
  FOR ALL USING (public.is_admin());

-- Seed default homepage layout order
INSERT INTO public.homepage_layout (section_key, label, is_visible, sort_order) VALUES
  ('hero',          'Hero Banner',          true,  1),
  ('stats',         'Stats Counter',        true,  2),
  ('why_us',        'Why Choose Us',        true,  3),
  ('destinations',  'Popular Destinations', true,  4),
  ('packages',      'Featured Packages',    true,  5),
  ('map',           'India Map',            true,  6),
  ('testimonials',  'Testimonials',         true,  7),
  ('stories',       'Instagram Stories',    true,  8),
  ('community',     'Community CTA',        true,  9),
  ('faq',           'FAQs',                 true,  10)
ON CONFLICT (section_key) DO NOTHING;

-- ============================================================
-- 9. HERO SLIDES TABLE (for slider mode)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title        text        NOT NULL,
  subtitle     text,
  media_url    text        NOT NULL,
  media_type   text        DEFAULT 'image', -- 'image' | 'video'
  cta_label    text        DEFAULT 'Explore Trips',
  cta_href     text        DEFAULT '/destinations',
  cta2_label   text,
  cta2_href    text,
  overlay_opacity numeric  DEFAULT 0.5,
  sort_order   integer     DEFAULT 0,
  is_active    boolean     DEFAULT true,
  created_at   timestamptz DEFAULT now() NOT NULL,
  updated_at   timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hero_slides_active ON public.hero_slides(is_active);
CREATE INDEX IF NOT EXISTS idx_hero_slides_order  ON public.hero_slides(sort_order);

DROP TRIGGER IF EXISTS hero_slides_updated_at ON public.hero_slides;
CREATE TRIGGER hero_slides_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Hero slides: public read" ON public.hero_slides;
CREATE POLICY "Hero slides: public read" ON public.hero_slides
  FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "Hero slides: admin write" ON public.hero_slides;
CREATE POLICY "Hero slides: admin write" ON public.hero_slides
  FOR ALL USING (public.is_admin());

-- ============================================================
-- 10. THEME CONFIG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.theme_config (
  id    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key   text UNIQUE NOT NULL,
  value text,
  label text
);

ALTER TABLE public.theme_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Theme config: public read" ON public.theme_config;
CREATE POLICY "Theme config: public read" ON public.theme_config
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Theme config: admin write" ON public.theme_config;
CREATE POLICY "Theme config: admin write" ON public.theme_config
  FOR ALL USING (public.is_admin());

-- Seed default theme config
INSERT INTO public.theme_config (key, value, label) VALUES
  ('primary_color',   '#1e3a5f', 'Primary Color'),
  ('accent_color',    '#c9a84c', 'Accent / Gold Color'),
  ('font_heading',    'Playfair Display', 'Heading Font'),
  ('font_body',       'Inter', 'Body Font'),
  ('border_radius',   'rounded', 'Border Radius Preset') -- sharp | rounded | pill
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 11. PAGE SEO TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.page_seo (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key    text        UNIQUE NOT NULL,  -- 'home', 'about', 'contact', 'destinations', 'stories', 'blog'
  page_label  text        NOT NULL,
  title       text,
  description text,
  og_image    text,
  keywords    text,
  canonical   text,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

DROP TRIGGER IF EXISTS page_seo_updated_at ON public.page_seo;
CREATE TRIGGER page_seo_updated_at
  BEFORE UPDATE ON public.page_seo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.page_seo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Page SEO: public read" ON public.page_seo;
CREATE POLICY "Page SEO: public read" ON public.page_seo
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Page SEO: admin write" ON public.page_seo;
CREATE POLICY "Page SEO: admin write" ON public.page_seo
  FOR ALL USING (public.is_admin());

-- Seed default page SEO entries
INSERT INTO public.page_seo (page_key, page_label, title, description) VALUES
  ('home',         'Homepage',         'Nomadik — Premium Curated Road Trips Across India', 'Discover handpicked road trip experiences to Manali, Jibhi, Chopta, McLeod Ganj & Udaipur. Curated journeys with experienced Trip Captains.'),
  ('about',        'About Page',       'About Nomadik | Our Story & Team',                  'Learn about Nomadik — who we are, what drives us, and why thousands of explorers trust us for their road trips.'),
  ('contact',      'Contact Page',     'Contact Nomadik | Book Your Trip Now',              'Get in touch with Nomadik for custom trip planning, group bookings, or any queries about our road trips across India.'),
  ('destinations', 'Destinations',     'All Destinations | Nomadik Road Trips',             'Explore all curated road trip destinations — Manali, Jibhi, Chopta, McLeod Ganj, Udaipur and more.'),
  ('stories',      'Stories',          'Travel Stories | Nomadik Explorer Tales',           'Real travel stories from Nomadik explorers. Inspiring road trip tales from across India.'),
  ('blog',         'Blog',             'Nomadik Blog | Travel Tips & Guides',               'Expert travel tips, packing guides, destination guides and road trip inspiration from Nomadik.')
ON CONFLICT (page_key) DO NOTHING;

-- ============================================================
-- 12. SEED DEFAULT CMS SECTIONS
-- ============================================================
-- First, drop the NOT NULL constraint on section_title so our new title column is the source of truth
ALTER TABLE public.cms_sections ALTER COLUMN section_title DROP NOT NULL;

INSERT INTO public.cms_sections (section_key, section_title, title, subtitle, content, is_enabled, sort_order) VALUES
  ('hero', 'Some Roads Change You Forever.', 'Some Roads Change You Forever.', 'Explore India''s most breathtaking roads with expertly planned group trips, weekend escapes and unforgettable adventures.',
   '{
     "bg_type": "video",
     "video_url": "https://assets.mixkit.co/videos/preview/mixkit-camper-driving-on-a-mountain-road-42289-large.mp4",
     "badge_text": "Curated Road Trips",
     "cta_primary_label": "Explore Trips",
     "cta_primary_href": "/destinations",
     "cta_secondary_label": "Upcoming Departures",
     "cta_secondary_href": "/destinations",
     "stats_badges": [
       {"icon": "⭐", "text": "500+ Happy Travellers"},
       {"icon": "🏔", "text": "15+ Destinations"},
       {"icon": "🚌", "text": "Weekly Departures"},
       {"icon": "⭐", "text": "Rated 4.9/5"}
     ]
   }'::jsonb, true, 1),
  ('stats', 'Travel Stats', 'Travel Stats', NULL,
   '{
     "stats": [
       {"label": "Happy Explorers", "value": 15000, "suffix": "+", "icon": "users"},
       {"label": "Road Trips",      "value": 120,   "suffix": "+", "icon": "compass"},
       {"label": "Average Rating",  "value": 4,     "suffix": ".9★","icon": "star"},
       {"label": "Years Experience","value": 8,     "suffix": "+", "icon": "award"}
     ]
   }'::jsonb, true, 2),
  ('features', 'Why Choose Nomadik', 'Why Choose Nomadik', 'Six reasons thousands trust us with their most precious time.',
   '{
     "cards": [
       {"icon": "Shield",     "title": "Safety First",        "text": "GPS-tracked vehicles, verified captains, 24×7 ops support."},
       {"icon": "Star",       "title": "Curated Experiences", "text": "Every detail planned — hotels, meals, routes, surprises."},
       {"icon": "Users",      "title": "Amazing Community",   "text": "Join 15,000+ explorers who travel, bond, and come back."},
       {"icon": "IndianRupee","title": "Fair Pricing",        "text": "No hidden fees. All-inclusive packages with clear breakdowns."},
       {"icon": "Headphones", "title": "24×7 Support",        "text": "Our operations team is always on call — before and during trips."},
       {"icon": "Award",      "title": "Experienced Captains","text": "Trip Captains with 100+ trips of experience guide every journey."}
     ]
   }'::jsonb, true, 3),
  ('community_cta', 'Join the Nomadik Family', 'Join the Nomadik Family', 'Join 15,000+ explorers in our WhatsApp community.',
   '{
     "description": "Get trip updates, flash deals, last seat alerts, and travel tips directly on WhatsApp.",
     "cta_label": "Join WhatsApp Community",
     "stats": [
       {"value": "15,000+", "label": "Members"},
       {"value": "Weekly",  "label": "Updates"},
       {"value": "Free",    "label": "Always"}
     ]
   }'::jsonb, true, 9)
ON CONFLICT (section_key) DO UPDATE SET
  content       = EXCLUDED.content,
  section_title = EXCLUDED.section_title,
  title         = EXCLUDED.title,
  subtitle      = EXCLUDED.subtitle,
  updated_at    = now();

-- ============================================================
-- 13. RLS on stories table (if exists from v7)
-- ============================================================
ALTER TABLE IF EXISTS public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Stories: public read published" ON public.stories;
CREATE POLICY "Stories: public read published" ON public.stories
  FOR SELECT TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "Stories: admin full access" ON public.stories;
CREATE POLICY "Stories: admin full access" ON public.stories
  FOR ALL USING (public.is_admin());

-- ============================================================
-- 14. Ensure reviews table has is_approved column (code uses is_approved)
-- ============================================================
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;

-- Backfill is_approved from the legacy 'approved' column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'approved'
  ) THEN
    UPDATE public.reviews SET is_approved = approved WHERE is_approved IS DISTINCT FROM approved;
  END IF;
END $$;

ALTER TABLE public.reviews ALTER COLUMN is_approved SET DEFAULT false;

DROP POLICY IF EXISTS "Reviews: public read approved" ON public.reviews;
CREATE POLICY "Reviews: public read approved" ON public.reviews
  FOR SELECT TO anon, authenticated USING (is_approved = true);

DROP POLICY IF EXISTS "Reviews: public insert" ON public.reviews;
CREATE POLICY "Reviews: public insert" ON public.reviews
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Reviews: admin full access" ON public.reviews;
CREATE POLICY "Reviews: admin full access" ON public.reviews
  FOR ALL USING (public.is_admin());

-- ============================================================
-- Done!
-- ============================================================
SELECT 'Migration v12 complete! CMS tables created: site_settings, faqs, nav_items, footer_sections, announcement_bar, homepage_layout, hero_slides, theme_config, page_seo. cms_sections extended and seeded.' AS status;
