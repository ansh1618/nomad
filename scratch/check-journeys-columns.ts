import { supabaseAdmin } from "../src/lib/supabase-admin";

async function checkJourneyColumns() {
  const { data, error } = await supabaseAdmin.from("journeys").select("*").limit(1);
  if (error) {
    console.error("Journeys query error:", error.message);
  } else if (data && data.length > 0) {
    console.log("Valid columns on journeys table:", Object.keys(data[0]));
  }
}

checkJourneyColumns().catch(console.error);
