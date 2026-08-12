import { supabase } from "../src/lib/supabase";

async function testJourneysSelect400() {
  console.log("=== TESTING JOURNEYS QUERIES FOR HTTP 400 ERRORS ===");

  const queriesToTest = [
    {
      name: "1. JOURNEY_LIST_SELECT from packages.ts",
      select: "id, slug, name, duration, duration_days, duration_nights, starting_price, price, hero_banner, status, is_featured, is_popular, is_upcoming, priority, destination_id, destinations(id, slug, name, hero_image, state, country)"
    },
    {
      name: "2. JOURNEY_SELECT from packages.ts",
      select: "*, destinations(id, slug, name, state, country, hero_image), itinerary_days(*)"
    },
    {
      name: "3. journeys-client.ts queries",
      select: "*, destinations(*)"
    },
    {
      name: "4. queries-client.ts queries",
      select: "*, destination:destinations(*)"
    },
    {
      name: "5. journeys table with destinations relation",
      select: "id, slug, name, destination_id, destinations(id, slug, name)"
    }
  ];

  for (const q of queriesToTest) {
    console.log(`\nTesting ${q.name}...`);
    const { data, error } = await supabase.from("journeys").select(q.select).limit(2);
    if (error) {
      console.log(`❌ ERROR on ${q.name}:`, error.message, "| Details:", error.details, "| Hint:", error.hint, "| Code:", error.code);
    } else {
      console.log(`✅ SUCCESS on ${q.name}. Rows returned: ${data?.length || 0}`);
    }
  }
}

testJourneysSelect400().catch(console.error);
