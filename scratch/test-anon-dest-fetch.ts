import { supabase } from "../src/lib/supabase";
import { getDestinationBySlug } from "../src/lib/queries/destinations";

async function testAnonDestFetch() {
  console.log("=== TESTING PUBLIC ANON CLIENT FETCH FOR 'jibhi' ===");
  try {
    const d1 = await getDestinationBySlug("jibhi");
    console.log("getDestinationBySlug('jibhi') result:", d1 ? `FOUND (${d1.name})` : "NULL");
  } catch (err) {
    console.error("getDestinationBySlug error:", err);
  }

  console.log("\n=== TESTING PUBLIC ANON CLIENT FETCH FOR ALL SLUGS ===");
  for (const s of ["jibhi", "mcleodganj", "chopta", "manali", "udaipur", "kasol"]) {
    try {
      const d = await getDestinationBySlug(s);
      console.log(`Slug '${s}': ${d ? `FOUND (${d.name})` : 'NULL'}`);
    } catch (err) {
      console.error(`Error for slug '${s}':`, err);
    }
  }
}

testAnonDestFetch().catch(console.error);
