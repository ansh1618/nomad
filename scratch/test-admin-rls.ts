import { supabase } from "../src/lib/supabase";
import { supabaseAdmin } from "../src/lib/supabase-admin";

async function testAdminRls() {
  const adminId = "2b1bb97a-c3a8-4a61-a9d4-816ef77f76f2";
  console.log("=== 1. TESTING WITH ANON CLIENT (`src/lib/supabase.ts`) ===");
  const { data: d1, error: e1 } = await supabase
    .from("admins")
    .select("id, email, role, is_active")
    .eq("id", adminId)
    .maybeSingle();

  console.log("Anon Client Result:", d1, "Error:", e1);

  console.log("\n=== 2. TESTING WITH ADMIN CLIENT (`src/lib/supabase-admin.ts`) ===");
  const { data: d2, error: e2 } = await supabaseAdmin
    .from("admins")
    .select("id, email, role, is_active")
    .eq("id", adminId)
    .maybeSingle();

  console.log("Admin Client Result:", d2, "Error:", e2);
}

testAdminRls().catch(console.error);
