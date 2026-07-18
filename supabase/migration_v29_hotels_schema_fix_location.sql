-- Migration v29: Add location column to public.hotels

ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS location TEXT;
