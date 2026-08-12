import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../src/lib/supabase-admin';

const brainDir = `C:\\Users\\ansht\\.gemini\\antigravity-ide\\brain\\feeea25d-2972-4837-ad8e-3eed290a6ba6`;
const publicDestDir = path.join(process.cwd(), 'public', 'images', 'destinations');

if (!fs.existsSync(publicDestDir)) {
  fs.mkdirSync(publicDestDir, { recursive: true });
}

const mediaMapping = [
  {
    src: 'media__1785416266072.jpg',
    target: 'manali-atal-tunnel.jpg',
    slug: 'manali'
  },
  {
    src: 'media__1785416266221.jpg',
    target: 'mcleodganj-town-view.jpg',
    slug: 'mcleodganj'
  },
  {
    src: 'media__1785416313572.jpg',
    target: 'udaipur-lake-pichola.jpg',
    slug: 'udaipur'
  },
  {
    src: 'media__1785416330771.jpg',
    target: 'chopta-tungnath-snow.jpg',
    slug: 'chopta-tungnath'
  }
];

async function processDestinationMedia() {
  console.log("=== COPYING AND UPLOADING ATTACHED DESTINATION IMAGES ===");

  const localPaths: Record<string, string> = {};

  for (const item of mediaMapping) {
    const srcPath = path.join(brainDir, item.src);
    const destPath = path.join(publicDestDir, item.target);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      const url = `/images/destinations/${item.target}`;
      localPaths[item.slug] = url;
      console.log(`✓ Copied for ${item.slug}: ${url}`);

      // Upload to Supabase Storage
      const fileBuffer = fs.readFileSync(srcPath);
      const { error: uploadError } = await supabaseAdmin.storage
        .from('media')
        .upload(`destinations/${item.target}`, fileBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.warn(`Supabase storage note (${item.target}):`, uploadError.message);
      } else {
        console.log(`✓ Uploaded to Supabase Storage: media/destinations/${item.target}`);
      }
    } else {
      console.error(`Missing source image: ${srcPath}`);
    }
  }

  // Update destinations in Supabase DB with these attached images
  const dbUpdates = [
    {
      slug: 'manali',
      hero_image: localPaths['manali'] || '/images/destinations/manali-atal-tunnel.jpg',
      name: 'Manali',
      subtitle: 'Snow-capped peaks, adventure and breathtaking landscapes.'
    },
    {
      slug: 'mcleodganj',
      hero_image: localPaths['mcleodganj'] || '/images/destinations/mcleodganj-town-view.jpg',
      name: 'McLeod Ganj',
      subtitle: 'Spiritual vibes, Tibetan culture and stunning Dhauladhar views.'
    },
    {
      slug: 'udaipur',
      hero_image: localPaths['udaipur'] || '/images/destinations/udaipur-lake-pichola.jpg',
      name: 'Udaipur',
      subtitle: 'Lakes, palaces and royal heritage of Mewar.'
    },
    {
      slug: 'chopta-tungnath',
      hero_image: localPaths['chopta-tungnath'] || '/images/destinations/chopta-tungnath-snow.jpg',
      name: 'Chopta & Tungnath',
      subtitle: "The meadows of Uttarakhand and the world's highest Shiva temple."
    },
    {
      slug: 'jibhi',
      hero_image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
      name: 'Jibhi',
      subtitle: 'A hidden paradise for nature lovers and slow travelers.'
    }
  ];

  for (const item of dbUpdates) {
    const { error } = await supabaseAdmin
      .from('destinations')
      .update({
        hero_image: item.hero_image,
        subtitle: item.subtitle
      })
      .eq('slug', item.slug);

    if (error) console.error(`DB Update Error (${item.slug}):`, error.message);
    else console.log(`✓ Updated destination '${item.slug}' DB hero_image to ${item.hero_image}`);
  }

  // Update journey hero_banners in DB
  const journeyMap = [
    { slug: 'manali-weekend', hero_banner: localPaths['manali'] || '/images/destinations/manali-atal-tunnel.jpg' },
    { slug: 'manali-quick', hero_banner: localPaths['manali'] || '/images/destinations/manali-atal-tunnel.jpg' },
    { slug: 'mcleodganj-dharamshala', hero_banner: localPaths['mcleodganj'] || '/images/destinations/mcleodganj-town-view.jpg' },
    { slug: 'udaipur-weekend', hero_banner: localPaths['udaipur'] || '/images/destinations/udaipur-lake-pichola.jpg' },
    { slug: 'chopta-tungnath-trek', hero_banner: localPaths['chopta-tungnath'] || '/images/destinations/chopta-tungnath-snow.jpg' },
    { slug: 'jibhi-retreat', hero_banner: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80' }
  ];

  for (const j of journeyMap) {
    const { error } = await supabaseAdmin
      .from('journeys')
      .update({ hero_banner: j.hero_banner })
      .eq('slug', j.slug);

    if (error) console.error(`DB Journey Update Error (${j.slug}):`, error.message);
    else console.log(`✓ Updated journey '${j.slug}' DB hero_banner to ${j.hero_banner}`);
  }

  console.log("=== ATTACHED MEDIA PROCESS COMPLETE ===");
}

processDestinationMedia().catch(console.error);
