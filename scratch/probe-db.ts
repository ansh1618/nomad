import { supabaseAdmin } from "../src/lib/supabase-admin";

async function probe() {
  console.log("Probing RLS & RPC...");
  const { data: coupons, error } = await supabaseAdmin.from("coupons").select("*");
  console.log("All coupons count:", coupons?.length, error);

  // Check if coupon_usages table can be queried or if error returns hint
  const { data: usages, error: uErr } = await supabaseAdmin.from("coupon_usages").select("*");
  console.log("Usages query result:", { usages, uErr });
}

probe().catch(console.error);
