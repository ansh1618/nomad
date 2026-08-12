import { supabaseAdmin } from "../src/lib/supabase-admin";

async function auditJourneyTables() {
  console.log("=== 1. FETCH ALL JOURNEYS ===");
  const { data: journeys } = await supabaseAdmin
    .from("journeys")
    .select("id, slug, name, itinerary, itinerary_days");
  
  console.log(`Found ${journeys?.length || 0} journeys in DB:`);
  for (const j of journeys || []) {
    console.log(`\n----------------------------------------`);
    console.log(`Journey ID: ${j.id}`);
    console.log(`Slug: ${j.slug}`);
    console.log(`Name: ${j.name}`);
    console.log(`itinerary column type/len: ${typeof j.itinerary} / ${Array.isArray(j.itinerary) ? j.itinerary.length : 'not array'}`);
    console.log(`itinerary_days column type/len: ${typeof j.itinerary_days} / ${Array.isArray(j.itinerary_days) ? j.itinerary_days.length : 'not array'}`);
    if (Array.isArray(j.itinerary) && j.itinerary.length > 0) {
      console.log(`Sample itinerary item:`, JSON.stringify(j.itinerary[0]));
    }
  }

  console.log("\n=== 2. CHECK FOR SEPARATE ITINERARY TABLES ===");
  const tablesToProbe = ["journey_itinerary", "package_itineraries", "itinerary_days", "package_itinerary"];
  for (const tbl of tablesToProbe) {
    try {
      const { data, error } = await supabaseAdmin.from(tbl as any).select("*").limit(5);
      if (error) {
        console.log(`Table '${tbl}': DOES NOT EXIST (${error.message})`);
      } else {
        console.log(`Table '${tbl}': EXISTS with ${data?.length} sample rows:`, JSON.stringify(data));
      }
    } catch (e) {
      console.log(`Table '${tbl}': Exception (${e})`);
    }
  }

  console.log("\n=== 3. FETCH ALL DEPARTURES ===");
  const { data: deps } = await supabaseAdmin
    .from("departures")
    .select("*");
  
  console.log(`Found ${deps?.length || 0} departures in 'departures' table:`);
  for (const d of deps || []) {
    console.log(`- ID: ${d.id} | journey_id: ${d.journey_id} | date: ${d.departure_date} | status: '${d.status}' | visible: ${d.is_visible} | cancelled: ${d.is_cancelled}`);
  }

  console.log("\n=== 4. CHECK FOR LEGACY TRIP_BATCHES TABLE ===");
  try {
    const { data: batches, error: bErr } = await supabaseAdmin.from("trip_batches").select("*");
    console.log(`trip_batches table: ${batches?.length || 0} rows, Error:`, bErr?.message);
    for (const b of batches || []) {
      console.log(`- Batch ID: ${b.id} | journey_id: ${b.journey_id} | date: ${b.departure_date} | status: '${b.status}'`);
    }
  } catch (e) {
    console.log("trip_batches table exception:", e);
  }
}

auditJourneyTables().catch(console.error);
