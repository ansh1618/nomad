import { supabaseAdmin } from "../src/lib/supabase-admin";

async function auditManaliPackages() {
  console.log("=== AUDITING MANALI PACKAGES IN DATABASE ===");

  const { data: journeys, error } = await supabaseAdmin
    .from("journeys")
    .select("id, name, slug, starting_price, duration, status, is_published")
    .or("slug.ilike.%manali%,name.ilike.%manali%");

  if (error) {
    console.error("Error fetching journeys:", error.message);
  } else {
    console.log("Found Manali Journeys in DB:", JSON.stringify(journeys, null, 2));
  }
}

auditManaliPackages().catch(console.error);
