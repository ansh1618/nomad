import fs from 'fs';
import path from 'path';

const brainDir = `C:\\Users\\ansht\\.gemini\\antigravity-ide\\brain\\feeea25d-2972-4837-ad8e-3eed290a6ba6`;

console.log("Scanning artifacts directory for latest Chopta image...");
const files = fs.readdirSync(brainDir);

for (const file of files) {
  const fullPath = path.join(brainDir, file);
  const stat = fs.statSync(fullPath);
  if (stat.isFile() && (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'))) {
    console.log(`${file} -> ${stat.size} bytes (mtime: ${stat.mtime.toISOString()})`);
  }
}
