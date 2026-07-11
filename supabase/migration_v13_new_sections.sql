-- ============================================================
-- Migration v13: CMS Section defaults for newly wired components
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Insert default data for Special Offers section
INSERT INTO cms_sections (section_key, title, subtitle, content, is_enabled, sort_order)
VALUES (
  'special_offers',
  'Special Offers Ending Soon',
  'Limited-time offers',
  '{
    "offers": [
      {
        "icon": "Heart",
        "title": "Luxury Honeymoon",
        "desc": "Romantic overwater villas, private dinners & spa retreats.",
        "off": "Up to 30% OFF"
      },
      {
        "icon": "Users",
        "title": "Family Packages",
        "desc": "Kid-friendly stays, activities and stress-free planning.",
        "off": "Kids Go Free"
      },
      {
        "icon": "Mountain",
        "title": "Adventure Trips",
        "desc": "Treks, safaris and adrenaline-packed guided expeditions.",
        "off": "Up to 25% OFF"
      }
    ]
  }'::jsonb,
  true,
  15
)
ON CONFLICT (section_key) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle;

-- Insert default data for Experience Steps section
INSERT INTO cms_sections (section_key, title, subtitle, content, is_enabled, sort_order)
VALUES (
  'experience_steps',
  'The Nomadik Experience',
  'THE NOMADIK VIBE',
  '{
    "description": "A horizontal trail map of how we build connections and run road trips.",
    "steps": [
      { "icon": "Compass", "title": "Discover", "desc": "Browse handpicked mountain roads, old heritage lanes, and active group departures." },
      { "icon": "BookOpen", "title": "Book", "desc": "Secure your explorer seat with a token deposit. Splitting payments is supported." },
      { "icon": "Backpack", "title": "Pack", "desc": "Receive our Trip Captain custom packing logs, gear checks, and weather alerts." },
      { "icon": "Map", "title": "Travel", "desc": "Depart in road caravans, listening to acoustic soundtracks and exploring secret routes." },
      { "icon": "Sparkles", "title": "Explore", "desc": "Embark on guided walks to hidden streams, old village castles, and local food trials." },
      { "icon": "Heart", "title": "Remember", "desc": "Re-live the road trip memories in our WhatsApp tribe and co-traveler meetups." }
    ]
  }'::jsonb,
  true,
  16
)
ON CONFLICT (section_key) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle;

-- Insert default data for Our Promise section
INSERT INTO cms_sections (section_key, title, subtitle, content, is_enabled, sort_order)
VALUES (
  'our_promise',
  'Our Promise',
  'ON-ROAD JOURNEY',
  '{
    "description": "Every step of your adventure is crafted for slow travel and connection.",
    "steps": [
      { "icon": "CheckCircle2", "title": "Book", "desc": "Select your desired path and lock your seat. A Trip Captain will call to welcome you to the tribe." },
      { "icon": "Settings", "title": "Plan", "desc": "We finalize vetted cottage stays, route permits, safety checklists, and prepare you for the caravan." },
      { "icon": "ShieldCheck", "title": "Travel", "desc": "Hit the road in our AC Tempo Traveller caravans with co-explorers and experienced drivers." },
      { "icon": "Heart", "title": "Memories", "desc": "Return home with custom drone videos, campfire stories, and co-traveler connections that stay." }
    ]
  }'::jsonb,
  true,
  17
)
ON CONFLICT (section_key) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle;

-- Insert default data for Manifesto / Why We Don't Sell Trips
INSERT INTO cms_sections (section_key, title, subtitle, content, is_enabled, sort_order)
VALUES (
  'manifesto',
  'We Don''t Believe in Selling Trips.',
  '"We create memories, friendships, stories and experiences that stay with you forever. Nomadik isn''t a booking site; it''s a doorway to a tribe of explorers who believe every road has a story."',
  '{"badge": "OUR MANIFESTO", "cta_label": "Become A Nomadik Explorer"}'::jsonb,
  true,
  7
)
ON CONFLICT (section_key) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle;

-- Insert default data for Popular Destinations section headings
INSERT INTO cms_sections (section_key, title, subtitle, content, is_enabled, sort_order)
VALUES (
  'popular_destinations',
  'Popular Destinations',
  'Explore India''s most breathtaking roads. Handpicked getaways vetted by Nomadik Trip Captains.',
  '{"badge": "ACTIVE CONVOYS"}'::jsonb,
  true,
  3
)
ON CONFLICT (section_key) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle;

-- Insert default data for Featured Packages section headings
INSERT INTO cms_sections (section_key, title, subtitle, content, is_enabled, sort_order)
VALUES (
  'featured_packages',
  'Signature Experiences',
  'Handpicked adventures loved by thousands of explorers. Built around slow road travel and authentic vibes.',
  '{"badge": "NOMADIK SIGNATURE"}'::jsonb,
  true,
  9
)
ON CONFLICT (section_key) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle;

-- ============================================================
-- Also ensure homepage_layout has entries for newly wired sections
-- ============================================================
INSERT INTO homepage_layout (section_key, label, is_visible, sort_order)
VALUES
  ('special_offers', 'Special Offers (Countdown)', true, 14),
  ('experience_steps', 'Nomadik Experience Steps', true, 10),
  ('our_promise', 'Our Promise (4-step)', true, 8),
  ('popular_destinations', 'Popular Destinations Grid', true, 2),
  ('featured_packages', 'Featured Journeys Grid', true, 9)
ON CONFLICT (section_key) DO NOTHING;
