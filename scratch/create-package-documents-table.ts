import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPackageDocumentsTable() {
  console.log("=== CREATING PUBLIC.PACKAGE_DOCUMENTS TABLE IN SUPABASE ===");

  const sql = `
    CREATE TABLE IF NOT EXISTS public.package_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      package_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
      document_type TEXT NOT NULL DEFAULT 'ITINERARY',
      title TEXT NOT NULL,
      file_url TEXT NOT NULL,
      page_count INTEGER DEFAULT 14,
      size BIGINT DEFAULT 0,
      thumbnail_url TEXT,
      version INTEGER DEFAULT 1,
      is_active BOOLEAN DEFAULT true NOT NULL,
      allow_download BOOLEAN DEFAULT true NOT NULL,
      allow_print BOOLEAN DEFAULT true NOT NULL,
      allow_copy BOOLEAN DEFAULT true NOT NULL,
      watermark_enabled BOOLEAN DEFAULT true NOT NULL,
      uploaded_by UUID,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      CONSTRAINT unique_package_document UNIQUE (package_id, document_type)
    );

    ALTER TABLE public.package_documents ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Public: Read active package_documents" ON public.package_documents;
    CREATE POLICY "Public: Read active package_documents" ON public.package_documents FOR SELECT USING (is_active = true);

    DROP POLICY IF EXISTS "Admins & Service Role: Manage package_documents" ON public.package_documents;
    CREATE POLICY "Admins & Service Role: Manage package_documents" ON public.package_documents FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);
  `;

  // Use REST Endpoint or Pg connection via fetch
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({ sql })
  });

  console.log("Creation response status:", res.status);
  const text = await res.text();
  console.log("Creation response text:", text);
}

createPackageDocumentsTable().catch(console.error);
