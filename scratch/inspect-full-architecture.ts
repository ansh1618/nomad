import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

async function main() {
  console.log("=== FULL ARCHITECTURE INSPECTION ===\n");

  // 1. All journeys with hotel_id
  const { data: journeys } = await supabase
    .from("journeys")
    .select("id, name, slug, starting_price, price, hotel_id, status")
    .eq("is_deleted", false)
    .order("name");
  console.log("ALL JOURNEYS:");
  journeys?.forEach(j => {
    console.log(`  [${j.id}] ${j.name} | starting_price: ${j.starting_price} | hotel_id: ${j.hotel_id}`);
  });

  // 2. All hotels
  const { data: hotels } = await supabase
    .from("hotels")
    .select("id, name, city");
  console.log("\nALL HOTELS:");
  hotels?.forEach(h => console.log(`  [${h.id}] ${h.name} (${h.city})`));

  // 3. All hotel_rooms
  const { data: allRooms } = await supabase
    .from("hotel_rooms")
    .select("id, hotel_id, room_type, sharing_type, price_modifier, is_active")
    .order("hotel_id");
  console.log("\nALL HOTEL_ROOMS:");
  allRooms?.forEach(r => {
    const hotel = hotels?.find(h => h.id === r.hotel_id);
    console.log(`  [${r.hotel_id}] (${hotel?.name || "unknown"}) → ${r.room_type} (${r.sharing_type}): price_modifier=₹${r.price_modifier} active=${r.is_active}`);
  });

  // 4. Which journeys share the same hotel
  console.log("\nHOTEL → JOURNEYS MAPPING:");
  hotels?.forEach(h => {
    const jForHotel = journeys?.filter(j => j.hotel_id === h.id);
    if (jForHotel && jForHotel.length > 0) {
      console.log(`  ${h.name} [${h.id}]:`);
      jForHotel.forEach(j => console.log(`    → ${j.name} (starting_price: ₹${j.starting_price})`));
    }
  });

  // 5. Check if journey_accommodation_prices exists
  const { data: jap, error: japErr } = await supabase
    .from("journey_accommodation_prices")
    .select("*")
    .limit(10);
  console.log("\njourney_accommodation_prices table:");
  if (japErr) {
    console.log("  ERROR:", japErr.message);
  } else {
    console.log("  EXISTS! Rows:", JSON.stringify(jap, null, 2));
  }

  // 6. Check departures for hotel_id overrides
  const { data: departures } = await supabase
    .from("departures")
    .select("id, journey_id, departure_date, hotel_id, base_price, dynamic_price")
    .not("hotel_id", "is", null)
    .limit(10);
  console.log("\nDEPARTURES WITH hotel_id set:");
  departures?.forEach(d => {
    const journey = journeys?.find(j => j.id === d.journey_id);
    console.log(`  ${journey?.name || d.journey_id} dep:${d.departure_date} hotel_id:${d.hotel_id} base_price:${d.base_price} dyn:${d.dynamic_price}`);
  });

  // 7. Check bookings for accommodation data
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, journey_id, room_sharing, base_price, total_amount, accommodation_price")
    .limit(5);
  console.log("\nSAMPLE BOOKINGS:");
  bookings?.forEach(b => {
    const journey = journeys?.find(j => j.id === b.journey_id);
    console.log(`  ${journey?.name} | room:${b.room_sharing} | base:${b.base_price} | accom:${b.accommodation_price} | total:${b.total_amount}`);
  });

  // 8. AccommodationSelectionStep currently reads from hotel_rooms via journey.hotel_id
  // Let's verify what the Manali 2N/3D journey is
  const manali = journeys?.filter(j => j.name.toLowerCase().includes("manali"));
  console.log("\nMANALI JOURNEYS:");
  manali?.forEach(j => console.log(`  [${j.id}] ${j.name} | starting_price: ₹${j.starting_price} | hotel_id: ${j.hotel_id}`));
}

main().catch(console.error);
