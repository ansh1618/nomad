import { supabaseAdmin } from "../src/lib/supabase-admin";

async function probeSchema() {
  console.log("=== PROBING PACKAGES TABLE ===");
  const { data: pkgs, error: pkgErr } = await supabaseAdmin
    .from("packages")
    .select("id, slug, name, itinerary, itinerary_days, price");

  console.log(`Packages count: ${pkgs?.length || 0}, Error:`, pkgErr);
  if (pkgs && pkgs.length > 0) {
    for (const p of pkgs) {
      console.log(`- Pkg ID: ${p.id} | Slug: ${p.slug} | Name: ${p.name}`);
      console.log(`  Itinerary:`, JSON.stringify(p.itinerary || p.itinerary_days));
    }
  }

  console.log("\n=== PROBING DEPARTURES TABLE ===");
  const { data: deps, error: depErr } = await supabaseAdmin
    .from("departures")
    .select("*");

  console.log(`Departures count: ${deps?.length || 0}, Error:`, depErr);
  if (deps && deps.length > 0) {
    console.log("Sample departure row:", JSON.stringify(deps[0], null, 2));
  }
}

probeSchema().catch(console.error);
