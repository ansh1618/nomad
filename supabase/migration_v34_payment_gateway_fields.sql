-- ============================================================
-- Migration v34: Extended Payment & Gateway Fields for Refunds & Audit
-- ============================================================

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS bank text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS upi text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS wallet text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway_response jsonb;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_time timestamptz DEFAULT now();
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS receipt_url text;

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_time timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS receipt_url text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS gateway_response jsonb;
