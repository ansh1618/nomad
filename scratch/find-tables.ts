import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findTables() {
  console.log("=== INSPECTING EXISTING TABLES IN SUPABASE SCHEMA ===");

  const tablesToTest = [
    "package_documents",
    "itinerary_documents",
    "premium_itineraries",
    "journey_documents",
    "journeys",
    "itinerary_pdfs",
    "documents"
  ];

  for (const table of tablesToTest) {
    const { data, error } = await supabase.from(table).select("*").limit(1);
    if (error) {
      console.log(`❌ Table '${table}': ${error.message}`);
    } else {
      console.log(`✓ Table '${table}' EXISTS! Row count check: ${data?.length || 0}`);
    }
  }
}

findTables().catch(console.error);
