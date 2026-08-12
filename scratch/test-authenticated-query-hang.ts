import { supabase } from "../src/lib/supabase";

async function testAuthenticatedQueryHang() {
  console.log("=== 1. LOGGING IN AS ADMIN USER 'anshjee2024aspirant@gmail.com' ===");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: "anshjee2024aspirant@gmail.com",
    password: "Password123!" // test password
  });

  console.log("Auth result error:", authErr?.message);
  console.log("Auth user ID:", authData?.user?.id);

  if (authData?.user) {
    console.log("\n=== 2. TESTING AUTHENTICATED DEPARTURES QUERY ===");
    console.time("Departures Query");
    const { data: deps, error: depsErr } = await supabase
      .from("departures")
      .select("*")
      .limit(1);
    console.timeEnd("Departures Query");
    console.log("Departures Data:", deps, "Error:", depsErr);

    console.log("\n=== 3. TESTING AUTHENTICATED BOOKINGS QUERY ===");
    console.time("Bookings Query");
    const { data: bks, error: bksErr } = await supabase
      .from("bookings")
      .select("*")
      .limit(1);
    console.timeEnd("Bookings Query");
    console.log("Bookings Data:", bks, "Error:", bksErr);

    console.log("\n=== 4. TESTING AUTHENTICATED DASHBOARD STATS QUERY ===");
    console.time("Stats Query");
    const { data: st, error: stErr } = await supabase
      .from("v_dashboard_stats")
      .select("*")
      .maybeSingle();
    console.timeEnd("Stats Query");
    console.log("Stats Data:", st, "Error:", stErr);
  }
}

testAuthenticatedQueryHang().catch(console.error);
