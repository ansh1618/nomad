import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../src/lib/supabase-admin";

async function setupUnifiedSchema() {
  console.log("=== 1. SETTING UP UNIFIED SCHEMAS ON SUPABASE ===");

  // Check if journey_documents table can be queried or created
  const { data: journeys } = await supabaseAdmin.from("journeys").select("id, name, slug");
  console.log("Found journeys count:", journeys?.length || 0);

  const udaipurJourney = journeys?.find(j => j.slug === "udaipur-weekend" || j.slug === "udaipur");

  console.log("Udaipur journey record:", udaipurJourney);

  console.log("\n=== 2. VERIFYING STORAGE OBJECT IN BUCKET 'itineraries' ===");
  const { data: storageFiles } = await supabaseAdmin.storage.from("itineraries").list("udaipur-weekend/itinerary");
  console.log("Files in udaipur-weekend/itinerary:", storageFiles);
}

setupUnifiedSchema().catch(console.error);
