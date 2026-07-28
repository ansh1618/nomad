import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sgeffapbsrppzrgqfpec.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDI4NjM5MCwiZXhwIjoyMDU1ODYyMzkwfQ.OlyFh6MIs2sD5sPqPzX3hB7aW1K-U3_fK1xY7q9K00o";

const supabase = createClient(supabaseUrl, supabaseKey);

const srcDir = "C:\\Users\\ansht\\.gemini\\antigravity-ide\\brain\\6676c100-1d67-4535-b1cf-7d514ce53228";
const publicImages = "c:\\Users\\ansht\\Downloads\\wandernest-travels-launch-main\\wandernest-travels-launch-main\\public\\images";

const manaliImgSrc = path.join(srcDir, "media__1785227892947.jpg");
const mcleodImgSrc = path.join(srcDir, "media__1785227893044.jpg");
const jibhiImgSrc = path.join(srcDir, "media__1785227905560.jpg");

// Target local paths
const manaliDest = path.join(publicImages, "manali", "manali-snow-valley.jpg");
const manaliAtal = path.join(publicImages, "manali", "atal-tunnel.jpg");
const mcleodDest = path.join(publicImages, "mcleodganj", "mcleodganj-town-view.jpg");
const jibhiDest = path.join(publicImages, "jibhi", "jibhi-raghupur-fort-temple.jpg");

fs.copyFileSync(manaliImgSrc, manaliDest);
fs.copyFileSync(manaliImgSrc, manaliAtal);
fs.copyFileSync(mcleodImgSrc, mcleodDest);
fs.copyFileSync(jibhiImgSrc, jibhiDest);

console.log("Local photography files updated successfully!");

async function updateDb() {
  console.log("Updating Supabase database rows with exact destination images...");

  // Manali
  await supabase.from("destinations").update({
    hero_image: "/images/manali/manali-snow-valley.jpg",
    thumbnail: "/images/manali/manali-snow-valley.jpg",
    cover_image: "/images/manali/manali-snow-valley.jpg",
  }).or("slug.ilike.%manali%,name.ilike.%manali%");

  await supabase.from("journeys").update({
    hero_banner: "/images/manali/manali-snow-valley.jpg",
    thumbnail: "/images/manali/manali-snow-valley.jpg",
    cover_image: "/images/manali/manali-snow-valley.jpg",
  }).or("slug.ilike.%manali%,name.ilike.%manali%");

  // McLeod Ganj
  await supabase.from("destinations").update({
    hero_image: "/images/mcleodganj/mcleodganj-town-view.jpg",
    thumbnail: "/images/mcleodganj/mcleodganj-town-view.jpg",
    cover_image: "/images/mcleodganj/mcleodganj-town-view.jpg",
  }).or("slug.ilike.%mcleod%,name.ilike.%mcleod%,slug.ilike.%dharamshala%,name.ilike.%dharamshala%");

  await supabase.from("journeys").update({
    hero_banner: "/images/mcleodganj/mcleodganj-town-view.jpg",
    thumbnail: "/images/mcleodganj/mcleodganj-town-view.jpg",
    cover_image: "/images/mcleodganj/mcleodganj-town-view.jpg",
  }).or("slug.ilike.%mcleod%,name.ilike.%mcleod%,slug.ilike.%dharamshala%,name.ilike.%dharamshala%");

  // Jibhi
  await supabase.from("destinations").update({
    hero_image: "/images/jibhi/jibhi-raghupur-fort-temple.jpg",
    thumbnail: "/images/jibhi/jibhi-raghupur-fort-temple.jpg",
    cover_image: "/images/jibhi/jibhi-raghupur-fort-temple.jpg",
  }).or("slug.ilike.%jibhi%,name.ilike.%jibhi%");

  await supabase.from("journeys").update({
    hero_banner: "/images/jibhi/jibhi-raghupur-fort-temple.jpg",
    thumbnail: "/images/jibhi/jibhi-raghupur-fort-temple.jpg",
    cover_image: "/images/jibhi/jibhi-raghupur-fort-temple.jpg",
  }).or("slug.ilike.%jibhi%,name.ilike.%jibhi%");

  console.log("Supabase database updated successfully!");
}

updateDb().catch(console.error);
