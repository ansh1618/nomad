-- Migration v39: Add all missing columns for destinations and bookings tables
-- Run this migration in Supabase SQL Editor to support extended CMS and ERP fields.

-- 1. DESTINATIONS TABLE COLUMNS
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS altitude text;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS best_time text;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS google_map_url text;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS hero_video text;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS faqs jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS things_to_do jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS weather jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS how_to_reach jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS seo jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS seo_description text;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0;

-- 2. BOOKINGS TABLE COLUMNS
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_ref text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS base_amount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS gst numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_payable numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS departure_date text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS travel_date text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS currency text DEFAULT 'INR';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'RAZORPAY';

-- Reload Supabase Schema Cache
NOTIFY pgrst, 'reload schema';
