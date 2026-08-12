import { supabaseAdmin } from "../src/lib/supabase-admin";
import { getPackageBySlug } from "../src/lib/queries/packages";

async function testItineraryDaysQuery() {
  console.log("=== 1. FETCH ALL JOURNEYS FROM DB ===");
  const { data: journeys } = await supabaseAdmin
    .from("journeys")
    .select("id, slug, name");

  console.log(`Found ${journeys?.length || 0} journeys:`);
  for (const j of journeys || []) {
    console.log(`\n----------------------------------------`);
    console.log(`Journey: '${j.name}' | ID: ${j.id} | Slug: ${j.slug}`);

    // Query itinerary_days by UUID
    const { data: days, error: daysErr } = await supabaseAdmin
      .from("itinerary_days")
      .select("*")
      .eq("journey_id", j.id)
      .order("day_number", { ascending: true });

    console.log(`Direct query on 'itinerary_days' for journey_id=${j.id}: ${days?.length || 0} rows found`);
    if (days && days.length > 0) {
      for (const d of days) {
        console.log(`  - Day ${d.day_number}: ${d.title}`);
      }
    }

    // Query getPackageBySlug
    const pkg = await getPackageBySlug(j.slug);
    console.log(`getPackageBySlug('${j.slug}') itinerary_days count: ${pkg?.itinerary_days?.length || 0}`);
  }
}

testItineraryDaysQuery().catch(console.error);
