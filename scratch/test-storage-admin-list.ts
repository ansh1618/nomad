import { supabaseAdmin } from "../src/lib/supabase-admin";

async function testStorageAdminList() {
  console.log("=== TESTING STORAGE SCAN FOR ADMIN DOCUMENTS LIST ===");

  const { data: journeys } = await supabaseAdmin
    .from("journeys")
    .select("id, name, slug");

  console.log("Found journeys:", journeys?.length);

  const resultDocs: any[] = [];

  if (journeys && journeys.length > 0) {
    for (const j of journeys) {
      const folder = `${j.slug}/itinerary`;
      const { data: files } = await supabaseAdmin.storage
        .from("itineraries")
        .list(folder);

      if (files && files.length > 0) {
        for (const file of files) {
          if (!file.name.endsWith('.pdf')) continue;
          const storagePath = `${folder}/${file.name}`;
          const { data: signData } = await supabaseAdmin.storage
            .from("itineraries")
            .createSignedUrl(storagePath, 3600);

          resultDocs.push({
            id: `doc-${file.id || file.name}`,
            journey_id: j.id,
            package_id: j.id,
            document_type: 'ITINERARY',
            title: `${j.name} Official Itinerary`,
            bucket_name: 'itineraries',
            storage_path: storagePath,
            file_url: signData?.signedUrl || storagePath,
            signed_url: signData?.signedUrl || storagePath,
            file_name: file.name,
            file_size: file.metadata?.size || 0,
            size: file.metadata?.size || 0,
            page_count: 14,
            version: 1,
            is_active: true,
            created_at: file.created_at || new Date().toISOString(),
            updated_at: file.updated_at || new Date().toISOString(),
            journeys: j
          });
        }
      }
    }
  }

  console.log("Scanned Admin Documents Count:", resultDocs.length);
  console.log("Sample Document:", JSON.stringify(resultDocs[0], null, 2));
}

testStorageAdminList().catch(console.error);
