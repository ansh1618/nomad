import { supabase } from "../src/lib/supabase";
import { supabaseAdmin } from "../src/lib/supabase-admin";

async function testAnonVsAdmin() {
  console.log("=== TESTING ANON CLIENT vs ADMIN CLIENT FOR DESTINATIONS ===");

  const slug = "mcleodganj";

  console.log("\n1. ANON CLIENT QUERY:");
  try {
    const { data: anonData, error: anonError } = await supabase
      .from("destinations")
      .select("*, journeys(id, slug, name, status)")
      .eq("slug", slug)
      .maybeSingle();
    console.log("Anon Result:", JSON.stringify(anonData, null, 2));
    console.log("Anon Error:", anonError);
  } catch (err) {
    console.error("Anon Exception:", err);
  }

  console.log("\n2. ADMIN CLIENT QUERY:");
  try {
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from("destinations")
      .select("*, journeys(id, slug, name, status)")
      .eq("slug", slug)
      .maybeSingle();
    console.log("Admin Result:", JSON.stringify(adminData, null, 2));
    console.log("Admin Error:", adminError);
  } catch (err) {
    console.error("Admin Exception:", err);
  }

  console.log("\n3. ANON CLIENT JOURNEYS QUERY FOR manali-weekend:");
  try {
    const { data: jAnon, error: jErr } = await supabase
      .from("journeys")
      .select("*, destinations(id, slug, name)")
      .eq("slug", "manali-weekend")
      .maybeSingle();
    console.log("Anon Journey Result:", JSON.stringify(jAnon, null, 2));
    console.log("Anon Journey Error:", jErr);
  } catch (err) {
    console.error("Anon Journey Exception:", err);
  }
}

testAnonVsAdmin().catch(console.error);
