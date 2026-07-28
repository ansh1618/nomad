import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDI4NjM5MCwiZXhwIjoyMDU1ODYyMzkwfQ.OlyFh6MIs2sD5sPqPzX3hB7aW1K-U3_fK1xY7q9K00o";

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDatabaseImages() {
  console.log("Cleaning Supabase database images...");

  // 1. Manali Destinations & Journeys
  await supabase
    .from("destinations")
    .update({
      hero_image: "/images/manali/manali-snow-valley.jpg",
      thumbnail: "/images/manali/manali-snow-valley.jpg",
      cover_image: "/images/manali/manali-snow-valley.jpg",
    })
    .or("slug.ilike.%manali%,name.ilike.%manali%");

  await supabase
    .from("journeys")
    .update({
      hero_banner: "/images/manali/manali-snow-valley.jpg",
      thumbnail: "/images/manali/manali-snow-valley.jpg",
      cover_image: "/images/manali/manali-snow-valley.jpg",
    })
    .or("slug.ilike.%manali%,name.ilike.%manali%");

  // 2. Jibhi Destinations & Journeys
  await supabase
    .from("destinations")
    .update({
      hero_image: "/images/jibhi/jibhi-raghupur-fort-temple.jpg",
      thumbnail: "/images/jibhi/jibhi-raghupur-fort-temple.jpg",
      cover_image: "/images/jibhi/jibhi-raghupur-fort-temple.jpg",
    })
    .or("slug.ilike.%jibhi%,name.ilike.%jibhi%");

  await supabase
    .from("journeys")
    .update({
      hero_banner: "/images/jibhi/jibhi-raghupur-fort-temple.jpg",
      thumbnail: "/images/jibhi/jibhi-raghupur-fort-temple.jpg",
      cover_image: "/images/jibhi/jibhi-raghupur-fort-temple.jpg",
    })
    .or("slug.ilike.%jibhi%,name.ilike.%jibhi%");

  // 3. McLeod Ganj & Dharamshala
  await supabase
    .from("destinations")
    .update({
      hero_image: "/images/mcleodganj/mcleodganj-town-view.jpg",
      thumbnail: "/images/mcleodganj/mcleodganj-town-view.jpg",
      cover_image: "/images/mcleodganj/mcleodganj-town-view.jpg",
    })
    .or("slug.ilike.%mcleod%,name.ilike.%mcleod%,slug.ilike.%dharamshala%,name.ilike.%dharamshala%");

  await supabase
    .from("journeys")
    .update({
      hero_banner: "/images/mcleodganj/mcleodganj-town-view.jpg",
      thumbnail: "/images/mcleodganj/mcleodganj-town-view.jpg",
      cover_image: "/images/mcleodganj/mcleodganj-town-view.jpg",
    })
    .or("slug.ilike.%mcleod%,name.ilike.%mcleod%,slug.ilike.%dharamshala%,name.ilike.%dharamshala%");

  // 4. Udaipur
  await supabase
    .from("destinations")
    .update({
      hero_image: "/images/udaipur-palace.png",
      thumbnail: "/images/udaipur-palace.png",
      cover_image: "/images/udaipur-palace.png",
    })
    .or("slug.ilike.%udaipur%,name.ilike.%udaipur%");

  await supabase
    .from("journeys")
    .update({
      hero_banner: "/images/udaipur-palace.png",
      thumbnail: "/images/udaipur-palace.png",
      cover_image: "/images/udaipur-palace.png",
    })
    .or("slug.ilike.%udaipur%,name.ilike.%udaipur%");

  // 5. Chopta & Tungnath
  await supabase
    .from("destinations")
    .update({
      hero_image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80",
      thumbnail: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80",
      cover_image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80",
    })
    .or("slug.ilike.%chopta%,name.ilike.%chopta%");

  await supabase
    .from("journeys")
    .update({
      hero_banner: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80",
      thumbnail: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80",
      cover_image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80",
    })
    .or("slug.ilike.%chopta%,name.ilike.%chopta%");

  console.log("Database images successfully sanitized!");
}

cleanDatabaseImages().catch(console.error);
