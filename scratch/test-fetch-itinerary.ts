import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFetch() {
  console.log("Checking package_documents table records...");
  const { data: docs, error } = await supabase.from("package_documents").select("*");
  console.log("Documents in DB:", docs?.map(d => ({ id: d.id, title: d.title, file_url: d.file_url })));

  if (docs && docs.length > 0) {
    const testDoc = docs[0];
    console.log("Testing fetch for file_url:", testDoc.file_url);
    const res = await fetch(testDoc.file_url, { method: "HEAD" });
    console.log("File fetch HTTP status:", res.status, res.statusText);
  }
}

testFetch().catch(console.error);
