import { supabaseAdmin } from "../src/lib/supabase-admin";

async function publishAll() {
  console.log("=== PUBLISHING ALL DESTINATIONS & JOURNEYS IN SUPABASE ===");

  // 1. Update destinations table: ensure chopta slug is clean ('chopta' and 'chopta-tungnath')
  const { data: dests, error: destErr } = await supabaseAdmin
    .from("destinations")
    .select("id, slug, name");

  console.log("Current destinations:", dests, destErr);

  // Update destinations to be published
  const { error: dUpdateErr } = await supabaseAdmin
    .from("destinations")
    .update({ is_published: true })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (dUpdateErr) console.error("Error publishing destinations:", dUpdateErr);
  else console.log("✔ All destinations set to is_published = true");

  // Fix chopta slug in destinations if it's 'chopta-tungnath'
  const choptaDest = dests?.find(d => d.slug === "chopta-tungnath" || d.name.toLowerCase().includes("chopta"));
  if (choptaDest) {
    const { error: choptaErr } = await supabaseAdmin
      .from("destinations")
      .update({ slug: "chopta", is_published: true })
      .eq("id", choptaDest.id);
    if (choptaErr) console.error("Error updating chopta slug:", choptaErr);
    else console.log("✔ Chopta destination slug updated to 'chopta'");
  }

  // 2. Update journeys table: set is_published = true and status = 'PUBLISHED' for all
  const { error: jUpdateErr } = await supabaseAdmin
    .from("journeys")
    .update({ is_published: true, status: "PUBLISHED" })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (jUpdateErr) console.error("Error publishing journeys:", jUpdateErr);
  else console.log("✔ All journeys set to is_published = true and status = 'PUBLISHED'");

  // Re-query to verify
  const { data: updatedD } = await supabaseAdmin.from("destinations").select("id, slug, name, is_published");
  console.log("Updated destinations:", updatedD);

  const { data: updatedJ } = await supabaseAdmin.from("journeys").select("id, slug, name, is_published, status, destination_id");
  console.log("Updated journeys:", updatedJ);
}

publishAll().catch(console.error);
