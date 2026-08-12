import { supabaseAdmin } from "../src/lib/supabase-admin";

async function auditDestinations() {
  console.log("=== AUDITING ALL DESTINATIONS ===");

  const { data: destinations, error } = await supabaseAdmin
    .from("destinations")
    .select("id, name, slug, hero_image, is_published");

  if (error) {
    console.error("Error fetching destinations:", error.message);
  } else {
    console.log("All Destinations in DB:", JSON.stringify(destinations, null, 2));
  }
}

auditDestinations().catch(console.error);
