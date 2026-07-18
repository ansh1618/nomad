-- Migration v28: Fix Hotels Schema by adding missing columns: destination_id, gallery, amenities

-- 1. Add destination_id foreign key reference if not exists
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL;

-- 2. Add gallery jsonb column if not exists
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb;

-- 3. Add amenities text[] column if not exists
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}'::text[];
