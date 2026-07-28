import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDb() {
  console.log("Checking Supabase tables...");

  const { data: docs, error: docErr } = await supabase.from("package_documents").select("*");
  if (docErr) {
    console.log("package_documents error:", docErr.message);
  } else {
    console.log(`✓ package_documents table exists! Count: ${docs?.length}`);
  }

  const { data: leads, error: leadErr } = await supabase.from("itinerary_leads").select("*");
  if (leadErr) {
    console.log("itinerary_leads error:", leadErr.message);
  } else {
    console.log(`✓ itinerary_leads table exists! Count: ${leads?.length}`);
  }
}

testDb().catch(console.error);
