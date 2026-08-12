import { getUpcomingDepartures } from "../src/lib/queries/departures";
import { supabaseAdmin } from "../src/lib/supabase-admin";

async function testUpcomingDeps() {
  console.log("=== TESTING getUpcomingDepartures ===");
  
  // 1. Get first journey ID from DB
  const { data: jList } = await supabaseAdmin.from("journeys").select("id, name, slug");
  console.log("Found Journeys:", jList);

  if (jList && jList.length > 0) {
    for (const j of jList) {
      console.log(`\nTesting getUpcomingDepartures for journey '${j.name}' (ID: ${j.id}, slug: ${j.slug}):`);
      try {
        const deps = await getUpcomingDepartures(j.id);
        console.log(`Result count: ${deps.length}`);
        if (deps.length > 0) {
          console.log(`Sample dep:`, JSON.stringify(deps[0], null, 2));
        }
      } catch (err) {
        console.error("Error fetching departures:", err);
      }
    }
  }
}

testUpcomingDeps().catch(console.error);
