-- ============================================================
-- Migration v16: Fix Booking Schema for Guest Booking Flow
-- Run this in Supabase SQL Editor BEFORE testing bookings
-- ============================================================

-- 1. Make departure_id nullable (guest bookings may not have a departure)
ALTER TABLE public.bookings ALTER COLUMN departure_id DROP NOT NULL;

-- 2. Drop the GENERATED balance_due column and replace with a plain numeric
--    (GENERATED ALWAYS columns cannot be inserted into)
ALTER TABLE public.bookings DROP COLUMN IF EXISTS balance_due;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS balance_due numeric DEFAULT 0;

-- 3. Add missing columns on payments table (our code uses `gateway` not `payment_gateway`)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway text DEFAULT 'cashfree';

-- Sync any existing payment_gateway values to the new gateway column
UPDATE public.payments SET gateway = payment_gateway WHERE gateway IS NULL AND payment_gateway IS NOT NULL;

-- 4. Ensure booking_status and payment_status exist on bookings (may already exist from v15)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_status text DEFAULT 'PENDING';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'PENDING';

-- 5. Ensure customer_id column exists (from v15, but run safely)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

-- 6. Ensure cashfree columns exist (from v15)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cashfree_order_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cashfree_payment_id text;

-- 7. Ensure seat/room preference columns exist on bookings (from v15)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS seat_preference text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS room_sharing text;

-- 8. Ensure traveller columns exist (from v15)
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS seat_preference text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS room_sharing text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS guardian_number text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS heard_from text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS referred_by text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS aadhaar_doc_url text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS photo_url text;

-- 9. Make user_id nullable (guest bookings have no user_id)
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;

-- 10. Verify booking_seq and trigger exist (from v15 — safe to re-run)
CREATE SEQUENCE IF NOT EXISTS public.booking_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_booking_id()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.booking_id IS NULL OR NEW.booking_id = '' THEN
    NEW.booking_id := 'NMK-' || to_char(now(), 'YYYYMM') || '-' ||
      lpad(nextval('public.booking_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_booking_id ON public.bookings;
CREATE TRIGGER trg_generate_booking_id
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_booking_id();

-- 11. Ensure RLS policies allow service_role full access for bookings & travellers
CREATE POLICY IF NOT EXISTS "bookings_service_all" ON public.bookings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "travellers_service_all" ON public.booking_travellers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "payments_service_all" ON public.payments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Done. Run this migration, then test bookings.
