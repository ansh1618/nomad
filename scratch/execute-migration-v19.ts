import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeMigration() {
  console.log("=== EXECUTING MIGRATION V19 FOR PREMIUM DOCUMENTS ===");

  const sqlStatements = [
    `CREATE TABLE IF NOT EXISTS public.package_documents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      package_id uuid NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
      document_type text NOT NULL,
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
      uploaded_by uuid,
      created_at timestamptz DEFAULT now() NOT NULL,
      updated_at timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT unique_package_document UNIQUE (package_id, document_type)
    );`,
    `CREATE INDEX IF NOT EXISTS idx_package_docs_package_id ON public.package_documents(package_id);`,
    `CREATE INDEX IF NOT EXISTS idx_package_docs_type ON public.package_documents(document_type);`,
    `CREATE TABLE IF NOT EXISTS public.pdf_views (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid,
      package_id uuid NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
      document_id uuid NOT NULL REFERENCES public.package_documents(id) ON DELETE CASCADE,
      viewed_at timestamptz DEFAULT now() NOT NULL,
      last_page_viewed integer DEFAULT 1 NOT NULL,
      max_page_reached integer DEFAULT 1 NOT NULL,
      progress_percent integer DEFAULT 0 NOT NULL,
      reading_time integer DEFAULT 0 NOT NULL,
      completed_at timestamptz,
      is_bounce boolean DEFAULT true NOT NULL,
      is_returning boolean DEFAULT false NOT NULL,
      ip_address text,
      device text,
      browser text,
      download_count integer DEFAULT 0 NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS public.itinerary_leads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL,
      phone text,
      package_id uuid NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
      city text,
      source text DEFAULT 'Premium PDF' NOT NULL,
      created_at timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT unique_itinerary_lead UNIQUE (email, package_id)
    );`,
    `ALTER TABLE public.package_documents DISABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE public.pdf_views DISABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE public.itinerary_leads DISABLE ROW LEVEL SECURITY;`
  ];

  for (const query of sqlStatements) {
    const { error } = await supabase.rpc('exec_sql', { sql: query }).catch(() => ({ error: { message: "rpc missing" } }));
    if (error) {
      console.log("Notice: SQL execution result:", error.message);
    }
  }

  // Try fetching table directly
  const { data, error } = await supabase.from("package_documents").select("*");
  if (error) {
    console.log("Table check error:", error.message);
  } else {
    console.log("✓ package_documents table successfully created and accessible! Count:", data?.length || 0);
  }
}

executeMigration().catch(console.error);
