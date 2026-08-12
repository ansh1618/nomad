import { getDestinations, getJourneys } from "../src/lib/queries-client";

async function testSpeed() {
  console.log("=== TESTING DESTINATIONS & JOURNEYS FETCH SPEED ===");

  const t1 = Date.now();
  const dests = await getDestinations();
  console.log(`getDestinations completed in ${Date.now() - t1}ms | Count: ${dests?.length}`);

  const t2 = Date.now();
  const journeys = await getJourneys();
  console.log(`getJourneys completed in ${Date.now() - t2}ms | Count: ${journeys?.length}`);
}

testSpeed().catch(console.error);
