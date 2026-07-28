import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUploadMethods() {
  console.log("=== TESTING SIGNED UPLOAD URL GENERATION ===");
  const testPath = `test-folder/test-${Date.now()}.pdf`;

  const { data: signedData, error: signedErr } = await supabase.storage
    .from("itineraries")
    .createSignedUploadUrl(testPath);

  console.log("Signed upload URL result:", {
    error: signedErr?.message || null,
    signedUrl: signedData?.signedUrl ? "EXISTS" : "NONE",
    token: signedData?.token ? "EXISTS" : "NONE",
    path: signedData?.path
  });

  if (signedData?.token) {
    const testContent = Buffer.from("Test PDF content");
    const { data: tokenData, error: tokenErr } = await supabase.storage
      .from("itineraries")
      .uploadToSignedUrl(testPath, signedData.token, testContent, {
        contentType: "application/pdf"
      });

    console.log("Upload via token result:", {
      error: tokenErr?.message || null,
      data: tokenData ? tokenData.path : null
    });
  }
}

testUploadMethods().catch(console.error);
