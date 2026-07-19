const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://sgeffapbsrppzrgqfpec.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MjY2MDksImV4cCI6MjA5ODUwMjYwOX0.Lhv7m97uUD_tifN31f6DFqIl79sflqkjWePmlYQ6HfQ';
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  // First find available slugs
  const { data: slugs } = await sb.from('journeys').select('slug, name, inclusions, exclusions').limit(5);
  console.log('=== ALL JOURNEYS (first 5) ===');
  slugs?.forEach(j => {
    console.log(`slug: ${j.slug} | name: ${j.name}`);
    console.log(`  inclusions type: ${typeof j.inclusions}, isArray: ${Array.isArray(j.inclusions)}, length: ${j.inclusions?.length ?? 'null'}`);
    console.log(`  exclusions type: ${typeof j.exclusions}, isArray: ${Array.isArray(j.exclusions)}, length: ${j.exclusions?.length ?? 'null'}`);
    console.log(`  first inclusion: ${j.inclusions?.[0] ?? '(none)'}`);
  });
}
main().catch(console.error);
