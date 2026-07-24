-- ============================================================
-- Migration v35: Dedicated Booking Audit Logs Table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.booking_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  action text NOT NULL,
  payload jsonb,
  response jsonb,
  ip_address text,
  device text,
  browser text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_booking_logs_booking_id ON public.booking_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_logs_action ON public.booking_logs(action);

ALTER TABLE public.booking_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_logs_service_all" ON public.booking_logs;
CREATE POLICY "booking_logs_service_all" ON public.booking_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
