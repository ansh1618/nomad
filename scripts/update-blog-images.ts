import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

const url = process.env.VITE_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'); process.exit(1);
}

const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function main() {
  // List all blogs with their slugs & columns
  const { data, error } = await client
    .from('blogs')
    .select('id, slug, author_name, featured_image, is_published')
    .order('created_at', { ascending: false });

  if (error) { console.error('Error listing blogs:', error.message); return; }

  console.log(`Found ${data?.length ?? 0} blog rows:`);
  for (const b of data ?? []) {
    console.log(`  slug="${b.slug}" | author="${b.author_name}" | featured_image="${b.featured_image}" | published=${b.is_published}`);
  }

  // Now update ALL existing blogs: set featured_image based on matching slug patterns
  const slugImageMap: Record<string, string> = {
    'udaipur': '/images/udaipur-palace.png',
    'manali': '/images/manali/manali-snow-valley.jpg',
    'jibhi': '/images/jibhi/jibhi-raghupur-fort-temple.jpg',
    'chopta': '/images/destinations/chopta-tungnath-temple.jpg',
    'mcleodganj': '/images/mcleodganj/mcleodganj-town-view.jpg',
    'mcleod-ganj': '/images/mcleodganj/mcleodganj-town-view.jpg',
  };

  for (const b of data ?? []) {
    const slug = (b.slug || '').toLowerCase();
    let coverImage: string | null = null;

    for (const [key, img] of Object.entries(slugImageMap)) {
      if (slug.includes(key)) { coverImage = img; break; }
    }

    if (coverImage && b.featured_image !== coverImage) {
      const { error: updateErr } = await client
        .from('blogs')
        .update({ featured_image: coverImage, author_name: b.author_name || 'GoNomadik Team', updated_at: new Date().toISOString() })
        .eq('id', b.id);
      if (updateErr) {
        console.error(`  ERROR updating '${b.slug}':`, updateErr.message);
      } else {
        console.log(`  ✓ Updated '${b.slug}' featured_image -> '${coverImage}'`);
      }
    } else if (!coverImage) {
      console.log(`  ~ No image mapping found for slug '${b.slug}', skipping`);
    } else {
      console.log(`  ~ '${b.slug}' already has correct featured_image, skipping`);
    }
  }
}

main().catch(console.error);
