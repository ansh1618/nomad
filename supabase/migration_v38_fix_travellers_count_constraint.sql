-- ============================================================
-- Migration v38: Fix travellers_count NOT NULL Constraint
-- ============================================================

ALTER TABLE public.bookings ALTER COLUMN travellers_count DROP NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN traveller_count DROP NOT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS travellers_count integer DEFAULT 1;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS traveller_count integer DEFAULT 1;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS final_amount numeric DEFAULT 0;
