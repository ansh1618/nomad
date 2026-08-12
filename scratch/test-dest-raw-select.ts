import { supabase } from "../src/lib/supabase";

async function testRawDestSelect() {
  console.log("=== TESTING WITH DESTINATIONS_SELECT (WITH RELATIONAL JOIN) ===");
  const { data: d1, error: e1 } = await supabase
    .from("destinations")
    .select("*, journeys(id, slug, name, starting_price, duration, difficulty, status, is_published)")
    .eq("slug", "jibhi")
    .maybeSingle();

  console.log("Result 1:", d1 ? `FOUND (${d1.name})` : "NULL", "Error 1:", e1);

  console.log("\n=== TESTING WITH SIMPLE SELECT (*) ===");
  const { data: d2, error: e2 } = await supabase
    .from("destinations")
    .select("*")
    .eq("slug", "jibhi")
    .maybeSingle();

  console.log("Result 2:", d2 ? `FOUND (${d2.name})` : "NULL", "Error 2:", e2);
}

testRawDestSelect().catch(console.error);
