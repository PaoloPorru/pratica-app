#!/usr/bin/env node
/**
 * generate-icons.js
 * Generates all required PWA icons from an SVG source using sharp.
 * Run: node scripts/generate-icons.js
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const outputDir = path.join(__dirname, "../public/icons");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// SVG source — minimal "P" lettermark on sage green
const svgSource = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="114" fill="#A8B8A0"/>
  <rect width="512" height="512" rx="114" fill="url(#grad)" opacity="0.3"/>
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F8F6F1" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#7A9970" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <!-- Leaf / petal motif -->
  <ellipse cx="256" cy="220" rx="52" ry="80" fill="none" stroke="#F8F6F1" stroke-width="18" opacity="0.9"/>
  <ellipse cx="256" cy="220" rx="52" ry="80" fill="none" stroke="#F8F6F1" stroke-width="18" opacity="0.9" transform="rotate(60 256 220)"/>
  <ellipse cx="256" cy="220" rx="52" ry="80" fill="none" stroke="#F8F6F1" stroke-width="18" opacity="0.9" transform="rotate(120 256 220)"/>
  <circle cx="256" cy="220" r="14" fill="#F8F6F1" opacity="0.95"/>
  <!-- "pratica" text -->
  <text x="256" y="360" font-family="Georgia, serif" font-size="52" fill="#F8F6F1" text-anchor="middle" opacity="0.85" letter-spacing="6">pratica</text>
</svg>`;

const svgBuffer = Buffer.from(svgSource);

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];

async function generateIcons() {
  console.log("🌿 Generating Pratica PWA icons...\n");

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png({ quality: 95 })
      .toFile(outputPath);
    console.log(`  ✓ icon-${size}x${size}.png`);
  }

  // apple-touch-icon (180x180)
  const appleTouchPath = path.join(__dirname, "../public/apple-touch-icon.png");
  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ quality: 95 })
    .toFile(appleTouchPath);
  console.log("  ✓ apple-touch-icon.png");

  // favicon
  const faviconPath = path.join(__dirname, "../public/favicon.ico");
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, "../public/favicon-32.png"));
  console.log("  ✓ favicon-32.png (rename to favicon.ico or use as-is)");

  console.log("\n✅ All icons generated in public/icons/");
}

generateIcons().catch((err) => {
  console.error("Error generating icons:", err.message);
  console.log("\nMake sure sharp is installed: npm install --save-dev sharp");
  process.exit(1);
});
