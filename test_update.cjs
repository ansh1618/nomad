const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://sgeffapbsrppzrgqfpec.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA';
const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  const { data: pkg, error: fetchError } = await sb.from('journeys').select('*').eq('slug', 'chopta-tungnath-trek').single();
  
  if (fetchError) { console.error('Fetch error:', fetchError.message); return; }

  // payload simulating what the admin panel sends
  const payload = {
    ...pkg,
    updated_at: new Date().toISOString()
  };
  
  // The Admin panel payload doesn't include id, created_at, destinations etc.
  delete payload.id;
  delete payload.created_at;
  delete payload.destinations;
  delete payload.itinerary_days;
  delete payload.trip_captains;
  delete payload.package_faqs;
  delete payload.custom_package_faqs;
  delete payload.hotels;

  const { data, error } = await sb
      .from('journeys')
      .update(payload)
      .eq('id', pkg.id)
      .select('*')
      .single();

  if (error) {
    console.error('Update failed with error:', error);
  } else {
    console.log('Update succeeded!');
  }
}
main().catch(console.error);
