import { supabaseAdmin } from "../src/lib/supabase-admin";

async function inspectBookingsCols() {
  const { data, error } = await supabaseAdmin.from("bookings").select("*").limit(1);
  console.log("Bookings error:", error);
  console.log("Bookings data:", data);
}

inspectBookingsCols().catch(console.error);
