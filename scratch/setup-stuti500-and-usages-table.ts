import { supabaseAdmin } from "../src/lib/supabase-admin";
import { supabase } from "../src/lib/supabase";

async function setup() {
  console.log("Setting up STUTI500 coupon & checking coupon_usages table...");

  // 1. Try creating coupon_usages table via exec_sql RPC if available
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS public.coupon_usages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
      coupon_code TEXT NOT NULL,
      booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
      user_id UUID,
      customer_name TEXT,
      customer_phone TEXT,
      customer_email TEXT,
      journey_id UUID,
      journey_name TEXT,
      departure_date TEXT,
      original_amount NUMERIC NOT NULL DEFAULT 0,
      discount_amount NUMERIC NOT NULL DEFAULT 0,
      final_amount NUMERIC NOT NULL DEFAULT 0,
      used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT unique_booking_coupon UNIQUE (coupon_code, booking_id)
    );

    ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'coupon_usages' AND policyname = 'Public select coupon_usages'
      ) THEN
        CREATE POLICY "Public select coupon_usages" ON public.coupon_usages FOR SELECT USING (true);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'coupon_usages' AND policyname = 'Public insert coupon_usages'
      ) THEN
        CREATE POLICY "Public insert coupon_usages" ON public.coupon_usages FOR INSERT WITH CHECK (true);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'coupon_usages' AND policyname = 'Public update coupon_usages'
      ) THEN
        CREATE POLICY "Public update coupon_usages" ON public.coupon_usages FOR UPDATE USING (true);
      END IF;
    END $$;
  `;

  console.log("Attempting to execute SQL migration via RPC...");
  let rpcSuccess = false;
  try {
    const { data, error } = await supabaseAdmin.rpc("exec_sql" as any, { sql: createTableSql });
    if (!error) {
      console.log("RPC exec_sql succeeded:", data);
      rpcSuccess = true;
    } else {
      console.log("RPC exec_sql error:", error);
    }
  } catch (err) {
    console.log("RPC exec_sql exception:", err);
  }

  if (!rpcSuccess) {
    try {
      const { data, error } = await supabaseAdmin.rpc("exec_sql" as any, { sql_query: createTableSql });
      if (!error) {
        console.log("RPC exec_sql (sql_query) succeeded:", data);
        rpcSuccess = true;
      } else {
        console.log("RPC exec_sql (sql_query) error:", error);
      }
    } catch (err) {
      console.log("RPC exec_sql (sql_query) exception:", err);
    }
  }

  // 2. Check if STUTI500 coupon exists in coupons table
  const { data: existing, error: findErr } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", "STUTI500");

  console.log("Existing STUTI500 check:", { existing, findErr });

  if (!existing || existing.length === 0) {
    console.log("Creating STUTI500 coupon in DB...");
    const { data: inserted, error: insertErr } = await supabase
      .from("coupons")
      .insert({
        code: "STUTI500",
        description: "₹500 OFF all journeys",
        discount_type: "FLAT", // or FIXED
        discount_value: 500,
        min_amount: 0,
        used_count: 0,
        is_active: true,
      })
      .select()
      .single();

    console.log("STUTI500 insertion result:", { inserted, insertErr });
  } else {
    console.log("STUTI500 coupon already exists:", existing[0]);
    // Ensure active and discount_value is 500
    const { data: updated, error: updateErr } = await supabase
      .from("coupons")
      .update({
        discount_value: 500,
        is_active: true,
      })
      .eq("code", "STUTI500")
      .select()
      .single();
    console.log("STUTI500 update result:", { updated, updateErr });
  }

  // 3. Test querying coupon_usages table
  const { data: testUsages, error: testErr } = await supabase.from("coupon_usages").select("*").limit(1);
  console.log("Test querying coupon_usages table:", { testUsages, testErr });
}

setup().catch(console.error);
