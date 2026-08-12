import { getPublishedPackages, getPackages } from "../src/lib/queries/packages";

async function testPackages() {
  console.log("=== TESTING GET PUBLISHED PACKAGES ===");

  try {
    const pub = await getPublishedPackages();
    console.log("getPublishedPackages count:", pub?.length);
  } catch (e: any) {
    console.error("getPublishedPackages FAILED:", e?.message || e);
  }

  try {
    const allPkgs = await getPackages({});
    console.log("getPackages count:", allPkgs?.data?.length);
  } catch (e: any) {
    console.error("getPackages FAILED:", e?.message || e);
  }
}

testPackages().catch(console.error);
