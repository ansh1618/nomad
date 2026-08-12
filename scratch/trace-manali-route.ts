import { supabaseAdmin } from "../src/lib/supabase-admin";
import { getDestinationBySlug, getJourneys } from "../src/lib/queries-client";

async function traceManali() {
  console.log("=== TRACING MANALI DESTINATION DATA FLOW ===");

  // 1. Direct Supabase Query
  const { data: dbDest, error: dbErr } = await supabaseAdmin
    .from("destinations")
    .select("*")
    .eq("slug", "manali")
    .single();

  console.log("1. Supabase raw destination for 'manali':", dbErr ? `ERROR: ${dbErr.message}` : dbDest);

  // 2. getDestinationBySlug client function
  const clientDest = await getDestinationBySlug("manali");
  console.log("2. getDestinationBySlug('manali') result:", clientDest);

  // 3. getJourneys client function
  const allJourneys = await getJourneys();
  console.log("3. Total journeys returned:", allJourneys.length);

  const matchedJourneys = allJourneys.filter((j: any) => {
    const destSlug = j.destinationSlug || j.destinations?.slug || j.destination_slug;
    const destId = j.destination_id || j.destinationId || j.destinations?.id;
    return (
      (destSlug && destSlug === "manali") ||
      (destId && destId === dbDest?.id) ||
      (j.slug && j.slug.includes("manali")) ||
      (j.name && j.name.toLowerCase().includes("manali"))
    );
  });

  console.log("4. Matched journeys for Manali:", matchedJourneys.map(j => ({ slug: j.slug, name: j.name, transport: j.transport })));

  console.log("=== END TRACE ===");
}

traceManali().catch(console.error);
