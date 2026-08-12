import fs from 'fs';
import path from 'path';

const brainDir = `C:\\Users\\ansht\\.gemini\\antigravity-ide\\brain\\feeea25d-2972-4837-ad8e-3eed290a6ba6`;

console.log("Scanning brain dir for images:");
if (fs.existsSync(brainDir)) {
  const files = fs.readdirSync(brainDir);
  for (const f of files) {
    if (f.endsWith(".png") || f.endsWith(".jpg") || f.endsWith(".jpeg") || f.endsWith(".webp")) {
      const p = path.join(brainDir, f);
      const stat = fs.statSync(p);
      console.log(f, "->", stat.size, "bytes", "mtime:", stat.mtime);
    }
  }
} else {
  console.log("Brain dir does not exist:", brainDir);
}
