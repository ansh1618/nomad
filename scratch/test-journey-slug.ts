import { getJourneyBySlug } from "../src/lib/queries-client";

async function testJourney() {
  console.log("=== TESTING getJourneyBySlug('chopta-tungnath-trek') ===");
  try {
    const journey = await getJourneyBySlug("chopta-tungnath-trek");
    console.log("Journey result:", JSON.stringify(journey, null, 2));
  } catch (err: any) {
    console.error("EXCEPTIONS IN getJourneyBySlug:", err);
  }
}

testJourney().catch(console.error);
