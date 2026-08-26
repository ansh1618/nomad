-- ============================================================
-- GoNomadik Analytics Infrastructure
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Analytics Events Table
-- Stores all client-side tracking events (page views, clicks, funnel steps)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  event_name text NOT NULL,
  path text,
  params jsonb DEFAULT '{}',
  user_id text,
  device_category text,
  browser text,
  os text,
  screen_size text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  country text,
  region text,
  city text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_ae_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_ae_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_ae_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_ae_utm_campaign ON public.analytics_events(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_ae_utm_source ON public.analytics_events(utm_source);
CREATE INDEX IF NOT EXISTS idx_ae_path ON public.analytics_events(path);
CREATE INDEX IF NOT EXISTS idx_ae_device_category ON public.analytics_events(device_category);

-- Composite index for date-range + event_name queries (Admin Dashboard)
CREATE INDEX IF NOT EXISTS idx_ae_name_created ON public.analytics_events(event_name, created_at);

-- 2. Booking Attributions Table
-- Links UTM campaign data to actual bookings for revenue attribution
CREATE TABLE IF NOT EXISTS public.booking_attributions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id text NOT NULL,
  session_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  device_category text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ba_booking_id ON public.booking_attributions(booking_id);
CREATE INDEX IF NOT EXISTS idx_ba_utm_source ON public.booking_attributions(utm_source);
CREATE INDEX IF NOT EXISTS idx_ba_utm_campaign ON public.booking_attributions(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_ba_created_at ON public.booking_attributions(created_at);

-- 3. Row Level Security
-- analytics_events: service role can insert and read; anon/authenticated cannot read
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (used by API route)
CREATE POLICY "Service role full access on analytics_events"
  ON public.analytics_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow anon/authenticated to INSERT only (for the tracking endpoint)
CREATE POLICY "Allow insert for tracking"
  ON public.analytics_events
  FOR INSERT
  WITH CHECK (true);

-- booking_attributions: service role full access
ALTER TABLE public.booking_attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on booking_attributions"
  ON public.booking_attributions
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow insert for attribution tracking"
  ON public.booking_attributions
  FOR INSERT
  WITH CHECK (true);
