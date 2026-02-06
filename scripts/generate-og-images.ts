/**
 * Generate optimized Open Graph (OG) images for SEO
 * Creates social media preview images (1200x630px) for the platform
 * 
 * Run with: npx tsx scripts/generate-og-images.ts
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

// Brand colors from tailwind config
const BRAND_COLOR = '#3b82f6'; // Blue
const BRAND_SECONDARY = '#2563eb'; // Darker blue
const WHITE = '#ffffff';
const BACKGROUND = '#FAF8F5'; // Cream
const TEXT_DARK = '#1f2937'; // Gray-800

// OG Image dimensions (Facebook/LinkedIn/Twitter standard)
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

interface OGImageConfig {
  title: string;
  subtitle?: string;
  filename: string;
  accentColor?: string;
}

/**
 * Generate an OG image with title and subtitle
 */
async function generateOGImage(config: OGImageConfig): Promise<void> {
  const { title, subtitle, filename, accentColor = BRAND_COLOR } = config;
  
  // Calculate responsive font sizes
  const titleFontSize = title.length > 40 ? 56 : title.length > 30 ? 64 : 72;
  const subtitleFontSize = 36;
  
  // Split title into lines if too long
  const maxCharsPerLine = 30;
  const titleLines: string[] = [];
  if (title.length > maxCharsPerLine) {
    const words = title.split(' ');
    let currentLine = '';
    for (const word of words) {
      if ((currentLine + ' ' + word).length > maxCharsPerLine && currentLine) {
        titleLines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine = currentLine ? `${currentLine} ${word}` : word;
      }
    }
    if (currentLine) titleLines.push(currentLine.trim());
  } else {
    titleLines.push(title);
  }
  
  // Calculate positions
  const titleY = subtitle ? 240 : 280;
  const lineHeight = titleFontSize * 1.2;
  const subtitleY = titleY + (titleLines.length * lineHeight) + 40;
  
  // Create SVG with gradient background and text
  const svg = `
    <svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${accentColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${BRAND_SECONDARY};stop-opacity:1" />
        </linearGradient>
        <linearGradient id="overlayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${WHITE};stop-opacity:0.1" />
          <stop offset="100%" style="stop-color:${WHITE};stop-opacity:0" />
        </linearGradient>
      </defs>
      
      <!-- Background gradient -->
      <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bgGrad)"/>
      <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#overlayGrad)"/>
      
      <!-- Decorative elements (Moroccan pattern inspired) -->
      <circle cx="100" cy="100" r="80" fill="${WHITE}" opacity="0.1"/>
      <circle cx="${OG_WIDTH - 100}" cy="${OG_HEIGHT - 100}" r="120" fill="${WHITE}" opacity="0.1"/>
      <circle cx="${OG_WIDTH - 150}" cy="120" r="60" fill="${WHITE}" opacity="0.08"/>
      
      <!-- Logo/Brand mark (TA in circle) -->
      <circle cx="100" cy="80" r="50" fill="${WHITE}" opacity="0.95"/>
      <text 
        x="100" 
        y="80" 
        font-family="Arial, sans-serif" 
        font-size="38" 
        font-weight="bold" 
        fill="${accentColor}" 
        text-anchor="middle" 
        dominant-baseline="central"
      >TA</text>
      
      <!-- Title (multi-line support) -->
      ${titleLines.map((line, index) => `
        <text 
          x="600" 
          y="${titleY + (index * lineHeight)}" 
          font-family="Arial, sans-serif" 
          font-size="${titleFontSize}" 
          font-weight="bold" 
          fill="${WHITE}" 
          text-anchor="middle" 
          dominant-baseline="hanging"
        >${escapeXml(line)}</text>
      `).join('')}
      
      <!-- Subtitle (if provided) -->
      ${subtitle ? `
        <text 
          x="600" 
          y="${subtitleY}" 
          font-family="Arial, sans-serif" 
          font-size="${subtitleFontSize}" 
          font-weight="normal" 
          fill="${WHITE}" 
          opacity="0.9" 
          text-anchor="middle" 
          dominant-baseline="hanging"
        >${escapeXml(subtitle)}</text>
      ` : ''}
      
      <!-- Bottom branding -->
      <text 
        x="600" 
        y="${OG_HEIGHT - 60}" 
        font-family="Arial, sans-serif" 
        font-size="28" 
        font-weight="600" 
        fill="${WHITE}" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >TopAffaireImmo.com</text>
    </svg>
  `;
  
  const outputPath = path.join(process.cwd(), 'public', filename);
  
  await sharp(Buffer.from(svg))
    .resize(OG_WIDTH, OG_HEIGHT)
    .jpeg({ quality: 90, progressive: true })
    .toFile(outputPath);
    
  console.log(`✅ Generated: ${filename} (${OG_WIDTH}x${OG_HEIGHT})`);
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Main function to generate all OG images
 */
async function main() {
  console.log('🎨 Generating optimized OG images for SEO...\n');
  
  // Ensure public directory exists
  const publicDir = path.join(process.cwd(), 'public');
  try {
    await fs.access(publicDir);
  } catch {
    await fs.mkdir(publicDir, { recursive: true });
  }
  
  // 1. Default homepage OG image
  await generateOGImage({
    title: 'TopAffaireImmo',
    subtitle: 'Trouvez votre propriété parfaite au Maroc',
    filename: 'og-image.jpg',
  });
  
  // 2. Search page OG image
  await generateOGImage({
    title: 'Recherche Immobilière au Maroc',
    subtitle: 'Des milliers de propriétés à vendre et à louer',
    filename: 'og-search.jpg',
  });
  
  // 3. Buy page OG image
  await generateOGImage({
    title: 'Acheter un Bien Immobilier',
    subtitle: 'Villas, Appartements, Terrains au Maroc',
    filename: 'og-buy.jpg',
    accentColor: '#10b981', // Green for buying
  });
  
  // 4. Rent page OG image
  await generateOGImage({
    title: 'Location Immobilière',
    subtitle: 'Appartements et maisons à louer',
    filename: 'og-rent.jpg',
    accentColor: '#f59e0b', // Orange for renting
  });
  
  // 5. Casablanca (example city)
  await generateOGImage({
    title: 'Immobilier à Casablanca',
    subtitle: 'Vente & Location - الدار البيضاء',
    filename: 'og-casablanca.jpg',
  });
  
  // 6. Moroccan Sahara OG image
  await generateOGImage({
    title: 'Immobilier au Sahara Marocain',
    subtitle: 'Laâyoune, Dakhla, Boujdour, Smara, Tarfaya',
    filename: 'og-sahara.jpg',
    accentColor: '#dc2626', // Red for Sahara
  });
  
  console.log('\n✨ All OG images generated successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Test images at: https://developers.facebook.com/tools/debug/');
  console.log('2. Update SEO component to use specific OG images per page');
  console.log('3. Add more city-specific OG images as needed');
  console.log('\n💡 Tip: Run `npm run build` to include these in production build');
}

// Run the script
main().catch((error) => {
  console.error('❌ Error generating OG images:', error);
  process.exit(1);
});
