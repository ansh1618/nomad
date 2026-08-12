import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function testJwtVsAnon() {
  console.log("=== 1. TESTING ANON CLIENT (UNAUTHENTICATED) ===");
  const anonClient = createClient(url, anonKey);
  console.time("Anon departures");
  const { data: aData, error: aErr } = await anonClient.from("departures").select("*").limit(1);
  console.timeEnd("Anon departures");
  console.log("Anon Error:", aErr?.message, "Count:", aData?.length || 0);

  console.log("\n=== 2. SIGNING IN WITH ADMIN EMAIL 'anshjee2024aspirant@gmail.com' ===");
  // Let's create an auth user session using service key or magic link token to test
  const adminClient = createClient(url, serviceKey);
  const { data: authUser, error: userErr } = await adminClient.auth.admin.listUsers();
  console.log("Found users count:", authUser?.users?.length || 0);
  const targetUser = authUser?.users?.find(u => u.email === "anshjee2024aspirant@gmail.com");
  console.log("Target user:", targetUser?.id, targetUser?.email);

  if (targetUser) {
    // Generate magic link / session for target user
    const { data: linkData } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: targetUser.email!
    });
    console.log("Magic link token generated successfully.");

    // Sign in on client with custom token / password or test queries as target user
    const userClient = createClient(url, anonKey);
    // Create session using token
    if (linkData?.properties?.hashed_token) {
      const { data: sData, error: sErr } = await userClient.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: "magiclink"
      });
      console.log("Logged in user session:", sData?.session ? "SUCCESS" : "FAILED", sErr?.message);

      if (sData?.session) {
        console.log("\n=== 3. TESTING AUTHENTICATED USER CLIENT DEPARTURES QUERY ===");
        console.time("Authenticated user departures");
        const { data: uData, error: uErr } = await userClient.from("departures").select("*").limit(5);
        console.timeEnd("Authenticated user departures");
        console.log("Authenticated Error:", uErr?.message, "Count:", uData?.length || 0);

        console.log("\n=== 4. TESTING AUTHENTICATED USER CLIENT BOOKINGS QUERY ===");
        console.time("Authenticated user bookings");
        const { data: bData, error: bErr } = await userClient.from("bookings").select("*").limit(5);
        console.timeEnd("Authenticated user bookings");
        console.log("Authenticated Error:", bErr?.message, "Count:", bData?.length || 0);
      }
    }
  }
}

testJwtVsAnon().catch(console.error);
