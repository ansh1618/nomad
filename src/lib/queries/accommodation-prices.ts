/**
 * accommodation-prices.ts
 *
 * Query layer for journey_accommodation_prices table.
 *
 * Pricing identity: journey_id + accommodation_type
 * NOT: hotel_id + accommodation_type
 *
 * This is the ONLY authoritative source for package selling prices.
 * hotel_rooms.price_modifier is NOT used for pricing.
 */

import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { JourneyAccommodationPrice, AccommodationType } from '@/types/supabase'

// Normalize various sharing type strings to DB enum values
export function normalizeAccommodationType(raw: string | null | undefined): AccommodationType | null {
  if (!raw) return null
  const s = String(raw).toUpperCase().trim()
  if (s.includes('QUAD') || s === '4') return 'QUAD'
  if (s.includes('TRIPLE') || s === '3') return 'TRIPLE'
  if (s.includes('DOUBLE') || s === '2') return 'DOUBLE'
  if (s.includes('SINGLE') || s === '1') return 'SINGLE'
  if (s.includes('DORM')) return 'DORM'
  return null
}

/**
 * Fetch all active accommodation prices for a journey.
 * Returns empty array if none configured — caller should show "Not configured" state.
 */
export async function getJourneyAccommodationPrices(
  journeyId: string
): Promise<JourneyAccommodationPrice[]> {
  if (!journeyId) return []

  const { data, error } = await supabase
    .from('journey_accommodation_prices')
    .select('*')
    .eq('journey_id', journeyId)
    .eq('is_active', true)
    .order('price', { ascending: true })

  if (error) {
    console.warn('[accommodation-prices] getJourneyAccommodationPrices error:', error.message)
    return []
  }

  return (data ?? []) as JourneyAccommodationPrice[]
}

/**
 * Server-side authoritative price lookup.
 * Returns the price in rupees, or null if not configured.
 *
 * NEVER fallback to starting_price or any synthetic value.
 * Callers must reject/block if this returns null.
 */
export async function resolveJourneyAccommodationPrice(
  journeyId: string,
  accommodationType: string | null | undefined
): Promise<number | null> {
  if (!journeyId) return null

  const normalizedType = normalizeAccommodationType(accommodationType)
  if (!normalizedType) return null

  // Use admin client for server-side calls (bypasses RLS, authoritative)
  const client = supabaseAdmin ?? supabase

  const { data, error } = await client
    .from('journey_accommodation_prices')
    .select('price')
    .eq('journey_id', journeyId)
    .eq('accommodation_type', normalizedType)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('[accommodation-prices] resolveJourneyAccommodationPrice error:', error.message)
    return null
  }

  if (!data) return null

  return Number(data.price)
}

/**
 * Upsert a single price record for a journey + accommodation type.
 * Used by the admin panel "Accommodation Pricing" section.
 * Per-package isolation is guaranteed by UNIQUE(journey_id, accommodation_type).
 */
export async function upsertJourneyAccommodationPrice(
  journeyId: string,
  accommodationType: AccommodationType,
  price: number
): Promise<JourneyAccommodationPrice> {
  const { data, error } = await supabase
    .from('journey_accommodation_prices')
    .upsert(
      {
        journey_id: journeyId,
        accommodation_type: accommodationType,
        price: Math.round(price),
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'journey_id,accommodation_type' }
    )
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as JourneyAccommodationPrice
}

/**
 * Upsert all three standard pricing tiers (QUAD, TRIPLE, DOUBLE) for a journey.
 * Atomic-style save from the admin panel.
 */
export async function upsertAllJourneyAccommodationPrices(
  journeyId: string,
  prices: { QUAD?: number; TRIPLE?: number; DOUBLE?: number }
): Promise<void> {
  const records = Object.entries(prices)
    .filter(([, v]) => v !== undefined && v !== null && !isNaN(Number(v)))
    .map(([type, price]) => ({
      journey_id: journeyId,
      accommodation_type: type as AccommodationType,
      price: Math.round(Number(price)),
      is_active: true,
      updated_at: new Date().toISOString(),
    }))

  if (records.length === 0) return

  const { error } = await supabase
    .from('journey_accommodation_prices')
    .upsert(records, { onConflict: 'journey_id,accommodation_type' })

  if (error) throw new Error(error.message)
}
