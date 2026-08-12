import { supabase } from "../src/lib/supabase";

async function testAnonAllTables() {
  console.log("=== TESTING ALL TABLES WITH ANON CLIENT ===");

  const tables = [
    "departures",
    "bookings",
    "journeys",
    "destinations",
    "users",
    "profiles",
    "inquiries",
    "buses",
    "hotels",
    "reviews",
    "banners",
    "settings",
    "v_dashboard_stats",
    "v_monthly_revenue"
  ];

  for (const t of tables) {
    console.time(t);
    const { data, error } = await supabase.from(t).select("*").limit(1);
    console.timeEnd(t);
    if (error) {
      console.log(`❌ Table '${t}' ERROR:`, error.message);
    } else {
      console.log(`✅ Table '${t}' SUCCESS: ${data?.length || 0} row(s)`);
    }
  }
}

testAnonAllTables().catch(console.error);
