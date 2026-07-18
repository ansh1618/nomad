-- Migration v30: Add slug column to public.hotels

ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
