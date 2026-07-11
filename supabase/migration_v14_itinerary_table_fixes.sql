-- =========================================================================
-- NOMADIK ERP MIGRATION v14: ITINERARY DAYS TABLE SCHEMA FIX & RLS POLICIES
-- Run this in your Supabase SQL Editor to support the modern Package Builder.
-- =========================================================================

-- 1. Ensure itinerary_days table exists
CREATE TABLE IF NOT EXISTS public.itinerary_days (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
  day_number integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (journey_id, day_number)
);

-- 2. Ensure modern columns exist
ALTER TABLE public.itinerary_days ADD COLUMN IF NOT EXISTS stay text;
ALTER TABLE public.itinerary_days ADD COLUMN IF NOT EXISTS transport text;
ALTER TABLE public.itinerary_days ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.itinerary_days ADD COLUMN IF NOT EXISTS is_highlight boolean DEFAULT false;
ALTER TABLE public.itinerary_days ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- 3. Safely transition meals column from text[] to jsonb if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'itinerary_days' AND column_name = 'meals' AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.itinerary_days DROP COLUMN IF EXISTS meals;
  END IF;
END $$;

ALTER TABLE public.itinerary_days ADD COLUMN IF NOT EXISTS meals jsonb DEFAULT '{"breakfast": false, "lunch": false, "dinner": false}'::jsonb;

-- 4. Enable RLS and setup policies
ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public: Read itinerary days" ON public.itinerary_days;
CREATE POLICY "Public: Read itinerary days" ON public.itinerary_days 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins: Full access to itinerary_days" ON public.itinerary_days;
CREATE POLICY "Admins: Full access to itinerary_days" ON public.itinerary_days 
  FOR ALL USING (public.is_admin());
