const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://sgeffapbsrppzrgqfpec.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA';
const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  // Find chopta-tungnath-trek ID
  const { data: journey, error: fetchError } = await sb.from('journeys').select('id, slug, inclusions, exclusions').eq('slug', 'chopta-tungnath-trek').single();
  if (fetchError) { console.error('Fetch error:', fetchError.message); return; }
  
  console.log('Before update:');
  console.log('  inclusions:', journey.inclusions?.length, 'items');
  console.log('  exclusions:', journey.exclusions?.length, 'items');

  const testInclusions = [
    '🚐 Comfortable AC Tempo Traveller / Traveller transportation from Delhi',
    '🏕️ Premium Camps / Guest House accommodation on sharing basis',
    '🍽️ 2 Breakfasts',
    '🍛 2 Dinners',
    '🫖 Evening Tea & Snacks (as per itinerary)',
    '👨‍✈️ Experienced Trip Captain throughout the journey',
    '🥾 Guided Trek to Tungnath Temple & Chandrashila Summit',
    '🔥 Bonfire & Music (subject to weather & local permissions)',
    '🎲 Group games & ice-breaking activities',
    '📸 Unlimited group photographs & travel memories',
    '🩹 Basic First Aid Kit',
    '🛣️ All internal transfers as per itinerary',
  ];
  const testExclusions = [
    '❌ Lunches',
    '❌ Personal expenses (shopping, laundry, tips, etc.)',
    '❌ Any adventure activities not mentioned in the itinerary',
    '❌ Pony, Porter or Palki charges during the trek',
    '❌ Entry fees to monuments or attractions (if applicable)',
    '❌ Travel insurance',
    '❌ Medical expenses',
    '❌ Any cost arising due to weather, landslides, roadblocks or natural calamities',
    '❌ Anything not specifically mentioned under Package Inclusions',
  ];

  const { data: updated, error: updateError } = await sb
    .from('journeys')
    .update({ inclusions: testInclusions, exclusions: testExclusions, updated_at: new Date().toISOString() })
    .eq('id', journey.id)
    .select('id, slug, inclusions, exclusions')
    .single();

  if (updateError) {
    console.error('Update error:', updateError.message);
    return;
  }

  console.log('\nAfter update:');
  console.log('  inclusions:', updated.inclusions?.length, 'items');
  console.log('  first:', updated.inclusions?.[0]);
  console.log('  exclusions:', updated.exclusions?.length, 'items');
  console.log('  first:', updated.exclusions?.[0]);
  console.log('\n✅ Database updated successfully!');
}
main().catch(console.error);
