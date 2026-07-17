-- Migration v25: Extended Bookings CRM and Allocations

-- 1. Create booking_documents table if not exists
CREATE TABLE IF NOT EXISTS public.booking_documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    file_url text NOT NULL,
    file_type text NOT NULL,
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on booking_documents
ALTER TABLE public.booking_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_documents_select" ON public.booking_documents;
CREATE POLICY "booking_documents_select" ON public.booking_documents
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "booking_documents_insert" ON public.booking_documents;
CREATE POLICY "booking_documents_insert" ON public.booking_documents
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "booking_documents_delete" ON public.booking_documents;
CREATE POLICY "booking_documents_delete" ON public.booking_documents
    FOR DELETE USING (true);

-- 2. Add columns to public.bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_schedule text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS special_requests text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_point text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS drop_point text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancellation_accepted boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_source text DEFAULT 'Website';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS refund_status text DEFAULT 'NONE';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_time timestamp with time zone;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS assigned_bus_id uuid REFERENCES public.buses(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS assigned_trip_captain_id uuid REFERENCES public.trip_captains(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS assigned_hotel_id uuid REFERENCES public.hotels(id) ON DELETE SET NULL;

-- 3. Add columns to public.booking_travellers
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS id_proof_type text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS id_proof_number text;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS room_number text;

-- 4. Add columns to public.payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS cashfree_order_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS cashfree_payment_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS refund_status text;

-- 5. Update the generate_booking_id trigger format to NMK-YYYY-000001
CREATE SEQUENCE IF NOT EXISTS public.booking_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_booking_id()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.booking_id IS NULL OR NEW.booking_id = '' THEN
    NEW.booking_id := 'NMK-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('public.booking_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;
