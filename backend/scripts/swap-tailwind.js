// One-time migration script: swaps the Tailwind CDN for the locally built
// assets/tailwind.css on every page, and removes the per-page inline
// tailwind.config blocks (the theme now lives in tailwind.config.js).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const pages = fs.readdirSync(root).filter(f => f.endsWith('.html'));

const CDN_TAG = /\s*<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\s*/gi;
const CONFIG_BLOCK = /\s*<script>\s*tailwind\.config\s*=[\s\S]*?<\/script>\s*/gi;
const OLD_LINK = /\s*<link rel="stylesheet" href="assets\/tailwind\.css"\s*\/?>\s*/gi;
const CSS_LINK = '<link rel="stylesheet" href="assets/tailwind.css" />';
let changed = 0;

for (const file of pages) {
  const p = path.join(root, file);
  let html = fs.readFileSync(p, 'utf8');
  const before = html;

  html = html.replace(CDN_TAG, '\n  ');
  html = html.replace(CONFIG_BLOCK, '\n  ');
  html = html.replace(OLD_LINK, '\n  ');

  if (html !== before) {
    // Insert just before </head> so Tailwind utilities load AFTER the page's
    // own <style> block — matching the CDN's ordering behavior.
    if (html.includes('</head>')) {
      html = html.replace('</head>', `  ${CSS_LINK}\n</head>`);
    } else {
      html = html.replace('<head>', `<head>\n  ${CSS_LINK}`);
    }
    fs.writeFileSync(p, html);
    changed++;
    console.log('updated:', file);
  }
}
console.log(`\n${changed}/${pages.length} pages swapped to the built Tailwind CSS.`);
