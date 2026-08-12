import { supabaseAdmin } from "../src/lib/supabase-admin";

async function inspectRlsPoliciesDetail() {
  console.log("=== INSPECTING ALL RLS POLICIES AND TABLE RLS STATUS ===");

  // Query pg_tables to see which tables have RLS enabled
  const { data: tablesData, error: tablesErr } = await supabaseAdmin
    .from("pg_tables" as any)
    .select("schemaname, tablename, rowsecurity")
    .eq("schemaname", "public");

  console.log("RLS Status on Public Tables:");
  console.table(tablesData);

  // Run SQL to inspect exact definition of all RLS policies
  const sql = `
    SELECT 
      schemaname,
      tablename,
      policyname,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public';
  `;

  const { data: policiesData, error: policiesErr } = await supabaseAdmin.rpc("exec_sql" as any, { sql_query: sql }).catch(() => ({ data: null, error: null }));
  console.log("RLS Policies SQL result:", policiesData, policiesErr);
}

inspectRlsPoliciesDetail().catch(console.error);
