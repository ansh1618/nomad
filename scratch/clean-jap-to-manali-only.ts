import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const MANALI_3N4D = "9134531f-cea8-4a8a-8a54-3ce8901a3d7a";
const MANALI_2N3D = "54af3b8a-21af-4e5a-9857-1ba4fb8bc09e";

async function cleanNonManaliPrices() {
  console.log("Removing non-Manali journey_accommodation_prices records...");

  const { data: deleted, error } = await supabase
    .from("journey_accommodation_prices")
    .delete()
    .not("journey_id", "in", `(${MANALI_3N4D},${MANALI_2N3D})`)
    .select();

  if (error) {
    console.error("Delete failed:", error.message);
    return;
  }

  console.log(`Deleted ${deleted?.length || 0} non-Manali pricing records.`);

  // Verify remaining records
  const { data: remaining } = await supabase
    .from("journey_accommodation_prices")
    .select("journey_id, accommodation_type, price, journeys:journey_id(name)")
    .order("journey_id")
    .order("accommodation_type");

  console.log("\n=== REMAINING PRICING RECORDS IN DB ===");
  remaining?.forEach((p: any) => {
    console.log(`${p.journeys?.name || p.journey_id}: ${p.accommodation_type} = ₹${p.price}`);
  });
}

cleanNonManaliPrices().catch(console.error);
