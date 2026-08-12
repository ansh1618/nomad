import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

async function testFullDepartureSelect() {
  const adminClient = createClient(url, serviceKey);
  const { data: authUser } = await adminClient.auth.admin.listUsers();
  const targetUser = authUser?.users?.find(u => u.email === "anshjee2024aspirant@gmail.com");
  const { data: linkData } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: targetUser!.email!
  });

  const client = createClient(url, anonKey);
  await client.auth.verifyOtp({
    token_hash: linkData!.properties!.hashed_token,
    type: "magiclink"
  });

  console.log("Logged in as authenticated user.");

  const DEPARTURE_SELECT = `
    *,
    journeys(id, slug, name, starting_price, duration, hero_banner),
    trip_captains(id, full_name, photo_url, phone),
    buses(id, name, registration_number, bus_type, total_seats),
    hotels(id, name, star_rating, city),
    departure_rooms(
      id, allocated_count, price_override,
      hotel_rooms(id, room_type, sharing_type, capacity, price_modifier)
    ),
    pricing_tiers(*)
  `;

  console.time("Full DEPARTURE_SELECT Query");
  const { data, error, count } = await client
    .from("departures")
    .select(DEPARTURE_SELECT, { count: "exact" })
    .order("departure_date", { ascending: true })
    .range(0, 19);
  console.timeEnd("Full DEPARTURE_SELECT Query");

  console.log("Full DEPARTURE_SELECT Error:", error?.message, "Count:", count, "Rows:", data?.length || 0);
}

testFullDepartureSelect().catch(console.error);
