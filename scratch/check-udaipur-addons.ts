import { supabaseAdmin } from "../src/lib/supabase-admin";

async function checkUdaipurJourney() {
  console.log("=== CHECKING UDAIPUR JOURNEY DB ROW ===");
  const { data, error } = await supabaseAdmin
    .from('journeys')
    .select('*')
    .eq('slug', 'udaipur-weekend')
    .single();

  if (error) {
    console.error("Fetch error:", error.message);
  } else {
    console.log("Udaipur journey details:");
    console.log("Inclusions:", data.inclusions);
    console.log("Exclusions:", data.exclusions);
    console.log("Transport:", data.transport);

    // If exclusions mention river rafting, clean it up
    if (data.exclusions && Array.isArray(data.exclusions)) {
      const cleaned = data.exclusions.map((e: string) => 
        e.replace(/,\s*River Rafting/gi, "").replace(/River Rafting,\s*/gi, "").replace(/River Rafting/gi, "Boat Rides")
      );

      await supabaseAdmin
        .from('journeys')
        .update({ exclusions: cleaned })
        .eq('id', data.id);
      console.log("✓ Cleaned exclusions for Udaipur in DB!");
    }
  }
}

checkUdaipurJourney().catch(console.error);
