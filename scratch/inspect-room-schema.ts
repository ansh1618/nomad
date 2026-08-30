import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Get actual hotel_rooms columns
  const { data: rooms, error } = await supabase
    .from("hotel_rooms")
    .select("*")
    .limit(3);
  console.log("hotel_rooms sample:", JSON.stringify(rooms, null, 2));
  console.log("hotel_rooms error:", error);

  // Check if journey_accommodation_prices already exists
  const { data: jap, error: japErr } = await supabase
    .from("journey_accommodation_prices")
    .select("*")
    .limit(3);
  console.log("journey_accommodation_prices:", JSON.stringify(jap, null, 2));
  console.log("journey_accommodation_prices error:", japErr?.message);

  // Get hotel_rooms for Manali hotel
  const { data: manaliRooms } = await supabase
    .from("hotel_rooms")
    .select("*")
    .eq("hotel_id", "6703ca32-af46-49fd-a6dc-8e36cb3564f8");
  console.log("Manali hotel rooms:", JSON.stringify(manaliRooms, null, 2));

  // Check journeys table columns via a broad select
  const { data: journeyRow } = await supabase
    .from("journeys")
    .select("*")
    .eq("id", "9134531f-cea8-4a8a-8a54-3ce8901a3d7a")
    .single();
  console.log("Manali Weekend Escape full row:", JSON.stringify(journeyRow, null, 2));
}

main().catch(console.error);
