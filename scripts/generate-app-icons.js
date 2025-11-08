#!/usr/bin/env node

/**
 * Script to generate PWA app icons with white background and logo
 * 
 * This script uses Node.js with sharp library to generate app icons
 * 
 * Prerequisites:
 * npm install sharp
 * 
 * Usage:
 * node scripts/generate-app-icons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ Error: sharp library is not installed.');
  console.error('   Please install it with: npm install sharp');
  process.exit(1);
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const logoPath = path.join(__dirname, '../public/logo.png');
const outputDir = path.join(__dirname, '../public');

// Check if logo exists
if (!fs.existsSync(logoPath)) {
  console.error('❌ Error: logo.png not found in public directory');
  console.error(`   Expected path: ${logoPath}`);
  process.exit(1);
}

async function generateIcon(size) {
  const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
  
  try {
    // Create a white background canvas
    const whiteBackground = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });

    // Calculate padding (10% on each side) and logo size
    const padding = Math.floor(size * 0.1);
    const logoSize = size - (padding * 2);

    // Load and resize the logo
    const logo = await sharp(logoPath)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toBuffer();

    // Composite logo on white background (centered)
    await whiteBackground
      .composite([
        {
          input: logo,
          top: padding,
          left: padding
        }
      ])
      .png()
      .toFile(outputPath);

    console.log(`✅ Generated icon-${size}x${size}.png`);
  } catch (error) {
    console.error(`❌ Error generating icon-${size}x${size}.png:`, error.message);
  }
}

async function generateAllIcons() {
  console.log('🎨 Generating PWA app icons...\n');
  console.log(`📁 Logo source: ${logoPath}`);
  console.log(`📁 Output directory: ${outputDir}\n`);

  for (const size of sizes) {
    await generateIcon(size);
  }

  console.log('\n✨ All icons generated successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Verify the icons in the public directory');
  console.log('   2. Icons should have white background with logo centered');
  console.log('   3. Deploy your app to see the PWA install prompt');
}

generateAllIcons().catch(console.error);

