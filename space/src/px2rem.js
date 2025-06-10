#!/usr/bin/env node
// px2rem.js
// Usage: node px2rem.js [targetDir]
// Example: node px2rem.js src

const fs   = require('fs');
const path = require('path');

const BASE_PX      = 16;                   // how many px == 1rem
const IGNORE_DIRS  = new Set(['node_modules',' .git']);

function convertPxToRem(css) {
  return css.replace(/([\d.]+)px/gi, (_, px) => {
    const rem = (parseFloat(px) / BASE_PX)
      .toFixed(4)            // keep up to 4 decimal places
      .replace(/\.?0+$/, ''); // strip trailing zeros
    return `${rem}rem`;
  });
}

function processFile(filePath) {
  const css      = fs.readFileSync(filePath, 'utf8');
  const converted = convertPxToRem(css);
  if (converted !== css) {
    fs.writeFileSync(filePath, converted, 'utf8');
    console.log(`✔ Converted: ${filePath}`);
  }
}

function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // skip ignored folders
    if (entry.isDirectory() && IGNORE_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.isFile() && /\.css$/i.test(entry.name)) {
      processFile(fullPath);
    }
  }
}

// ──── Main ─────────────────────────────────────────────────
const target = process.argv[2] || '.';
if (!fs.existsSync(target)) {
  console.error(`❌ Directory not found: ${target}`);
  process.exit(1);
}

walkDir(target);
console.log('✅ All done!');
