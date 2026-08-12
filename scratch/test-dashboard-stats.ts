import { supabase } from "../src/lib/supabase";

async function testDashboardStats() {
  console.log("=== TESTING v_dashboard_stats QUERY WITH ANON CLIENT ===");
  const { data, error } = await supabase.from("v_dashboard_stats").select("*").maybeSingle();
  console.log("v_dashboard_stats Result:", data, "Error:", error);

  console.log("\n=== TESTING v_monthly_revenue QUERY WITH ANON CLIENT ===");
  const { data: mData, error: mErr } = await supabase.from("v_monthly_revenue").select("*");
  console.log("v_monthly_revenue Result:", mData, "Error:", mErr);
}

testDashboardStats().catch(console.error);
