import { supabaseAdmin } from "../src/lib/supabase-admin";
import { AUTHENTIC_DESTINATION_MEDIA } from "../src/lib/media-resolver";

async function verifyAllDestinationMedia() {
  console.log("=== AUDITING ALL DESTINATION MEDIA IN SUPABASE ===");

  const slugs = ["udaipur", "manali", "jibhi", "mcleodganj", "chopta-tungnath"];

  for (const slug of slugs) {
    const { data, error } = await supabaseAdmin
      .from("destinations")
      .select("id, slug, name, hero_image, gallery")
      .eq("slug", slug)
      .single();

    if (error) {
      console.error(`Destination '${slug}' error:`, error.message);
      continue;
    }

    console.log(`\n📍 [${data.name.toUpperCase()}] (${data.slug})`);
    console.log(`Hero Image: ${data.hero_image}`);
    console.log(`Gallery items count: ${data.gallery?.length || 0}`);

    // Ensure database rows match authentic media strictly
    const expected = AUTHENTIC_DESTINATION_MEDIA[slug] || AUTHENTIC_DESTINATION_MEDIA.udaipur;
    if (data.hero_image !== expected.hero) {
      console.log(` Updating ${slug} DB hero image to authentic target...`);
      await supabaseAdmin
        .from("destinations")
        .update({
          hero_image: expected.hero,
          gallery: expected.gallery
        })
        .eq("id", data.id);
      console.log(`  ✓ Updated ${slug} in Supabase!`);
    } else {
      console.log(`  ✓ Database media verified clean for ${slug}!`);
    }
  }

  // Also verify journeys match destination heroes
  const { data: journeys } = await supabaseAdmin
    .from("journeys")
    .select("id, slug, name, hero_banner, destinations(slug)");

  console.log(`\n=== VERIFYING ${journeys?.length || 0} JOURNEYS ===`);
  for (const j of journeys || []) {
    const destSlug = (j.destinations as any)?.slug || j.slug.split("-")[0];
    const expected = AUTHENTIC_DESTINATION_MEDIA[destSlug] || AUTHENTIC_DESTINATION_MEDIA.udaipur;

    if (!j.hero_banner || j.hero_banner.includes("manali") && destSlug === "udaipur") {
      console.log(`Fixing journey hero banner for ${j.slug}...`);
      await supabaseAdmin
        .from("journeys")
        .update({ hero_banner: expected.hero })
        .eq("id", j.id);
    }
  }

  console.log("\n=== ALL MEDIA AUDIT & DATABASE VERIFICATION COMPLETE ===");
}

verifyAllDestinationMedia().catch(console.error);
