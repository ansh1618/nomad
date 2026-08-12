const fs = require('fs');
const path = require('path');

async function processPng(filePath) {
  try {
    const sharp = require('sharp');
    const image = sharp(filePath);
    const metadata = await image.metadata();

    const width = metadata.width;
    const height = metadata.height;
    const r = Math.min(width, height) / 2 - 4;
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
    console.log("Successfully created transparent circular PNG for", filePath);
  } catch (err) {
    console.log("Sharp error:", err.message);
  }
}

const targetPath1 = path.join(__dirname, '../public/images/gonomadik-round-emblem.png');
const targetPath2 = path.join(__dirname, '../public/images/gonomadik-g-monogram.png');
const targetPath3 = path.join(__dirname, '../public/favicon.png');

processPng(targetPath1).then(() => processPng(targetPath2)).then(() => processPng(targetPath3));
