import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectLatestPdf() {
  console.log("=== INSPECTING LATEST UPLOADED PREMIUM DOCUMENTS ===");

  // 1. Query package_documents
  const { data: docs, error: docErr } = await supabase
    .from("package_documents")
    .select("*, journeys(id, name, slug)")
    .order("created_at", { ascending: false });

  console.log("Database package_documents count:", docs?.length || 0);
  if (docs && docs.length > 0) {
    for (const d of docs) {
      console.log(`Document ID: ${d.id}`);
      console.log(`Title: ${d.title}`);
      console.log(`Package ID: ${d.package_id}`);
      console.log(`Journey Name: ${d.journeys?.name}`);
      console.log(`Journey Slug: ${d.journeys?.slug}`);
      console.log(`Stored file_url: ${d.file_url}`);
      
      const storagePath = d.file_url.includes("/itineraries/") 
        ? d.file_url.split("/itineraries/").pop() || d.file_url 
        : d.file_url;
      console.log(`Derived Storage Path: ${storagePath}`);

      const { data: urlData } = supabase.storage
        .from("itineraries")
        .getPublicUrl(storagePath);
      console.log(`Generated Public URL: ${urlData?.publicUrl}`);

      // Verify object exists in storage
      const { data: fileBlob, error: downloadErr } = await supabase.storage
        .from("itineraries")
        .download(storagePath);
      console.log(`Storage file blob check: ${fileBlob ? `EXISTS (${fileBlob.size} bytes)` : `MISSING (${downloadErr?.message})`}`);
      console.log("---");
    }
  }

  // 2. Storage files in bucket
  const { data: journeys } = await supabase.from("journeys").select("slug");
  if (journeys) {
    for (const j of journeys) {
      const { data: files } = await supabase.storage.from("itineraries").list(`${j.slug}/itinerary`);
      if (files && files.length > 0) {
        console.log(`Found files in storage folder '${j.slug}/itinerary':`, files.map(f => f.name));
      }
    }
  }
}

inspectLatestPdf().catch(console.error);
