import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  console.log("Seeding BPIT Manali + Kasol Trip into Supabase...");

  // 1. Destination: Manali + Kasol
  const destSlug = "manali-kasol";
  const { data: existingDest } = await supabase
    .from("destinations")
    .select("*")
    .eq("slug", destSlug)
    .maybeSingle();

  let destinationId = existingDest?.id;

  if (!destinationId) {
    console.log("Creating destination: Manali + Kasol...");
    const { data: newDest, error: destErr } = await supabase
      .from("destinations")
      .insert({
        slug: destSlug,
        name: "Manali + Kasol",
        subtitle: "The ultimate Himalayan twin-valley student adventure",
        hero_image: "/images/manali/manali-snow-valley.jpg",
        description:
          "Experience the best of Himachal with snow-capped peaks, vibrant cafes, Old Manali lanes, riverside camps, and Parvati Valley vibes.",
        state: "Himachal Pradesh",
        country: "India",
        highlights: [
          "Snow points and mountain drives",
          "Riverside camping by Parvati River",
          "Old Manali and Kasol cafe culture",
          "DJ Night and Dandiya Night festivities"
        ],
        best_time_to_visit: "All Year Round",
        is_published: true,
      })
      .select()
      .single();

    if (destErr) {
      console.error("Failed to create destination:", destErr);
      process.exit(1);
    }
    destinationId = newDest.id;
  }
  console.log("Destination ID:", destinationId);

  // 2. Package: Manali + Kasol × BPIT
  const packageSlug = "manali-kasol-x-bpit";
  const { data: existingJourney } = await supabase
    .from("journeys")
    .select("*")
    .eq("slug", packageSlug)
    .maybeSingle();

  let journeyId = existingJourney?.id;

  const packageData = {
    destination_id: destinationId,
    slug: packageSlug,
    name: "Manali + Kasol × BPIT",
    duration: "3 Nights • 4 Days",
    price: 5500,
    starting_price: 5500,
    transport: "AC Pushback Traveller / Volvo with Professional Driver & Trip Captain",
    difficulty: "Easy to Moderate",
    season: "Autumn / Winter / Spring",
    group_size: "BPIT College Students (1st, 2nd, 3rd & 4th Year)",
    pickup_point: "Delhi NCR (Majnu Ka Tilla / Kashmiri Gate / Rohini)",
    drop_point: "Delhi NCR",
    max_capacity: 50,
    remaining_seats: 38,
    status: "published",
    is_published: true,
    hero_banner: "/images/campus/manali.jpg",
    category: "College Trips",
    highlights: [
      "Open for 1st, 2nd, 3rd & 4th year students — everyone's welcome!",
      "🏔️ 2N Manali + 1N Kasol Riverside Camping 🏕️",
      "💃 Dandiya Night in Manali + DJ Night in Kasol!",
      "🚌 Transport, stays, sightseeing & end-to-end professional coordination.",
      "💰 Package starting at ₹5,500/person.",
      "💙 Professionally planned, hassle-free arrangements and unforgettable memories with friends!",
      "⚠️ Independent trip, not an official BPIT college trip.",
      "🔥 SAME PEOPLE, NEW PLACES, UNFORGETTABLE MEMORIES!"
    ],
    inclusions: [
      "Delhi to Manali to Kasol to Delhi round-trip transportation in sanitized luxury AC Traveller / Volvo",
      "2 Nights hotel accommodation in Manali (Quad / Triple / Double sharing as selected)",
      "1 Night riverside dome / swiss camping in Kasol with riverside bonfire",
      "Daily breakfast and dinner (MAP Meal Plan - 3 Breakfasts & 3 Dinners)",
      "Special Dandiya Night celebration in Manali",
      "High-energy DJ Night in Kasol riverside camp",
      "Guided local sightseeing in Old Manali, Mall Road, Hadimba Temple, and Kasol Market",
      "Experienced Nomadik Trip Captains and 24x7 ground coordination support",
      "All toll taxes, parking charges, state permits, and driver allowances"
    ],
    exclusions: [
      "Personal expenses such as cafe hopping, shopping, extra snacks and beverages",
      "Adventure sports activities (Paragliding, River Rafting, ATV rides)",
      "Any entry tickets to monuments or temple permits not listed in inclusions",
      "Medical insurance and emergency evacuation costs",
      "Anything not specifically mentioned in the inclusions section"
    ],
    policies: [
      "College ID or student identity card is mandatory for BPIT trip participants.",
      "This trip is organized independently by GoNomadik for BPIT students and is not officially affiliated with or endorsed by BPIT college.",
      "Bookings are confirmed only after initial token payment or full amount.",
      "Strict zero-tolerance policy towards harassment, misconduct or unsafe behavior."
    ],
    faqs: [
      {
        question: "Is this an official BPIT college trip?",
        answer: "No. This trip is independently organized and managed by GoNomadik for BPIT students and friends. BPIT is not officially affiliated with, endorsing, or sponsoring this trip."
      },
      {
        question: "Who is eligible to join this trip?",
        answer: "The trip is open for 1st, 2nd, 3rd, and 4th-year BPIT students across all branches and programs, as well as their friends!"
      },
      {
        question: "What sharing options are available?",
        answer: "We offer Quad Sharing (₹5,500/person), Triple Sharing (₹6,000/person), and Double Sharing (₹6,300/person) so you can choose what suits your gang best."
      },
      {
        question: "What is the stay arrangement?",
        answer: "You get 2 Nights in a premium verified hotel in Manali and 1 Night of scenic Riverside Camping right alongside the Parvati River in Kasol."
      },
      {
        question: "How do we book seats?",
        answer: "Select your desired sharing option and number of travelers, click Book Now, and complete the booking wizard. If dates are being confirmed, you can also register your query instantly."
      }
    ],
    gallery: [
      "/images/manali/manali-snow-valley.jpg",
      "/images/manali/manali-atal-tunnel.jpg",
      "/images/manali/manali-summer-mountains.jpg",
      "/images/destinations/manali-atal-tunnel.jpg"
    ]
  };

  if (journeyId) {
    console.log("Updating existing journey:", journeyId);
    await supabase.from("journeys").update(packageData).eq("id", journeyId);
  } else {
    console.log("Inserting new journey:", packageSlug);
    const { data: newJourney, error: journeyErr } = await supabase
      .from("journeys")
      .insert(packageData)
      .select()
      .single();

    if (journeyErr) {
      console.error("Failed to insert journey:", journeyErr);
      process.exit(1);
    }
    journeyId = newJourney.id;
  }
  console.log("Journey ID:", journeyId);

  // 3. Exact Pricing in journey_accommodation_prices:
  // QUAD: 5,500
  // TRIPLE: 6,000
  // DOUBLE: 6,300
  const pricingOptions = [
    { accommodation_type: "QUAD", price: 5500, is_active: true },
    { accommodation_type: "TRIPLE", price: 6000, is_active: true },
    { accommodation_type: "DOUBLE", price: 6300, is_active: true },
  ];

  console.log("Configuring accommodation pricing in journey_accommodation_prices...");
  for (const opt of pricingOptions) {
    const { data: existingPrice } = await supabase
      .from("journey_accommodation_prices")
      .select("id")
      .eq("journey_id", journeyId)
      .eq("accommodation_type", opt.accommodation_type)
      .maybeSingle();

    if (existingPrice) {
      await supabase
        .from("journey_accommodation_prices")
        .update({ price: opt.price, is_active: opt.is_active, updated_at: new Date().toISOString() })
        .eq("id", existingPrice.id);
    } else {
      await supabase.from("journey_accommodation_prices").insert({
        journey_id: journeyId,
        accommodation_type: opt.accommodation_type,
        price: opt.price,
        is_active: opt.is_active,
      });
    }
  }

  // 4. Itinerary Days: 4 draft days in itinerary_days
  console.log("Configuring 4 itinerary days in itinerary_days...");
  const days = [
    {
      day_number: 1,
      title: "Delhi to Manali — Overnight Road Trip Journey",
      description: "Gather with your BPIT college gang at the designated Delhi NCR pickup spot. Board the luxury AC vehicle, meet your Nomadik trip captain, and kick off the Himalayan road trip with music, games, and pitstops.",
      meals: ["Dinner on route", "Breakfast on arrival"],
      stay: "Overnight journey / Check-in Manali",
      transport: "Luxury AC Traveller / Volvo",
      sort_order: 1,
      image_url: "/images/manali/manali-snow-valley.jpg"
    },
    {
      day_number: 2,
      title: "Manali Arrival, Old Manali Cafe Hopping & Dandiya Night",
      description: "Check into the hotel, refresh, and head out to explore Hadimba Devi Temple, the bohemian cafes of Old Manali, and the vibrant local mall road. As twilight descends, gear up for an electrifying Dandiya Night with your college squad!",
      meals: ["Breakfast", "Dinner"],
      stay: "Premium Hotel, Manali",
      transport: "Sightseeing transfers",
      sort_order: 2,
      image_url: "/images/manali/manali-summer-mountains.jpg"
    },
    {
      day_number: 3,
      title: "Manali to Kasol — Riverside Camp Check-in & DJ Night",
      description: "Post breakfast, embark on a picturesque drive to Parvati Valley. Reach Kasol and settle into comfortable Riverside Camping tents right beside the rushing Parvati River. Evening comes alive with a high-energy DJ Night and cozy bonfire vibes under the stars.",
      meals: ["Breakfast", "Dinner"],
      stay: "Riverside Camping, Kasol",
      transport: "Scenic valley drive",
      sort_order: 3,
      image_url: "/images/destinations/manali-atal-tunnel.jpg"
    },
    {
      day_number: 4,
      title: "Kasol Cafe Trail, Manikaran Sahib & Return to Delhi",
      description: "Wake up to misty river views, enjoy a hearty riverside breakfast, and explore Kasol's famous Israeli cafes or take a spiritual dip at Manikaran Sahib hot springs. Board our evening ride back to Delhi with phone galleries full of epic college memories.",
      meals: ["Breakfast"],
      stay: "Overnight return journey",
      transport: "Return to Delhi NCR",
      sort_order: 4,
      image_url: "/images/manali/manali-atal-tunnel.jpg"
    }
  ];

  await supabase.from("itinerary_days").delete().eq("journey_id", journeyId);

  for (const d of days) {
    const { error: insErr } = await supabase.from("itinerary_days").insert({
      journey_id: journeyId,
      ...d
    });
    if (insErr) {
      console.error(`Failed to insert day ${d.day_number}:`, insErr);
    } else {
      console.log(`Inserted day ${d.day_number}`);
    }
  }

  // 5. Departures: Ensure upcoming departures exist
  const { data: existingDeps } = await supabase
    .from("departures")
    .select("id")
    .eq("journey_id", journeyId)
    .limit(1);

  if (!existingDeps || existingDeps.length === 0) {
    console.log("Creating upcoming departure for Manali + Kasol × BPIT...");
    const depDate = new Date();
    depDate.setDate(depDate.getDate() + 14);
    const retDate = new Date(depDate);
    retDate.setDate(retDate.getDate() + 4);

    await supabase.from("departures").insert({
      journey_id: journeyId,
      departure_date: depDate.toISOString().split("T")[0],
      return_date: retDate.toISOString().split("T")[0],
      total_seats: 50,
      available_seats: 38,
      booked_seats: 12,
      base_price: 5500,
      pickup_location: "Delhi NCR (Majnu Ka Tilla / Kashmiri Gate)",
      drop_location: "Delhi NCR",
      pickup_time: "07:30 PM",
      status: "scheduled",
      is_visible: true,
      notes: "Exclusive BPIT College Batch Departure"
    });
  }

  // 6. Update student_offer_packages in site_settings so BPIT appears prominently
  const { data: ssPkgs } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "student_offer_packages")
    .maybeSingle();

  let pkgsList = [];
  if (ssPkgs?.value) {
    try {
      pkgsList = JSON.parse(ssPkgs.value);
    } catch {}
  }

  const bpitOffer = {
    id: `pkg-${journeyId}`,
    package_id: journeyId,
    is_eligible: true,
    override_global_discount: true,
    custom_discount_percentage: 0,
    is_active: true,
    display_order: 0,
    is_featured: true,
    college_name: "BPIT",
    college_logo: "/images/campus/bpit-logo.svg",
    package: {
      id: journeyId,
      slug: packageSlug,
      name: "Manali + Kasol × BPIT",
      duration: "3 Nights • 4 Days",
      starting_price: 5500,
      hero_banner: "/images/campus/manali.jpg",
      destinations: {
        id: destinationId,
        name: "Manali + Kasol",
        slug: destSlug
      }
    },
    updated_at: new Date().toISOString()
  };

  pkgsList = pkgsList.filter((p) => p.package_id !== journeyId && p.package?.slug !== packageSlug);
  pkgsList.unshift(bpitOffer);

  await supabase.from("site_settings").upsert({
    key: "student_offer_packages",
    value: JSON.stringify(pkgsList),
    description: "Eligible packages for College Student Program",
    updated_at: new Date().toISOString()
  }, { onConflict: "key" });

  console.log("Successfully seeded BPIT Manali + Kasol Trip into Supabase!");
  process.exit(0);
}

main().catch(err => {
  console.error("Seeding error:", err);
  process.exit(1);
});
