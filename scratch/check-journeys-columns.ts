import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkJourneys() {
  console.log("=== CHECKING JOURNEYS TABLE SCHEMA & DATA ===");
  const { data: journeys, error } = await supabase.from("journeys").select("*").limit(3);
  if (error) {
    console.error("Journeys table error:", error.message);
  } else if (journeys && journeys.length > 0) {
    console.log("Journeys columns:", Object.keys(journeys[0]));
  }

  // Check if we can add a column or store PDF details in journeys
  const { data: files } = await supabase.storage.from("itineraries").list("", { limit: 100 });
  console.log("Itineraries storage files count:", files?.length || 0);
}

checkJourneys().catch(console.error);
