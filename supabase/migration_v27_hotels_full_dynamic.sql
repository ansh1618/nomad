-- Migration v27: Dynamic Database Hotel Management System

-- 1. Extend public.hotels with country, verification status, and capacity
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS available_rooms INTEGER DEFAULT 0;

-- 2. Link Journeys (packages) to Hotels using a foreign key constraint
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES public.hotels(id) ON DELETE SET NULL;
