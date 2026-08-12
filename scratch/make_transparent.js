const fs = require('fs');
const path = require('path');

// Simple PNG parser / circular alpha mask script using zlib & pngjs or raw canvas
async function processPng(filePath) {
  try {
    const sharp = require('sharp');
    const image = sharp(filePath);
    const metadata = await image.metadata();

    const width = metadata.width;
    const height = metadata.height;
    const r = Math.min(width, height) / 2 - 2;
    const cx = width / 2;
    const cy = height / 2;

    const svgMask = Buffer.from(
      `<svg width="${width}" height="${height}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" /></svg>`
    );

    const result = await image
      .composite([{ input: svgMask, blend: 'dest-in' }])
      .png()
      .toBuffer();

    fs.writeFileSync(filePath, result);
    console.log("Successfully created transparent PNG for", filePath);
  } catch (err) {
    console.log("Sharp not available, trying pixel threshold algorithm:", err.message);
  }
}

const targetPath = path.join(__dirname, '../public/images/gonomadik-round-emblem.png');
processPng(targetPath);
