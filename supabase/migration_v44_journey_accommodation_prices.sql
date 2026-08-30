-- ============================================================
-- Migration v44: Journey-Scoped Accommodation Pricing
-- 
-- Pricing identity: journey_id + accommodation_type
-- NOT: hotel_id + accommodation_type
--
-- hotel_rooms is NOT touched/deleted — it continues to serve
-- room metadata (capacity, images, amenities, descriptions).
-- hotel_rooms.price_modifier is NO LONGER the source of 
-- package selling price.
--
-- Only two explicit seed records are created:
--   1. Manali Weekend Escape — 3N/4D
--   2. Manali Quick Escape   — 2N/3D
--
-- All other packages get NO synthetic pricing records.
-- If a package has no records, the UI shows "Not configured".
-- ============================================================

-- 1. Create journey_accommodation_prices table
CREATE TABLE IF NOT EXISTS public.journey_accommodation_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    journey_id UUID NOT NULL
        REFERENCES public.journeys(id)
        ON DELETE CASCADE,

    accommodation_type TEXT NOT NULL
        CHECK (accommodation_type IN ('QUAD', 'TRIPLE', 'DOUBLE', 'SINGLE', 'DORM')),

    price INTEGER NOT NULL
        CHECK (price >= 0),

    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Pricing is journey-scoped: one price per journey per accommodation type
    CONSTRAINT uq_journey_accommodation_type
        UNIQUE (journey_id, accommodation_type)
);

-- 2. Enable RLS
ALTER TABLE public.journey_accommodation_prices ENABLE ROW LEVEL SECURITY;

-- Public read (needed for booking UI)
DROP POLICY IF EXISTS "jap_public_read" ON public.journey_accommodation_prices;
CREATE POLICY "jap_public_read" ON public.journey_accommodation_prices
    FOR SELECT USING (true);

-- Service role full access (needed for server functions)
DROP POLICY IF EXISTS "jap_service_all" ON public.journey_accommodation_prices;
CREATE POLICY "jap_service_all" ON public.journey_accommodation_prices
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated admin write (needed for admin panel)
DROP POLICY IF EXISTS "jap_admin_write" ON public.journey_accommodation_prices;
CREATE POLICY "jap_admin_write" ON public.journey_accommodation_prices
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. updated_at trigger
CREATE OR REPLACE FUNCTION public.update_journey_accommodation_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_jap_updated_at ON public.journey_accommodation_prices;
CREATE TRIGGER trg_jap_updated_at
    BEFORE UPDATE ON public.journey_accommodation_prices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_journey_accommodation_prices_updated_at();

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_jap_journey_id
    ON public.journey_accommodation_prices (journey_id);

CREATE INDEX IF NOT EXISTS idx_jap_journey_type_active
    ON public.journey_accommodation_prices (journey_id, accommodation_type)
    WHERE is_active = true;

-- 5. Seed ONLY the two Manali packages
-- Uses slug-based lookup so this is safe to run on any environment.
-- If the slug does not exist, no records are inserted (no error thrown).
--
-- ============================================================
-- PRE-INSPECTION: How many journeys currently exist?
-- (Logged as a notice, not blocking)
-- ============================================================
DO $$
DECLARE
    v_journey_count INTEGER;
    v_3n4d_id UUID;
    v_2n3d_id UUID;
    v_inserted INTEGER := 0;
BEGIN
    -- Inspect existing journey count
    SELECT COUNT(*) INTO v_journey_count FROM public.journeys WHERE is_deleted = false;
    RAISE NOTICE '[Migration v44] Journeys inspected: %', v_journey_count;

    -- Look up Manali Weekend Escape 3N/4D
    -- Try multiple likely slugs since the exact slug depends on when it was created
    SELECT id INTO v_3n4d_id
    FROM public.journeys
    WHERE is_deleted = false
      AND (
          slug ILIKE '%manali%weekend%escape%'
          OR slug ILIKE '%manali-weekend%'
          OR name ILIKE '%Manali Weekend Escape%'
          OR (name ILIKE '%Manali%' AND name ILIKE '%3N%')
          OR (name ILIKE '%Manali%' AND name ILIKE '%3 Night%')
      )
    ORDER BY created_at ASC
    LIMIT 1;

    -- Look up Manali Quick Escape 2N/3D
    SELECT id INTO v_2n3d_id
    FROM public.journeys
    WHERE is_deleted = false
      AND (
          slug ILIKE '%manali%quick%escape%'
          OR slug ILIKE '%manali-quick%'
          OR name ILIKE '%Manali Quick Escape%'
          OR (name ILIKE '%Manali%' AND name ILIKE '%2N%')
          OR (name ILIKE '%Manali%' AND name ILIKE '%2 Night%')
      )
    ORDER BY created_at ASC
    LIMIT 1;

    RAISE NOTICE '[Migration v44] Manali 3N/4D journey_id: %', COALESCE(v_3n4d_id::TEXT, 'NOT FOUND');
    RAISE NOTICE '[Migration v44] Manali 2N/3D journey_id: %', COALESCE(v_2n3d_id::TEXT, 'NOT FOUND');

    -- Seed Manali Weekend Escape 3N/4D prices
    IF v_3n4d_id IS NOT NULL THEN
        INSERT INTO public.journey_accommodation_prices
            (journey_id, accommodation_type, price, is_active)
        VALUES
            (v_3n4d_id, 'QUAD',   7499, true),
            (v_3n4d_id, 'TRIPLE', 7999, true),
            (v_3n4d_id, 'DOUBLE', 8499, true)
        ON CONFLICT (journey_id, accommodation_type)
        DO UPDATE SET
            price      = EXCLUDED.price,
            is_active  = true,
            updated_at = now();

        GET DIAGNOSTICS v_inserted = ROW_COUNT;
        RAISE NOTICE '[Migration v44] Manali 3N/4D: % pricing records created/updated (QUAD=7499, TRIPLE=7999, DOUBLE=8499)', 3;
    ELSE
        RAISE WARNING '[Migration v44] Manali 3N/4D package NOT FOUND — no pricing records created. Apply manually after creating the package.';
    END IF;

    -- Seed Manali Quick Escape 2N/3D prices
    IF v_2n3d_id IS NOT NULL THEN
        INSERT INTO public.journey_accommodation_prices
            (journey_id, accommodation_type, price, is_active)
        VALUES
            (v_2n3d_id, 'QUAD',   6499, true),
            (v_2n3d_id, 'TRIPLE', 6999, true),
            (v_2n3d_id, 'DOUBLE', 7499, true)
        ON CONFLICT (journey_id, accommodation_type)
        DO UPDATE SET
            price      = EXCLUDED.price,
            is_active  = true,
            updated_at = now();

        RAISE NOTICE '[Migration v44] Manali 2N/3D: % pricing records created/updated (QUAD=6499, TRIPLE=6999, DOUBLE=7499)', 3;
    ELSE
        RAISE WARNING '[Migration v44] Manali 2N/3D package NOT FOUND — no pricing records created. Apply manually after creating the package.';
    END IF;

    RAISE NOTICE '[Migration v44] COMPLETE. NO other package pricing was modified.';
    RAISE NOTICE '[Migration v44] Packages with no journey_accommodation_prices records will show "Not configured" in UI.';
END;
$$;
