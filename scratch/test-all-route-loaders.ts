import { getDestinations, getJourneys, getDestinationBySlug, getApprovedReviews } from "../src/lib/queries-client";

async function testAllLoaders() {
  console.log("=== TESTING ALL ROUTE LOADERS ===");

  try {
    const dests = await getDestinations();
    console.log("getDestinations count:", dests?.length || 0);
  } catch (e: any) {
    console.error("getDestinations FAILED:", e.message);
  }

  try {
    const journeys = await getJourneys();
    console.log("getJourneys count:", journeys?.length || 0);
  } catch (e: any) {
    console.error("getJourneys FAILED:", e.message);
  }

  try {
    const reviews = await getApprovedReviews();
    console.log("getApprovedReviews count:", reviews?.data?.length || 0);
  } catch (e: any) {
    console.error("getApprovedReviews FAILED:", e.message);
  }

  try {
    const manali = await getDestinationBySlug('manali');
    console.log("manali dest found:", !!manali);
  } catch (e: any) {
    console.error("getDestinationBySlug('manali') FAILED:", e.message);
  }

  try {
    const udaipur = await getDestinationBySlug('udaipur');
    console.log("udaipur dest found:", !!udaipur);
  } catch (e: any) {
    console.error("getDestinationBySlug('udaipur') FAILED:", e.message);
  }

  try {
    const chopta = await getDestinationBySlug('chopta');
    console.log("chopta dest found:", !!chopta);
  } catch (e: any) {
    console.error("getDestinationBySlug('chopta') FAILED:", e.message);
  }
}

testAllLoaders().catch(console.error);
