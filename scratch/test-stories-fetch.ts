import { getPublishedStories } from "../src/lib/queries/stories";
import { supabaseAdmin } from "../src/lib/supabase-admin";

async function testStories() {
  console.log("=== TESTING STORIES SUPABASE FETCH ===");
  try {
    const { data: raw, error } = await supabaseAdmin.from('stories').select('*');
    console.log(`Raw DB stories count: ${raw?.length || 0}`);
    if (error) console.error("DB error:", error.message);
    else console.log("Raw stories:", JSON.stringify(raw, null, 2));

    const published = await getPublishedStories({});
    console.log("getPublishedStories result:", JSON.stringify(published, null, 2));
  } catch (err: any) {
    console.error("Fetch Exception:", err.message);
  }
}

testStories().catch(console.error);
