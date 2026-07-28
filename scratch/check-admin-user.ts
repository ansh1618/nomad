import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminMapping() {
  console.log("=== CHECKING PUBLIC.ADMINS AND AUTH MAPPING ===");

  // 1. Fetch rows from public.admins
  const { data: admins, error: adminsErr } = await supabase.from("admins").select("*");
  console.log("public.admins error:", adminsErr?.message || "None");
  console.log("public.admins count:", admins?.length || 0);
  if (admins && admins.length > 0) {
    console.log("public.admins rows:", admins);
  }

  // 2. Register/Ensure admin user exists in public.admins
  // Get journeys or users
  const { data: users } = await supabase.auth.admin.listUsers();
  console.log("Auth users count:", users?.users?.length || 0);
  if (users?.users) {
    users.users.forEach(u => {
      console.log(`User: ID=${u.id}, Email=${u.email}`);
    });

    for (const u of users.users) {
      if (u.email?.includes("ansh") || u.email?.includes("admin") || u.email?.includes("nomad")) {
        const { data: upsertData, error: upsertErr } = await supabase
          .from("admins")
          .upsert({
            id: u.id,
            email: u.email,
            role: "SUPER_ADMIN",
            full_name: u.user_metadata?.full_name || "Super Admin",
            is_active: true
          })
          .select();

        if (upsertErr) {
          console.error(`Upsert error for ${u.email}:`, upsertErr.message);
        } else {
          console.log(`✓ Admin mapping created for ${u.email} -> public.admins ID=${u.id}`);
        }
      }
    }
  }
}

checkAdminMapping().catch(console.error);
