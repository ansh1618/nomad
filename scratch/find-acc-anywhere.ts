import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL || 'https://kkmpueukngupurxvxc.supabase.co'
const key = process.env.VITE_SUPABASE_ANON_KEY || ''

const client = createClient(url, key)

async function findAccAnywhere() {
  const journeyId = '9d3236a0-1777-40fb-997c-fc27cd879c98'
  
  // 1. Fetch complete raw journey record for Udaipur
  const { data: journey, error: jErr } = await client
    .from('journeys')
    .select('*')
    .eq('id', journeyId)
    .single()

  console.log("Raw Journey keys:", Object.keys(journey || {}))
  console.log("Raw Journey full record:", JSON.stringify(journey, null, 2))

  // 2. Fetch all departures for this journey
  const { data: deps } = await client
    .from('departures')
    .select('*')
    .eq('journey_id', journeyId)

  console.log("Departures count:", deps?.length)
  console.log("Departures sample record:", JSON.stringify(deps?.[0], null, 2))

  // 3. Fetch departure_rooms for any of these departures
  if (deps && deps.length > 0) {
    const depIds = deps.map(d => d.id)
    const { data: depRooms } = await client
      .from('departure_rooms')
      .select('*, hotel_rooms(*, hotels(*))')
      .in('departure_id', depIds)

    console.log("Departure Rooms:", JSON.stringify(depRooms, null, 2))
  }

  // 4. Fetch all records from accommodation table
  const { data: allAcc } = await client.from('accommodation').select('*')
  console.log("ALL records in accommodation table:", JSON.stringify(allAcc, null, 2))

  // 5. Fetch all records from hotels table
  const { data: allHotels } = await client.from('hotels').select('*')
  console.log("ALL records in hotels table:", JSON.stringify(allHotels, null, 2))
}

findAccAnywhere()
