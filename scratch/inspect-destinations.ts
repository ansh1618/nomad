import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://sgeffapbsrppzrgqfpec.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA'
)

async function main() {
  // 1. List all destinations
  console.log('=== ALL DESTINATIONS ===')
  const { data: dests, error: destErr } = await supabase
    .from('destinations')
    .select('id, slug, name, state, country, is_published, hero_image, description, subtitle')
    .order('name')
  
  if (destErr) console.error('Destinations error:', destErr)
  else {
    for (const d of dests || []) {
      console.log(`  [${d.is_published ? 'PUBLISHED' : 'DRAFT'}] ${d.name} (slug: ${d.slug}) — state: ${d.state}, id: ${d.id}`)
      console.log(`    hero_image: ${d.hero_image ? d.hero_image.substring(0, 80) : 'null'}`)
    }
  }

  // 2. List all journeys (packages)
  console.log('\n=== ALL JOURNEYS ===')
  const { data: journeys, error: jErr } = await supabase
    .from('journeys')
    .select('id, slug, name, destination_id, status, is_published, duration, starting_price, price, hero_banner, hotel_id, is_deleted')
    .order('name')
  
  if (jErr) console.error('Journeys error:', jErr)
  else {
    for (const j of journeys || []) {
      console.log(`  [${j.status}] ${j.name} (slug: ${j.slug}) — dest_id: ${j.destination_id}, price: ${j.starting_price || j.price}, duration: ${j.duration}, deleted: ${j.is_deleted}`)
    }
  }

  // 3. Check existing departures for a journey
  console.log('\n=== DEPARTURES (sample) ===')
  const { data: deps, error: depErr } = await supabase
    .from('departures')
    .select('id, journey_id, departure_date, return_date, base_price, available_seats, total_seats, status, pricing_tiers(*)')
    .order('departure_date', { ascending: true })
    .limit(5)
  
  if (depErr) console.error('Departures error:', depErr)
  else {
    for (const d of deps || []) {
      console.log(`  Departure: ${d.departure_date} — journey_id: ${d.journey_id}, base_price: ${d.base_price}, seats: ${d.available_seats}/${d.total_seats}, status: ${d.status}`)
      if (d.pricing_tiers && (d.pricing_tiers as any[]).length > 0) {
        console.log(`    Pricing Tiers:`, JSON.stringify(d.pricing_tiers))
      }
    }
  }

  // 4. Check pricing_tiers table schema
  console.log('\n=== PRICING_TIERS (sample) ===')
  const { data: tiers, error: tierErr } = await supabase
    .from('pricing_tiers')
    .select('*')
    .limit(5)
  
  if (tierErr) console.error('Pricing tiers error:', tierErr.message)
  else {
    console.log('  Sample pricing_tiers:', JSON.stringify(tiers, null, 2))
  }

  // 5. Check departure_rooms table
  console.log('\n=== DEPARTURE_ROOMS (sample) ===')
  const { data: rooms, error: roomErr } = await supabase
    .from('departure_rooms')
    .select('*')
    .limit(5)
  
  if (roomErr) console.error('Departure rooms error:', roomErr.message)
  else {
    console.log('  Sample departure_rooms:', JSON.stringify(rooms, null, 2))
  }

  // 6. Check if winter-spiti or summer-spiti already exist
  console.log('\n=== CHECK IF SPITI ALREADY EXISTS ===')
  const { data: spitiDest } = await supabase
    .from('destinations')
    .select('id, slug, name')
    .or('slug.ilike.%spiti%,name.ilike.%spiti%')
  console.log('  Spiti destinations:', spitiDest)

  const { data: spitiJourney } = await supabase
    .from('journeys')
    .select('id, slug, name')
    .or('slug.ilike.%spiti%,name.ilike.%spiti%')
  console.log('  Spiti journeys:', spitiJourney)

  // 7. Check itinerary_days schema by looking at one journey's days
  console.log('\n=== ITINERARY_DAYS (sample) ===')
  const { data: days, error: dayErr } = await supabase
    .from('itinerary_days')
    .select('*')
    .limit(3)
  
  if (dayErr) console.error('Itinerary days error:', dayErr.message)
  else {
    console.log('  Sample itinerary_days:', JSON.stringify(days, null, 2))
  }
}

main().catch(console.error)
