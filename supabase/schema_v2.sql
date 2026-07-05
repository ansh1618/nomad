-- ==========================================
-- NOMADIK V2 — PRODUCTION SCHEMA
-- Run this in Supabase SQL Editor
-- ==========================================

-- STEP 0: Drop old tables (safe to re-run if previous schema exists)
-- Note: Drop in reverse dependency order
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.inquiries CASCADE;
DROP TABLE IF EXISTS public.trip_batches CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.gallery CASCADE;
DROP TABLE IF EXISTS public.journeys CASCADE;
DROP TABLE IF EXISTS public.destinations CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;

-- Drop old types if they exist
DROP TYPE IF EXISTS public.inquiry_status_enum CASCADE;
DROP TYPE IF EXISTS public.booking_status_enum CASCADE;
DROP TYPE IF EXISTS public.payment_status_enum CASCADE;
DROP TYPE IF EXISTS public.admin_role_enum CASCADE;

-- Drop old sequence
DROP SEQUENCE IF EXISTS booking_id_seq;

-- ==========================================
-- STEP 1: EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ==========================================
-- STEP 2: CUSTOM ENUM TYPES
-- ==========================================

-- Inquiry CRM Pipeline Status
-- NEW          = Just submitted from website
-- CONTACTED    = Admin has called/messaged the lead
-- FOLLOW_UP    = Lead asked to be contacted again later
-- CONVERTED    = Lead booked a trip
-- CANCELLED    = Lead dropped off
-- SPAM         = Junk / bot submission
CREATE TYPE public.inquiry_status_enum AS ENUM (
    'NEW', 'CONTACTED', 'FOLLOW_UP', 'CONVERTED', 'CANCELLED', 'SPAM'
);

-- Booking lifecycle
CREATE TYPE public.booking_status_enum AS ENUM (
    'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REFUNDED'
);

-- Payment state
CREATE TYPE public.payment_status_enum AS ENUM (
    'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'
);

-- Admin role hierarchy
-- SUPER_ADMIN  = Full control over everything
-- MANAGER      = Manage trips, bookings, view reports
-- TRIP_CAPTAIN = See their own assigned batches
-- SUPPORT      = Handle inquiries and customer queries
CREATE TYPE public.admin_role_enum AS ENUM (
    'SUPER_ADMIN', 'MANAGER', 'TRIP_CAPTAIN', 'SUPPORT'
);


-- ==========================================
-- STEP 3: HELPER FUNCTIONS
-- ==========================================

-- Auto-update updated_at column on any row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Booking ID sequence: NOM-2026-0001, NOM-2026-0002, etc.
CREATE SEQUENCE booking_id_seq START 1;

CREATE OR REPLACE FUNCTION generate_booking_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.booking_id := 'NOM-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('booking_id_seq')::text, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if the current authenticated user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is a manager or above
CREATE OR REPLACE FUNCTION is_manager_or_above()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins 
        WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'MANAGER')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- STEP 4: CORE TABLES
-- ==========================================

-- ---- SETTINGS ----
-- Stores global site configuration in scoped categories
-- Example: category='site', key='maintenance_mode', value='false'
CREATE TABLE public.settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    category text NOT NULL,          -- e.g., 'site', 'pricing', 'notifications'
    key text UNIQUE NOT NULL,
    value jsonb NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---- ADMINS ----
-- References Supabase Auth users. Add a user here after creating them in Auth > Users.
CREATE TABLE public.admins (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL UNIQUE,
    role public.admin_role_enum NOT NULL DEFAULT 'SUPPORT',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---- USERS ----
-- For future customer app login (not linked to admins)
CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name text NOT NULL,
    phone text UNIQUE NOT NULL,
    email text UNIQUE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---- DESTINATIONS ----
CREATE TABLE public.destinations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    subtitle text,
    hero_image text,
    hero_video text,
    description text,
    weather jsonb,          -- { summer: "...", monsoon: "...", winter: "..." }
    how_to_reach jsonb,     -- { road: "...", rail: "...", air: "..." }
    gallery jsonb,          -- Array of image URLs
    seo jsonb,              -- { title: "...", description: "..." }
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---- JOURNEYS ----
-- A journey is the base trip template (e.g., "Manali Weekend Escape")
-- Actual departure dates are stored in trip_batches
CREATE TABLE public.journeys (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    destination_id uuid REFERENCES public.destinations(id) ON DELETE CASCADE NOT NULL,
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    price numeric NOT NULL,
    duration text NOT NULL,           -- e.g., "3 Nights / 4 Days"
    transport text,
    difficulty text,
    distance text,
    season text,
    group_size text,
    pickup_point text,                -- Default pickup (can be overridden per batch)
    drop_point text,
    max_capacity integer DEFAULT 20,
    remaining_seats integer DEFAULT 20,
    itinerary jsonb,                  -- Array of { day, title, description, places }
    hotel text,
    food text,
    gallery jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---- TRIP BATCHES ----
-- Same journey, multiple departure dates. Solves duplication.
-- e.g., "Manali Weekend Escape" runs on July 12, 19, 26.
CREATE TABLE public.trip_batches (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
    departure_date date NOT NULL,
    return_date date NOT NULL,
    pickup_point text,                -- Override journey default
    capacity integer NOT NULL,
    available_seats integer NOT NULL,
    status text DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---- INQUIRIES (Lead CRM) ----
-- Every form submission on the website creates an inquiry.
-- Status progresses through the CRM pipeline.
CREATE TABLE public.inquiries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name text NOT NULL,
    phone text NOT NULL,
    email text,
    destination text,
    journey text,
    travel_date text,
    travellers integer DEFAULT 1,
    message text,
    source text DEFAULT 'Website',   -- 'Website', 'WhatsApp', 'Instagram', 'Referral'
    status public.inquiry_status_enum DEFAULT 'NEW',
    notes text,                       -- Admin internal notes
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---- BOOKINGS ----
-- Created when an inquiry is converted. Full financial & Razorpay data.
CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id text UNIQUE,           -- Auto-generated: NOM-2026-0001
    inquiry_id uuid REFERENCES public.inquiries(id) ON DELETE SET NULL,
    journey_id uuid REFERENCES public.journeys(id) ON DELETE RESTRICT,
    destination_id uuid REFERENCES public.destinations(id) ON DELETE RESTRICT,
    trip_batch_id uuid REFERENCES public.trip_batches(id) ON DELETE RESTRICT,

    -- Customer details (denormalized for quick admin view)
    customer_name text NOT NULL,
    phone text NOT NULL,
    email text,

    -- Trip details
    travel_date date,
    travellers_count integer NOT NULL,

    -- Financials
    amount numeric NOT NULL,          -- Base amount
    discount_amount numeric DEFAULT 0,
    final_amount numeric NOT NULL,    -- amount - discount_amount

    -- Status
    payment_status public.payment_status_enum DEFAULT 'PENDING',
    booking_status public.booking_status_enum DEFAULT 'PENDING',
    payment_method text,              -- 'Razorpay', 'UPI', 'Cash', 'Bank Transfer'

    -- Razorpay
    razorpay_order_id text,
    razorpay_payment_id text,
    razorpay_signature text,

    -- Extras
    coupon_code text,
    notes text,

    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---- PAYMENTS ----
-- Decoupled payment ledger. A booking can have multiple payment attempts.
CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    amount numeric NOT NULL,
    method text NOT NULL,             -- 'Razorpay', 'UPI', 'Cash'
    status public.payment_status_enum DEFAULT 'PENDING',
    transaction_id text UNIQUE,
    gateway text,                     -- 'Razorpay', 'PhonePe', etc.
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---- GALLERY ----
CREATE TABLE public.gallery (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    destination_id uuid REFERENCES public.destinations(id) ON DELETE CASCADE,
    journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    caption text,
    alt_text text,                    -- SEO-friendly alt text
    display_order integer DEFAULT 0,
    featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---- REVIEWS ----
CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE,
    author_name text NOT NULL,
    rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    content text NOT NULL,
    trip_date date,
    verified boolean DEFAULT false,   -- Admin has verified this person actually travelled
    approved boolean DEFAULT false,   -- Approved to show publicly
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================
-- STEP 5: INDEXES
-- ==========================================
CREATE INDEX idx_journeys_destination_id ON public.journeys(destination_id);
CREATE INDEX idx_trip_batches_journey_id ON public.trip_batches(journey_id);
CREATE INDEX idx_trip_batches_departure_date ON public.trip_batches(departure_date);
CREATE INDEX idx_inquiries_status ON public.inquiries(status);
CREATE INDEX idx_inquiries_created_at ON public.inquiries(created_at);
CREATE INDEX idx_inquiries_phone ON public.inquiries(phone);
CREATE INDEX idx_bookings_booking_id ON public.bookings(booking_id);
CREATE INDEX idx_bookings_booking_status ON public.bookings(booking_status);
CREATE INDEX idx_bookings_journey_id ON public.bookings(journey_id);
CREATE INDEX idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX idx_gallery_destination_id ON public.gallery(destination_id);
CREATE INDEX idx_gallery_display_order ON public.gallery(display_order);
CREATE INDEX idx_reviews_journey_id ON public.reviews(journey_id);
CREATE INDEX idx_reviews_approved ON public.reviews(approved);


-- ==========================================
-- STEP 6: TRIGGERS
-- ==========================================
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_destinations_updated_at
    BEFORE UPDATE ON public.destinations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journeys_updated_at
    BEFORE UPDATE ON public.journeys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_batches_updated_at
    BEFORE UPDATE ON public.trip_batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at
    BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate Booking ID on insert
CREATE TRIGGER generate_booking_id_trigger
    BEFORE INSERT ON public.bookings
    FOR EACH ROW
    WHEN (NEW.booking_id IS NULL)
    EXECUTE FUNCTION generate_booking_id();


-- ==========================================
-- STEP 7: ANALYTICS VIEWS
-- ==========================================

-- Dashboard quick stats
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
    (SELECT count(*) FROM public.inquiries WHERE created_at::date = current_date) AS today_leads,
    (SELECT count(*) FROM public.inquiries WHERE created_at >= date_trunc('week', current_date)) AS week_leads,
    (SELECT count(*) FROM public.bookings WHERE booking_status = 'CONFIRMED') AS confirmed_bookings,
    (SELECT count(*) FROM public.bookings WHERE booking_status = 'COMPLETED') AS completed_trips,
    (SELECT COALESCE(sum(final_amount), 0) FROM public.bookings WHERE payment_status = 'SUCCESS') AS total_revenue,
    (SELECT COALESCE(sum(final_amount), 0) FROM public.bookings WHERE payment_status = 'SUCCESS' AND created_at >= date_trunc('month', current_date)) AS this_month_revenue,
    (SELECT destination FROM public.inquiries GROUP BY destination ORDER BY count(*) DESC LIMIT 1) AS top_destination,
    (SELECT ROUND(count(*) FILTER (WHERE status = 'CONVERTED')::numeric / NULLIF(count(*), 0) * 100, 1) FROM public.inquiries) AS conversion_rate_percent;


-- ==========================================
-- STEP 8: ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;


-- ---- PUBLIC READ POLICIES ----
-- Rationale: Website visitors must be able to browse destinations, journeys, batches, gallery, and approved reviews.

CREATE POLICY "Public: Read all destinations"
    ON public.destinations FOR SELECT USING (true);

CREATE POLICY "Public: Read all journeys"
    ON public.journeys FOR SELECT USING (true);

CREATE POLICY "Public: Read non-cancelled trip batches"
    ON public.trip_batches FOR SELECT USING (status <> 'CANCELLED');

CREATE POLICY "Public: Read approved reviews"
    ON public.reviews FOR SELECT USING (approved = true);

CREATE POLICY "Public: Read gallery"
    ON public.gallery FOR SELECT USING (true);

CREATE POLICY "Public: Read public settings"
    ON public.settings FOR SELECT USING (category <> 'private');


-- ---- PUBLIC INSERT POLICIES ----
-- Rationale: Anyone can submit an inquiry. Reads are blocked to protect PII.
-- Bookings/payments are submitted from the server with service role, not anon.

CREATE POLICY "Public: Insert inquiries"
    ON public.inquiries FOR INSERT WITH CHECK (true);

-- Note: bookings and payments are inserted by server (service role key) via API
-- Not by anon browser. So no public insert policy for those.


-- ---- ADMIN FULL ACCESS POLICIES ----
-- Rationale: Admins (is_admin() = true) get unrestricted access to all tables.
-- is_admin() checks public.admins table, not just auth.users.

CREATE POLICY "Admin: Full access to settings"
    ON public.settings FOR ALL USING (is_admin());

CREATE POLICY "Admin: Full access to admins"
    ON public.admins FOR ALL USING (is_admin());

CREATE POLICY "Admin: Full access to users"
    ON public.users FOR ALL USING (is_admin());

CREATE POLICY "Admin: Full access to destinations"
    ON public.destinations FOR ALL USING (is_admin());

CREATE POLICY "Admin: Full access to journeys"
    ON public.journeys FOR ALL USING (is_admin());

CREATE POLICY "Admin: Full access to trip batches"
    ON public.trip_batches FOR ALL USING (is_admin());

CREATE POLICY "Admin: Full access to inquiries"
    ON public.inquiries FOR ALL USING (is_admin());

CREATE POLICY "Admin: Full access to bookings"
    ON public.bookings FOR ALL USING (is_admin());

CREATE POLICY "Admin: Full access to payments"
    ON public.payments FOR ALL USING (is_admin());

CREATE POLICY "Admin: Full access to gallery"
    ON public.gallery FOR ALL USING (is_admin());

CREATE POLICY "Admin: Full access to reviews"
    ON public.reviews FOR ALL USING (is_admin());


-- ==========================================
-- STEP 9: DEFAULT SETTINGS SEED
-- ==========================================
INSERT INTO public.settings (category, key, value, description) VALUES
    ('site', 'maintenance_mode', 'false', 'Set to true to show maintenance page'),
    ('site', 'site_name', '"The Nomadik Traveller"', 'Display name for the website'),
    ('site', 'contact_phone_primary', '"+91 78570 37041"', 'Primary WhatsApp/call number'),
    ('site', 'contact_phone_secondary', '"+91 99710 46607"', 'Secondary contact number'),
    ('site', 'contact_email', '"harsh.nomadik@gmail.com"', 'Primary contact email'),
    ('site', 'whatsapp_community', '"https://chat.whatsapp.com/Gs3A2oHpp4r0iYCVqxvS57"', 'WhatsApp community link'),
    ('site', 'instagram_url', '"https://www.instagram.com/nomadik.co.in"', 'Instagram profile URL'),
    ('pricing', 'gst_rate', '5', 'GST percentage to apply on bookings'),
    ('pricing', 'convenience_fee', '0', 'Platform convenience fee per booking')
ON CONFLICT (key) DO NOTHING;

