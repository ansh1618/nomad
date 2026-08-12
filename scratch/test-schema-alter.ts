import { supabaseAdmin } from "../src/lib/supabase-admin";

async function testAlter() {
  console.log("Testing schema creation via Supabase...");

  // Try creating new columns using rpc if query function exists or checking rest capabilities
  const { error } = await supabaseAdmin.from('reviews').update({ title: 'Test' }).eq('id', 'non-existent-id');
  console.log("Update title error:", error?.message);
}

testAlter().catch(console.error);
