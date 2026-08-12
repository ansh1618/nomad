import { supabaseAdmin } from "../src/lib/supabase-admin";

async function checkEnum() {
  const { data: b } = await supabaseAdmin.from("bookings").select("payment_status").limit(5);
  console.log("Sample booking payment_status values:", b);
}

checkEnum().catch(console.error);
