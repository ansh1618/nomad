import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const MANALI_3N4D_ID = "9134531f-cea8-4a8a-8a54-3ce8901a3d7a";
const MANALI_2N3D_ID = "54af3b8a-21af-4e5a-9857-1ba4fb8bc09e";

async function verifyAndSeed() {
  console.log("Checking current contents of journey_accommodation_prices...");
  const { data: currentRows, error: fetchErr } = await supabase
    .from("journey_accommodation_prices")
    .select("*");

  if (fetchErr) {
    console.error("Fetch error:", fetchErr.message);
    return;
  }

  console.log(`Current rows count: ${currentRows?.length ?? 0}`);
  console.log(currentRows);

  console.log("\nUpserting Manali 3N/4D prices...");
  const m3n4dRecords = [
    { journey_id: MANALI_3N4D_ID, accommodation_type: "QUAD", price: 7499, is_active: true },
    { journey_id: MANALI_3N4D_ID, accommodation_type: "TRIPLE", price: 7999, is_active: true },
    { journey_id: MANALI_3N4D_ID, accommodation_type: "DOUBLE", price: 8499, is_active: true },
  ];
  const { data: m3n4dResult, error: m3Err } = await supabase
    .from("journey_accommodation_prices")
    .upsert(m3n4dRecords, { onConflict: "journey_id,accommodation_type" })
    .select();

  if (m3Err) console.error("Manali 3N/4D seed error:", m3Err.message);
  else console.log("Manali 3N/4D seeded:", m3n4dResult);

  console.log("\nUpserting Manali 2N/3D prices...");
  const m2n3dRecords = [
    { journey_id: MANALI_2N3D_ID, accommodation_type: "QUAD", price: 6499, is_active: true },
    { journey_id: MANALI_2N3D_ID, accommodation_type: "TRIPLE", price: 6999, is_active: true },
    { journey_id: MANALI_2N3D_ID, accommodation_type: "DOUBLE", price: 7499, is_active: true },
  ];
  const { data: m2n3dResult, error: m2Err } = await supabase
    .from("journey_accommodation_prices")
    .upsert(m2n3dRecords, { onConflict: "journey_id,accommodation_type" })
    .select();

  if (m2Err) console.error("Manali 2N/3D seed error:", m2Err.message);
  else console.log("Manali 2N/3D seeded:", m2n3dResult);
}

verifyAndSeed().catch(console.error);
