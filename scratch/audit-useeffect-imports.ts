import fs from "fs";
import path from "path";

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else if (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

const srcDir = path.resolve(process.cwd(), "src");
const allSrcFiles = getAllFiles(srcDir);

const missingImports: { file: string; line: number }[] = [];

allSrcFiles.forEach((filePath) => {
  const content = fs.readFileSync(filePath, "utf-8");
  
  // Check if file uses useEffect(
  if (/\buseEffect\s*\(/.test(content)) {
    // Check if React.useEffect or imported useEffect
    const hasReactImport = /import\s+.*?\buseEffect\b.*?from\s+['"]react['"]/.test(content) ||
      /import\s+React\b/.test(content) ||
      /import\s+\*?\s*as\s+React\b/.test(content);
    
    if (!hasReactImport) {
      const lines = content.split("\n");
      const lineNo = lines.findIndex((l) => l.includes("useEffect(")) + 1;
      missingImports.push({ file: filePath, line: lineNo });
    }
  }
});

console.log(`Found ${missingImports.length} files using useEffect without React useEffect import:`);
missingImports.forEach((item) => console.log(`- ${item.file}:${item.line}`));
