/**
 * Update pillar blog author_name values to "GoNomadik Team"
 * using the actual slugs found in the DB.
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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
const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function main() {
  // Get all pillar blogs
  const { data, error } = await client.from('blogs').select('id, slug, author_name, seo').order('created_at', { ascending: false });
  if (error) { console.error('Error:', error.message); return; }

  console.log(`Found ${data?.length ?? 0} blogs. Updating author_name to "GoNomadik Team" for pillar articles...`);

  for (const b of data ?? []) {
    const slug = (b.slug || '').toLowerCase();
    // Only update the pillar travel guides that were seeded with wrong author_name
    if (b.author_name === 'The Nomadik Traveller') {
      const seoObj = typeof b.seo === 'object' && b.seo !== null ? b.seo : {};
      const { error: updateErr } = await client
        .from('blogs')
        .update({
          author_name: 'GoNomadik Team',
          seo: { ...seoObj, author_image: '/nomadik-favicon.png' },
          updated_at: new Date().toISOString()
        })
        .eq('id', b.id);
      if (updateErr) {
        console.error(`  ERROR updating '${b.slug}':`, updateErr.message);
      } else {
        console.log(`  ✓ Updated '${b.slug}' author_name → GoNomadik Team, seo.author_image → /nomadik-favicon.png`);
      }
    } else {
      console.log(`  ~ Skipping '${b.slug}' (author: "${b.author_name}")`);
    }
  }
}

main().catch(console.error);
