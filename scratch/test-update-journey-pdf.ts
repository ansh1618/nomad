import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testJourneyUpdate() {
  console.log("Testing journey PDF path update...");
  const { data: journeys, error } = await supabase
    .from("journeys")
    .select("id, name, slug, itinerary")
    .limit(1);

  if (error || !journeys || journeys.length === 0) {
    console.error("Error fetching journeys:", error?.message);
    return;
  }

  const j = journeys[0];
  console.log(`Found journey: ID=${j.id}, Name=${j.name}, Slug=${j.slug}`);

  // Test updating updated_at on journey
  const { error: updateErr } = await supabase
    .from("journeys")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", j.id);

  if (updateErr) {
    console.error("Journey update error:", updateErr.message);
  } else {
    console.log("✓ Successfully updated journey record!");
  }
}

testJourneyUpdate().catch(console.error);
