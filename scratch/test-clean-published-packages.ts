import { supabase } from "../src/lib/supabase";

async function testCleanPublishedPackages() {
  console.log("=== TESTING CLEAN getPublishedPackages QUERY ===");
  const { data, error } = await supabase
    .from('journeys')
    .select('*, destinations(id, slug, name, state, country, hero_image), itinerary_days(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("❌ ERROR:", error.message, error.details);
  } else {
    console.log(`✅ SUCCESS! ${data?.length || 0} journeys fetched with destinations and itinerary_days!`);
    for (const j of data || []) {
      console.log(`- '${j.name}' | Slug: '${j.slug}' | Destination: '${j.destinations?.name || 'none'}' | Days: ${j.itinerary_days?.length || 0}`);
    }
  }
}

testCleanPublishedPackages().catch(console.error);
