-- ============================================================
-- Migration v15: ERP Foundation — Production Booking System
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── 1. CUSTOMERS TABLE (normalized, CRM-ready) ────────────────
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text NOT NULL,
  whatsapp text,
  gender text,
  date_of_birth date,
  city text,
  state text,
  address text,
  referral_source text,
  total_bookings integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  last_booking_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (phone)
);

-- Index for fast phone/email lookups
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers (email);

-- ── 2. TRANSACTIONS TABLE (raw gateway responses) ─────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings (id) ON DELETE CASCADE,
  gateway text NOT NULL DEFAULT 'cashfree',
  order_id text,
  gateway_payment_id text,
  amount numeric NOT NULL,
  currency text DEFAULT 'INR',
  status text NOT NULL DEFAULT 'PENDING',
  gateway_response jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON public.transactions (booking_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON public.transactions (order_id);

-- ── 3. BOOKING TIMELINE TABLE (activity log per booking) ──────
CREATE TABLE IF NOT EXISTS public.booking_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings (id) ON DELETE CASCADE NOT NULL,
  event text NOT NULL,
  description text,
  actor text DEFAULT 'SYSTEM',
  actor_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_booking_timeline_booking_id ON public.booking_timeline (booking_id);

-- ── 4. NOTIFICATIONS TABLE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type text NOT NULL DEFAULT 'ADMIN',
  recipient_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'INFO',
  related_booking_id uuid REFERENCES public.bookings (id) ON DELETE SET NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications (recipient_type, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_booking ON public.notifications (related_booking_id);

-- ── 5. ALTER BOOKINGS TABLE (add missing columns) ─────────────

-- Make user_id nullable so guest (anonymous) bookings work
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;

-- Link to customers table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers (id) ON DELETE SET NULL;

-- Cashfree payment columns
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cashfree_order_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cashfree_payment_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS transaction_id text;

-- booking_status & payment_status (separate from status: BookingState)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_status text DEFAULT 'PENDING';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'PENDING';

-- Room / seat preference on booking level
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS seat_preference text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS room_sharing text;

-- Journey link (in case departure_id is not always set)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS journey_id uuid;

-- GST rate column (some schemas have it, some don't)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS gst_rate numeric DEFAULT 5;

CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings (customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_cashfree_order ON public.bookings (cashfree_order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_status ON public.bookings (booking_status);

-- ── 6. ALTER BOOKING_TRAVELLERS (add missing columns) ─────────
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS seat_preference text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS room_sharing text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS guardian_number text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS heard_from text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS referred_by text;

-- ── 7. BOOKING ID AUTO-GENERATE FUNCTION & TRIGGER ──────────
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

-- ── 8. UPDATED_AT TRIGGER FOR CUSTOMERS ───────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 9. RLS POLICIES ───────────────────────────────────────────

-- Enable RLS on new tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- customers: anon can insert (on booking), admins can read/update all
CREATE POLICY "customers_anon_insert" ON public.customers
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "customers_admin_all" ON public.customers
  FOR ALL TO authenticated USING (true);

-- customers: public can also select their own (future auth use)
CREATE POLICY "customers_service_all" ON public.customers
  FOR ALL TO service_role USING (true);

-- transactions: service_role only (webhook writes here)
CREATE POLICY "transactions_service_all" ON public.transactions
  FOR ALL TO service_role USING (true);

CREATE POLICY "transactions_admin_read" ON public.transactions
  FOR SELECT TO authenticated USING (true);

-- booking_timeline: anon/service can insert, admins can read
CREATE POLICY "timeline_anon_insert" ON public.booking_timeline
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "timeline_service_all" ON public.booking_timeline
  FOR ALL TO service_role USING (true);

CREATE POLICY "timeline_admin_read" ON public.booking_timeline
  FOR SELECT TO authenticated USING (true);

-- notifications: service writes, admins read/update
CREATE POLICY "notif_service_all" ON public.notifications
  FOR ALL TO service_role USING (true);

CREATE POLICY "notif_admin_all" ON public.notifications
  FOR ALL TO authenticated USING (true);

-- bookings: anon can INSERT (guest booking), service has full access
CREATE POLICY "bookings_anon_insert" ON public.bookings
  FOR INSERT TO anon WITH CHECK (true);

-- booking_travellers: anon can INSERT
CREATE POLICY "travellers_anon_insert" ON public.booking_travellers
  FOR INSERT TO anon WITH CHECK (true);

-- ── 10. ENABLE REALTIME ON KEY TABLES ─────────────────────────
-- Run these if not already enabled:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
-- (Comment: run this manually in Supabase dashboard > Database > Replication)
