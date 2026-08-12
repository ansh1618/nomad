import { getDestinationBySlug } from "../src/lib/queries/destinations";
import { getJourneyBySlug } from "../src/lib/queries-client";

async function testDest() {
  console.log("=== TESTING getDestinationBySlug('manali') ===");
  try {
    const dest = await getDestinationBySlug("manali");
    console.log("Dest result:", JSON.stringify(dest, null, 2));
  } catch (err: any) {
    console.error("EXCEPTIONS IN getDestinationBySlug:", err);
  }

  console.log("=== TESTING getJourneyBySlug('jibhi-tirthan') ===");
  try {
    const j = await getJourneyBySlug("jibhi-tirthan");
    console.log("Journey result for jibhi-tirthan:", JSON.stringify(j, null, 2));
  } catch (err: any) {
    console.error("EXCEPTIONS IN getJourneyBySlug:", err);
  }
}

testDest().catch(console.error);
