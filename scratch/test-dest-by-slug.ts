import { getDestinationBySlug, getDestinations } from "../src/lib/queries-client";
import { supabaseAdmin } from "../src/lib/supabase-admin";

async function testDestBySlug() {
  console.log("=== 1. FETCH ALL DESTINATIONS FROM DB VIA ADMIN ===");
  const { data: dests, error } = await supabaseAdmin.from("destinations").select("id, slug, name, is_published");
  console.log(`Found ${dests?.length || 0} destinations in DB:`, dests);

  console.log("\n=== 2. TEST getDestinationBySlug FOR EACH SLUG ===");
  const testSlugs = ["jibhi", "mcleodganj", "chopta", "manali", "udaipur", "kasol"];
  for (const s of testSlugs) {
    try {
      const res = await getDestinationBySlug(s);
      console.log(`Slug '${s}': ${res ? `FOUND (name: ${res.name}, id: ${(res as any).id})` : 'NOT FOUND'}`);
    } catch (err) {
      console.error(`Error for slug '${s}':`, err);
    }
  }
}

testDestBySlug().catch(console.error);
