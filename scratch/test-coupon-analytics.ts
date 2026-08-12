import { supabaseAdmin } from "../src/lib/supabase-admin";

async function testCouponAnalytics() {
  console.log("Testing coupon analytics & usage fetching...");

  // 1. Fetch from coupon_usages table
  const { data: usages, error: usagesErr } = await supabaseAdmin
    .from("coupon_usages")
    .select("*");

  console.log("coupon_usages query:", { count: usages?.length, error: usagesErr });

  // 2. Fetch from bookings table where coupon_code is set
  const { data: bookings, error: bookingsErr } = await supabaseAdmin
    .from("bookings")
    .select("*, journeys(name, slug), departures(departure_date)")
    .not("coupon_code", "is", null);

  console.log("bookings with coupon_code query:", { count: bookings?.length, error: bookingsErr });

  if (bookings && bookings.length > 0) {
    console.log("Sample booking with coupon:", bookings[0]);
  }
}

testCouponAnalytics().catch(console.error);
