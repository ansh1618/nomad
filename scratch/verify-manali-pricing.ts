import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=== Accommodation Pricing Verification ===\n");

  // 1. Verify Manali hotel rooms
  const { data: manaliRooms } = await supabase
    .from("hotel_rooms")
    .select("room_type, sharing_type, price_modifier, is_active")
    .eq("hotel_id", "6703ca32-af46-49fd-a6dc-8e36cb3564f8")
    .order("price_modifier");

  console.log("Manali Weekend Escape rooms (hotel_id: 6703ca32...):");
  manaliRooms?.forEach(r => {
    const label = r.sharing_type === "QUAD" ? "Quad Sharing" : r.sharing_type === "TRIPLE" ? "Triple Sharing" : "Double Sharing";
    const expected = r.sharing_type === "QUAD" ? 7499 : r.sharing_type === "TRIPLE" ? 7999 : 8499;
    const pass = r.price_modifier === expected ? "✅" : "❌";
    console.log(`  ${pass} ${label}: ₹${r.price_modifier} (expected ₹${expected})`);
  });

  // 2. Simulate what the booking component would show
  console.log("\nSimulating booking component display:");
  manaliRooms?.forEach(r => {
    const rawVal = Number(r.price_modifier || 0);
    const absolutePrice = rawVal >= 1000 ? rawVal : 6500;
    console.log(`  ${r.room_type}: displayed as ₹${absolutePrice.toLocaleString('en-IN')}`);
  });

  // 3. Simulate pricing-fns.ts server calculation
  console.log("\nSimulating pricing-fns.ts for 2 travellers:");
  const journey = { starting_price: 7499 };
  manaliRooms?.forEach(r => {
    const roomPrice = r.price_modifier >= 3000 ? r.price_modifier : 6500;
    const travellers = 2;
    const roomTotal = roomPrice * travellers;
    const gst = Math.round(roomTotal * 0.05);
    const grandTotal = roomTotal + gst;
    console.log(`  ${r.room_type}: ₹${roomPrice}/person × ${travellers} = ₹${roomTotal} + GST ₹${gst} = ₹${grandTotal}`);
  });

  console.log("\n=== Verification Complete ===");
}

main().catch(console.error);
