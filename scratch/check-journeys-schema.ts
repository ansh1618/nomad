import { supabase } from "../src/lib/supabase";

async function checkJourneysSchema() {
  console.log("=== CHECKING ACTUAL COLUMNS ON 'journeys' TABLE ===");
  const { data, error } = await supabase.from("journeys").select("*").limit(1);
  if (error) {
    console.error("Error fetching journeys:", error.message);
  } else if (data && data.length > 0) {
    console.log("Existing columns on 'journeys' table:");
    console.log(Object.keys(data[0]));
  }
}

checkJourneysSchema().catch(console.error);
