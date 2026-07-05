-- ==========================================
-- NOMADIK V5 — SCHEMA ADDITIONS FOR ERP & CMS FOUNDATION
-- Run AFTER schema_v4_cms.sql
-- ==========================================

-- 1. Status Enum
CREATE TYPE public.content_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- 2. Add Status to Core Entities
ALTER TABLE public.destinations ADD COLUMN status public.content_status DEFAULT 'DRAFT';
ALTER TABLE public.journeys ADD COLUMN status public.content_status DEFAULT 'DRAFT';

-- 3. Media Assets Library (WordPress Style Centralized Asset Manager)
CREATE TABLE IF NOT EXISTS public.media_assets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name text NOT NULL,
    file_size integer NOT NULL,
    mime_type text NOT NULL,
    url text NOT NULL,
    thumbnail_url text,
    folder text DEFAULT '/', -- For organizing: 'Hero', 'Gallery', 'Blog'
    alt_text text,
    width integer,
    height integer,
    uploaded_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 4. Revisions Tracking (For restoring previous edits)
CREATE TABLE IF NOT EXISTS public.journey_revisions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
    edited_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
    revision_data jsonb NOT NULL, -- Snapshot of the journey data
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.destination_revisions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    destination_id uuid REFERENCES public.destinations(id) ON DELETE CASCADE NOT NULL,
    edited_by uuid REFERENCES public.admins(id) ON DELETE SET NULL,
    revision_data jsonb NOT NULL, -- Snapshot of the destination data
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 5. Foreign Key Enhancements (Link Core Entities to Media Library explicitly where needed, or they can just store the URL/ID)
-- It's often better to just store the URL in existing columns (like hero_image), but keeping a reference is good for cleanup.
-- We will add a `media_id` array to destinations and journeys for their galleries, replacing raw JSON arrays.
ALTER TABLE public.destinations ADD COLUMN gallery_media_ids uuid[] DEFAULT '{}';
ALTER TABLE public.journeys ADD COLUMN gallery_media_ids uuid[] DEFAULT '{}';

-- Create Trigger for Updated_At on media_assets
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
