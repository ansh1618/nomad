import { supabase } from "../src/lib/supabase";

async function inspectDb() {
  console.log("=== INSPECTING DB DESTINATIONS & JOURNEYS ===");

  const { data: destinations, error: dErr } = await supabase
    .from("destinations")
    .select("id, slug, name, hero_image, is_published, status");

  console.log("Destinations in DB:", dErr ? `Error: ${dErr.message}` : JSON.stringify(destinations, null, 2));

  const { data: journeys, error: jErr } = await supabase
    .from("journeys")
    .select("id, slug, name, destination_id, destinations(id, slug, name), is_published, status");

  console.log("Journeys in DB:", jErr ? `Error: ${jErr.message}` : JSON.stringify(journeys, null, 2));
}

inspectDb().catch(console.error);
