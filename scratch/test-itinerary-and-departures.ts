import { supabase } from "../src/lib/supabase";
import { supabaseAdmin } from "../src/lib/supabase-admin";

async function testItineraryAndDepartures() {
  console.log("=== 1. FETCH ALL JOURNEYS FROM DB ===");
  const { data: journeys, error: jErr } = await supabaseAdmin
    .from("journeys")
    .select("id, slug, name, itinerary, itinerary_days, is_published");

  console.log(`Found ${journeys?.length || 0} journeys:`);
  for (const j of journeys || []) {
    console.log(`\n- ID: ${j.id} | Slug: ${j.slug} | Name: ${j.name}`);
    console.log(`  Itinerary field type: ${typeof j.itinerary} | length: ${Array.isArray(j.itinerary) ? j.itinerary.length : 'not array'}`);
    console.log(`  Itinerary_days field type: ${typeof j.itinerary_days} | length: ${Array.isArray(j.itinerary_days) ? j.itinerary_days.length : 'not array'}`);
    if (Array.isArray(j.itinerary) && j.itinerary.length > 0) {
      console.log(`  Itinerary sample:`, JSON.stringify(j.itinerary[0]));
    }
  }

  console.log("\n=== 2. FETCH ALL DEPARTURES FROM DB ===");
  const { data: departures, error: depErr } = await supabaseAdmin
    .from("departures")
    .select("*");
  
  console.log(`Found ${departures?.length || 0} departures:`);
  for (const d of departures || []) {
    console.log(`- ID: ${d.id} | JourneyID: ${d.journey_id || d.package_id} | Start: ${d.start_date} | Status: ${d.status} | Seats: ${d.remaining_seats}`);
  }
}

testItineraryAndDepartures().catch(console.error);
