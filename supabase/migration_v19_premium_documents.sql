-- ============================================================
-- Migration v19: Premium Document Management System
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create package_documents table
CREATE TABLE IF NOT EXISTS public.package_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  document_type text NOT NULL, -- e.g., 'ITINERARY', 'PACKING', 'GUIDE', 'TERMS', 'OTHER', 'VOUCHER', 'INVOICE'
  title text NOT NULL,
  file_url text NOT NULL,
  page_count integer DEFAULT 0,
  size bigint DEFAULT 0,
  thumbnail_url text,
  version integer DEFAULT 1,
  is_active boolean DEFAULT true NOT NULL,
  allow_download boolean DEFAULT true NOT NULL,
  allow_print boolean DEFAULT true NOT NULL,
  allow_copy boolean DEFAULT true NOT NULL,
  watermark_enabled boolean DEFAULT true NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_package_document UNIQUE (package_id, document_type)
);

-- Index for querying documents by package
CREATE INDEX IF NOT EXISTS idx_package_docs_package_id ON public.package_documents(package_id);
CREATE INDEX IF NOT EXISTS idx_package_docs_type ON public.package_documents(document_type);

-- 2. Create pdf_views table (analytics)
CREATE TABLE IF NOT EXISTS public.pdf_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  package_id uuid NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.package_documents(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now() NOT NULL,
  last_page_viewed integer DEFAULT 1 NOT NULL,
  max_page_reached integer DEFAULT 1 NOT NULL,
  progress_percent integer DEFAULT 0 NOT NULL,
  reading_time integer DEFAULT 0 NOT NULL, -- in seconds
  completed_at timestamptz,
  is_bounce boolean DEFAULT true NOT NULL,
  is_returning boolean DEFAULT false NOT NULL,
  ip_address text,
  device text,
  browser text,
  download_count integer DEFAULT 0 NOT NULL
);

-- Index for analytics aggregation
CREATE INDEX IF NOT EXISTS idx_pdf_views_document_id ON public.pdf_views(document_id);
CREATE INDEX IF NOT EXISTS idx_pdf_views_user_id ON public.pdf_views(user_id);

-- 3. Create itinerary_leads table (lead capture)
CREATE TABLE IF NOT EXISTS public.itinerary_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  phone text,
  package_id uuid NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  city text,
  source text DEFAULT 'Premium PDF' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_itinerary_lead UNIQUE (email, package_id)
);

CREATE INDEX IF NOT EXISTS idx_itinerary_leads_package ON public.itinerary_leads(package_id);

-- 4. Enable Row Level Security
ALTER TABLE public.package_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_leads ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies for package_documents
DROP POLICY IF EXISTS "Public: Read active package_documents" ON public.package_documents;
CREATE POLICY "Public: Read active package_documents" 
  ON public.package_documents 
  FOR SELECT 
  USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admins: Full access to package_documents" ON public.package_documents;
CREATE POLICY "Admins: Full access to package_documents" 
  ON public.package_documents 
  FOR ALL 
  USING (is_admin()) 
  WITH CHECK (is_admin());

-- 6. Define RLS Policies for pdf_views
DROP POLICY IF EXISTS "Users: Insert own pdf_views" ON public.pdf_views;
CREATE POLICY "Users: Insert own pdf_views" 
  ON public.pdf_views 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users: Update own pdf_views" ON public.pdf_views;
CREATE POLICY "Users: Update own pdf_views" 
  ON public.pdf_views 
  FOR UPDATE 
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Admins: Read all pdf_views" ON public.pdf_views;
CREATE POLICY "Admins: Read all pdf_views" 
  ON public.pdf_views 
  FOR SELECT 
  USING (is_admin());

-- 7. Define RLS Policies for itinerary_leads
DROP POLICY IF EXISTS "Public: Insert itinerary_leads" ON public.itinerary_leads;
CREATE POLICY "Public: Insert itinerary_leads" 
  ON public.itinerary_leads 
  FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins: Full access to itinerary_leads" ON public.itinerary_leads;
CREATE POLICY "Admins: Full access to itinerary_leads" 
  ON public.itinerary_leads 
  FOR ALL 
  USING (is_admin());

-- 8. Setup Private Storage Bucket 'itineraries' if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('itineraries', 'itineraries', false, 31457280, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = 31457280,
  allowed_mime_types = ARRAY['application/pdf'];

-- Storage Policies for 'itineraries' bucket
DROP POLICY IF EXISTS "Authenticated users can read itineraries" ON storage.objects;
CREATE POLICY "Authenticated users can read itineraries"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'itineraries');

DROP POLICY IF EXISTS "Admins can manage itineraries" ON storage.objects;
CREATE POLICY "Admins can manage itineraries"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'itineraries' AND public.is_admin());

-- Trigger for updated_at on package_documents
DROP TRIGGER IF EXISTS handle_updated_at ON public.package_documents;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.package_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper function to atomically increment download count
CREATE OR REPLACE FUNCTION public.increment_pdf_download_count(view_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.pdf_views
  SET download_count = download_count + 1
  WHERE id = view_id;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.increment_pdf_download_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_pdf_download_count(uuid) TO anon;

