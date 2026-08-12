import { supabaseAdmin } from "../src/lib/supabase-admin";

async function testInsert() {
  const { data, error } = await supabaseAdmin.from('stories').insert({
    title: "Test Story",
    slug: "test-story-2",
    category: "Adventure",
    snippet: "Test snippet",
    image_url: "/images/destinations/manali-atal-tunnel.jpg"
  }).select('*');

  if (error) console.error("Insert error:", error.message);
  else {
    console.log("Inserted test row successfully!");
    console.log("Columns present in table:", Object.keys(data[0]));
    // Clean up test row
    await supabaseAdmin.from('stories').delete().eq('slug', 'test-story-2');
  }
}

testInsert().catch(console.error);
