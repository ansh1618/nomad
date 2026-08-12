import { supabaseAdmin } from "../src/lib/supabase-admin";

async function detailedSchemaCheck() {
  // Query information_schema via RPC or raw select if possible, or try selecting specific expected fields
  const { data, error } = await supabaseAdmin.from('reviews').select('*').limit(10);
  console.log("Reviews rows count:", data?.length);
  if (data && data.length > 0) {
    console.log("Sample review object:", data[0]);
  } else {
    // Try fetching with explicit columns or check error
    console.log("Error or empty reviews:", error);
  }

  // Check bookings table for reference
  const { data: bookings } = await supabaseAdmin.from('bookings').select('id, status, journey_id, user_id').limit(2);
  console.log("Sample bookings:", bookings);
}

detailedSchemaCheck().catch(console.error);
