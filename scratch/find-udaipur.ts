import { supabaseAdmin } from "../src/lib/supabase-admin";

async function findUdaipur() {
  const { data: journeys } = await supabaseAdmin
    .from("journeys")
    .select("id, name, slug")
    .ilike("name", "%udaipur%");

  console.log("Udaipur Journeys:", journeys);

  const { data: departures } = await supabaseAdmin
    .from("departures")
    .select("id, journey_id, departure_date, price")
    .order("departure_date", { ascending: true })
    .limit(10);

  console.log("Sample Departures:", departures);
}

findUdaipur().catch(console.error);
