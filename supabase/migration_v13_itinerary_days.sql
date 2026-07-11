-- ============================================================
-- NOMADIK ERP — MIGRATION v13: itinerary_days table
-- Creates the itinerary_days separate table (instead of JSONB in journeys).
-- Backfills from the legacy journeys.itinerary column if it has data.
-- Safe: all statements use IF NOT EXISTS / ON CONFLICT DO NOTHING
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/sgeffapbsrppzrgqfpec/sql/new
-- ============================================================

-- ============================================================
-- 1. CREATE itinerary_days table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.itinerary_days (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id  uuid        REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
  day_number  integer     NOT NULL,
  title       text        NOT NULL,
  description text,
  meals       jsonb,
  stay        text,
  transport   text,
  image_url   text,
  is_highlight boolean    DEFAULT false,
  sort_order  integer     DEFAULT 0,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE(journey_id, day_number)
);

-- Ensure all columns exist (in case table was created by an older migration without them)
ALTER TABLE public.itinerary_days ADD COLUMN IF NOT EXISTS image_url   text;
ALTER TABLE public.itinerary_days ADD COLUMN IF NOT EXISTS is_highlight boolean DEFAULT false;
ALTER TABLE public.itinerary_days ADD COLUMN IF NOT EXISTS sort_order  integer DEFAULT 0;
ALTER TABLE public.itinerary_days ADD COLUMN IF NOT EXISTS meals       jsonb;
ALTER TABLE public.itinerary_days ADD COLUMN IF NOT EXISTS stay        text;
ALTER TABLE public.itinerary_days ADD COLUMN IF NOT EXISTS transport   text;
ALTER TABLE public.itinerary_days ADD COLUMN IF NOT EXISTS updated_at  timestamptz DEFAULT now();


-- ============================================================
-- 2. CREATE package_revisions table (for version history)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.package_revisions (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id    uuid        REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
  revision_data jsonb       NOT NULL,
  revision_note text,
  created_by    uuid        REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- 3. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_itinerary_journey   ON public.itinerary_days(journey_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_sort       ON public.itinerary_days(journey_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_revisions_journey    ON public.package_revisions(journey_id);

-- ============================================================
-- 4. updated_at trigger for itinerary_days
-- ============================================================
DROP TRIGGER IF EXISTS set_updated_at_itinerary_days ON public.itinerary_days;
CREATE TRIGGER set_updated_at_itinerary_days
  BEFORE UPDATE ON public.itinerary_days
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. RLS Policies
-- ============================================================
ALTER TABLE public.itinerary_days    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_revisions ENABLE ROW LEVEL SECURITY;

-- itinerary_days: public can read, admins can write
DROP POLICY IF EXISTS "Itinerary: public read"  ON public.itinerary_days;
CREATE POLICY "Itinerary: public read" ON public.itinerary_days
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Itinerary: admin write" ON public.itinerary_days;
CREATE POLICY "Itinerary: admin write" ON public.itinerary_days
  FOR ALL USING (public.is_admin());

-- package_revisions: admins only
DROP POLICY IF EXISTS "Revisions: admin full access" ON public.package_revisions;
CREATE POLICY "Revisions: admin full access" ON public.package_revisions
  FOR ALL USING (public.is_admin());

-- ============================================================
-- 6. Backfill: migrate legacy journeys.itinerary JSONB to itinerary_days rows
-- Only runs if the journeys table has an itinerary column with data.
-- ============================================================
DO $$
DECLARE
  j     RECORD;
  d     jsonb;
  idx   integer;
BEGIN
  -- Check if itinerary column exists on journeys
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journeys' AND column_name = 'itinerary'
  ) THEN
    RAISE NOTICE 'No legacy itinerary column found -- skipping backfill.';
    RETURN;
  END IF;

  FOR j IN
    SELECT id, itinerary
    FROM public.journeys
    WHERE itinerary IS NOT NULL
      AND jsonb_array_length(itinerary) > 0
  LOOP
    idx := 0;
    FOR d IN SELECT * FROM jsonb_array_elements(j.itinerary)
    LOOP
      idx := idx + 1;
      INSERT INTO public.itinerary_days (
        journey_id, day_number, title, description,
        stay, transport, sort_order
      )
      VALUES (
        j.id,
        COALESCE((d->>'day')::integer, idx),
        COALESCE(d->>'title', 'Day ' || idx),
        COALESCE(d->>'description', ''),
        COALESCE(d->>'hotel', ''),
        COALESCE(d->>'transport', ''),
        idx - 1
      )
      ON CONFLICT (journey_id, day_number) DO NOTHING;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Backfill complete.';
END $$;

-- ============================================================
-- Done!
-- ============================================================
SELECT 'Migration v13 complete! itinerary_days table created and backfilled from legacy JSONB.' AS status;
