import { supabase } from "../src/lib/supabase";

async function testAdminLoginFlow() {
  console.log("=== 1. TEST ADMIN ROLE QUERY FOR USER EMAIL 'anshjee2024aspirant@gmail.com' ===");
  const { data: adminData, error: adminError } = await supabase
    .from("admins")
    .select("id, email, role, is_active")
    .eq("email", "anshjee2024aspirant@gmail.com")
    .maybeSingle();

  console.log("Admin record query:", adminData, "Error:", adminError);

  if (adminData) {
    console.log("\n=== 2. TEST PROFILES QUERY FOR USER ID:", adminData.id, "===");
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", adminData.id)
      .maybeSingle();

    console.log("Profiles query result:", prof, "Error:", profErr);

    console.log("\n=== 3. TEST USERS QUERY FOR USER ID:", adminData.id, "===");
    const { data: usr, error: usrErr } = await supabase
      .from("users")
      .select("*")
      .eq("id", adminData.id)
      .maybeSingle();

    console.log("Users query result:", usr, "Error:", usrErr);

    console.log("\n=== 4. TEST MERGE GUEST BOOKINGS QUERY FOR EMAIL ===");
    const { data: bData, error: bErr } = await supabase
      .from("bookings")
      .select("id")
      .eq("email", "anshjee2024aspirant@gmail.com")
      .is("user_id", null);

    console.log("Guest bookings count:", bData?.length || 0, "Error:", bErr);
  }
}

testAdminLoginFlow().catch(console.error);
