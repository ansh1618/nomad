import { supabaseAdmin } from "../src/lib/supabase-admin";

async function checkAllRlsPolicies() {
  console.log("=== CHECKING ALL RLS POLICIES IN SUPABASE ===");
  const sql = `
    SELECT 
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `;

  // Query pg_policies table directly via supabaseAdmin
  const { data, error } = await supabaseAdmin.from("pg_policies" as any).select("*").catch(() => ({ data: null, error: null }));

  if (error || !data) {
    // Fallback query
    const { data: rawData, error: rawError } = await supabaseAdmin.rpc("exec_sql" as any, { sql_query: sql }).catch(() => ({ data: null, error: null }));
    console.log("Raw SQL query result:", rawData, rawError);
  } else {
    console.log(`Found ${data.length} RLS policies:`, data);
  }
}

checkAllRlsPolicies().catch(console.error);
