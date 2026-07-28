import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertUdaipurRecord() {
  console.log("=== LINKING UPLOADED STORAGE OBJECT TO PACKAGE DOCUMENTS TABLE ===");

  const { data: journeys } = await supabase.from("journeys").select("id, name, slug").or("slug.eq.udaipur-weekend,slug.eq.udaipur-royal-weekend");
  console.log("Found journeys:", journeys);

  if (journeys && journeys.length > 0) {
    for (const j of journeys) {
      const storagePath = `udaipur-weekend/itinerary/1785262528899-UDAIPUR_NOMADIK__1___1_.pdf`;
      const { data: inserted, error: insErr } = await supabase
        .from("package_documents")
        .upsert({
          package_id: j.id,
          document_type: "ITINERARY",
          title: "Udaipur Royal Weekend Official Itinerary",
          file_url: storagePath,
          size: 22250000,
          page_count: 14,
          is_active: true,
          allow_download: true,
          allow_print: true,
          allow_copy: true,
          watermark_enabled: true
        }, { onConflict: "package_id,document_type" })
        .select();

      if (insErr) {
        console.error(`Insert error for journey ${j.slug}:`, insErr.message);
      } else {
        console.log(`✓ Linked package ${j.slug} -> storage_path: ${storagePath}`);
      }
    }
  }
}

insertUdaipurRecord().catch(console.error);
