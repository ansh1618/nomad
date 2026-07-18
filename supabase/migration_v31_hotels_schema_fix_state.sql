-- Migration v31: Add state column to public.hotels

ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS state TEXT;
