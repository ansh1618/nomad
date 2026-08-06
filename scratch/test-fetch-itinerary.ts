import { supabaseAdmin } from "../src/lib/supabase-admin";

async function testFixedQuery() {
  console.log("=== TESTING FIXED JOURNEYS QUERY ===");

  const slug = "udaipur";

  const { data: pkg, error } = await supabaseAdmin
    .from("journeys")
    .select("id, name, slug, hero_banner")
    .or(`slug.ilike.%${slug}%,name.ilike.%${slug}%`)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Query Error:", error.message);
  } else {
    console.log("✓ Successfully found journey record:", pkg);
  }
}

testFixedQuery().catch(console.error);
