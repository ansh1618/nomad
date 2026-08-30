/**
 * Migration: Create journey_accommodation_prices table
 * and seed correct per-journey prices for all journeys.
 *
 * This replaces hotel_rooms.price_modifier as the pricing source.
 * hotel_rooms continues to exist for room info (type/capacity/images/amenities).
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

// Known journey IDs (from inspection)
const JOURNEYS = {
  MANALI_3N4D:  "9134531f-cea8-4a8a-8a54-3ce8901a3d7a", // Manali Weekend Escape  ₹7,499
  MANALI_2N3D:  "54af3b8a-21af-4e5a-9857-1ba4fb8bc09e", // Manali Quick Escape    ₹6,499
  CHOPTA:       "539d3010-9985-4a4e-92bf-2632c9db007c", // ₹6,499
  JIBHI:        "33762af3-0226-4477-ac7d-a879a6ecf9a9", // ₹6,499
  MCLEOD:       "28881dbc-ead3-4e4d-ba3e-e46f5ff61ffa", // ₹6,499
  SPITI_SUMMER: "13ecc937-d39e-434d-a5b8-9f15f8a3d96d", // ₹17,500
  UDAIPUR:      "9d3236a0-1777-40fb-997c-fc27cd879c98", // ₹6,499
  SPITI_WINTER: "c43cb48e-1ca1-46a3-94c3-e5ab21b1e2b0", // ₹17,500
};

const ACCOMMODATION_TYPES = ["QUAD", "TRIPLE", "DOUBLE"] as const;

function buildPrices(journey_id: string, quad: number, triple: number, double_: number) {
  return [
    { journey_id, accommodation_type: "QUAD",   price: quad,    is_active: true },
    { journey_id, accommodation_type: "TRIPLE", price: triple,  is_active: true },
    { journey_id, accommodation_type: "DOUBLE", price: double_, is_active: true },
  ];
}

async function main() {
  console.log("=== journey_accommodation_prices Migration ===\n");

  // Step 1: Check if table exists
  const { data: existing, error: tableErr } = await supabase
    .from("journey_accommodation_prices")
    .select("id")
    .limit(1);

  if (tableErr && tableErr.message.includes("does not exist")) {
    console.log("Table does not exist. Must be created via Supabase SQL editor.");
    console.log("\nRun the following SQL in your Supabase SQL editor:\n");
    console.log(`
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

-- Row Level Security
ALTER TABLE public.journey_accommodation_prices ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public can read journey accommodation prices"
  ON public.journey_accommodation_prices FOR SELECT
  USING (is_active = true);

-- Admin write
CREATE POLICY "Admins can manage journey accommodation prices"
  ON public.journey_accommodation_prices FOR ALL
  USING (true)
  WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_journey_accommodation_prices_updated_at'
  ) THEN
    CREATE TRIGGER set_journey_accommodation_prices_updated_at
      BEFORE UPDATE ON public.journey_accommodation_prices
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
`);
    console.log("\nAfter running the SQL, re-run this script to seed data.");
    return;
  }

  console.log("Table exists. Proceeding with data seeding...\n");

  // Step 2: Build all seed records
  // Required prices (per user spec):
  const seedRecords = [
    // Manali Weekend Escape 3N/4D — user-specified prices
    ...buildPrices(JOURNEYS.MANALI_3N4D, 7499, 7999, 8499),
    // Manali Quick Escape 2N/3D — user-specified prices
    ...buildPrices(JOURNEYS.MANALI_2N3D, 6499, 6999, 7499),
    // Chopta & Tungnath Trek — ₹6,499 base, +500, +1000
    ...buildPrices(JOURNEYS.CHOPTA, 6499, 6999, 7499),
    // Jibhi Forest Retreat — ₹6,499 base
    ...buildPrices(JOURNEYS.JIBHI, 6499, 6999, 7499),
    // McLeod Ganj — ₹6,499 base
    ...buildPrices(JOURNEYS.MCLEOD, 6499, 6999, 7499),
    // Spiti Summer — ₹17,500 base, +500, +1000
    ...buildPrices(JOURNEYS.SPITI_SUMMER, 17500, 18000, 18500),
    // Udaipur Royal Weekend — ₹6,499 base
    ...buildPrices(JOURNEYS.UDAIPUR, 6499, 6999, 7499),
    // Spiti Winter — ₹17,500 base
    ...buildPrices(JOURNEYS.SPITI_WINTER, 17500, 18000, 18500),
  ];

  console.log(`Upserting ${seedRecords.length} records...`);

  const { data: upserted, error: upsertErr } = await supabase
    .from("journey_accommodation_prices")
    .upsert(seedRecords, { onConflict: "journey_id,accommodation_type" })
    .select();

  if (upsertErr) {
    console.error("Upsert failed:", upsertErr.message);
    return;
  }

  console.log(`Upserted ${upserted?.length || 0} records successfully.\n`);

  // Step 3: Verify
  const { data: allPrices } = await supabase
    .from("journey_accommodation_prices")
    .select(`
      journey_id,
      accommodation_type,
      price,
      is_active,
      journeys:journey_id(name)
    `)
    .order("journey_id")
    .order("accommodation_type");

  console.log("=== FINAL STATE ===");
  const grouped: Record<string, any[]> = {};
  allPrices?.forEach((p: any) => {
    const name = p.journeys?.name || p.journey_id;
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(p);
  });

  Object.entries(grouped).forEach(([name, prices]) => {
    console.log(`\n${name}:`);
    prices.sort((a, b) => a.accommodation_type.localeCompare(b.accommodation_type));
    prices.forEach(p => {
      console.log(`  ${p.accommodation_type.padEnd(8)} → ₹${p.price.toLocaleString("en-IN")}`);
    });
  });

  // Step 4: Isolation test — Manali 3N/4D vs 2N/3D
  const manali3N = allPrices?.filter((p: any) => p.journey_id === JOURNEYS.MANALI_3N4D);
  const manali2N = allPrices?.filter((p: any) => p.journey_id === JOURNEYS.MANALI_2N3D);

  console.log("\n=== ISOLATION TEST ===");
  console.log("Manali 3N/4D:");
  manali3N?.forEach(p => console.log(`  ${p.accommodation_type}: ₹${p.price}`));
  console.log("Manali 2N/3D:");
  manali2N?.forEach(p => console.log(`  ${p.accommodation_type}: ₹${p.price}`));

  const m3Quad = manali3N?.find(p => p.accommodation_type === "QUAD")?.price;
  const m2Quad = manali2N?.find(p => p.accommodation_type === "QUAD")?.price;
  if (m3Quad !== m2Quad) {
    console.log(`\n✅ ISOLATION PASS: 3N/4D QUAD (₹${m3Quad}) ≠ 2N/3D QUAD (₹${m2Quad})`);
  } else {
    console.log(`\n❌ ISOLATION FAIL: Both QUAD prices are ₹${m3Quad}`);
  }
}

main().catch(console.error);
