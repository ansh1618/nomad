import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL || 'https://kkmpueukngupurxvxc.supabase.co'
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

// 1. Client using ANON key (Guest mode)
const anonClient = createClient(url, anonKey)

async function testGuestVsAdminQueries() {
  console.log("=== 1. TESTING WITH ANON / GUEST KEY ===")

  // Query journey by slug
  const { data: journey, error: jErr } = await anonClient
    .from('journeys')
    .select('*, hotels(*, hotel_rooms(*))')
    .eq('slug', 'udaipur-weekend')
    .single()

  if (jErr) console.error("Anon Journey Query Error:", jErr)
  console.log("Anon Journey hotel_id:", journey?.hotel_id)
  console.log("Anon Journey hotels join:", JSON.stringify(journey?.hotels, null, 2))

  // Query accommodation table as anon
  const { data: acc, error: accErr } = await anonClient
    .from('accommodation')
    .select('*')
    .eq('package_id', '9d3236a0-1777-40fb-997c-fc27cd879c98')

  if (accErr) console.error("Anon Accommodation Query Error:", accErr)
  console.log("Anon Accommodation records:", JSON.stringify(acc, null, 2))

  // Query hotels table directly by hotel_id as anon
  if (journey?.hotel_id) {
    const { data: hData, error: hErr } = await anonClient
      .from('hotels')
      .select('*, hotel_rooms(*)')
      .eq('id', journey.hotel_id)

    if (hErr) console.error("Anon Direct Hotel Query Error:", hErr)
    console.log("Anon Direct Hotel record:", JSON.stringify(hData, null, 2))
  }

  // Check RLS policies via pg_policies table or rpc
  console.log("\n=== 2. CHECKING RLS POLICIES FOR HOTELS & ACCOMMODATION ===")
  const { data: policies, error: pErr } = await anonClient
    .rpc('get_policies') // if exists
    .catch(() => ({ data: null, error: null })) as any

  console.log("Policies:", policies)
}

testGuestVsAdminQueries()
