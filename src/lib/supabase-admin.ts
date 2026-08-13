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

let adminClientInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (adminClientInstance) return adminClientInstance;

  const url = getEnvVar("VITE_SUPABASE_URL") || getEnvVar("SUPABASE_URL");
  const serviceKey = getEnvVar("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    if (typeof window === "undefined") {
      console.error("[Supabase Admin] Environment variables missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
    }
    return null;
  }

  try {
    adminClientInstance = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return adminClientInstance;
  } catch (err: any) {
    if (typeof window === "undefined") {
      console.error("[Supabase Admin] Failed to initialize admin client:", err?.message || err);
    }
    return null;
  }
}

function createSafeAdminProxy(): any {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        const client = getSupabaseAdmin();
        if (client && (client as any)[prop]) {
          const value = (client as any)[prop];
          return typeof value === "function" ? value.bind(client) : value;
        }

        if (prop === "from") {
          return () => createMockQueryBuilder();
        }
        if (prop === "rpc") {
          return async () => ({ data: null, error: { message: "Supabase admin unavailable" } });
        }
        if (prop === "storage") {
          return {
            from: () => ({
              list: async () => ({ data: [], error: null }),
              getPublicUrl: () => ({ data: { publicUrl: "" } }),
              upload: async () => ({ data: null, error: { message: "Supabase admin storage unavailable" } }),
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
    gt: () => mockBuilder,
    gte: () => mockBuilder,
    lt: () => mockBuilder,
    lte: () => mockBuilder,
    like: () => mockBuilder,
    ilike: () => mockBuilder,
    is: () => mockBuilder,
    in: () => mockBuilder,
    or: () => mockBuilder,
    not: () => mockBuilder,
    order: () => mockBuilder,
    limit: () => mockBuilder,
    range: () => mockBuilder,
    single: async () => ({ data: null, error: { message: "Supabase admin unavailable" } }),
    maybeSingle: async () => ({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null, count: 0 }),
  };
  return mockBuilder;
}

export const supabaseAdmin = createSafeAdminProxy();
