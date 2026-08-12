import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL || 'https://kkmpueukngupurxvxc.supabase.co'
const key = process.env.VITE_SUPABASE_ANON_KEY || ''

const client = createClient(url, key)

async function inspectProdSchema() {
  console.log("=== INSPECTING DEPARTURES TABLE SCHEMA ===")
  const { data: dep, error: depErr } = await client
    .from('departures')
    .select('*')
    .limit(1)

  if (depErr) console.error("Departures query error:", depErr)
  if (dep && dep.length > 0) {
    console.log("Actual Departures Columns:", Object.keys(dep[0]))
  } else {
    console.log("Departures table is empty, attempting to select columns...")
  }

  console.log("=== INSPECTING JOURNEYS TABLE SCHEMA ===")
  const { data: journey, error: jErr } = await client
    .from('journeys')
    .select('*')
    .limit(1)

  if (jErr) console.error("Journeys query error:", jErr)
  if (journey && journey.length > 0) {
    console.log("Actual Journeys Columns:", Object.keys(journey[0]))
  }
}

inspectProdSchema()
