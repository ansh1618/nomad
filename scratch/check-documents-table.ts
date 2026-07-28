import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDocsTable() {
  console.log("=== CHECKING PACKAGE DOCUMENTS TABLE ===");

  // 1. Direct select from package_documents
  const { data: rawDocs, error: rawError } = await supabase
    .from("package_documents")
    .select("*");

  console.log("Raw package_documents error:", rawError?.message || "None");
  console.log("Raw package_documents count:", rawDocs?.length || 0);
  if (rawDocs && rawDocs.length > 0) {
    console.log("Raw package_documents rows:", rawDocs);
  }

  // 2. Select with join journeys
  const { data: joinDocs, error: joinError } = await supabase
    .from("package_documents")
    .select("*, journeys(id, name, slug)");

  console.log("Join package_documents error:", joinError?.message || "None");
  console.log("Join package_documents count:", joinDocs?.length || 0);

  // 3. Check storage files in itineraries bucket
  const { data: storageFiles } = await supabase.storage.from("itineraries").list("", { limit: 100 });
  console.log("Storage files in 'itineraries' root:", storageFiles?.map(f => f.name));
}

checkDocsTable().catch(console.error);
