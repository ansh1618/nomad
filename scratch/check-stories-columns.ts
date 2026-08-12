import { supabaseAdmin } from "../src/lib/supabase-admin";

async function checkColumns() {
  const { data, error } = await supabaseAdmin.from('stories').select('*').limit(1);
  if (error) console.error("Error:", error.message);
  else {
    console.log("Stories columns in DB:", Object.keys(data[0] || {}));
  }
}

checkColumns().catch(console.error);
