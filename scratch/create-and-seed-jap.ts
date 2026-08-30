/**
 * Creates journey_accommodation_prices table via Supabase Management API
 * then seeds all journey pricing records.
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const PROJECT_REF = "sgeffapbsrppzrgqfpec";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS public.journey_accommodation_prices (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id         uuid NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  accommodation_type text NOT NULL CHECK (accommodation_type IN ('QUAD', 'TRIPLE', 'DOUBLE')),
  price              integer NOT NULL CHECK (price > 0),
  is_active          boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (journey_id, accommodation_type)
);

ALTER TABLE public.journey_accommodation_prices ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'journey_accommodation_prices'
    AND policyname = 'Public can read journey accommodation prices'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Public can read journey accommodation prices"
        ON public.journey_accommodation_prices FOR SELECT
        USING (is_active = true)
    $policy$;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'journey_accommodation_prices'
    AND policyname = 'Admins can manage journey accommodation prices'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can manage journey accommodation prices"
        ON public.journey_accommodation_prices FOR ALL
        USING (true)
        WITH CHECK (true)
    $policy$;
  END IF;
END $$;
`;

async function runSQL(sql: string): Promise<{ data: any; error: any }> {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return { data: null, error: { message: `HTTP ${res.status}: ${text}` } };
  }
  const data = await res.json();
  return { data, error: null };
}

const JOURNEYS = {
  MANALI_3N4D:  "9134531f-cea8-4a8a-8a54-3ce8901a3d7a",
  MANALI_2N3D:  "54af3b8a-21af-4e5a-9857-1ba4fb8bc09e",
  CHOPTA:       "539d3010-9985-4a4e-92bf-2632c9db007c",
  JIBHI:        "33762af3-0226-4477-ac7d-a879a6ecf9a9",
  MCLEOD:       "28881dbc-ead3-4e4d-ba3e-e46f5ff61ffa",
  SPITI_SUMMER: "13ecc937-d39e-434d-a5b8-9f15f8a3d96d",
  UDAIPUR:      "9d3236a0-1777-40fb-997c-fc27cd879c98",
  SPITI_WINTER: "c43cb48e-1ca1-46a3-94c3-e5ab21b1e2b0",
};

function buildPrices(journey_id: string, quad: number, triple: number, dbl: number) {
  return [
    { journey_id, accommodation_type: "QUAD",   price: quad,  is_active: true },
    { journey_id, accommodation_type: "TRIPLE", price: triple,is_active: true },
    { journey_id, accommodation_type: "DOUBLE", price: dbl,   is_active: true },
  ];
}

const SEED_RECORDS = [
  ...buildPrices(JOURNEYS.MANALI_3N4D,  7499, 7999, 8499), // user-specified
  ...buildPrices(JOURNEYS.MANALI_2N3D,  6499, 6999, 7499), // user-specified
  ...buildPrices(JOURNEYS.CHOPTA,       6499, 6999, 7499),
  ...buildPrices(JOURNEYS.JIBHI,        6499, 6999, 7499),
  ...buildPrices(JOURNEYS.MCLEOD,       6499, 6999, 7499),
  ...buildPrices(JOURNEYS.SPITI_SUMMER, 17500, 18000, 18500),
  ...buildPrices(JOURNEYS.UDAIPUR,      6499, 6999, 7499),
  ...buildPrices(JOURNEYS.SPITI_WINTER, 17500, 18000, 18500),
];

async function main() {
  console.log("Step 1: Creating table via Management API...");
  const { data: createResult, error: createErr } = await runSQL(CREATE_TABLE_SQL);
  if (createErr) {
    console.error("Management API table creation failed:", createErr.message);
    console.log("\nFalling back to direct supabase-js upsert (table may already exist)...");
  } else {
    console.log("Table creation SQL executed:", JSON.stringify(createResult));
  }

  // Reload schema cache by making a dummy request
  await new Promise(r => setTimeout(r, 2000));

  console.log("\nStep 2: Seeding journey accommodation prices...");
  const { data: upserted, error: upsertErr } = await supabase
    .from("journey_accommodation_prices")
    .upsert(SEED_RECORDS, { onConflict: "journey_id,accommodation_type" })
    .select();

  if (upsertErr) {
    console.error("Seed failed:", upsertErr.message);
    console.log("\nThe table may need manual SQL creation. Use this SQL in Supabase SQL editor:");
    console.log(CREATE_TABLE_SQL);
    return;
  }

  console.log(`✅ Seeded ${upserted?.length || 0} records\n`);

  // Verify
  const { data: allPrices } = await supabase
    .from("journey_accommodation_prices")
    .select("journey_id, accommodation_type, price, journeys:journey_id(name)")
    .order("journey_id").order("accommodation_type");

  const grouped: Record<string, any[]> = {};
  (allPrices as any[])?.forEach((p: any) => {
    const name = p.journeys?.name || p.journey_id;
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(p);
  });

  console.log("=== FINAL PRICING STATE ===");
  Object.entries(grouped).forEach(([name, prices]) => {
    console.log(`\n${name}:`);
    prices.forEach(p => console.log(`  ${p.accommodation_type.padEnd(8)} ₹${p.price}`));
  });

  const m3Quad = (allPrices as any[])?.find(p => p.journey_id === JOURNEYS.MANALI_3N4D && p.accommodation_type === "QUAD")?.price;
  const m2Quad = (allPrices as any[])?.find(p => p.journey_id === JOURNEYS.MANALI_2N3D && p.accommodation_type === "QUAD")?.price;
  console.log(`\n=== ISOLATION TEST ===`);
  console.log(`Manali 3N/4D QUAD: ₹${m3Quad} (expected: 7499)`);
  console.log(`Manali 2N/3D QUAD: ₹${m2Quad} (expected: 6499)`);
  console.log(m3Quad === 7499 && m2Quad === 6499 ? "✅ PASS" : "❌ FAIL");
}

main().catch(console.error);
