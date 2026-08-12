import { supabaseAdmin } from "../src/lib/supabase-admin";

async function testJourneysQuery() {
  console.log("=== TESTING JOURNEYS SELECT ===");

  const { data: d1, error: e1 } = await supabaseAdmin
    .from("journeys")
    .select("*")
    .eq("is_published", true);

  console.log("Basic journeys query result count:", d1?.length, e1?.message);

  const { data: d2, error: e2 } = await supabaseAdmin
    .from("journeys")
    .select(`
      *,
      destinations(id, slug, name, state, country, hero_image),
      itinerary_days(*)
    `)
    .eq("is_published", true);

  console.log("Joined journeys query result count:", d2?.length, e2?.message);
}

testJourneysQuery().catch(console.error);
