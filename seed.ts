import { createClient } from "@supabase/supabase-js";
import { destinations } from "./src/data/destinations.js";
import { journeys } from "./src/data/journeys.js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Starting seed process...");

  // 1. Seed Destinations
  const destIdMap = new Map<string, string>(); // slug -> id

  for (const dest of destinations) {
    console.log(`Seeding destination: ${dest.name}`);
    const { data, error } = await supabase
      .from("destinations")
      .upsert(
        {
          slug: dest.slug,
          name: dest.name,
          subtitle: dest.subtitle,
          hero_image: dest.image,
          description: dest.overview,
          weather: dest.weather,
          how_to_reach: dest.howToReach,
          seo: {
            title: `${dest.name} Tour Packages | Nomadik`,
            description: dest.subtitle
          }
        },
        { onConflict: "slug" }
      )
      .select("id")
      .single();

    if (error) {
      console.error(`Error seeding destination ${dest.name}:`, error);
      continue;
    }

    if (data) {
      destIdMap.set(dest.slug, data.id);
      
      // Seed Reviews for this destination
      if (dest.reviews && dest.reviews.length > 0) {
        for (const review of dest.reviews) {
          await supabase.from("reviews").insert({
            name: review.name,
            destination: dest.name,
            rating: review.rating,
            review: review.text,
            photo: review.avatar,
            approved: true
          });
        }
      }
    }
  }

  console.log("Destinations seeded successfully.");

  // 2. Seed Journeys
  for (const journey of journeys) {
    console.log(`Seeding journey: ${journey.name}`);
    const destinationId = destIdMap.get(journey.destinationSlug);
    
    if (!destinationId) {
      console.warn(`Destination not found for journey ${journey.slug} (slug: ${journey.destinationSlug})`);
      continue;
    }

    // Convert price string (e.g. "₹14,500") to integer (14500)
    let parsedPrice = 0;
    if (typeof journey.price === "string") {
      parsedPrice = parseInt(journey.price.replace(/[^\d]/g, ""), 10) || 0;
    }

    const { error } = await supabase
      .from("journeys")
      .upsert(
        {
          slug: journey.slug,
          destination_id: destinationId,
          name: journey.name,
          price: parsedPrice,
          duration: journey.duration,
          transport: journey.transport,
          difficulty: journey.difficulty,
          distance: journey.distance,
          season: journey.bestSeason,
          group_size: journey.groupSize,
          itinerary: journey.itinerary,
          hotel: "Premium Stays / Camps",
          food: "Meals Included as per Itinerary",
          gallery: [journey.image]
        },
        { onConflict: "slug" }
      );

    if (error) {
      console.error(`Error seeding journey ${journey.name}:`, error);
    }
  }

  console.log("Journeys seeded successfully.");
  console.log("Seed process completed!");
}

seed().catch(console.error);
