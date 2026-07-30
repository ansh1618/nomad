import { createClient } from "@supabase/supabase-js";

const env = (typeof import.meta !== "undefined" && (import.meta as any).env) ? (import.meta as any).env : process.env;
const supabaseUrl = env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or Anon Key is missing. Check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
