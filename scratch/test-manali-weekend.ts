import { getJourneyBySlug } from "../src/lib/queries-client";

async function testManaliWeekend() {
  console.log("=== TESTING getJourneyBySlug('manali-weekend') ===");
  try {
    const journey = await getJourneyBySlug("manali-weekend");
    console.log("Journey result:", JSON.stringify(journey, null, 2));
  } catch (err: any) {
    console.error("EXCEPTIONS IN getJourneyBySlug('manali-weekend'):", err);
  }
}

testManaliWeekend().catch(console.error);
