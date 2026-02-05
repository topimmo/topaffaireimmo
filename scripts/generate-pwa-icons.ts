import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

// Brand colors from tailwind config
const BRAND_COLOR = '#3b82f6'; // theme-color from index.html
const WHITE = '#ffffff';
const BACKGROUND = '#FAF8F5'; // cream from tailwind

async function generateIcon(size: number, maskable: boolean, outputPath: string) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${BRAND_COLOR};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
        </linearGradient>
      </defs>
      ${maskable ? `<rect width="${size}" height="${size}" fill="${BACKGROUND}"/>` : ''}
      <rect 
        x="${maskable ? size * 0.15 : 0}" 
        y="${maskable ? size * 0.15 : 0}" 
        width="${maskable ? size * 0.7 : size}" 
        height="${maskable ? size * 0.7 : size}" 
        rx="${size * 0.15}" 
        fill="url(#grad)"
      />
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.35}" 
        font-weight="bold" 
        fill="${WHITE}" 
        text-anchor="middle" 
        dominant-baseline="central"
      >TA</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(outputPath);
}

async function generateAppleTouchIcon(size: number, outputPath: string) {
  // Apple icons should have rounded corners but NOT safe area padding
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${BRAND_COLOR};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
        </linearGradient>
        <clipPath id="roundedCorner">
          <rect x="0" y="0" width="${size}" height="${size}" rx="${size * 0.22}" ry="${size * 0.22}"/>
        </clipPath>
      </defs>
      <rect width="${size}" height="${size}" fill="${BACKGROUND}"/>
      <rect 
        x="0" 
        y="0" 
        width="${size}" 
        height="${size}" 
        fill="url(#grad)"
        clip-path="url(#roundedCorner)"
      />
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.4}" 
        font-weight="bold" 
        fill="${WHITE}" 
        text-anchor="middle" 
        dominant-baseline="central"
      >TA</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(outputPath);
}

async function main() {
  const publicDir = path.join(process.cwd(), 'public');
  const iconsDir = path.join(publicDir, 'icons');

  // Ensure icons directory exists
  await fs.mkdir(iconsDir, { recursive: true });

  console.log('Generating PWA icons...');

  // Standard icons (no safe area padding)
  await generateIcon(192, false, path.join(iconsDir, 'icon-192.png'));
  console.log('✓ Generated icon-192.png');

  await generateIcon(512, false, path.join(iconsDir, 'icon-512.png'));
  console.log('✓ Generated icon-512.png');

  // Maskable icons (with safe area padding)
  await generateIcon(192, true, path.join(iconsDir, 'icon-192-maskable.png'));
  console.log('✓ Generated icon-192-maskable.png');

  await generateIcon(512, true, path.join(iconsDir, 'icon-512-maskable.png'));
  console.log('✓ Generated icon-512-maskable.png');

  // Apple touch icon (180x180, rounded corners)
  await generateAppleTouchIcon(180, path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Generated apple-touch-icon.png');

  console.log('\n✅ All PWA icons generated successfully!');
}

main().catch(console.error);
