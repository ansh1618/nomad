import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../src/lib/supabase-admin';

const brainDir = `C:\\Users\\ansht\\.gemini\\antigravity-ide\\brain\\feeea25d-2972-4837-ad8e-3eed290a6ba6`;
const publicTransportDir = path.join(process.cwd(), 'public', 'images', 'transport');

if (!fs.existsSync(publicTransportDir)) {
  fs.mkdirSync(publicTransportDir, { recursive: true });
}

const imageMapping = [
  {
    src: 'media__1785406760795.jpg',
    target: 'force-traveller-front.jpg',
    label: 'Force Traveller Front View'
  },
  {
    src: 'media__1785406772001.jpg',
    target: 'force-traveller-side.jpg',
    label: 'Force Traveller Side Profile'
  },
  {
    src: 'media__1785406796243.jpg',
    target: 'force-traveller-interior-seats.jpg',
    label: 'Ergonomic Pushback Recliner Seats'
  },
  {
    src: 'media__1785406832191.jpg',
    target: 'force-traveller-interior-cabin.jpg',
    label: 'Ambient LED Cabin & Audio Setup'
  }
];

async function processTransportImages() {
  console.log("=== COPYING AND UPLOADING REAL TRANSPORT IMAGES ===");
  const localUrls: string[] = [];

  for (const item of imageMapping) {
    const srcPath = path.join(brainDir, item.src);
    const destPath = path.join(publicTransportDir, item.target);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✓ Copied to public: /images/transport/${item.target}`);
      localUrls.push(`/images/transport/${item.target}`);

      // Upload to Supabase Storage as well
      const fileBuffer = fs.readFileSync(srcPath);
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('media')
        .upload(`transport/${item.target}`, fileBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.warn(`Supabase storage upload note (${item.target}):`, uploadError.message);
      } else {
        console.log(`✓ Uploaded to Supabase Storage: media/transport/${item.target}`);
      }
    } else {
      console.error(`Source file missing: ${srcPath}`);
    }
  }

  // Update all journeys in DB to include these 4 real vehicle photos in transport JSON
  const { data: journeys, error: fetchErr } = await supabaseAdmin
    .from('journeys')
    .select('id, name, slug, transport');

  if (fetchErr) {
    console.error("Error fetching journeys:", fetchErr.message);
    return;
  }

  console.log(`Updating ${journeys.length} journeys with real transport images...`);

  for (const j of journeys) {
    let t = typeof j.transport === 'string' ? null : j.transport;
    if (!t && typeof j.transport === 'string') {
      try { t = JSON.parse(j.transport); } catch { t = {}; }
    }
    if (Array.isArray(t)) t = t[0];
    if (!t || typeof t !== 'object') t = {};

    const updatedTransport = {
      ...t,
      name: t.name || t.vehicle_name || 'Luxury AC Force Traveller',
      vehicle_name: t.vehicle_name || t.name || 'Luxury AC Force Traveller',
      capacity: t.capacity || '12-18 Explorers',
      isAc: true,
      ac: true,
      pushbackSeats: true,
      pushback_seats: true,
      chargingPorts: 'Personal USB & AC Sockets on Every Seat Row',
      musicSystem: 'JBL Surround Sound & LED Ambient Cabin Lighting',
      luggageSpace: 'Under-deck & Overhead Luggage Bays',
      driverExperience: 'Hill-Certified Commercial Captains (10+ Yrs Mountain Exp)',
      washroomStops: 'Scheduled Clean Restroom Breaks Every 3-4 Hours',
      images: localUrls,
      gallery: localUrls,
      cover_image: localUrls[0],
      features: [
        "160° Pushback Seats",
        "Personal USB Charging",
        "Climate AC Vents",
        "JBL Sound System",
        "Ambient LED Cabin Lights",
        "Safety GPS Tracking",
        "Clean Restroom Breaks"
      ]
    };

    const { error: updateErr } = await supabaseAdmin
      .from('journeys')
      .update({ transport: updatedTransport })
      .eq('id', j.id);

    if (updateErr) {
      console.error(`Error updating journey ${j.slug}:`, updateErr.message);
    } else {
      console.log(`✓ Updated journey ${j.slug} with real transport gallery`);
    }
  }

  console.log("=== TRANSPORT IMAGES SETUP COMPLETE ===");
}

processTransportImages().catch(console.error);
