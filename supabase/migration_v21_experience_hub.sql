-- ============================================================
-- NOMADIK: migration_v21_experience_hub.sql
-- Add Columns for Trip Experience Hub (Community Hub)
-- ============================================================

-- Alter journeys table to add columns for community features
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS reels jsonb DEFAULT '[]';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS memories jsonb DEFAULT '[]';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS trip_moments jsonb DEFAULT '[]';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS experience_stats jsonb DEFAULT '{"travelers": 420, "stories": 178, "photos": 980, "videos": 56, "reels": 32, "avg_rating": 4.9}';
