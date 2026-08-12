import { supabaseAdmin } from "../src/lib/supabase-admin";

async function auditAll() {
  console.log("=== FULL AUDIT OF SUPABASE DESTINATIONS & JOURNEYS ===");

  const { data: dests, error: dErr } = await supabaseAdmin
    .from("destinations")
    .select("id, slug, name, is_published, hero_image");

  console.log("All Destinations in DB:", dErr ? `Error: ${dErr.message}` : JSON.stringify(dests, null, 2));

  const { data: journeys, error: jErr } = await supabaseAdmin
    .from("journeys")
    .select("id, slug, name, destination_id, is_published, status, destinations(id, slug, name)");

  console.log("All Journeys in DB:", jErr ? `Error: ${jErr.message}` : JSON.stringify(journeys, null, 2));
}

auditAll().catch(console.error);
