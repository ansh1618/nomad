import { getPackageDocumentBySlug } from "../src/server/itinerary-pdf";

async function main() {
  console.log("Testing getPackageDocumentBySlug('udaipur')...");
  const doc1 = await getPackageDocumentBySlug("udaipur", "ITINERARY");
  console.log("Result for 'udaipur':", doc1);

  console.log("\nTesting getPackageDocumentBySlug('udaipur-weekend')...");
  const doc2 = await getPackageDocumentBySlug("udaipur-weekend", "ITINERARY");
  console.log("Result for 'udaipur-weekend':", doc2);
}

main().catch(console.error);
