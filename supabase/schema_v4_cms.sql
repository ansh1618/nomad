-- ==========================================
-- NOMADIK V4 — SCHEMA ADDITIONS FOR ADMIN CMS
-- Run AFTER schema_v3.sql
-- ==========================================

-- New role: CONTENT_EDITOR
-- (Can't ALTER TYPE easily, so we recreate if needed. In production, use ALTER TYPE...ADD VALUE)
-- ALTER TYPE public.admin_role_enum ADD VALUE IF NOT EXISTS 'CONTENT_EDITOR';

-- ==========================================
-- INQUIRIES (Lead Management / CRM)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.inquiries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    destination_id uuid REFERENCES public.destinations(id) ON DELETE SET NULL,
    journey_id uuid REFERENCES public.journeys(id) ON DELETE SET NULL,
    message text,
    source text DEFAULT 'WEBSITE', -- 'WEBSITE', 'WHATSAPP', 'INSTAGRAM', 'REFERRAL', 'GOOGLE'
    status text DEFAULT 'NEW', -- 'NEW', 'CONTACTED', 'INTERESTED', 'PAYMENT_PENDING', 'BOOKED', 'COMPLETED', 'LOST'
    assigned_to uuid REFERENCES public.admins(id),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ==========================================
-- BANNERS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.banners (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    placement text NOT NULL, -- 'HERO', 'OFFER', 'POPUP', 'ANNOUNCEMENT'
    title text,
    subtitle text,
    image_url text,
    cta_text text,
    cta_link text,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    valid_from timestamp with time zone,
    valid_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ==========================================
-- ACTIVITY LOG (Admin Action Tracking)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.activity_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id uuid REFERENCES public.admins(id) ON DELETE SET NULL,
    admin_email text,
    action text NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'LOGIN', 'LOGOUT'
    entity_type text NOT NULL, -- 'DESTINATION', 'JOURNEY', 'DEPARTURE', 'BOOKING', 'HOTEL', 'BUS', etc.
    entity_id uuid,
    description text NOT NULL,
    metadata jsonb, -- Store old/new values for auditing
    ip_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ==========================================
-- DYNAMIC PRICING
-- ==========================================
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    departure_id uuid REFERENCES public.departures(id) ON DELETE CASCADE NOT NULL,
    tier_name text NOT NULL, -- 'EARLY_BIRD', 'REGULAR', 'LAST_MINUTE'
    price numeric NOT NULL,
    seats_threshold integer, -- e.g. first 5 seats at this price
    valid_from timestamp with time zone,
    valid_until timestamp with time zone,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ==========================================
-- GALLERY TABLE (if not exists from v3)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.gallery (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    destination_id uuid REFERENCES public.destinations(id) ON DELETE CASCADE,
    journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE,
    media_type text DEFAULT 'IMAGE', -- 'IMAGE', 'VIDEO', 'DRONE', 'REEL', 'STORY'
    url text NOT NULL,
    thumbnail_url text,
    caption text,
    folder text, -- For organizing: 'Manali', 'Jibhi', etc.
    file_size integer,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ==========================================
-- REVIEWS TABLE (enhanced if not exists from v3)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    author_name text NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content text NOT NULL,
    trip_date text,
    approved boolean DEFAULT false,
    featured boolean DEFAULT false,
    admin_reply text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ==========================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ==========================================

-- Destinations: extra fields for CMS
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS weather jsonb;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS how_to_reach text;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS temperature text;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS faqs jsonb;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS best_season text;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS gallery jsonb;

-- Journeys: extra fields for CMS
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS highlights jsonb;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS gallery jsonb;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS policies jsonb;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS faqs jsonb;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS group_size text;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS max_capacity integer;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS transport text;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS hotel text;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS food text;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS season text;

-- Departures: extra fields
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS pickup_location text;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS drop_location text;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS notes text;

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON public.inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_admin ON public.activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_dest ON public.gallery(destination_id);
CREATE INDEX IF NOT EXISTS idx_gallery_journey ON public.gallery(journey_id);
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_departure ON public.pricing_tiers(departure_id);
CREATE INDEX IF NOT EXISTS idx_banners_placement ON public.banners(placement);

-- ==========================================
-- RLS FOR NEW TABLES
-- ==========================================
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public read for website-facing data
CREATE POLICY "Public: Read active banners" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Public: Read gallery" ON public.gallery FOR SELECT USING (true);
CREATE POLICY "Public: Read approved reviews" ON public.reviews FOR SELECT USING (approved = true);
CREATE POLICY "Public: Read pricing tiers" ON public.pricing_tiers FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins: Full inquiries" ON public.inquiries FOR ALL USING (has_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'TRIP_MANAGER', 'SUPPORT']::public.admin_role_enum[]));
CREATE POLICY "Admins: Full banners" ON public.banners FOR ALL USING (has_role(ARRAY['SUPER_ADMIN', 'ADMIN']::public.admin_role_enum[]));
CREATE POLICY "Admins: Full activity_log" ON public.activity_log FOR ALL USING (has_role(ARRAY['SUPER_ADMIN', 'ADMIN']::public.admin_role_enum[]));
CREATE POLICY "Admins: Full gallery" ON public.gallery FOR ALL USING (has_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'TRIP_MANAGER']::public.admin_role_enum[]));
CREATE POLICY "Admins: Full reviews" ON public.reviews FOR ALL USING (has_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'SUPPORT']::public.admin_role_enum[]));
CREATE POLICY "Admins: Full pricing_tiers" ON public.pricing_tiers FOR ALL USING (has_role(ARRAY['SUPER_ADMIN', 'ADMIN']::public.admin_role_enum[]));

-- Triggers for new tables
CREATE TRIGGER update_inquiries_mod BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
