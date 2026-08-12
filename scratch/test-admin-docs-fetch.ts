import { getAllPackageDocuments } from "../src/server/itinerary-pdf";

async function testAdminDocsFetch() {
  console.log("=== TESTING ADMIN DOCUMENTS FETCH ===");
  const docs = await getAllPackageDocuments();
  console.log("Fetched Admin Documents Count:", docs.length);
  console.log("Sample Document:", JSON.stringify(docs[0], null, 2));
}

testAdminDocsFetch().catch(console.error);
