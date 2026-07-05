import fs from "fs";
import { destinations } from "./src/data/destinations.js";
import { journeys } from "./src/data/journeys.js";

function escapeSql(str: string | undefined | null) {
  if (!str) return "NULL";
  return "'" + str.replace(/'/g, "''") + "'";
}

function escapeJson(obj: any) {
  if (!obj) return "NULL";
  return "'" + JSON.stringify(obj).replace(/'/g, "''") + "'::jsonb";
}

let sql = `-- Seed Destinations\n`;

for (const dest of destinations) {
  sql += `INSERT INTO public.destinations (slug, name, subtitle, hero_image, description, weather, how_to_reach, seo) VALUES (
    ${escapeSql(dest.slug)},
    ${escapeSql(dest.name)},
    ${escapeSql(dest.subtitle)},
    ${escapeSql(dest.image)},
    ${escapeSql(dest.overview)},
    ${escapeJson(dest.weather)},
    ${escapeJson(dest.howToReach)},
    ${escapeJson({ title: `${dest.name} Tour Packages | Nomadik`, description: dest.subtitle })}
  ) ON CONFLICT (slug) DO NOTHING;\n`;
}

sql += `\n-- Seed Journeys\n`;

for (const journey of journeys) {
  let parsedPrice = 0;
  if (typeof journey.price === "string") {
    parsedPrice = parseInt(journey.price.replace(/[^\d]/g, ""), 10) || 0;
  }

  sql += `
  INSERT INTO public.journeys (destination_id, slug, name, price, duration, transport, difficulty, distance, season, group_size, itinerary, hotel, food, gallery)
  SELECT id, ${escapeSql(journey.slug)}, ${escapeSql(journey.name)}, ${parsedPrice}, ${escapeSql(journey.duration)}, ${escapeSql(journey.transport)}, ${escapeSql(journey.difficulty)}, ${escapeSql(journey.distance)}, ${escapeSql(journey.bestSeason)}, ${escapeSql(journey.groupSize)}, ${escapeJson(journey.itinerary)}, 'Premium Stays / Camps', 'Meals Included as per Itinerary', ${escapeJson([journey.image])}
  FROM public.destinations WHERE slug = ${escapeSql(journey.destinationSlug)}
  ON CONFLICT (slug) DO NOTHING;\n`;
}

fs.writeFileSync("supabase/seed_data.sql", sql);
console.log("Generated supabase/seed_data.sql successfully.");
