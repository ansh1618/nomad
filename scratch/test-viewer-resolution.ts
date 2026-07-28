import { getPackageDocumentBySlug } from "../src/server/itinerary-pdf";

async function testViewerResolution() {
  console.log("=== TESTING VIEWER PUBLIC URL RESOLUTION ===");

  const slugsToTest = ["udaipur-royal-weekend", "udaipur-weekend"];

  for (const slug of slugsToTest) {
    console.log(`\nTesting slug: '${slug}'...`);
    const doc = await getPackageDocumentBySlug(slug, "ITINERARY");
    console.log("Returned document metadata:", doc);
  }
}

testViewerResolution().catch(console.error);
