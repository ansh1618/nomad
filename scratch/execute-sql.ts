import fs from "fs";
import path from "path";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA";

async function executeSql() {
  const sqlPath = path.join(process.cwd(), "supabase", "migration_v19_premium_documents.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  console.log("Sending SQL migration request to Supabase...");

  // Try raw query endpoint if available
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": serviceRoleKey,
      "Authorization": `Bearer ${serviceRoleKey}`
    },
    body: JSON.stringify({ query: sql })
  });

  const text = await response.text();
  console.log("Response status:", response.status);
  console.log("Response body:", text);
}

executeSql().catch(console.error);
