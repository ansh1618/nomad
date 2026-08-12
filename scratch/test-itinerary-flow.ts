import { supabase } from "../src/lib/supabase";

async function testItineraryFlow() {
  console.log("=== 1. FETCHING ALL JOURNEYS ===");
  const { data: journeys, error: jErr } = await supabase
    .from("journeys")
    .select("id, slug, name, itinerary, status")
    .limit(10);

  console.log(`Found ${journeys?.length || 0} journeys:`);
  for (const j of journeys || []) {
    console.log(`\nJourney: '${j.name}' | Slug: '${j.slug}' | ID: '${j.id}'`);
    console.log("  Column 'journeys.itinerary':", j.itinerary);

    // Fetch itinerary_days table for this journey
    const { data: days, error: dErr } = await supabase
      .from("itinerary_days")
      .select("*")
      .eq("journey_id", j.id)
      .order("day_number", { ascending: true });

    console.log(`  Table 'itinerary_days' count for ID '${j.id}': ${days?.length || 0}`);
    if (days && days.length > 0) {
      console.log("  Sample day 1:", days[0]);
    }
  }
}

testItineraryFlow().catch(console.error);
