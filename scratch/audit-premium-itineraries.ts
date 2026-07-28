import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function auditPremiumItineraries() {
  console.log("=== PREMIUM ITINERARY AUDIT & CLEANUP ===");

  // 1. Validate bucket
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  const itinerariesBucket = buckets?.find(b => b.name === "itineraries");
  console.log(`✓ Bucket name: ${itinerariesBucket ? itinerariesBucket.name : "MISSING"}`);

  // 2. List all files in itineraries bucket
  const { data: storageFiles } = await supabase.storage.from("itineraries").list("", { limit: 100, recursive: true });
  console.log("✓ Storage objects found:", storageFiles?.length || 0);
  storageFiles?.forEach(f => console.log(`   - Storage path: ${f.name}`));

  // 3. Query all package_documents rows
  const { data: docs } = await supabase.from("package_documents").select("*");
  console.log("✓ Database paths total:", docs?.length || 0);

  const brokenRecords: any[] = [];
  const validRecords: any[] = [];

  if (docs) {
    for (const doc of docs) {
      console.log(`   - DB Record [${doc.id}] Title: "${doc.title}", URL: ${doc.file_url}`);
      
      // Check if file_url points to a dummy sample URL or missing object
      if (doc.file_url.includes("githubusercontent.com") || doc.file_url.includes("tracemonkey")) {
        brokenRecords.push(doc);
      } else {
        // Test HTTP status of the file_url
        try {
          const res = await fetch(doc.file_url, { method: "HEAD" });
          if (res.status !== 200) {
            brokenRecords.push(doc);
          } else {
            validRecords.push(doc);
          }
        } catch (err) {
          brokenRecords.push(doc);
        }
      }
    }
  }

  console.log(`✓ Broken records found: ${brokenRecords.length}`);
  for (const b of brokenRecords) {
    console.log(`   - Removing broken/sample DB record: ID=${b.id}, Title="${b.title}"`);
    await supabase.from("package_documents").delete().eq("id", b.id);
  }

  console.log("✓ Audit script finished!");
}

auditPremiumItineraries().catch(console.error);
