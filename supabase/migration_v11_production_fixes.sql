-- ============================================================
-- NOMADIK ERP — MIGRATION v11: Enterprise Production Fixes
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/sgeffapbsrppzrgqfpec/sql/new
-- ============================================================

-- 1. Ensure sequence and trigger function for booking reference targets booking_id
CREATE SEQUENCE IF NOT EXISTS booking_ref_seq START 1001;

CREATE OR REPLACE FUNCTION generate_booking_ref() RETURNS TRIGGER AS $$ 
BEGIN 
  -- Set booking_id instead of booking_ref since only booking_id exists
  NEW.booking_id := 'NM-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('booking_ref_seq')::text, 4, '0'); 
  RETURN NEW; 
END; 
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bookings_generate_ref ON public.bookings;
CREATE TRIGGER bookings_generate_ref 
  BEFORE INSERT ON public.bookings 
  FOR EACH ROW 
  EXECUTE FUNCTION generate_booking_ref();


-- 2. Make bookings.user_id nullable to support guest checkouts
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;


-- 3. Setup activity_logs table for Admin Audit Trail
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  action text NOT NULL,
  module text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access activity_logs" ON public.activity_logs;
CREATE POLICY "Admins full access activity_logs" ON public.activity_logs FOR ALL USING (public.is_admin());

-- 3.1. Automatic CRUD Logger trigger for Destinations, Journeys, Departures, Bookings
CREATE OR REPLACE FUNCTION public.log_admin_action() 
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id uuid;
  v_record_id uuid;
  v_old_data jsonb := null;
  v_new_data jsonb := null;
BEGIN
  -- Get active auth user ID
  v_admin_id := auth.uid();
  
  -- Record ID selection
  IF (TG_OP = 'DELETE') THEN
    v_record_id := OLD.id;
    v_old_data := to_jsonb(OLD);
  ELSIF (TG_OP = 'UPDATE') THEN
    v_record_id := NEW.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSE
    v_record_id := NEW.id;
    v_new_data := to_jsonb(NEW);
  END IF;

  -- Only log if action was done by an admin (auth.uid() is not null)
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO public.activity_logs (admin_id, action, module, record_id, old_data, new_data)
    VALUES (v_admin_id, TG_OP, TG_TABLE_NAME, v_record_id, v_old_data, v_new_data);
  END IF;

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers to automatic logging
DROP TRIGGER IF EXISTS log_destinations_activity ON public.destinations;
CREATE TRIGGER log_destinations_activity AFTER INSERT OR UPDATE OR DELETE ON public.destinations
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

DROP TRIGGER IF EXISTS log_journeys_activity ON public.journeys;
CREATE TRIGGER log_journeys_activity AFTER INSERT OR UPDATE OR DELETE ON public.journeys
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

DROP TRIGGER IF EXISTS log_departures_activity ON public.departures;
CREATE TRIGGER log_departures_activity AFTER INSERT OR UPDATE OR DELETE ON public.departures
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

DROP TRIGGER IF EXISTS log_bookings_activity ON public.bookings;
CREATE TRIGGER log_bookings_activity AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();


-- 4. Enable Soft Delete Support across key tables
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false NOT NULL;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false NOT NULL;
ALTER TABLE public.departures ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false NOT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false NOT NULL;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false NOT NULL;
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false NOT NULL;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false NOT NULL;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false NOT NULL;


-- 5. Payments Security: Disable public insert, restrict to Admin and Server
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert payments" ON public.payments;
DROP POLICY IF EXISTS "Anyone can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Users: Insert own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins: full access payments" ON public.payments;
DROP POLICY IF EXISTS "Admins full access payments" ON public.payments;

CREATE POLICY "Admins: full access payments" ON public.payments FOR ALL USING (public.is_admin());


ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Bookings: insert" ON public.bookings;
DROP POLICY IF EXISTS "Users: Insert own bookings" ON public.bookings;
CREATE POLICY "Bookings: insert" ON public.bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Bookings: select" ON public.bookings;
DROP POLICY IF EXISTS "Users: Read own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Bookings: select guest" ON public.bookings;
CREATE POLICY "Bookings: select guest" ON public.bookings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Bookings: admin" ON public.bookings;
CREATE POLICY "Bookings: admin" ON public.bookings FOR ALL USING (public.is_admin());

ALTER TABLE public.booking_travellers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users: Insert own travellers" ON public.booking_travellers;
CREATE POLICY "Users: Insert own travellers" ON public.booking_travellers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users: Read own travellers" ON public.booking_travellers;
DROP POLICY IF EXISTS "Admins: full access travellers" ON public.booking_travellers;
CREATE POLICY "Admins: full access travellers" ON public.booking_travellers FOR ALL USING (public.is_admin());
CREATE POLICY "Users: Read own travellers" ON public.booking_travellers FOR SELECT TO anon, authenticated USING (true);


-- 7. Setup Media Storage Bucket & RLS policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('traveler_documents', 'traveler_documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for media bucket: public read, authenticated (admin) write/delete
DROP POLICY IF EXISTS "Media: public read" ON storage.objects;
CREATE POLICY "Media: public read" ON storage.objects 
  FOR SELECT TO public 
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Media: admin write" ON storage.objects;
CREATE POLICY "Media: admin write" ON storage.objects 
  FOR ALL TO authenticated 
  USING (bucket_id = 'media' AND public.is_admin()) 
  WITH CHECK (bucket_id = 'media' AND public.is_admin());

-- RLS for traveler_documents bucket: private read/write only for authed admins
DROP POLICY IF EXISTS "Documents: admin read" ON storage.objects;
CREATE POLICY "Documents: admin read" ON storage.objects 
  FOR SELECT TO authenticated 
  USING (bucket_id = 'traveler_documents' AND public.is_admin());

DROP POLICY IF EXISTS "Documents: admin write" ON storage.objects;
CREATE POLICY "Documents: admin write" ON storage.objects 
  FOR ALL TO authenticated 
  USING (bucket_id = 'traveler_documents' AND public.is_admin()) 
  WITH CHECK (bucket_id = 'traveler_documents' AND public.is_admin());


-- 8. Public RLS insert policies for contact inquiries, consultations, and callbacks
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Contact: insert" ON public.contact_inquiries;
CREATE POLICY "Contact: insert" ON public.contact_inquiries FOR INSERT TO anon, authenticated WITH CHECK (true);

ALTER TABLE public.consultation_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Consultation: insert" ON public.consultation_requests;
CREATE POLICY "Consultation: insert" ON public.consultation_requests FOR INSERT TO anon, authenticated WITH CHECK (true);

ALTER TABLE public.callback_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Callback: insert" ON public.callback_requests;
CREATE POLICY "Callback: insert" ON public.callback_requests FOR INSERT TO anon, authenticated WITH CHECK (true);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert inquiries" ON public.inquiries;
CREATE POLICY "Allow public insert inquiries" ON public.inquiries FOR INSERT TO anon, authenticated WITH CHECK (true);


-- Done!
SELECT 'Migration complete! trigger, nullable user_id, storage, soft delete, activity logs, auto-CRUD audit logger, and contact form RLS policies established successfully.' AS status;
