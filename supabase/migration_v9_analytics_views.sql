-- ============================================================
-- NOMADIK ERP — ANALYTICS VIEWS (v9 Views)
-- Run this in Supabase SQL Editor AFTER running:
-- 1. migration_v6_erp_tables.sql
-- 2. migration_v8_erp_modules.sql
-- Creates all dynamic views needed for the Admin Dashboard charts and KPIs.
-- ============================================================

-- Drop old views if they exist to prevent conflict
DROP VIEW IF EXISTS public.v_dashboard_stats CASCADE;
DROP VIEW IF EXISTS public.v_monthly_revenue CASCADE;
DROP VIEW IF EXISTS public.v_package_performance CASCADE;

-- 1. Dashboard Master KPIs View
CREATE OR REPLACE VIEW public.v_dashboard_stats AS
SELECT
  -- Today's Bookings count
  (SELECT COUNT(*) FROM public.bookings WHERE created_at::date = CURRENT_DATE) AS today_bookings,
  
  -- Today's Revenue (successful payments + confirmed offline bookings today)
  (SELECT COALESCE(SUM(total_amount), 0) FROM public.bookings WHERE created_at::date = CURRENT_DATE AND status NOT IN ('CANCELLED', 'REFUNDED')) AS today_revenue,
  
  -- Monthly Revenue (this calendar month)
  (SELECT COALESCE(SUM(total_amount), 0) FROM public.bookings WHERE created_at >= date_trunc('month', CURRENT_DATE) AND status NOT IN ('CANCELLED', 'REFUNDED')) AS monthly_revenue,
  
  -- Confirmed Bookings count
  (SELECT COUNT(*) FROM public.bookings WHERE status = 'CONFIRMED') AS confirmed_bookings,
  
  -- Pending Bookings count
  (SELECT COUNT(*) FROM public.bookings WHERE status = 'PAYMENT_PENDING') AS pending_bookings,
  
  -- Completed trips count
  (SELECT COUNT(*) FROM public.bookings WHERE status = 'COMPLETED') AS completed_trips,
  
  -- Today's new leads CRM count
  (SELECT COUNT(*) FROM public.inquiries WHERE created_at::date = CURRENT_DATE) AS today_leads,
  
  -- Weekly Leads CRM count
  (SELECT COUNT(*) FROM public.inquiries WHERE created_at >= date_trunc('week', CURRENT_DATE)) AS week_leads,
  
  -- Total registered users
  (SELECT COUNT(*) FROM public.users) AS total_customers,
  
  -- Active trip packages
  (SELECT COUNT(*) FROM public.journeys WHERE status = 'PUBLISHED') AS active_packages,
  
  -- Upcoming departures count
  (SELECT COUNT(*) FROM public.departures WHERE departure_date >= CURRENT_DATE AND status = 'UPCOMING') AS upcoming_departures,
  
  -- Conversion rate calculation
  (SELECT ROUND(COUNT(*) FILTER (WHERE status = 'CONVERTED')::numeric / NULLIF(COUNT(*), 0) * 100, 1) FROM public.inquiries) AS lead_conversion_rate;

-- 2. Monthly Revenue Over Time (for dashboard charts)
CREATE OR REPLACE VIEW public.v_monthly_revenue AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COALESCE(SUM(total_amount), 0) AS revenue,
  COUNT(*) AS bookings
FROM public.bookings
WHERE status NOT IN ('CANCELLED', 'REFUNDED')
  AND created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;

-- 3. Package Sales Performance View
CREATE OR REPLACE VIEW public.v_package_performance AS
SELECT
  j.id,
  j.name,
  j.slug,
  j.starting_price,
  COUNT(b.id) AS booking_count,
  COALESCE(SUM(b.total_amount), 0) AS total_revenue,
  COALESCE(AVG(r.rating), 4.8) AS avg_rating,
  COUNT(r.id) AS review_count
FROM public.journeys j
LEFT JOIN public.departures d ON d.journey_id = j.id
LEFT JOIN public.bookings b ON b.departure_id = d.id AND b.status NOT IN ('CANCELLED', 'REFUNDED')
LEFT JOIN public.reviews r ON r.journey_id = j.id AND r.approved = true
GROUP BY j.id, j.name, j.slug, j.starting_price
ORDER BY booking_count DESC;

-- Grant permissions to read views
GRANT SELECT ON public.v_dashboard_stats TO anon, authenticated, service_role;
GRANT SELECT ON public.v_monthly_revenue TO anon, authenticated, service_role;
GRANT SELECT ON public.v_package_performance TO anon, authenticated, service_role;

-- ============================================================
-- ✅ Analytics Views Created Successfully
-- ============================================================
