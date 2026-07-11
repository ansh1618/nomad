-- NOMADIK COMPLETE PRODUCTION SCHEMA v7
-- Run this in Supabase SQL Editor: sgeffapbsrppzrgqfpec

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN CREATE TYPE public.trip_difficulty AS ENUM ('Easy', 'Moderate', 'Hard'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.room_sharing_type AS ENUM ('Double', 'Triple', 'Quad'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payment_schedule_type AS ENUM ('Full Payment', 'Book Slot'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payment_status_type AS ENUM ('Pending', 'Successful', 'Failed', 'Refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.booking_status_type AS ENUM ('Draft', 'Confirmed', 'Cancelled', 'Completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.admin_role_enum AS ENUM ('SUPER_ADMIN', 'ADMIN', 'TRIP_MANAGER', 'OPERATIONS', 'SALES', 'SUPPORT', 'MARKETING', 'ACCOUNTANT', 'TRIP_CAPTAIN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE SEQUENCE IF NOT EXISTS booking_ref_seq START 1;
CREATE OR REPLACE FUNCTION generate_booking_ref() RETURNS TRIGGER AS $$ BEGIN NEW.booking_ref := 'NM-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('booking_ref_seq')::text, 4, '0'); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$ BEGIN RETURN EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()); END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS public.admins (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, email text NOT NULL UNIQUE, role public.admin_role_enum NOT NULL DEFAULT 'SUPPORT', full_name text, is_active boolean DEFAULT true NOT NULL, created_at timestamptz DEFAULT now() NOT NULL);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins: read own" ON public.admins;
CREATE POLICY "Admins: read own" ON public.admins FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins: admin access" ON public.admins;
CREATE POLICY "Admins: admin access" ON public.admins FOR ALL USING (is_admin());

-- Seed owner@gonomadik.com Super Admin
INSERT INTO public.admins (id, email, role, full_name, is_active)
VALUES ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'owner@gonomadik.com', 'SUPER_ADMIN', 'Nomadik Owner', true)
ON CONFLICT (id) DO UPDATE SET role = 'SUPER_ADMIN', is_active = true;

CREATE TABLE IF NOT EXISTS public.trips (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, slug text UNIQUE NOT NULL, title text NOT NULL, location text NOT NULL, duration text NOT NULL, group_size text NOT NULL, difficulty public.trip_difficulty NOT NULL DEFAULT 'Moderate', base_price numeric NOT NULL, featured_images jsonb DEFAULT '[]', thumbnail text, description text, highlights jsonb DEFAULT '[]', inclusions jsonb DEFAULT '[]', exclusions jsonb DEFAULT '[]', itinerary jsonb DEFAULT '[]', pickup_points jsonb DEFAULT '[]', is_featured boolean DEFAULT false, is_active boolean DEFAULT true, seo jsonb, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL);
DROP TRIGGER IF EXISTS trips_updated_at ON public.trips;
CREATE TRIGGER trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trips: public read" ON public.trips;
CREATE POLICY "Trips: public read" ON public.trips FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Trips: admin" ON public.trips;
CREATE POLICY "Trips: admin" ON public.trips FOR ALL USING (is_admin());

CREATE TABLE IF NOT EXISTS public.trip_dates (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL, departure_date date NOT NULL, return_date date NOT NULL, pickup_point text, capacity integer NOT NULL DEFAULT 25, available_seats integer NOT NULL DEFAULT 25, price_double numeric, price_triple numeric, price_quad numeric, status text NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING','FILLING_FAST','SOLD_OUT','ONGOING','COMPLETED','CANCELLED')), notes text, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL);
DROP TRIGGER IF EXISTS trip_dates_updated_at ON public.trip_dates;
CREATE TRIGGER trip_dates_updated_at BEFORE UPDATE ON public.trip_dates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE public.trip_dates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trip dates: public" ON public.trip_dates;
CREATE POLICY "Trip dates: public" ON public.trip_dates FOR SELECT USING (status <> 'CANCELLED');
DROP POLICY IF EXISTS "Trip dates: admin" ON public.trip_dates;
CREATE POLICY "Trip dates: admin" ON public.trip_dates FOR ALL USING (is_admin());

CREATE TABLE IF NOT EXISTS public.coupons (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, code text UNIQUE NOT NULL, description text, discount_type text NOT NULL DEFAULT 'PERCENT' CHECK (discount_type IN ('PERCENT','FLAT')), discount_value numeric NOT NULL, min_amount numeric DEFAULT 0, max_uses integer, used_count integer DEFAULT 0, valid_from date, valid_until date, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now() NOT NULL);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Coupons: public read" ON public.coupons;
CREATE POLICY "Coupons: public read" ON public.coupons FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Coupons: admin" ON public.coupons;
CREATE POLICY "Coupons: admin" ON public.coupons FOR ALL USING (is_admin());
INSERT INTO public.coupons (code, description, discount_type, discount_value, min_amount) VALUES ('NOMADIK10', '10% off all trips', 'PERCENT', 10, 5000) ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.bookings (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, booking_ref text UNIQUE, trip_id uuid REFERENCES public.trips(id) ON DELETE RESTRICT, trip_date_id uuid REFERENCES public.trip_dates(id) ON DELETE RESTRICT, departure_date date NOT NULL, custom_date boolean DEFAULT false, full_name text NOT NULL, email text NOT NULL, phone text NOT NULL, whatsapp_same boolean DEFAULT true, whatsapp_number text, address text, age integer, gender text CHECK (gender IN ('Male','Female','Other','Prefer not to say')), guardian_number text, aadhar_url text, profile_url text, referred_by text, heard_from text, is_solo boolean DEFAULT false, room_sharing public.room_sharing_type NOT NULL DEFAULT 'Triple', coupon_code text, coupon_id uuid REFERENCES public.coupons(id) ON DELETE SET NULL, base_amount numeric NOT NULL, discount_amount numeric DEFAULT 0, total_payable numeric NOT NULL, payment_schedule public.payment_schedule_type NOT NULL DEFAULT 'Full Payment', deposit_amount numeric, balance_due numeric, payment_status public.payment_status_type NOT NULL DEFAULT 'Pending', payment_gateway text DEFAULT 'cashfree', cashfree_order_id text, cashfree_payment_id text, transaction_id text, special_requests text, terms_accepted boolean DEFAULT false, terms_accepted_at timestamptz, booking_status public.booking_status_type NOT NULL DEFAULT 'Draft', notes text, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL);
DROP TRIGGER IF EXISTS bookings_generate_ref ON public.bookings;
CREATE TRIGGER bookings_generate_ref BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION generate_booking_ref();
DROP TRIGGER IF EXISTS bookings_updated_at ON public.bookings;
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Bookings: insert" ON public.bookings;
CREATE POLICY "Bookings: insert" ON public.bookings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Bookings: admin" ON public.bookings;
CREATE POLICY "Bookings: admin" ON public.bookings FOR ALL USING (is_admin());

CREATE TABLE IF NOT EXISTS public.contact_inquiries (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, name text NOT NULL, email text NOT NULL, phone text, subject text NOT NULL, message text NOT NULL, source text DEFAULT 'Contact Page', status text DEFAULT 'NEW' CHECK (status IN ('NEW','REPLIED','RESOLVED','SPAM')), admin_notes text, created_at timestamptz DEFAULT now() NOT NULL);
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Contact: insert" ON public.contact_inquiries;
CREATE POLICY "Contact: insert" ON public.contact_inquiries FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Contact: admin" ON public.contact_inquiries;
CREATE POLICY "Contact: admin" ON public.contact_inquiries FOR ALL USING (is_admin());

CREATE TABLE IF NOT EXISTS public.stories (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, slug text UNIQUE NOT NULL, category text NOT NULL, title text NOT NULL, snippet text NOT NULL, content text, image_url text NOT NULL, author text DEFAULT 'Nomadik Team', read_time integer NOT NULL DEFAULT 5, rating numeric DEFAULT 4.5, tags jsonb DEFAULT '[]', is_featured boolean DEFAULT false, is_published boolean DEFAULT false, published_at timestamptz, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL);
DROP TRIGGER IF EXISTS stories_updated_at ON public.stories;
CREATE TRIGGER stories_updated_at BEFORE UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Stories: public" ON public.stories;
CREATE POLICY "Stories: public" ON public.stories FOR SELECT USING (is_published = true);
DROP POLICY IF EXISTS "Stories: admin" ON public.stories;
CREATE POLICY "Stories: admin" ON public.stories FOR ALL USING (is_admin());

CREATE INDEX IF NOT EXISTS idx_trips_slug ON public.trips(slug);
CREATE INDEX IF NOT EXISTS idx_trip_dates_trip_id ON public.trip_dates(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_dates_departure ON public.trip_dates(departure_date);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON public.bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON public.bookings(phone);
CREATE INDEX IF NOT EXISTS idx_bookings_cashfree ON public.bookings(cashfree_order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_contact_status ON public.contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_stories_published ON public.stories(is_published, published_at DESC);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('traveler_documents', 'traveler_documents', false, 2097152, ARRAY['image/jpeg','image/png','image/webp','application/pdf']) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Docs: upload" ON storage.objects;
CREATE POLICY "Docs: upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'traveler_documents');
DROP POLICY IF EXISTS "Docs: admin read" ON storage.objects;
CREATE POLICY "Docs: admin read" ON storage.objects FOR SELECT USING (bucket_id = 'traveler_documents' AND is_admin());
