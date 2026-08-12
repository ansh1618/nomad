import { supabase } from "../src/lib/supabase";
import { supabaseAdmin } from "../src/lib/supabase-admin";

async function testDeparturesQuery() {
  console.log("=== 1. TESTING COMPLEX JOIN QUERY ON 'departures' ===");
  const DEPARTURE_SELECT = `
    *,
    journeys(id, slug, name, starting_price, duration, hero_banner),
    trip_captains(id, full_name, photo_url, phone),
    buses(id, name, registration_number, bus_type, total_seats),
    hotels(id, name, star_rating, city),
    departure_rooms(
      id, allocated_count, price_override,
      hotel_rooms(id, room_type, sharing_type, capacity, price_modifier)
    ),
    pricing_tiers(*)
  `;

  const { data: d1, error: e1 } = await supabaseAdmin
    .from("departures")
    .select(DEPARTURE_SELECT, { count: "exact" })
    .range(0, 19);

  console.log("Complex Join Error:", e1?.message, e1?.details, e1?.hint);
  console.log("Complex Join Data Count:", d1?.length || 0);

  console.log("\n=== 2. TESTING SIMPLE QUERY ON 'departures' ===");
  const SIMPLE_SELECT = `
    *,
    journeys(id, slug, name, starting_price, duration, hero_banner)
  `;

  const { data: d2, error: e2 } = await supabaseAdmin
    .from("departures")
    .select(SIMPLE_SELECT, { count: "exact" })
    .range(0, 19);

  console.log("Simple Query Error:", e2?.message);
  console.log("Simple Query Data Count:", d2?.length || 0);
}

testDeparturesQuery().catch(console.error);
