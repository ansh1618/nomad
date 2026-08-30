import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testRpc() {
  console.log("Testing RPC functions...");
  
  // Test exec_sql if it exists
  const { data: d1, error: e1 } = await supabase.rpc("exec_sql", { sql_query: "SELECT 1" });
  console.log("exec_sql:", { d1, error: e1?.message });

  // Test execute_sql
  const { data: d2, error: e2 } = await supabase.rpc("execute_sql", { query: "SELECT 1" });
  console.log("execute_sql:", { d2, error: e2?.message });
}

testRpc().catch(console.error);
