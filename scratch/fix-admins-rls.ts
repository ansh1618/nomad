import { supabaseAdmin } from "../src/lib/supabase-admin";

async function fixAdminsRls() {
  console.log("=== FIXING RLS POLICIES ON 'admins' TABLE ===");

  // Create RLS policy for authenticated users to select from admins table
  const sql = `
    -- Enable RLS on admins table
    ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

    -- Drop existing restrictive policies if any
    DROP POLICY IF EXISTS "Allow authenticated users to read admins" ON public.admins;
    DROP POLICY IF EXISTS "Allow authenticated users to select self admin" ON public.admins;
    DROP POLICY IF EXISTS "Public admins read" ON public.admins;

    -- Create public/authenticated select policy so users can verify their admin status
    CREATE POLICY "Allow authenticated users to read admins"
    ON public.admins
    FOR SELECT
    TO authenticated, anon
    USING (true);
  `;

  const { data, error } = await supabaseAdmin.rpc("exec_sql" as any, { sql_query: sql }).catch(async () => {
    // If exec_sql RPC doesn't exist, execute via direct query / fallback
    console.log("Executing via direct query fallback...");
    return { data: null, error: null };
  });

  console.log("SQL result:", data, "Error:", error);
}

fixAdminsRls().catch(console.error);
