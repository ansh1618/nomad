import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

async function testDepartureJoins() {
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

  const joinsToTest = [
    { name: "1. Only *", query: "*" },
    { name: "2. * + journeys", query: "*, journeys(id, slug, name, starting_price, duration, hero_banner)" },
    { name: "3. * + trip_captains", query: "*, trip_captains(id, full_name, photo_url, phone)" },
    { name: "4. * + buses", query: "*, buses(id, name, registration_number, bus_type, total_seats)" },
    { name: "5. * + hotels", query: "*, hotels(id, name, star_rating, city)" },
    { name: "6. * + departure_rooms", query: "*, departure_rooms(id, allocated_count, price_override)" },
    { name: "7. * + departure_rooms(hotel_rooms)", query: "*, departure_rooms(id, allocated_count, price_override, hotel_rooms(id, room_type, sharing_type, capacity, price_modifier))" },
    { name: "8. * + pricing_tiers", query: "*, pricing_tiers(*)" },
  ];

  for (const j of joinsToTest) {
    console.log(`\n--- Testing ${j.name} ---`);
    console.time(j.name);
    try {
      const { data, error } = await client.from("departures").select(j.query).limit(5);
      console.timeEnd(j.name);
      if (error) console.log("❌ Error:", error.message);
      else console.log("✅ Data count:", data?.length || 0);
    } catch (e: any) {
      console.timeEnd(j.name);
      console.log("❌ Exception:", e?.message || e);
    }
  }
}

testDepartureJoins().catch(console.error);
