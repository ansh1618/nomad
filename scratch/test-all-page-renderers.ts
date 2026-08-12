import { getApprovedReviews } from "../src/lib/queries/admin";
import { getDestinationBySlug } from "../src/lib/queries-client";

async function testPageRenderers() {
  console.log("=== TESTING ADMIN GET APPROVED REVIEWS ===");

  try {
    const adminRev = await getApprovedReviews('some-id', 6);
    console.log("Admin getApprovedReviews result:", adminRev);
  } catch (e: any) {
    console.error("Admin getApprovedReviews THREW ERROR:", e.message);
  }

  try {
    const manaliDest = await getDestinationBySlug('manali');
    console.log("manaliDest loaded:", !!manaliDest);
  } catch (e: any) {
    console.error("manaliDest THREW ERROR:", e.message);
  }
}

testPageRenderers().catch(console.error);
