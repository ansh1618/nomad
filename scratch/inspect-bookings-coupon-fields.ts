import { supabaseAdmin } from "../src/lib/supabase-admin";

async function inspectBookings() {
  console.log("Inspecting bookings table coupon fields...");
  const { data: bookings, error } = await supabaseAdmin
    .from("bookings")
    .select("*, journeys(name, slug), departures(departure_date), coupons(code)")
    .limit(5);

  console.log("Bookings sample error:", error);
  if (bookings && bookings.length > 0) {
    console.log("Bookings sample keys:", Object.keys(bookings[0]));
    console.log("First booking:", JSON.stringify(bookings[0], null, 2));
  } else {
    console.log("No bookings found in DB.");
  }
}

inspectBookings().catch(console.error);
