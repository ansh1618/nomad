import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanMissingRecords() {
  console.log("=== COMPREHENSIVE STORAGE & DB CLEANUP ===");

  // 1. Storage bucket audit
  const { data: buckets } = await supabase.storage.listBuckets();
  const itinerariesBucket = buckets?.find(b => b.name === "itineraries");
  console.log("✓ Storage bucket used:", itinerariesBucket ? itinerariesBucket.name : "MISSING");

  // 2. Fetch all package_documents
  const { data: docs } = await supabase.from("package_documents").select("*");
  console.log("✓ Total DB records found:", docs?.length || 0);

  let brokenRecordsCount = 0;
  if (docs && docs.length > 0) {
    for (const doc of docs) {
      const storagePath = doc.file_url.includes("/itineraries/") 
        ? doc.file_url.split("/itineraries/").pop() || doc.file_url 
        : doc.file_url;

      // Verify object exists in storage
      const { data: fileBlob, error: downloadErr } = await supabase.storage
        .from("itineraries")
        .download(storagePath);

      if (downloadErr || !fileBlob) {
        console.log(`❌ Object missing in storage for DB record ID=${doc.id}, storage_path=${storagePath}. Removing broken DB record...`);
        await supabase.from("package_documents").delete().eq("id", doc.id);
        brokenRecordsCount++;
      } else {
        console.log(`✓ Valid record: ID=${doc.id}, storage_path=${storagePath}`);
      }
    }
  }

  console.log(`✓ Broken records removed: ${brokenRecordsCount}`);
}

cleanMissingRecords().catch(console.error);
