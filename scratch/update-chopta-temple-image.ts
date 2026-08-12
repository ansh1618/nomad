import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../src/lib/supabase-admin';

const brainDir = `C:\\Users\\ansht\\.gemini\\antigravity-ide\\brain\\feeea25d-2972-4837-ad8e-3eed290a6ba6`;
const srcImg = path.join(brainDir, 'media__1785416908948.jpg');
const publicDestDir = path.join(process.cwd(), 'public', 'images', 'destinations');

if (!fs.existsSync(publicDestDir)) {
  fs.mkdirSync(publicDestDir, { recursive: true });
}

const target1 = path.join(publicDestDir, 'chopta-tungnath-snow.jpg');
const target2 = path.join(publicDestDir, 'chopta-tungnath-temple.jpg');

async function processChoptaImage() {
  console.log("=== UPDATING CHOPTA & TUNGNATH TEMPLE IMAGE ===");

  if (fs.existsSync(srcImg)) {
    fs.copyFileSync(srcImg, target1);
    fs.copyFileSync(srcImg, target2);
    console.log("✓ Copied new Tungnath Temple photo to public/images/destinations/");

    // Upload to Supabase Storage
    const fileBuffer = fs.readFileSync(srcImg);
    await supabaseAdmin.storage
      .from('media')
      .upload('destinations/chopta-tungnath-snow.jpg', fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    console.log("✓ Uploaded to Supabase Storage media/destinations/chopta-tungnath-snow.jpg");
  } else {
    console.error("Source image not found:", srcImg);
    return;
  }

  // Update DB destination row
  const { error: destErr } = await supabaseAdmin
    .from('destinations')
    .update({
      hero_image: '/images/destinations/chopta-tungnath-snow.jpg'
    })
    .eq('slug', 'chopta-tungnath');

  if (destErr) console.error("Destination update error:", destErr.message);
  else console.log("✓ Updated destination 'chopta-tungnath' DB hero_image!");

  // Update DB journey row
  const { error: jErr } = await supabaseAdmin
    .from('journeys')
    .update({
      hero_banner: '/images/destinations/chopta-tungnath-snow.jpg'
    })
    .eq('slug', 'chopta-tungnath-trek');

  if (jErr) console.error("Journey update error:", jErr.message);
  else console.log("✓ Updated journey 'chopta-tungnath-trek' DB hero_banner!");

  console.log("=== CHOPTA TEMPLE IMAGE PROCESS COMPLETE ===");
}

processChoptaImage().catch(console.error);
