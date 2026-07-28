import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectExactDbRow() {
  console.log("=== INSPECTING EXACT DB ROW & STORAGE PATH ===");

  const { data: docs } = await supabase.from("package_documents").select("*");
  console.log("Database package_documents count:", docs?.length || 0);

  if (docs && docs.length > 0) {
    for (const d of docs) {
      console.log("--- DB RECORD ---");
      console.log("ID:", d.id);
      console.log("package_id:", d.package_id);
      console.log("file_url stored:", d.file_url);

      const rawPath = d.file_url;
      const cleanPath = rawPath.replace(/^itineraries\//, "");
      const { data: pubData } = supabase.storage.from("itineraries").getPublicUrl(cleanPath);

      console.log("Clean storage path:", cleanPath);
      console.log("Generated public URL:", pubData.publicUrl);
    }
  } else {
    console.log("No records in package_documents table. Scanning storage bucket for actual files...");
    const { data: journeys } = await supabase.from("journeys").select("id, name, slug");
    if (journeys) {
      for (const j of journeys) {
        // Search for folders under itineraries bucket
        const { data: files } = await supabase.storage.from("itineraries").list(`${j.slug}/itinerary`);
        if (files && files.length > 0) {
          console.log(`Found object in bucket under folder '${j.slug}/itinerary':`, files[0].name);
          const exactStoragePath = `${j.slug}/itinerary/${files[0].name}`;
          const { data: pubUrl } = supabase.storage.from("itineraries").getPublicUrl(exactStoragePath);
          console.log("Exact Storage Path:", exactStoragePath);
          console.log("Generated Public URL:", pubUrl.publicUrl);
        }
      }
    }
  }
}

inspectExactDbRow().catch(console.error);
