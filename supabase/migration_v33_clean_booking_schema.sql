-- ============================================================
-- Migration v33: Clean Booking Schema & Standardized Statuses
-- ============================================================

-- 1. Standardize status constraints on public.bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_status text DEFAULT 'Pending';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'Pending';

-- 2. Ensure profiles link cleanly
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

-- 3. Additional booking fields
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS destination_code text DEFAULT 'NOM';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS addon_amount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS gst_amount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_amount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS balance_due numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS room_sharing text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_point text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS drop_point text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS special_requests text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS internal_notes text;
