import { supabaseAdmin } from "../src/lib/supabase-admin";
import { getPackageDocumentBySlug } from "../src/server/itinerary-pdf";

async function inspectDbAndStorage() {
  console.log("=== INSPECTING DB AND STORAGE FOR UDAIPUR ===");

  const res1 = await getPackageDocumentBySlug("udaipur", "ITINERARY");
  console.log("\n1. Result for slug 'udaipur':", JSON.stringify(res1, null, 2));

  const res2 = await getPackageDocumentBySlug("udaipur-weekend", "ITINERARY");
  console.log("\n2. Result for slug 'udaipur-weekend':", JSON.stringify(res2, null, 2));

  // Check journey_documents
  const { data: jDocs, error: jErr } = await supabaseAdmin.from("journey_documents").select("*");
  console.log("\n3. journey_documents count:", jDocs?.length, "error:", jErr?.message);

  // Check package_documents
  const { data: pDocs, error: pErr } = await supabaseAdmin.from("package_documents").select("*");
  console.log("\n4. package_documents count:", pDocs?.length, "error:", pErr?.message, "data:", pDocs);
}

inspectDbAndStorage().catch(console.error);
