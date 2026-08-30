import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=== INSPECTING MANALI WEEKEND ESCAPE & ROOM PRICING ===");

  // 1. Fetch Manali journey/package
  const { data: journeys, error: jErr } = await supabase
    .from("journeys")
    .select("id, name, slug, starting_price, price, hotel_id")
    .ilike("slug", "%manali%");

  console.log("Journeys:", journeys, "Error:", jErr);

  // 2. Fetch packages table as well
  const { data: pkgs, error: pErr } = await supabase
    .from("packages")
    .select("id, name, slug, starting_price, price, hotel_id")
    .ilike("slug", "%manali%");

  console.log("Packages:", pkgs, "Error:", pErr);

  // 3. Fetch all hotels and hotel_rooms
  const { data: rooms, error: rErr } = await supabase
    .from("hotel_rooms")
    .select("id, hotel_id, room_type, sharing_type, capacity, price, price_modifier, is_active, hotels(id, name)");

  console.log("Hotel Rooms count:", rooms?.length, "Error:", rErr);
  console.log("Sample Rooms:", JSON.stringify(rooms, null, 2));

  // 4. Fetch departures
  const { data: departures } = await supabase
    .from("departures")
    .select("id, journey_id, hotel_id, base_price, dynamic_price");

  console.log("Departures sample:", departures?.slice(0, 5));
}

main().catch(console.error);
