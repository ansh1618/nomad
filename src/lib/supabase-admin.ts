import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (typeof process !== "undefined" ? process.env.VITE_SUPABASE_URL : null) || import.meta.env?.VITE_SUPABASE_URL || "";
const supabaseServiceRoleKey = (typeof process !== "undefined" ? process.env.SUPABASE_SERVICE_ROLE_KEY : null) || "";

if (!supabaseUrl) {
  console.error("❌ [supabase-admin] FATAL: VITE_SUPABASE_URL is missing. Add it to .env");
}
if (!supabaseServiceRoleKey || supabaseServiceRoleKey === "YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE") {
  console.error("❌ [supabase-admin] FATAL: SUPABASE_SERVICE_ROLE_KEY is missing or is still the placeholder.");
  console.error("   → Go to Supabase Dashboard → Settings → API → copy the 'service_role' key");
  console.error("   → Add it to your .env file: SUPABASE_SERVICE_ROLE_KEY=eyJ...");
  console.error("   → Restart the dev server after adding it");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
