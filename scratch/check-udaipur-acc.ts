import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL || 'https://kkmpueukngupurxvxc.supabase.co'
const key = process.env.VITE_SUPABASE_ANON_KEY || ''

const client = createClient(url, key)

async function checkUdaipurAcc() {
  const journeyId = '9d3236a0-1777-40fb-997c-fc27cd879c98'
  console.log("Checking accommodation table for package_id =", journeyId)
  
  const { data: acc, error: accErr } = await client
    .from('accommodation')
    .select('*')
    .eq('package_id', journeyId)

  if (accErr) console.error("Acc error:", accErr)
  console.log("Accommodation table records for Udaipur:", JSON.stringify(acc, null, 2))

  // Also check hotels table by ID c8d851d7-8101-49dc-b8ef-68bada2fd097
  const hotelId = 'c8d851d7-8101-49dc-b8ef-68bada2fd097'
  const { data: hotel, error: hErr } = await client
    .from('hotels')
    .select('*, hotel_rooms(*)')
    .eq('id', hotelId)
  
  console.log("Hotel record by hotel_id:", JSON.stringify(hotel, null, 2))
}

checkUdaipurAcc()
