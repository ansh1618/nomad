import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://sgeffapbsrppzrgqfpec.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MjY2MDksImV4cCI6MjA5ODUwMjYwOX0.Lhv7m97uUD_tifN31f6DFqIl79sflqkjWePmlYQ6HfQ'
)

async function testFetch() {
  console.log("=== TESTING PUBLIC DESTINATION FETCH ===")

  // 1. Fetch published destinations
  const { data: dests, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('is_published', true)
    .eq('is_deleted', false)
    .order('name', { ascending: true })

  if (error) console.error("Fetch error:", error)
  else {
    console.log(`Found ${dests?.length} published destinations:`)
    for (const d of dests || []) {
      console.log(`  - ${d.name} (/destinations/${d.slug}) | hero: ${d.hero_image?.substring(0, 50)}`)
    }
  }

  // 2. Fetch Winter Spiti detail
  const { data: winter } = await supabase
    .from('destinations')
    .select('*, journeys(*, itinerary_days(*), hotels(*, hotel_rooms(*)))')
    .eq('slug', 'winter-spiti')
    .single()

  console.log("\n=== WINTER SPITI DETAIL ===")
  console.log("  Name:", winter?.name)
  console.log("  Slug:", winter?.slug)
  console.log("  Journeys count:", winter?.journeys?.length)
  if (winter?.journeys?.[0]) {
    const j = winter.journeys[0]
    console.log("  Journey Name:", j.name)
    console.log("  Journey Price:", j.starting_price)
    console.log("  Journey Duration:", j.duration)
    console.log("  Itinerary Days:", j.itinerary_days?.length)
    console.log("  Hotel Rooms:", j.hotels?.hotel_rooms)
  }

  // 3. Fetch Summer Spiti detail
  const { data: summer } = await supabase
    .from('destinations')
    .select('*, journeys(*, itinerary_days(*), hotels(*, hotel_rooms(*)))')
    .eq('slug', 'summer-spiti')
    .single()

  console.log("\n=== SUMMER SPITI DETAIL ===")
  console.log("  Name:", summer?.name)
  console.log("  Slug:", summer?.slug)
  console.log("  Journeys count:", summer?.journeys?.length)
  if (summer?.journeys?.[0]) {
    const j = summer.journeys[0]
    console.log("  Journey Name:", j.name)
    console.log("  Journey Price:", j.starting_price)
    console.log("  Journey Duration:", j.duration)
    console.log("  Itinerary Days:", j.itinerary_days?.length)
    console.log("  Hotel Rooms:", j.hotels?.hotel_rooms)
  }
}

testFetch().catch(console.error)
