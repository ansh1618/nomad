import fs from 'fs';
import path from 'path';

const campusDir = path.join(process.cwd(), 'public', 'images', 'campus');
if (!fs.existsSync(campusDir)) {
  fs.mkdirSync(campusDir, { recursive: true });
}

// Copy manali image
const srcManali = path.join(process.cwd(), 'public', 'images', 'manali', 'manali-snow-valley.jpg');
const destManali = path.join(campusDir, 'manali.jpg');
if (fs.existsSync(srcManali)) {
  fs.copyFileSync(srcManali, destManali);
  console.log("Copied manali.jpg to public/images/campus/manali.jpg");
}

// Copy udaipur image
const srcUdaipur = path.join(process.cwd(), 'public', 'images', 'udaipur-palace.png');
const destUdaipur = path.join(campusDir, 'udaipur.jpg');
if (fs.existsSync(srcUdaipur)) {
  fs.copyFileSync(srcUdaipur, destUdaipur);
  console.log("Copied udaipur.jpg to public/images/campus/udaipur.jpg");
}
