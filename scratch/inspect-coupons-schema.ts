import { supabase } from "../src/lib/supabase";

async function main() {
  console.log("Checking coupons table...");
  const { data: coupons, error: cErr } = await supabase.from("coupons").select("*").limit(5);
  console.log("Coupons error:", cErr);
  console.log("Coupons sample:", coupons);

  console.log("Checking coupon_usages table...");
  const { data: usages, error: uErr } = await supabase.from("coupon_usages").select("*").limit(5);
  console.log("Coupon Usages error:", uErr);
  console.log("Coupon Usages sample:", usages);

  console.log("Checking coupon_redemptions table...");
  const { data: redemptions, error: rErr } = await supabase.from("coupon_redemptions").select("*").limit(5);
  console.log("Coupon Redemptions error:", rErr);
  console.log("Coupon Redemptions sample:", redemptions);
}

main().catch(console.error);
