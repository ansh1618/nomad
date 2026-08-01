import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getEnvVar(key: string): string {
  let val = "";
  try {
    if (typeof import.meta !== "undefined" && (import.meta as any).env) {
      val = (import.meta as any).env[key] || "";
    }
  } catch {}

  if (!val && typeof process !== "undefined" && process.env) {
    val = process.env[key] || "";
  }
  return val;
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const url = getEnvVar("VITE_SUPABASE_URL") || getEnvVar("SUPABASE_URL");
  const anonKey = getEnvVar("VITE_SUPABASE_ANON_KEY") || getEnvVar("SUPABASE_ANON_KEY");

  if (!url || !anonKey) {
    console.error("[Supabase Client] Environment variables missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
    return null;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: typeof window !== "undefined",
        autoRefreshToken: typeof window !== "undefined",
        detectSessionInUrl: typeof window !== "undefined",
      },
    });
    return supabaseInstance;
  } catch (err: any) {
    console.error("[Supabase Client] Failed to initialize Supabase client:", err?.message || err);
    return null;
  }
}

// Exception-safe proxy for legacy `import { supabase } from "@/lib/supabase"` calls
function createSafeSupabaseProxy(): any {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        const client = getSupabase();
        if (client && (client as any)[prop]) {
          const value = (client as any)[prop];
          return typeof value === "function" ? value.bind(client) : value;
        }

        // Return safe mock builder methods if client is null or unavailable
        if (prop === "from") {
          return () => createMockQueryBuilder();
        }
        if (prop === "rpc") {
          return async () => ({ data: null, error: { message: "Supabase client unavailable" } });
        }
        if (prop === "auth") {
          return {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            getUser: async () => ({ data: { user: null }, error: null }),
          };
        }
        if (prop === "storage") {
          return {
            from: () => ({
              list: async () => ({ data: [], error: null }),
              getPublicUrl: () => ({ data: { publicUrl: "" } }),
            }),
          };
        }

        return undefined;
      },
    }
  );
}

function createMockQueryBuilder(): any {
  const mockBuilder: any = {
    select: () => mockBuilder,
    insert: () => mockBuilder,
    update: () => mockBuilder,
    delete: () => mockBuilder,
    eq: () => mockBuilder,
    neq: () => mockBuilder,
    or: () => mockBuilder,
    in: () => mockBuilder,
    is: () => mockBuilder,
    order: () => mockBuilder,
    limit: () => mockBuilder,
    single: async () => ({ data: null, error: { message: "Supabase client unavailable" } }),
    maybeSingle: async () => ({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null, count: 0 }),
  };
  return mockBuilder;
}

export const supabase = createSafeSupabaseProxy();
