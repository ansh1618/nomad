import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRlsAndTable() {
  console.log("=== FIXING RLS & SCHEMAS FOR PACKAGE DOCUMENTS ===");

  // 1. Create table if not present via RLS & Policies
  // Test direct insert via service key to verify table structure
  const { data: journeys } = await supabase.from("journeys").select("id").limit(1);
  if (!journeys || journeys.length === 0) {
    console.error("No journeys found");
    return;
  }

  const testJourneyId = journeys[0].id;

  // Test insert into package_documents using service role key
  const { data: inserted, error: insertErr } = await supabase
    .from("package_documents")
    .upsert({
      package_id: testJourneyId,
      document_type: "ITINERARY",
      title: "Test Itinerary",
      file_url: "test/path.pdf",
      is_active: true
    })
    .select();

  if (insertErr) {
    console.log("Service role insert error:", insertErr.message);
  } else {
    console.log("✓ Service role insert test succeeded! Inserted row:", inserted);
    // Cleanup test row
    await supabase.from("package_documents").delete().eq("file_url", "test/path.pdf");
  }

  // 2. Disable RLS or grant permissive policies on package_documents table
  // Try inserting with anon/client key to verify if client RLS fails
  const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MjY2MDksImV4cCI6MjA5ODUwMjYwOX0.Lhv7m97uUD_tifN31f6DFqIl79sflqkjWePmlYQ6HfQ";
  const clientSupabase = createClient(supabaseUrl, anonKey);

  const { error: clientInsertErr } = await clientSupabase
    .from("package_documents")
    .upsert({
      package_id: testJourneyId,
      document_type: "ITINERARY",
      title: "Client Test Itinerary",
      file_url: "test/client_path.pdf",
      is_active: true
    });

  if (clientInsertErr) {
    console.log("❌ Anon/Client insert failed with error:", clientInsertErr.message);
  } else {
    console.log("✓ Anon/Client insert succeeded!");
    await supabase.from("package_documents").delete().eq("file_url", "test/client_path.pdf");
  }

  console.log("RLS Check complete!");
}

fixRlsAndTable().catch(console.error);
