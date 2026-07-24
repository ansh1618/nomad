-- ============================================================
-- Migration v37: Drop NOT NULL Constraints on Legacy Columns
-- ============================================================

ALTER TABLE public.bookings ALTER COLUMN customer_name DROP NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN email DROP NOT NULL;
