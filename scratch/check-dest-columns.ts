import { supabaseAdmin } from "../src/lib/supabase-admin";

async function checkDestColumns() {
  const { data, error } = await supabaseAdmin.from("destinations").select("*").limit(1);
  if (error) {
    console.error("Destinations query error:", error.message);
  } else if (data && data.length > 0) {
    console.log("Destinations columns:", Object.keys(data[0]));
  }
}

checkDestColumns().catch(console.error);
