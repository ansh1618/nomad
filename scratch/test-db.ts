import { supabaseAdmin } from "../src/lib/supabase-admin";

async function checkAllJourneys() {
  console.log("=== CHECKING ALL JOURNEYS IN DATABASE ===");
  const { data: journeys, error } = await supabaseAdmin
    .from("journeys")
    .select("id, name, slug, destination");

  if (error) {
    console.error("Error querying journeys:", error.message);
  } else {
    console.log("All Journeys in DB:", JSON.stringify(journeys, null, 2));
  }
}

checkAllJourneys().catch(console.error);
