import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL || 'https://kkmpueukngupurxvxc.supabase.co'
const key = process.env.VITE_SUPABASE_ANON_KEY || ''

const client = createClient(url, key)

async function inspectUdaipurDepartures() {
  console.log("=== INSPECTING DEPARTURES FOR UDAIPUR (udaipur-weekend) ===")
  const { data: journey } = await client
    .from('journeys')
    .select('id, name, slug')
    .eq('slug', 'udaipur-weekend')
    .single()

  console.log("Journey:", journey)
  if (!journey) return

  const { data: departures } = await client
    .from('departures')
    .select('*')
    .eq('journey_id', journey.id)
    .order('departure_date', { ascending: true })

  console.log(`Total departures found for Udaipur: ${departures?.length}`)

  const datesMap = new Map<string, any[]>()
  departures?.forEach((d) => {
    const formattedDate = d.departure_date ? d.departure_date.split('T')[0] : 'unknown'
    if (!datesMap.has(formattedDate)) {
      datesMap.set(formattedDate, [])
    }
    datesMap.get(formattedDate)!.push(d)
  })

  console.log("\nSummary of departure dates:")
  for (const [date, list] of datesMap.entries()) {
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
    console.log(`Date: ${date} (${dayOfWeek}) -> Count: ${list.length}`)
    if (list.length > 1) {
      console.log("  DUPLICATE RECORDS:")
      list.forEach((dep) => {
        console.log(`    - ID: ${dep.id} | CreatedAt: ${dep.created_at} | Seats Booked: ${dep.booked_seats} | Status: ${dep.status} | Visible: ${dep.is_visible}`)
      })
    } else {
      const dep = list[0]
      console.log(`    - ID: ${dep.id} | CreatedAt: ${dep.created_at} | Seats Booked: ${dep.booked_seats} | Status: ${dep.status} | Visible: ${dep.is_visible}`)
    }
  }
}

inspectUdaipurDepartures()
