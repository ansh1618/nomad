-- ============================================================
-- NOMADIK ERP — SAFE SCHEMA UPGRADE (v6 ERP Tables)
-- Run this in Supabase SQL Editor BEFORE running migration_v8.
-- Creates all missing ERP tables (departures, hotels, buses, etc.)
-- and upgrades existing tables safely without losing data.
-- ============================================================

-- 1. Create missing custom types
DO $$ BEGIN
  CREATE TYPE public.booking_state_enum AS ENUM (
    'CREATED', 'SEAT_LOCKED', 'PAYMENT_PENDING', 'PARTIAL_PAID', 
    'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'REFUNDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status_enum AS ENUM (
    'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.admin_role_enum AS ENUM (
    'SUPER_ADMIN', 'ADMIN', 'TRIP_MANAGER', 'HOTEL_MANAGER', 'SUPPORT', 'ACCOUNTANT'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 2. Upgrade existing tables (destinations, journeys, admins, bookings) safely
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'SUPPORT';
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Destinations additions
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS country text DEFAULT 'India';
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS highlights jsonb DEFAULT '[]';
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS best_time_to_visit text;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS map_embed_url text;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Journeys additions
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS starting_price numeric;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS highlights jsonb DEFAULT '[]';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS inclusions jsonb DEFAULT '[]';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS exclusions jsonb DEFAULT '[]';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS policies jsonb DEFAULT '[]';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS faqs jsonb DEFAULT '[]';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS videos jsonb DEFAULT '[]';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS status text DEFAULT 'Draft';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS hero_banner text;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();


-- 3. Create ERP specific tables

-- Settings
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Media Assets
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  filename text NOT NULL,
  url text NOT NULL,
  size integer,
  mime_type text,
  folder text DEFAULT 'general',
  uploaded_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Trip Captains
CREATE TABLE IF NOT EXISTS public.trip_captains (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text UNIQUE,
  phone text NOT NULL,
  bio text,
  photo_url text,
  instagram_handle text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Itinerary Days
CREATE TABLE IF NOT EXISTS public.itinerary_days (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
  day_number integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  meals text[],
  accommodation text,
  distance_covered text,
  time_taken text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (journey_id, day_number)
);

-- Package Revisions
CREATE TABLE IF NOT EXISTS public.package_revisions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
  revision_number integer NOT NULL,
  snapshot jsonb NOT NULL,
  created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Buses
CREATE TABLE IF NOT EXISTS public.buses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  registration_number text UNIQUE NOT NULL,
  bus_type text NOT NULL,             -- 'Sleeper', 'Semi-Sleeper', 'Seater'
  total_seats integer NOT NULL DEFAULT 40,
  amenities text[],
  operator_name text,
  operator_contact text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Bus Seats
CREATE TABLE IF NOT EXISTS public.bus_seats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bus_id uuid REFERENCES public.buses(id) ON DELETE CASCADE NOT NULL,
  seat_number text NOT NULL,
  row_number integer,
  column_number integer,
  seat_type text DEFAULT 'Standard',  -- 'Window', 'Aisle', 'Double'
  is_available boolean DEFAULT true,
  UNIQUE (bus_id, seat_number)
);

-- Hotels
CREATE TABLE IF NOT EXISTS public.hotels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  city text NOT NULL,
  address text,
  longitude numeric,
  latitude numeric,
  star_rating integer,
  description text,
  meal_plans text[],
  check_in_time text DEFAULT '14:00',
  check_out_time text DEFAULT '11:00',
  contact_name text,
  contact_phone text,
  contact_email text,
  website text,
  is_active boolean DEFAULT true,
  notes text,
  created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Hotel Rooms
CREATE TABLE IF NOT EXISTS public.hotel_rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL,
  room_type text NOT NULL,           -- 'Single', 'Double', 'Triple', 'Dormitory', 'Suite'
  sharing_type text,                 -- 'SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD', 'DORM'
  capacity integer NOT NULL DEFAULT 2,
  price_per_night numeric,
  price_modifier numeric DEFAULT 0,
  total_rooms integer DEFAULT 1,
  amenities text[],
  description text,
  images jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Departures
CREATE TABLE IF NOT EXISTS public.departures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
  trip_captain_id uuid REFERENCES public.trip_captains(id) ON DELETE SET NULL,
  bus_id uuid REFERENCES public.buses(id) ON DELETE SET NULL,
  hotel_id uuid REFERENCES public.hotels(id) ON DELETE SET NULL,
  departure_date date NOT NULL,
  return_date date NOT NULL,
  total_seats integer NOT NULL DEFAULT 20,
  available_seats integer NOT NULL DEFAULT 20,
  booked_seats integer DEFAULT 0,
  base_price numeric NOT NULL,
  dynamic_price numeric,
  discount_amount numeric DEFAULT 0,
  discount_type text,
  pickup_location text,
  drop_location text,
  pickup_time time,
  hotel_name text,
  notes text,
  status text DEFAULT 'UPCOMING',
  is_visible boolean DEFAULT true,
  is_closed boolean DEFAULT false,
  is_cancelled boolean DEFAULT false,
  is_sold_out boolean DEFAULT false,
  cancellation_reason text,
  created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Departure Transport
CREATE TABLE IF NOT EXISTS public.departure_transport (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  departure_id uuid REFERENCES public.departures(id) ON DELETE CASCADE NOT NULL,
  bus_id uuid REFERENCES public.buses(id) ON DELETE CASCADE NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Departure Rooms
CREATE TABLE IF NOT EXISTS public.departure_rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  departure_id uuid REFERENCES public.departures(id) ON DELETE CASCADE NOT NULL,
  hotel_room_id uuid REFERENCES public.hotel_rooms(id) ON DELETE CASCADE NOT NULL,
  allocated_count integer NOT NULL DEFAULT 1,
  booked_count integer DEFAULT 0,
  price_override numeric,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Departure Inventory
CREATE TABLE IF NOT EXISTS public.departure_inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  departure_id uuid REFERENCES public.departures(id) ON DELETE CASCADE NOT NULL,
  item_name text NOT NULL,
  quantity_total integer NOT NULL DEFAULT 0,
  quantity_assigned integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Pricing Tiers
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  departure_id uuid REFERENCES public.departures(id) ON DELETE CASCADE NOT NULL,
  sharing_type text NOT NULL,        -- 'DOUBLE', 'TRIPLE', 'QUAD'
  price numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);


-- 4. Re-create or Upgrade Bookings to ERP structure
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_id text UNIQUE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS departure_id uuid REFERENCES public.departures(id) ON DELETE RESTRICT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_amount numeric;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'CREATED';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS note text;

-- Booking Travellers
CREATE TABLE IF NOT EXISTS public.booking_travellers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  age integer,
  gender text,
  phone text,
  room_sharing text DEFAULT 'Triple',
  seat_number text,
  id_proof_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE RESTRICT NOT NULL,
  amount numeric NOT NULL,
  payment_method text NOT NULL,      -- 'UPI', 'CARD', 'NETBANKING', 'CASH'
  status text NOT NULL DEFAULT 'PENDING',
  transaction_id text UNIQUE,
  payment_gateway_response jsonb,
  created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Wallet Transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,            -- positive for deposit, negative for withdrawal
  transaction_type text NOT NULL,    -- 'REFUND', 'BOOKING_PAYMENT', 'REFERRAL_BONUS'
  reference_id text,                 -- e.g. booking_id or refund_id
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Blogs
CREATE TABLE IF NOT EXISTS public.blogs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  excerpt text,
  featured_image text,
  author_id uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  status text DEFAULT 'Draft',
  published_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Banners
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  image_url text NOT NULL,
  link_url text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- CMS Sections
CREATE TABLE IF NOT EXISTS public.cms_sections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page_name text NOT NULL DEFAULT 'homepage',
  section_key text UNIQUE NOT NULL,
  section_title text NOT NULL,
  content jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Addons
CREATE TABLE IF NOT EXISTS public.addons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL,
  referred_email text NOT NULL,
  status text DEFAULT 'PENDING',      -- 'PENDING', 'REGISTERED', 'BOOKED'
  reward_amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (referrer_id, referred_email)
);


-- 5. Enable Row Level Security and Create Core Policies
ALTER TABLE public.trip_captains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Admins full access policies
CREATE POLICY "Admins: full access captains" ON public.trip_captains FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE id::text = auth.uid()::text AND is_active = true));
CREATE POLICY "Admins: full access buses" ON public.buses FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE id::text = auth.uid()::text AND is_active = true));
CREATE POLICY "Admins: full access hotels" ON public.hotels FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE id::text = auth.uid()::text AND is_active = true));
CREATE POLICY "Admins: full access hotel_rooms" ON public.hotel_rooms FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE id::text = auth.uid()::text AND is_active = true));
CREATE POLICY "Admins: full access departures" ON public.departures FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE id::text = auth.uid()::text AND is_active = true));

-- Public read access policies for website/checkout
CREATE POLICY "Public: read captains" ON public.trip_captains FOR SELECT USING (is_active = true);
CREATE POLICY "Public: read departures" ON public.departures FOR SELECT USING (is_visible = true AND is_closed = false);

-- ============================================================
-- ✅ Migration Upgrade Complete
-- All core ERP tables created and configured safely.
-- ============================================================
