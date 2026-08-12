import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://sgeffapbsrppzrgqfpec.supabase.co'
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

const client = createClient(url, key)

async function cleanUdaipurDuplicates() {
  console.log("=== CLEANING DUPLICATE DEPARTURES FOR UDAIPUR WITH SERVICE ROLE KEY ===")
  const { data: journey } = await client
    .from('journeys')
    .select('id, name, slug')
    .eq('slug', 'udaipur-weekend')
    .single()

  if (!journey) {
    console.error("Udaipur journey not found!")
    return
  }

  const { data: departures } = await client
    .from('departures')
    .select('*')
    .eq('journey_id', journey.id)
    .order('created_at', { ascending: false }) // Newest first

  console.log(`Found ${departures?.length} total departures for ${journey.name}`)

  const datesMap = new Map<string, any[]>()
  departures?.forEach((d) => {
    const formattedDate = d.departure_date ? d.departure_date.split('T')[0] : 'unknown'
    if (!datesMap.has(formattedDate)) {
      datesMap.set(formattedDate, [])
    }
    datesMap.get(formattedDate)!.push(d)
  })

  const idsToDelete: string[] = []

  for (const [dateStr, list] of datesMap.entries()) {
    if (list.length > 1) {
      // Find if any record has bookings
      const withBookings = list.find((d) => (d.booked_seats || 0) > 0)
      const toKeep = withBookings || list[0] // list[0] is newest because ordered by created_at desc

      console.log(`Date ${dateStr} (${list.length} records): Keeping ID ${toKeep.id} (booked: ${toKeep.booked_seats})`)

      const duplicates = list.filter((d) => d.id !== toKeep.id)
      duplicates.forEach((dup) => {
        if ((dup.booked_seats || 0) === 0) {
          idsToDelete.push(dup.id)
          console.log(`   -> Marking duplicate ID ${dup.id} for deletion`)
        } else {
          console.warn(`   -> WARNING: Duplicate ID ${dup.id} has booked seats! Skipping deletion.`)
        }
      })
    }
  }

  console.log(`\nTotal duplicate IDs to delete: ${idsToDelete.length}`)

  if (idsToDelete.length > 0) {
    // 1. Delete seat inventory for these duplicate IDs if present
    const { error: invErr } = await client
      .from('departure_inventory')
      .delete()
      .in('departure_id', idsToDelete)

    if (invErr) console.warn("Inventory cleanup warning:", invErr.message)

    // 2. Delete duplicate departures
    const { error: depErr, data: deleted } = await client
      .from('departures')
      .delete()
      .in('id', idsToDelete)
      .select('id')

    if (depErr) {
      console.error("Failed to delete duplicate departures:", depErr.message)
    } else {
      console.log(`Successfully deleted ${deleted?.length ?? idsToDelete.length} duplicate departure records! 🎉`)
    }
  } else {
    console.log("No duplicate departures to delete.")
  }
}

cleanUdaipurDuplicates()
