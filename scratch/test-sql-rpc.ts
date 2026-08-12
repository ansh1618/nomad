import { supabaseAdmin } from "../src/lib/supabase-admin";

async function testSqlRpc() {
  console.log("Testing SQL RPC capability...");

  // Try calling exec_sql or similar if registered
  const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: 'SELECT 1;' });
  console.log("exec_sql result:", data, error);
}

testSqlRpc().catch(console.error);
