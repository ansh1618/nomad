import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA";

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log("Applying Migration v19: Premium Documents to Supabase...");

  try {
    const { error: bucketErr } = await supabase.storage.createBucket("itineraries", {
      public: false,
      fileSizeLimit: 31457280,
      allowedMimeTypes: ["application/pdf"]
    });
    if (bucketErr) {
      console.log("Storage bucket notice:", bucketErr.message);
    } else {
      console.log("✓ Created private storage bucket 'itineraries'");
    }
  } catch (err: any) {
    console.log("Storage bucket error:", err.message);
  }
}

applyMigration().catch(console.error);
