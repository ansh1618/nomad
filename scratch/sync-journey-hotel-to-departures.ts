import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://sgeffapbsrppzrgqfpec.supabase.co'
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

const client = createClient(url, key)

async function syncJourneyHotelToDepartures() {
  console.log("=== SYNCING JOURNEY HOTEL_ID TO DEPARTURES ===")
  
  // 1. Get all journeys with a non-null hotel_id
  const { data: journeys, error: jErr } = await client
    .from('journeys')
    .select('id, name, slug, hotel_id')
    .not('hotel_id', 'is', null)

  if (jErr || !journeys) {
    console.error("Failed to fetch journeys with hotel_id:", jErr)
    return
  }

  console.log(`Found ${journeys.length} journeys with valid hotel_id`)

  let updatedCount = 0

  for (const j of journeys) {
    console.log(`Checking departures for journey '${j.name}' (ID: ${j.id}, hotel_id: ${j.hotel_id})...`)
    
    // Update departures where hotel_id is null for this journey
    const { data: updated, error: uErr } = await client
      .from('departures')
      .update({ hotel_id: j.hotel_id })
      .eq('journey_id', j.id)
      .is('hotel_id', null)
      .select('id')

    if (uErr) {
      console.error(`Failed to update departures for journey ${j.name}:`, uErr.message)
    } else {
      const count = updated?.length || 0
      updatedCount += count
      console.log(` -> Updated ${count} departures for ${j.name}`)
    }
  }

  console.log(`\n🎉 Total departures updated with journey.hotel_id: ${updatedCount}`)
}

syncJourneyHotelToDepartures()
