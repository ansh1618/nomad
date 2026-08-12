import { supabaseAdmin } from "../src/lib/supabase-admin";

async function checkAllAdmins() {
  console.log("=== ALL ROWS IN 'admins' TABLE ===");
  const { data: admins, error: aErr } = await supabaseAdmin.from("admins").select("*");
  console.log(`Found ${admins?.length || 0} admin records:`, admins, "Error:", aErr?.message);

  console.log("\n=== CHECKING SUPABASE AUTH USERS ===");
  const { data: users, error: uErr } = await supabaseAdmin.auth.admin.listUsers();
  console.log(`Found ${users?.users?.length || 0} auth users:`);
  for (const u of users?.users || []) {
    console.log(`- ID: ${u.id} | Email: ${u.email} | Verified: ${u.email_confirmed_at ? 'Yes' : 'No'}`);
  }
}

checkAllAdmins().catch(console.error);
