-- ============================================================
-- Migration v32: Complete Nomadik Booking Schema Fix
-- Ensures all columns, tables, indexes, sequences & triggers exist.
-- Safe to re-run multiple times (idempotent ALTER TABLE ... ADD COLUMN IF NOT EXISTS)
-- ============================================================

-- 1. Ensure public.bookings has all required columns
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_id text UNIQUE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS departure_id uuid REFERENCES public.departures(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS journey_id uuid REFERENCES public.journeys(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS coupon_id uuid REFERENCES public.coupons(id) ON DELETE SET NULL;

-- Pricing & Amounts
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS base_amount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS addon_amount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS gst_rate numeric DEFAULT 5;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS gst_amount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS coupon_discount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS wallet_amount_used numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_amount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS deposit_amount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS balance_due numeric DEFAULT 0;

-- Statuses & Preferences
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS status text DEFAULT 'PAYMENT_PENDING';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_status text DEFAULT 'PENDING';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'PENDING';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_schedule text DEFAULT 'FULL';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS traveller_count integer DEFAULT 1;

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS room_sharing text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS room_preference text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS seat_preference text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_point text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS drop_point text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS food_preference text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS special_requests text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS internal_notes text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancellation_reason text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS refund_status text DEFAULT 'NONE';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_source text DEFAULT 'Website';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancellation_accepted boolean DEFAULT false;

-- Gateway References
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS razorpay_payment_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS razorpay_signature text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cashfree_order_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cashfree_payment_id text;

-- Assignments
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS assigned_hotel_id uuid REFERENCES public.hotels(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS assigned_bus_id uuid REFERENCES public.buses(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS assigned_trip_captain_id uuid REFERENCES public.trip_captains(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.admins(id) ON DELETE SET NULL;

-- Make user_id and departure_id nullable for guest bookings
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN departure_id DROP NOT NULL;

-- 2. Ensure public.booking_travellers has all required columns
CREATE TABLE IF NOT EXISTS public.booking_travellers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  is_primary boolean DEFAULT false,
  full_name text NOT NULL,
  gender text,
  date_of_birth date,
  age integer,
  phone text,
  email text,
  aadhaar_number text,
  passport_number text,
  id_proof_type text,
  id_proof_number text,
  pickup_point text,
  room_number text,
  room_sharing text,
  seat_preference text,
  food_preference text,
  medical_conditions text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  assigned_seat_id uuid,
  assigned_room_id uuid,
  address text,
  guardian_number text,
  heard_from text,
  referred_by text,
  aadhaar_doc_url text,
  photo_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS id_proof_type text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS id_proof_number text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS pickup_point text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS room_sharing text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS seat_preference text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS assigned_seat_id uuid;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS assigned_room_id uuid;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS guardian_number text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS aadhaar_doc_url text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS photo_url text;

-- 3. Create public.booking_addons table
CREATE TABLE IF NOT EXISTS public.booking_addons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  addon_id uuid,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 4. Create public.booking_timeline table
CREATE TABLE IF NOT EXISTS public.booking_timeline (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  event text NOT NULL,
  description text,
  actor text DEFAULT 'SYSTEM',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 5. Create public.payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'INR',
  status text DEFAULT 'PENDING',
  payment_type text DEFAULT 'FULL',
  payment_gateway text DEFAULT 'RAZORPAY',
  gateway text DEFAULT 'razorpay',
  payment_method text,
  gateway_order_id text,
  gateway_payment_id text,
  gateway_signature text,
  transaction_id text,
  receipt_url text,
  failure_reason text,
  metadata jsonb,
  processed_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS currency text DEFAULT 'INR';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS status text DEFAULT 'PENDING';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'FULL';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_gateway text DEFAULT 'RAZORPAY';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway text DEFAULT 'razorpay';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway_order_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway_payment_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway_signature text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_id text;

-- 6. Sequence & Trigger for auto-generating booking_id
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

-- 7. Indexes for Fast Admin & User Queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_departure_id ON public.bookings(departure_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_booking_travellers_booking_id ON public.booking_travellers(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_addons_booking_id ON public.booking_addons(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_timeline_booking_id ON public.booking_timeline(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);

-- 8. Enable Row Level Security & Provide Service Access
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_travellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_service_all" ON public.bookings;
CREATE POLICY "bookings_service_all" ON public.bookings FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "travellers_service_all" ON public.booking_travellers;
CREATE POLICY "travellers_service_all" ON public.booking_travellers FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "addons_service_all" ON public.booking_addons;
CREATE POLICY "addons_service_all" ON public.booking_addons FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "timeline_service_all" ON public.booking_timeline;
CREATE POLICY "timeline_service_all" ON public.booking_timeline FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "payments_service_all" ON public.payments;
CREATE POLICY "payments_service_all" ON public.payments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow authenticated users to read their own bookings
DROP POLICY IF EXISTS "bookings_user_read" ON public.bookings;
CREATE POLICY "bookings_user_read" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "travellers_user_read" ON public.booking_travellers;
CREATE POLICY "travellers_user_read" ON public.booking_travellers FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_travellers.booking_id AND b.user_id = auth.uid())
);

DROP POLICY IF EXISTS "payments_user_read" ON public.payments;
CREATE POLICY "payments_user_read" ON public.payments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = payments.booking_id AND b.user_id = auth.uid())
);
