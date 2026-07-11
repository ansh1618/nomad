import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (typeof process !== "undefined" ? process.env.VITE_SUPABASE_URL : null) || import.meta.env.VITE_SUPABASE_URL || "";
const supabaseServiceRoleKey = (typeof process !== "undefined" ? process.env.SUPABASE_SERVICE_ROLE_KEY : null) || "";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn("Supabase URL or Service Role Key is missing in server environment.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
