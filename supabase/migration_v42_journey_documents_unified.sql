-- ==============================================================================
-- UNIFIED PRODUCTION MIGRATION V42: PREMIUM JOURNEY DOCUMENTS & AUDIT SUBSYSTEM
-- Single Source of Truth for Journey Documents, Versioning, Audit Logs & Analytics
-- ==============================================================================

-- 1. Create journey_documents table (Replaces legacy package_documents / premium_documents)
CREATE TABLE IF NOT EXISTS public.journey_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  document_type text NOT NULL DEFAULT 'ITINERARY', -- 'ITINERARY' | 'PACKING' | 'GUIDE' | 'TERMS' | 'VOUCHER' | 'TICKET' | 'INVOICE' | 'OTHER'
  title text NOT NULL,
  bucket_name text NOT NULL DEFAULT 'itineraries',
  storage_path text NOT NULL, -- Relative path ONLY: e.g. "udaipur-weekend/itinerary/1758262528899-UDAIPUR.pdf"
  file_name text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/pdf',
  file_size bigint NOT NULL DEFAULT 0,
  page_count integer DEFAULT 1,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  allow_download boolean NOT NULL DEFAULT true,
  allow_print boolean NOT NULL DEFAULT true,
  allow_copy boolean NOT NULL DEFAULT true,
  watermark_enabled boolean NOT NULL DEFAULT true,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for ultra-fast query execution
CREATE INDEX IF NOT EXISTS idx_journey_docs_journey_id ON public.journey_documents(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_docs_lookup ON public.journey_documents(journey_id, document_type, is_active);

-- 2. Create document_audit_logs table for compliance and activity tracking
CREATE TABLE IF NOT EXISTS public.document_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.journey_documents(id) ON DELETE SET NULL,
  journey_id uuid REFERENCES public.journeys(id) ON DELETE SET NULL,
  action text NOT NULL, -- 'UPLOAD' | 'VIEW' | 'DOWNLOAD' | 'REPLACE' | 'ARCHIVE' | 'RESTORE'
  version integer DEFAULT 1,
  performed_by uuid,
  user_email text,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_audit_journey_id ON public.document_audit_logs(journey_id);
CREATE INDEX IF NOT EXISTS idx_doc_audit_action ON public.document_audit_logs(action);

-- 3. Create pdf_views table for reading analytics and heatmaps
CREATE TABLE IF NOT EXISTS public.pdf_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  journey_id uuid NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.journey_documents(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  last_page_viewed integer NOT NULL DEFAULT 1,
  max_page_reached integer NOT NULL DEFAULT 1,
  progress_percent integer NOT NULL DEFAULT 0,
  reading_time integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  is_bounce boolean NOT NULL DEFAULT true,
  is_returning boolean NOT NULL DEFAULT false,
  ip_address text,
  device text,
  browser text,
  download_count integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pdf_views_journey_id ON public.pdf_views(journey_id);
CREATE INDEX IF NOT EXISTS idx_pdf_views_doc_id ON public.pdf_views(document_id);

-- 4. Create itinerary_leads table for lead generation before document unlocks
CREATE TABLE IF NOT EXISTS public.itinerary_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  phone text,
  journey_id uuid NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  city text,
  source text NOT NULL DEFAULT 'Premium PDF',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_itinerary_lead UNIQUE (email, journey_id)
);

CREATE INDEX IF NOT EXISTS idx_itinerary_leads_journey_id ON public.itinerary_leads(journey_id);

-- 5. Setup Storage Bucket 'itineraries'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('itineraries', 'itineraries', true, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf'];

-- RLS Policies
ALTER TABLE public.journey_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_leads DISABLE ROW LEVEL SECURITY;
