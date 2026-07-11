-- ==========================================
-- NOMADIK ERP v6 — COMPLETE PRODUCTION SCHEMA
-- Safe additive migration — runs after v2/v3/v4/v5
-- Run in Supabase SQL Editor
-- ==========================================

-- ==========================================
-- EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- ==========================================
-- HELPER: auto-updated_at trigger
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- ENUM TYPES (add new values safely)
-- ==========================================
DO $$ BEGIN
  CREATE TYPE public.erp_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.departure_status AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED', 'SOLD_OUT', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.booking_state AS ENUM (
    'CREATED', 'SEAT_LOCKED', 'PAYMENT_PENDING', 'PARTIAL_PAID',
    'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'REFUNDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_state AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.erp_role AS ENUM (
    'SUPER_ADMIN', 'ADMIN', 'TRIP_MANAGER', 'SALES', 'SUPPORT',
    'ACCOUNTANT', 'CONTENT_EDITOR', 'TRIP_CAPTAIN'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.inventory_status AS ENUM ('AVAILABLE', 'LOCKED', 'BOOKED', 'BLOCKED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_channel AS ENUM ('EMAIL', 'WHATSAPP', 'SMS', 'IN_APP');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_status AS ENUM (
    'NEW', 'CONTACTED', 'INTERESTED', 'PAYMENT_PENDING', 'CONVERTED', 'LOST', 'SPAM'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.wallet_tx_type AS ENUM ('CREDIT', 'DEBIT', 'REFUND', 'REFERRAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==========================================
-- SEQUENCE: Booking ID generator
-- ==========================================
CREATE SEQUENCE IF NOT EXISTS booking_id_seq START 1;

CREATE OR REPLACE FUNCTION generate_booking_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_id IS NULL THEN
    NEW.booking_id := 'NOM-' || to_char(now(), 'YYYYMM') || '-' || lpad(nextval('booking_id_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Invoice number generator
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || to_char(now(), 'YYYYMM') || '-' || lpad(nextval('invoice_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- HELPER: Check admin role
-- ==========================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_role(required_roles text[])
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE id = auth.uid() AND role::text = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- CORE: SETTINGS (already exists, ensure columns)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ==========================================
-- CORE: ADMINS TABLE (enhanced)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text,
  phone text,
  avatar_url text,
  role text NOT NULL DEFAULT 'SUPPORT',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add missing columns to admins
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ==========================================
-- CORE: USERS TABLE (enhanced)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text UNIQUE NOT NULL,
  email text UNIQUE,
  avatar_url text,
  date_of_birth date,
  gender text,
  city text,
  state text,
  aadhaar_number text,
  passport_number text,
  wallet_balance numeric DEFAULT 0,
  referral_code text UNIQUE,
  referred_by uuid REFERENCES public.users(id),
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add missing user columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS aadhaar_number text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS passport_number text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.users(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS emergency_contact_name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS emergency_contact_relation text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ==========================================
-- MEDIA ASSETS LIBRARY (WordPress-style)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name text NOT NULL,
  original_name text NOT NULL,
  file_size integer NOT NULL,         -- bytes
  mime_type text NOT NULL,
  url text NOT NULL,
  thumbnail_url text,
  folder text DEFAULT '/' NOT NULL,   -- e.g., '/destinations/manali'
  alt_text text,
  width integer,
  height integer,
  usage_count integer DEFAULT 0,
  tags text[],
  uploaded_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ==========================================
-- TRIP CAPTAINS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.trip_captains (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  photo_url text,
  bio text,
  experience_years integer DEFAULT 0,
  specializations text[],          -- e.g., ['Himachal', 'Rajasthan']
  languages text[],
  rating numeric DEFAULT 0,
  total_trips integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ==========================================
-- DESTINATIONS TABLE (enhanced v6)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.destinations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  subtitle text,
  country text DEFAULT 'India',
  state text,
  region text,
  hero_image text,
  hero_video text,
  gallery jsonb DEFAULT '[]',        -- array of {url, alt, caption}
  short_description text,
  description text,
  altitude text,
  best_time text,
  weather jsonb,                     -- {summer, monsoon, winter, spring}
  things_to_do jsonb DEFAULT '[]',   -- array of {title, description, icon}
  how_to_reach jsonb,                -- {road, rail, air, local}
  coordinates jsonb,                 -- {lat, lng}
  google_map_url text,
  faqs jsonb DEFAULT '[]',           -- array of {question, answer}
  seo jsonb,                         -- {title, description, keywords}
  status text DEFAULT 'DRAFT',
  is_featured boolean DEFAULT false,
  priority integer DEFAULT 0,
  created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add missing destination columns
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS country text DEFAULT 'India';
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS gallery jsonb DEFAULT '[]';
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS altitude text;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS best_time text;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS weather jsonb;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS things_to_do jsonb DEFAULT '[]';
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS how_to_reach jsonb;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS coordinates jsonb;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS google_map_url text;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS faqs jsonb DEFAULT '[]';
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS seo jsonb;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS status text DEFAULT 'DRAFT';
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.admins(id) ON DELETE SET NULL;

-- ==========================================
-- PACKAGES (journeys) TABLE (enhanced v6)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.journeys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_id uuid REFERENCES public.destinations(id) ON DELETE CASCADE NOT NULL,
  trip_captain_id uuid REFERENCES public.trip_captains(id) ON DELETE SET NULL,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  tagline text,
  hero_banner text,
  gallery jsonb DEFAULT '[]',
  videos jsonb DEFAULT '[]',
  duration_days integer,
  duration_nights integer,
  duration text,                     -- display string e.g. "5 Days / 4 Nights"
  difficulty text DEFAULT 'EASY',    -- EASY, MODERATE, DIFFICULT, EXTREME
  group_size_min integer DEFAULT 1,
  group_size_max integer DEFAULT 30,
  starting_price numeric,
  maximum_price numeric,
  pickup_point text,
  drop_point text,
  short_description text,
  overview text,
  highlights jsonb DEFAULT '[]',     -- string array
  policies jsonb DEFAULT '[]',       -- array of {title, content}
  cancellation_policy jsonb,         -- {description, tiers: [{days_before, refund_percent}]}
  inclusions jsonb DEFAULT '[]',     -- string array
  exclusions jsonb DEFAULT '[]',     -- string array
  packing_list jsonb DEFAULT '[]',   -- string array
  faqs jsonb DEFAULT '[]',           -- array of {question, answer}
  seo jsonb,
  status text DEFAULT 'DRAFT',
  is_featured boolean DEFAULT false,
  is_published boolean DEFAULT false,
  priority integer DEFAULT 0,
  avg_rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  booking_count integer DEFAULT 0,
  created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add missing journey columns
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS trip_captain_id uuid REFERENCES public.trip_captains(id) ON DELETE SET NULL;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS hero_banner text;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS videos jsonb DEFAULT '[]';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS duration_days integer;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS duration_nights integer;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS group_size_min integer DEFAULT 1;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS group_size_max integer DEFAULT 30;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS starting_price numeric;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS maximum_price numeric;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS overview text;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS highlights jsonb DEFAULT '[]';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS policies jsonb DEFAULT '[]';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS cancellation_policy jsonb;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS inclusions jsonb DEFAULT '[]';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS exclusions jsonb DEFAULT '[]';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS packing_list jsonb DEFAULT '[]';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS faqs jsonb DEFAULT '[]';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS seo jsonb;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS status text DEFAULT 'DRAFT';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS avg_rating numeric DEFAULT 0;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS booking_count integer DEFAULT 0;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.admins(id) ON DELETE SET NULL;

-- ==========================================
-- ITINERARY (separate table, NOT JSON)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.itinerary_days (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
  day_number integer NOT NULL,
  title text NOT NULL,
  description text,
  meals jsonb,                       -- {breakfast: bool, lunch: bool, dinner: bool}
  stay text,                         -- hotel name or camp name
  transport text,
  image_url text,
  is_highlight boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(journey_id, day_number)
);

-- ==========================================
-- PACKAGE REVISIONS (version history)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.package_revisions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
  revision_data jsonb NOT NULL,
  revision_note text,
  created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ==========================================
-- BUSES (enhanced v6)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.buses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  registration_number text UNIQUE NOT NULL,
  bus_type text NOT NULL DEFAULT '2x2',  -- 2x2, SLEEPER, TEMPO_TRAVELLER, MINI_BUS, VOLVO
  total_seats integer NOT NULL,
  seat_layout jsonb,                 -- visual layout grid
  amenities text[],
  photos jsonb DEFAULT '[]',
  driver_name text,
  driver_phone text,
  driver_photo text,
  is_active boolean DEFAULT true,
  notes text,
  created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add missing bus columns
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS bus_type text NOT NULL DEFAULT '2x2';
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS seat_layout jsonb;
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS photos jsonb DEFAULT '[]';
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS driver_name text;
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS driver_phone text;
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS driver_photo text;
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL;
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ==========================================
-- BUS SEATS (per-bus seat registry)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.bus_seats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bus_id uuid REFERENCES public.buses(id) ON DELETE CASCADE NOT NULL,
  seat_number text NOT NULL,         -- e.g. '1A', '1B', '2A'
  seat_type text DEFAULT 'STANDARD', -- STANDARD, PREMIUM, SLEEPER, DRIVER, BLOCKED
  row_number integer,
  column_letter text,
  is_window boolean DEFAULT false,
  is_sleeper boolean DEFAULT false,
  price_modifier numeric DEFAULT 0,  -- extra charge for premium seats
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(bus_id, seat_number)
);

-- ==========================================
-- HOTELS (enhanced v6)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.hotels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_id uuid REFERENCES public.destinations(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE,
  address text,
  city text,
  state text,
  location text,
  latitude numeric,
  longitude numeric,
  star_rating integer CHECK (star_rating BETWEEN 1 AND 5),
  description text,
  gallery jsonb DEFAULT '[]',
  amenities text[],
  meal_plans text[],                 -- ['EP', 'CP', 'MAP', 'AP']
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

-- Add missing hotel columns
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS star_rating integer;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS meal_plans text[];
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS check_in_time text DEFAULT '14:00';
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS check_out_time text DEFAULT '11:00';
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS contact_name text;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ==========================================
-- HOTEL ROOMS (enhanced v6)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.hotel_rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL,
  room_type text NOT NULL,           -- 'Single', 'Double', 'Triple', 'Dormitory', 'Suite'
  sharing_type text,                 -- 'SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD', 'DORM'
  capacity integer NOT NULL DEFAULT 2,
  price_per_night numeric,
  price_modifier numeric DEFAULT 0,  -- extra charge vs base package price
  total_rooms integer DEFAULT 1,
  amenities text[],
  description text,
  images jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add missing room columns
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS sharing_type text;
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS price_per_night numeric;
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS price_modifier numeric DEFAULT 0;
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS total_rooms integer DEFAULT 1;
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]';
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ==========================================
-- DEPARTURES (enhanced v6)
-- ==========================================
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
  dynamic_price numeric,             -- overrides base_price when set
  discount_amount numeric DEFAULT 0,
  discount_type text,                -- 'PERCENTAGE' | 'FLAT'
  pickup_location text,
  drop_location text,
  pickup_time time,
  hotel_name text,                   -- override if not linked to hotel table
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

-- Add missing departure columns
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS trip_captain_id uuid REFERENCES public.trip_captains(id) ON DELETE SET NULL;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS bus_id uuid REFERENCES public.buses(id) ON DELETE SET NULL;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS hotel_id uuid REFERENCES public.hotels(id) ON DELETE SET NULL;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS total_seats integer NOT NULL DEFAULT 20;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS available_seats integer NOT NULL DEFAULT 20;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS booked_seats integer DEFAULT 0;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS dynamic_price numeric;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS discount_type text;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS pickup_location text;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS drop_location text;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS pickup_time time;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS hotel_name text;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS is_closed boolean DEFAULT false;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS is_cancelled boolean DEFAULT false;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS is_sold_out boolean DEFAULT false;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS cancellation_reason text;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.admins(id) ON DELETE SET NULL;

-- ==========================================
-- DEPARTURE TRANSPORT (bus assignment)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.departure_transport (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  departure_id uuid REFERENCES public.departures(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bus_id uuid REFERENCES public.buses(id) ON DELETE RESTRICT,
  driver_name text,
  driver_phone text,
  pickup_time timestamptz,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ==========================================
-- DEPARTURE ROOMS (hotel room assignments)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.departure_rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  departure_id uuid REFERENCES public.departures(id) ON DELETE CASCADE NOT NULL,
  hotel_id uuid REFERENCES public.hotels(id) ON DELETE RESTRICT NOT NULL,
  hotel_room_id uuid REFERENCES public.hotel_rooms(id) ON DELETE RESTRICT NOT NULL,
  allocated_count integer NOT NULL DEFAULT 1,
  price_override numeric,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(departure_id, hotel_room_id)
);

-- ==========================================
-- DEPARTURE INVENTORY (seat/room ledger)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.departure_inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  departure_id uuid REFERENCES public.departures(id) ON DELETE CASCADE NOT NULL,
  inventory_type text NOT NULL,      -- 'SEAT' | 'ROOM_BED'
  bus_seat_id uuid REFERENCES public.bus_seats(id) ON DELETE SET NULL,
  hotel_room_id uuid REFERENCES public.hotel_rooms(id) ON DELETE SET NULL,
  label text NOT NULL,               -- seat number or room label
  status text DEFAULT 'AVAILABLE',   -- AVAILABLE, LOCKED, BOOKED, BLOCKED
  price_modifier numeric DEFAULT 0,
  locked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  locked_at timestamptz,
  locked_until timestamptz,
  booking_id uuid,                   -- set when booked
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ==========================================
-- PRICING TIERS (early bird, last minute)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  departure_id uuid REFERENCES public.departures(id) ON DELETE CASCADE NOT NULL,
  tier_name text NOT NULL,
  price numeric NOT NULL,
  seats_limit integer,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ==========================================
-- COUPONS (enhanced v6)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  description text,
  discount_type text NOT NULL,       -- 'PERCENTAGE' | 'FLAT'
  discount_value numeric NOT NULL,
  min_order_amount numeric DEFAULT 0,
  max_discount_amount numeric,
  valid_from timestamptz NOT NULL,
  valid_until timestamptz,
  max_redemptions integer,
  current_redemptions integer DEFAULT 0,
  per_user_limit integer DEFAULT 1,
  is_first_booking_only boolean DEFAULT false,
  destination_id uuid REFERENCES public.destinations(id) ON DELETE SET NULL,
  journey_id uuid REFERENCES public.journeys(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add missing coupon columns
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS per_user_limit integer DEFAULT 1;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS journey_id uuid REFERENCES public.journeys(id) ON DELETE SET NULL;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ==========================================
-- BOOKINGS (enhanced v6)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id text UNIQUE,            -- NOM-202506-00001
  user_id uuid REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
  departure_id uuid REFERENCES public.departures(id) ON DELETE RESTRICT NOT NULL,
  journey_id uuid REFERENCES public.journeys(id) ON DELETE RESTRICT,
  coupon_id uuid REFERENCES public.coupons(id) ON DELETE SET NULL,

  -- Status
  status text DEFAULT 'CREATED',

  -- Counts
  traveller_count integer NOT NULL DEFAULT 1,

  -- Pricing
  base_amount numeric NOT NULL,
  addon_amount numeric DEFAULT 0,
  gst_rate numeric DEFAULT 5,
  gst_amount numeric NOT NULL DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  coupon_discount numeric DEFAULT 0,
  wallet_amount_used numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  amount_paid numeric DEFAULT 0,
  balance_due numeric GENERATED ALWAYS AS (total_amount - amount_paid) STORED,

  -- Razorpay
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,

  -- Extras
  room_preference text,
  food_preference text,
  special_requests text,
  internal_notes text,
  cancellation_reason text,
  refund_amount numeric DEFAULT 0,
  refund_status text,

  created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add missing booking columns
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS journey_id uuid REFERENCES public.journeys(id) ON DELETE RESTRICT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS gst_rate numeric DEFAULT 5;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS coupon_discount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS wallet_amount_used numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS room_preference text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS food_preference text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS special_requests text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS internal_notes text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS refund_status text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL;

-- ==========================================
-- BOOKING TRAVELLERS (enhanced v6)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.booking_travellers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  is_primary boolean DEFAULT false,
  full_name text NOT NULL,
  gender text,
  date_of_birth date,
  age integer,
  phone text,
  email text,
  aadhaar_number text,
  passport_number text,
  food_preference text,
  medical_conditions text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  pickup_point text,
  assigned_seat_id uuid REFERENCES public.departure_inventory(id) ON DELETE SET NULL,
  assigned_room_id uuid REFERENCES public.departure_inventory(id) ON DELETE SET NULL,
  aadhaar_doc_url text,
  photo_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Add missing traveller columns
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS emergency_contact_relation text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS aadhaar_doc_url text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS photo_url text;

-- ==========================================
-- PAYMENTS (enhanced v6)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'INR',
  status text DEFAULT 'PENDING',
  payment_type text DEFAULT 'FULL',  -- 'ADVANCE' | 'FULL' | 'BALANCE'
  payment_gateway text DEFAULT 'RAZORPAY',
  payment_method text,               -- 'UPI', 'CARD', 'NETBANKING', 'WALLET'
  gateway_order_id text,
  gateway_payment_id text UNIQUE,
  gateway_signature text,
  receipt_url text,
  failure_reason text,
  metadata jsonb,
  processed_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add missing payment columns
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS currency text DEFAULT 'INR';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'FULL';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway_order_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway_payment_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway_signature text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS failure_reason text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS metadata jsonb;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS processed_by uuid REFERENCES public.admins(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS processed_at timestamptz;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ==========================================
-- INVOICES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number text UNIQUE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
  amount numeric NOT NULL,
  gst_amount numeric DEFAULT 0,
  gst_number text,
  invoice_date date DEFAULT CURRENT_DATE,
  due_date date,
  pdf_url text,
  status text DEFAULT 'ISSUED',
  issued_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  issued_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ==========================================
-- COUPON USAGES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.coupon_usages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id uuid REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  discount_applied numeric NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(coupon_id, booking_id)
);

-- ==========================================
-- WALLET TRANSACTIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  tx_type text NOT NULL,             -- 'CREDIT' | 'DEBIT' | 'REFUND' | 'REFERRAL'
  amount numeric NOT NULL,
  balance_after numeric NOT NULL,
  reference_id uuid,                 -- booking_id or payment_id
  reference_type text,               -- 'BOOKING', 'PAYMENT', 'REFUND', 'ADMIN'
  description text NOT NULL,
  created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ==========================================
-- REVIEWS (enhanced v6)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  author_email text,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  content text NOT NULL,
  photos jsonb DEFAULT '[]',
  trip_date text,
  is_verified boolean DEFAULT false, -- person actually travelled
  is_approved boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  admin_reply text,
  admin_reply_at timestamptz,
  approved_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add missing review columns
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS photos jsonb DEFAULT '[]';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS admin_reply text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS admin_reply_at timestamptz;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.admins(id) ON DELETE SET NULL;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ==========================================
-- INQUIRIES / LEADS CRM (enhanced v6)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.inquiries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  destination_id uuid REFERENCES public.destinations(id) ON DELETE SET NULL,
  journey_id uuid REFERENCES public.journeys(id) ON DELETE SET NULL,
  departure_id uuid REFERENCES public.departures(id) ON DELETE SET NULL,
  traveller_count integer DEFAULT 1,
  travel_date text,
  budget text,
  message text,
  source text DEFAULT 'WEBSITE',     -- WEBSITE, WHATSAPP, INSTAGRAM, GOOGLE, REFERRAL, PHONE
  status text DEFAULT 'NEW',
  priority text DEFAULT 'NORMAL',    -- LOW, NORMAL, HIGH, URGENT
  assigned_to uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  notes text,
  follow_up_at timestamptz,
  converted_booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add missing inquiry columns
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS departure_id uuid REFERENCES public.departures(id) ON DELETE SET NULL;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS traveller_count integer DEFAULT 1;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS budget text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS priority text DEFAULT 'NORMAL';
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS follow_up_at timestamptz;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS converted_booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS utm_campaign text;

-- ==========================================
-- BLOGS (enhanced v6)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.blogs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text,
  content text NOT NULL,
  featured_image text,
  gallery jsonb DEFAULT '[]',
  category text DEFAULT 'Travel',
  tags text[],
  author_id uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  author_name text,
  destination_id uuid REFERENCES public.destinations(id) ON DELETE SET NULL,
  journey_id uuid REFERENCES public.journeys(id) ON DELETE SET NULL,
  seo jsonb,
  is_published boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  read_time_minutes integer,
  published_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add missing blog columns
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS excerpt text;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS gallery jsonb DEFAULT '[]';
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS category text DEFAULT 'Travel';
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS author_name text;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS destination_id uuid REFERENCES public.destinations(id) ON DELETE SET NULL;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS journey_id uuid REFERENCES public.journeys(id) ON DELETE SET NULL;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS seo jsonb;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS read_time_minutes integer;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- ==========================================
-- WISHLIST
-- ==========================================
CREATE TABLE IF NOT EXISTS public.wishlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, journey_id)
);

-- ==========================================
-- BANNERS / ANNOUNCEMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  placement text NOT NULL,           -- 'HERO', 'OFFER', 'POPUP', 'ANNOUNCEMENT_BAR'
  title text,
  subtitle text,
  image_url text,
  cta_text text,
  cta_link text,
  bg_color text,
  text_color text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  valid_from timestamptz,
  valid_until timestamptz,
  created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add missing banner columns
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS bg_color text;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS text_color text;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ==========================================
-- CMS SECTIONS (Homepage + all pages)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.cms_sections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key text UNIQUE NOT NULL,  -- 'hero', 'stats', 'testimonials', 'gallery', 'footer'
  title text,
  content jsonb NOT NULL DEFAULT '{}',
  is_enabled boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  updated_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ==========================================
-- NOTIFICATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  channel text NOT NULL,             -- 'EMAIL', 'WHATSAPP', 'SMS', 'IN_APP'
  notification_type text NOT NULL,   -- 'BOOKING_CONFIRMED', 'PAYMENT_RECEIVED', etc.
  status text DEFAULT 'PENDING',     -- 'PENDING', 'SENT', 'FAILED', 'READ'
  subject text,
  content text NOT NULL,
  metadata jsonb,
  scheduled_for timestamptz,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ==========================================
-- ACTIVITY LOG (Admin audit trail)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  admin_email text,
  admin_name text,
  action text NOT NULL,              -- 'CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'ARCHIVE', 'LOGIN'
  entity_type text NOT NULL,         -- 'DESTINATION', 'JOURNEY', 'DEPARTURE', 'BOOKING', etc.
  entity_id uuid,
  entity_label text,                 -- human readable name
  description text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ==========================================
-- ADDONS (Insurance, porter, activities)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.addons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text,
  price numeric NOT NULL,
  addon_type text DEFAULT 'OPTIONAL', -- 'MANDATORY', 'OPTIONAL'
  applies_to text DEFAULT 'PER_PERSON', -- 'PER_PERSON', 'PER_BOOKING'
  journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ==========================================
-- REFERRALS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  referee_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  reward_amount numeric DEFAULT 0,
  reward_status text DEFAULT 'PENDING', -- 'PENDING', 'CREDITED', 'EXPIRED'
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(referrer_id, referee_id)
);

-- ==========================================
-- GALLERY TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.gallery (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_id uuid REFERENCES public.destinations(id) ON DELETE CASCADE,
  journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE,
  media_type text DEFAULT 'IMAGE',   -- 'IMAGE', 'VIDEO', 'REEL'
  url text NOT NULL,
  thumbnail_url text,
  caption text,
  alt_text text,
  display_order integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Add missing gallery columns
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS alt_text text;
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- ==========================================
-- TRIGGERS
-- ==========================================
DROP TRIGGER IF EXISTS booking_id_trigger ON public.bookings;
CREATE TRIGGER booking_id_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION generate_booking_id();

DROP TRIGGER IF EXISTS invoice_number_trigger ON public.invoices;
CREATE TRIGGER invoice_number_trigger
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- updated_at triggers
CREATE OR REPLACE FUNCTION create_updated_at_trigger(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('
    DROP TRIGGER IF EXISTS update_%1$s_updated_at ON public.%1$s;
    CREATE TRIGGER update_%1$s_updated_at
      BEFORE UPDATE ON public.%1$s
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  ', table_name);
END;
$$ LANGUAGE plpgsql;

SELECT create_updated_at_trigger('settings');
SELECT create_updated_at_trigger('admins');
SELECT create_updated_at_trigger('users');
SELECT create_updated_at_trigger('media_assets');
SELECT create_updated_at_trigger('trip_captains');
SELECT create_updated_at_trigger('destinations');
SELECT create_updated_at_trigger('journeys');
SELECT create_updated_at_trigger('itinerary_days');
SELECT create_updated_at_trigger('buses');
SELECT create_updated_at_trigger('hotels');
SELECT create_updated_at_trigger('hotel_rooms');
SELECT create_updated_at_trigger('departures');
SELECT create_updated_at_trigger('departure_inventory');
SELECT create_updated_at_trigger('coupons');
SELECT create_updated_at_trigger('bookings');
SELECT create_updated_at_trigger('payments');
SELECT create_updated_at_trigger('reviews');
SELECT create_updated_at_trigger('inquiries');
SELECT create_updated_at_trigger('blogs');
SELECT create_updated_at_trigger('banners');
SELECT create_updated_at_trigger('cms_sections');

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_destinations_status ON public.destinations(status);
CREATE INDEX IF NOT EXISTS idx_destinations_slug ON public.destinations(slug);
CREATE INDEX IF NOT EXISTS idx_destinations_featured ON public.destinations(is_featured);

CREATE INDEX IF NOT EXISTS idx_journeys_destination ON public.journeys(destination_id);
CREATE INDEX IF NOT EXISTS idx_journeys_slug ON public.journeys(slug);
CREATE INDEX IF NOT EXISTS idx_journeys_status ON public.journeys(status);
CREATE INDEX IF NOT EXISTS idx_journeys_featured ON public.journeys(is_featured);

CREATE INDEX IF NOT EXISTS idx_itinerary_journey ON public.itinerary_days(journey_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_sort ON public.itinerary_days(journey_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_departures_journey ON public.departures(journey_id);
CREATE INDEX IF NOT EXISTS idx_departures_date ON public.departures(departure_date);
CREATE INDEX IF NOT EXISTS idx_departures_status ON public.departures(status);

CREATE INDEX IF NOT EXISTS idx_departure_inv_departure ON public.departure_inventory(departure_id);
CREATE INDEX IF NOT EXISTS idx_departure_inv_status ON public.departure_inventory(status);
CREATE INDEX IF NOT EXISTS idx_departure_inv_locked ON public.departure_inventory(locked_by, locked_until);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_departure ON public.bookings(departure_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_id ON public.bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON public.bookings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

CREATE INDEX IF NOT EXISTS idx_reviews_journey ON public.reviews(journey_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.reviews(is_approved);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_phone ON public.inquiries(phone);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON public.inquiries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blogs_slug ON public.blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_published ON public.blogs(is_published);

CREATE INDEX IF NOT EXISTS idx_media_folder ON public.media_assets(folder);
CREATE INDEX IF NOT EXISTS idx_media_mime ON public.media_assets(mime_type);

CREATE INDEX IF NOT EXISTS idx_activity_log_admin ON public.activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON public.activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON public.activity_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON public.wallet_transactions(user_id);

-- ==========================================
-- ANALYTICS VIEWS
-- ==========================================
CREATE OR REPLACE VIEW public.v_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM public.bookings WHERE created_at::date = CURRENT_DATE) AS today_bookings,
  (SELECT COALESCE(SUM(total_amount), 0) FROM public.bookings WHERE created_at::date = CURRENT_DATE AND status NOT IN ('CANCELLED', 'REFUNDED')) AS today_revenue,
  (SELECT COALESCE(SUM(total_amount), 0) FROM public.bookings WHERE created_at >= date_trunc('month', CURRENT_DATE) AND status NOT IN ('CANCELLED', 'REFUNDED')) AS monthly_revenue,
  (SELECT COUNT(*) FROM public.bookings WHERE status = 'CONFIRMED') AS confirmed_bookings,
  (SELECT COUNT(*) FROM public.bookings WHERE status = 'PAYMENT_PENDING') AS pending_bookings,
  (SELECT COUNT(*) FROM public.bookings WHERE status = 'COMPLETED') AS completed_trips,
  (SELECT COUNT(*) FROM public.inquiries WHERE created_at::date = CURRENT_DATE) AS today_leads,
  (SELECT COUNT(*) FROM public.inquiries WHERE created_at >= date_trunc('week', CURRENT_DATE)) AS week_leads,
  (SELECT COUNT(*) FROM public.users) AS total_customers,
  (SELECT COUNT(*) FROM public.journeys WHERE status = 'PUBLISHED') AS active_packages,
  (SELECT COUNT(*) FROM public.departures WHERE departure_date >= CURRENT_DATE AND status = 'UPCOMING') AS upcoming_departures,
  (SELECT ROUND(COUNT(*) FILTER (WHERE status = 'CONVERTED')::numeric / NULLIF(COUNT(*), 0) * 100, 1) FROM public.inquiries) AS lead_conversion_rate;

CREATE OR REPLACE VIEW public.v_monthly_revenue AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COALESCE(SUM(total_amount), 0) AS revenue,
  COUNT(*) AS bookings
FROM public.bookings
WHERE status NOT IN ('CANCELLED', 'REFUNDED')
  AND created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;

CREATE OR REPLACE VIEW public.v_package_performance AS
SELECT
  j.id,
  j.name,
  j.slug,
  j.starting_price,
  COUNT(b.id) AS booking_count,
  COALESCE(SUM(b.total_amount), 0) AS total_revenue,
  j.avg_rating,
  j.review_count
FROM public.journeys j
LEFT JOIN public.departures d ON d.journey_id = j.id
LEFT JOIN public.bookings b ON b.departure_id = d.id AND b.status NOT IN ('CANCELLED', 'REFUNDED')
GROUP BY j.id, j.name, j.slug, j.starting_price, j.avg_rating, j.review_count
ORDER BY booking_count DESC;

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_captains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departure_transport ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departure_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departure_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_travellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ POLICIES
CREATE POLICY IF NOT EXISTS "Public: Read published destinations" ON public.destinations FOR SELECT USING (status = 'PUBLISHED' OR is_admin());
CREATE POLICY IF NOT EXISTS "Public: Read published journeys" ON public.journeys FOR SELECT USING (status = 'PUBLISHED' OR is_admin());
CREATE POLICY IF NOT EXISTS "Public: Read itinerary days" ON public.itinerary_days FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public: Read active departures" ON public.departures FOR SELECT USING (is_visible = true OR is_admin());
CREATE POLICY IF NOT EXISTS "Public: Read departure inventory" ON public.departure_inventory FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public: Read approved reviews" ON public.reviews FOR SELECT USING (is_approved = true OR is_admin());
CREATE POLICY IF NOT EXISTS "Public: Read published blogs" ON public.blogs FOR SELECT USING (is_published = true OR is_admin());
CREATE POLICY IF NOT EXISTS "Public: Read active banners" ON public.banners FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY IF NOT EXISTS "Public: Read cms sections" ON public.cms_sections FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public: Read settings" ON public.settings FOR SELECT USING (category <> 'private' OR is_admin());
CREATE POLICY IF NOT EXISTS "Public: Read trip captains" ON public.trip_captains FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY IF NOT EXISTS "Public: Read buses" ON public.buses FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public: Read bus seats" ON public.bus_seats FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public: Read hotels" ON public.hotels FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public: Read hotel rooms" ON public.hotel_rooms FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public: Read gallery" ON public.gallery FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public: Read active coupons" ON public.coupons FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY IF NOT EXISTS "Public: Read addons" ON public.addons FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY IF NOT EXISTS "Public: Read pricing tiers" ON public.pricing_tiers FOR SELECT USING (is_active = true OR is_admin());

-- USER POLICIES
CREATE POLICY IF NOT EXISTS "Users: Read own profile" ON public.users FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY IF NOT EXISTS "Users: Update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users: Insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users: Read own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY IF NOT EXISTS "Users: Insert own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users: Read own travellers" ON public.booking_travellers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND user_id = auth.uid()) OR is_admin()
);
CREATE POLICY IF NOT EXISTS "Users: Insert own travellers" ON public.booking_travellers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND user_id = auth.uid())
);

CREATE POLICY IF NOT EXISTS "Users: Read own payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND user_id = auth.uid()) OR is_admin()
);

CREATE POLICY IF NOT EXISTS "Users: Read own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY IF NOT EXISTS "Users: Read own wallet" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY IF NOT EXISTS "Users: Read own wishlist" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users: Manage own wishlist" ON public.wishlist FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users: Read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- PUBLIC INSERT POLICIES
CREATE POLICY IF NOT EXISTS "Public: Insert inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users: Insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ADMIN FULL ACCESS (using is_admin() function)
DO $$ 
DECLARE
  tbl text;
  tbls text[] := ARRAY[
    'settings', 'admins', 'users', 'media_assets', 'trip_captains',
    'destinations', 'journeys', 'itinerary_days', 'package_revisions',
    'buses', 'bus_seats', 'hotels', 'hotel_rooms',
    'departures', 'departure_transport', 'departure_rooms', 'departure_inventory',
    'pricing_tiers', 'coupons', 'bookings', 'booking_travellers',
    'payments', 'invoices', 'coupon_usages', 'wallet_transactions',
    'reviews', 'inquiries', 'blogs', 'wishlist', 'banners', 'cms_sections',
    'notifications', 'activity_log', 'addons', 'gallery', 'referrals'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS "Admins: Full access to %1$s" ON public.%1$s;
      CREATE POLICY "Admins: Full access to %1$s" ON public.%1$s FOR ALL USING (is_admin());
    ', tbl);
  END LOOP;
END $$;

-- ==========================================
-- DEFAULT SETTINGS SEED (safe upsert)
-- ==========================================
INSERT INTO public.settings (category, key, value, description) VALUES
  ('site', 'site_name', '"Nomadik"', 'Display name for the website'),
  ('site', 'site_tagline', '"Premium Curated Road Trips Across India"', 'Site tagline'),
  ('site', 'contact_phone_primary', '"+91 78570 37041"', 'Primary contact number'),
  ('site', 'contact_phone_secondary', '"+91 99710 46607"', 'Secondary contact number'),
  ('site', 'contact_email', '"harsh.nomadik@gmail.com"', 'Primary contact email'),
  ('site', 'whatsapp_number', '"+917857037041"', 'WhatsApp contact'),
  ('site', 'instagram_url', '"https://www.instagram.com/nomadik.co.in"', 'Instagram URL'),
  ('site', 'facebook_url', '""', 'Facebook URL'),
  ('site', 'youtube_url', '""', 'YouTube URL'),
  ('site', 'whatsapp_community', '"https://chat.whatsapp.com/Gs3A2oHpp4r0iYCVqxvS57"', 'WhatsApp community link'),
  ('pricing', 'gst_rate', '5', 'GST percentage on bookings'),
  ('pricing', 'advance_payment_percent', '30', 'Advance payment percentage'),
  ('pricing', 'platform_fee', '0', 'Platform convenience fee'),
  ('razorpay', 'key_id', '""', 'Razorpay Key ID'),
  ('razorpay', 'mode', '"test"', 'Razorpay mode: test or live'),
  ('notifications', 'booking_email', 'true', 'Send booking confirmation email'),
  ('notifications', 'booking_whatsapp', 'true', 'Send booking WhatsApp'),
  ('seo', 'google_analytics_id', '""', 'Google Analytics ID'),
  ('seo', 'meta_pixel_id', '""', 'Meta Pixel ID'),
  ('seo', 'search_console_verification', '""', 'Search Console verification code')
ON CONFLICT (key) DO NOTHING;

-- Default CMS sections
INSERT INTO public.cms_sections (section_key, title, content, sort_order) VALUES
  ('announcement_bar', 'Announcement Bar', '{"text": "🏔️ New departures added for Spiti Valley — Book Early!", "link": "/packages", "link_text": "View Packages", "is_active": true, "bg_color": "#163A5F"}', 1),
  ('hero', 'Hero Section', '{"headline": "Some Roads Change You Forever", "subheadline": "Premium group road trips across India", "cta_primary_text": "Explore Trips", "cta_primary_link": "/packages", "cta_secondary_text": "Plan My Trip", "video_url": ""}', 2),
  ('stats', 'Travel Stats', '{"items": [{"label": "Trips Completed", "value": "500+"}, {"label": "Happy Travellers", "value": "15,000+"}, {"label": "Destinations", "value": "25+"}, {"label": "Cities", "value": "50+"}]}', 3),
  ('why_nomadik', 'Why Nomadik', '{"items": [{"icon": "shield", "title": "Verified Stays", "description": "Handpicked hotels with real quality checks"}, {"icon": "users", "title": "Expert Captains", "description": "Experienced trip captains for every journey"}, {"icon": "star", "title": "5-Star Reviews", "description": "15,000+ happy travellers trust us"}, {"icon": "phone", "title": "24×7 Support", "description": "Always available when you need us"}, {"icon": "currency", "title": "Best Value", "description": "Premium experiences at honest prices"}, {"icon": "map", "title": "Curated Routes", "description": "Hidden gems and iconic destinations"}]}', 4),
  ('testimonials', 'Testimonials', '{"items": []}', 5),
  ('instagram_feed', 'Instagram Feed', '{"handle": "@nomadik.co.in", "reel_urls": []}', 6),
  ('footer', 'Footer', '{"company_description": "Premium curated road trips across India. Building memories one journey at a time.", "quick_links": [{"label": "Destinations", "href": "/destinations"}, {"label": "Packages", "href": "/packages"}, {"label": "About Us", "href": "/about"}, {"label": "Contact", "href": "/contact"}]}', 7)
ON CONFLICT (section_key) DO NOTHING;
