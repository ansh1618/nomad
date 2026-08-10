-- Migration V43: Coupon Usages & STUTI500 Configuration
-- Creates coupon_usages table and unique constraint to prevent duplicate usage per booking

CREATE TABLE IF NOT EXISTS public.coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  coupon_code TEXT NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  journey_id UUID,
  journey_name TEXT,
  departure_date TEXT,
  original_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  final_amount NUMERIC NOT NULL DEFAULT 0,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_booking_coupon UNIQUE (coupon_code, booking_id)
);

-- RLS Policies
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'coupon_usages' AND policyname = 'Public select coupon_usages'
  ) THEN
    CREATE POLICY "Public select coupon_usages" ON public.coupon_usages FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'coupon_usages' AND policyname = 'Public insert coupon_usages'
  ) THEN
    CREATE POLICY "Public insert coupon_usages" ON public.coupon_usages FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'coupon_usages' AND policyname = 'Public update coupon_usages'
  ) THEN
    CREATE POLICY "Public update coupon_usages" ON public.coupon_usages FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'coupon_usages' AND policyname = 'Public delete coupon_usages'
  ) THEN
    CREATE POLICY "Public delete coupon_usages" ON public.coupon_usages FOR DELETE USING (true);
  END IF;
END $$;

-- Seed STUTI500 coupon if missing
INSERT INTO public.coupons (code, description, discount_type, discount_value, min_amount, used_count, is_active)
VALUES ('STUTI500', '₹500 OFF on all journeys', 'FLAT', 500, 0, 0, true)
ON CONFLICT (code) DO UPDATE 
SET discount_value = 500, is_active = true;
