import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndCreateBuckets() {
  console.log("Checking Supabase Storage buckets...");

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("Error listing buckets:", listError.message);
  } else {
    console.log("Existing buckets:", buckets?.map(b => `${b.name} (public: ${b.public})`));
  }

  // Check if 'itineraries' bucket exists
  const itinerariesBucket = buckets?.find(b => b.name === 'itineraries');

  if (!itinerariesBucket) {
    console.log("Creating 'itineraries' storage bucket with public access...");
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('itineraries', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png']
    });

    if (createError) {
      console.error("Failed to create 'itineraries' bucket:", createError.message);
    } else {
      console.log("✓ 'itineraries' bucket created successfully with public access!", newBucket);
    }
  } else if (!itinerariesBucket.public) {
    console.log("Updating 'itineraries' bucket to public...");
    await supabase.storage.updateBucket('itineraries', {
      public: true
    });
    console.log("✓ 'itineraries' bucket updated to public access!");
  } else {
    console.log("✓ 'itineraries' bucket exists and is public!");
  }

  // Also check 'media' bucket
  const mediaBucket = buckets?.find(b => b.name === 'media');
  if (!mediaBucket) {
    console.log("Creating 'media' storage bucket...");
    await supabase.storage.createBucket('media', {
      public: true,
      fileSizeLimit: 52428800
    });
    console.log("✓ 'media' bucket created successfully!");
  }

  console.log("Bucket verification complete!");
}

checkAndCreateBuckets().catch(console.error);
