/**
 * Sitemap Generator for TopAffaireImmo
 * Generates multiple sitemap files for better organization and SEO
 * Run with: npx tsx scripts/generate-sitemaps.ts
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DOMAIN = 'https://topaffaireimmo.vercel.app';

// Define data inline to avoid import issues
const MOROCCO_CITIES = [
  { id: 'casablanca', name_fr: 'Casablanca', name_ar: 'الدار البيضاء', slug: 'casablanca' },
  { id: 'rabat', name_fr: 'Rabat', name_ar: 'الرباط', slug: 'rabat' },
  { id: 'marrakech', name_fr: 'Marrakech', name_ar: 'مراكش', slug: 'marrakech' },
  { id: 'tanger', name_fr: 'Tanger', name_ar: 'طنجة', slug: 'tanger' },
  { id: 'agadir', name_fr: 'Agadir', name_ar: 'أكادير', slug: 'agadir' },
  { id: 'fes', name_fr: 'Fès', name_ar: 'فاس', slug: 'fes' },
];

const PROPERTY_TYPES = [
  { id: 'apartment', name_fr: 'Appartement', name_ar: 'شقة', slug: 'appartement' },
  { id: 'villa', name_fr: 'Villa', name_ar: 'فيلا', slug: 'villa' },
  { id: 'house', name_fr: 'Maison', name_ar: 'منزل', slug: 'maison' },
  { id: 'commercial', name_fr: 'Commercial', name_ar: 'تجاري', slug: 'commercial' },
  { id: 'land', name_fr: 'Terrain', name_ar: 'أرض', slug: 'terrain' },
];

const TRANSACTION_TYPES = [
  { id: 'sale', name_fr: 'Acheter', name_ar: 'شراء', slug: 'acheter' },
  { id: 'rent', name_fr: 'Louer', name_ar: 'إيجار', slug: 'louer' },
];

const MOROCCO_NEIGHBORHOODS = {
  casablanca: [
    { id: 'maarif', name_fr: 'Maarif', name_ar: 'المعاريف', slug: 'maarif', city_id: 'casablanca' },
    { id: 'anfa', name_fr: 'Anfa', name_ar: 'أنفا', slug: 'anfa', city_id: 'casablanca' },
    { id: 'gauthier', name_fr: 'Gauthier', name_ar: 'غوتيي', slug: 'gauthier', city_id: 'casablanca' },
    { id: 'ain-diab', name_fr: 'Aïn Diab', name_ar: 'عين الذياب', slug: 'ain-diab', city_id: 'casablanca' },
    { id: 'bourgogne', name_fr: 'Bourgogne', name_ar: 'بورغون', slug: 'bourgogne', city_id: 'casablanca' },
    { id: 'sidi-maarouf', name_fr: 'Sidi Maarouf', name_ar: 'سيدي معروف', slug: 'sidi-maarouf', city_id: 'casablanca' },
    { id: 'hay-hassani', name_fr: 'Hay Hassani', name_ar: 'الحي الحسني', slug: 'hay-hassani', city_id: 'casablanca' },
    { id: 'californie', name_fr: 'Californie', name_ar: 'كاليفورنيا', slug: 'californie', city_id: 'casablanca' },
  ],
  rabat: [
    { id: 'agdal', name_fr: 'Agdal', name_ar: 'أكدال', slug: 'agdal', city_id: 'rabat' },
    { id: 'hay-riad', name_fr: 'Hay Riad', name_ar: 'حي الرياض', slug: 'hay-riad', city_id: 'rabat' },
    { id: 'hassan', name_fr: 'Hassan', name_ar: 'حسان', slug: 'hassan', city_id: 'rabat' },
    { id: 'souissi', name_fr: 'Souissi', name_ar: 'سويسي', slug: 'souissi', city_id: 'rabat' },
    { id: 'aviation', name_fr: 'Aviation', name_ar: 'الطيران', slug: 'aviation', city_id: 'rabat' },
    { id: 'hay-nahda', name_fr: 'Hay Nahda', name_ar: 'حي النهضة', slug: 'hay-nahda', city_id: 'rabat' },
  ],
  marrakech: [
    { id: 'gueliz', name_fr: 'Guéliz', name_ar: 'كليز', slug: 'gueliz', city_id: 'marrakech' },
    { id: 'hivernage', name_fr: 'Hivernage', name_ar: 'هيفيرناج', slug: 'hivernage', city_id: 'marrakech' },
    { id: 'medina', name_fr: 'Médina', name_ar: 'المدينة', slug: 'medina', city_id: 'marrakech' },
    { id: 'palmeraie', name_fr: 'Palmeraie', name_ar: 'النخيل', slug: 'palmeraie', city_id: 'marrakech' },
    { id: 'targa', name_fr: 'Targa', name_ar: 'تارجا', slug: 'targa', city_id: 'marrakech' },
  ],
  tanger: [
    { id: 'malabata', name_fr: 'Malabata', name_ar: 'ملاباطا', slug: 'malabata', city_id: 'tanger' },
    { id: 'centre-ville', name_fr: 'Centre Ville', name_ar: 'وسط المدينة', slug: 'centre-ville', city_id: 'tanger' },
    { id: 'california', name_fr: 'California', name_ar: 'كاليفورنيا', slug: 'california', city_id: 'tanger' },
    { id: 'medina', name_fr: 'Médina', name_ar: 'المدينة', slug: 'medina', city_id: 'tanger' },
  ],
  agadir: [
    { id: 'founty', name_fr: 'Founty', name_ar: 'فونتي', slug: 'founty', city_id: 'agadir' },
    { id: 'hay-dakhla', name_fr: 'Hay Dakhla', name_ar: 'حي الداخلة', slug: 'hay-dakhla', city_id: 'agadir' },
    { id: 'centre-ville', name_fr: 'Centre Ville', name_ar: 'وسط المدينة', slug: 'centre-ville', city_id: 'agadir' },
    { id: 'secteur-touristique', name_fr: 'Secteur Touristique', name_ar: 'القطاع السياحي', slug: 'secteur-touristique', city_id: 'agadir' },
  ],
  fes: [
    { id: 'medina', name_fr: 'Médina', name_ar: 'المدينة', slug: 'medina', city_id: 'fes' },
    { id: 'ville-nouvelle', name_fr: 'Ville Nouvelle', name_ar: 'المدينة الجديدة', slug: 'ville-nouvelle', city_id: 'fes' },
    { id: 'narjiss', name_fr: 'Narjiss', name_ar: 'نرجس', slug: 'narjiss', city_id: 'fes' },
    { id: 'bensouda', name_fr: 'Bensouda', name_ar: 'بن سودة', slug: 'bensouda', city_id: 'fes' },
  ],
};

function getAllNeighborhoods() {
  return Object.values(MOROCCO_NEIGHBORHOODS).flat();
}

function generateXmlHeader(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;
}

function generateSitemapIndexHeader(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
}

interface UrlEntry {
  loc: string;
  changefreq?: string;
  priority?: string;
  lastmod?: string;
}

function generateUrlEntry(entry: UrlEntry): string {
  return `
  <url>
    <loc>${entry.loc}</loc>
    ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''}
    ${entry.priority ? `<priority>${entry.priority}</priority>` : ''}
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
  </url>`;
}

function generateCitiesSitemap(): string {
  let xml = generateXmlHeader();
  
  // City immobilier pages: /immobilier/[city]
  MOROCCO_CITIES.forEach(city => {
    xml += generateUrlEntry({
      loc: `${DOMAIN}/immobilier/${city.slug}`,
      changefreq: 'daily',
      priority: '0.9',
    });
  });
  
  // Legacy city pages: /[city]
  MOROCCO_CITIES.forEach(city => {
    xml += generateUrlEntry({
      loc: `${DOMAIN}/${city.slug}`,
      changefreq: 'weekly',
      priority: '0.8',
    });
  });
  
  // Transaction + City pages (acheter-casablanca, louer-rabat, etc.)
  TRANSACTION_TYPES.forEach(transaction => {
    MOROCCO_CITIES.forEach(city => {
      xml += generateUrlEntry({
        loc: `${DOMAIN}/${transaction.slug}-${city.slug}`,
        changefreq: 'daily',
        priority: '0.85',
      });
    });
  });
  
  xml += '\n</urlset>';
  return xml;
}

function generateNeighborhoodsSitemap(): string {
  let xml = generateXmlHeader();
  
  const allNeighborhoods = getAllNeighborhoods();
  
  // Neighborhood pages: /immobilier/[city]/[neighborhood]
  allNeighborhoods.forEach(neighborhood => {
    const city = MOROCCO_CITIES.find(c => c.id === neighborhood.city_id);
    if (city) {
      xml += generateUrlEntry({
        loc: `${DOMAIN}/immobilier/${city.slug}/${neighborhood.slug}`,
        changefreq: 'daily',
        priority: '0.85',
      });
    }
  });
  
  // Property type combinations: /immobilier/[city]/[neighborhood]/[propertyType]
  allNeighborhoods.forEach(neighborhood => {
    const city = MOROCCO_CITIES.find(c => c.id === neighborhood.city_id);
    if (city) {
      PROPERTY_TYPES.forEach(propertyType => {
        xml += generateUrlEntry({
          loc: `${DOMAIN}/immobilier/${city.slug}/${neighborhood.slug}/${propertyType.slug}`,
          changefreq: 'daily',
          priority: '0.8',
        });
      });
    }
  });
  
  // Full combination: /immobilier/[city]/[neighborhood]/[propertyType]/[transactionType]
  allNeighborhoods.forEach(neighborhood => {
    const city = MOROCCO_CITIES.find(c => c.id === neighborhood.city_id);
    if (city) {
      PROPERTY_TYPES.forEach(propertyType => {
        TRANSACTION_TYPES.forEach(transactionType => {
          xml += generateUrlEntry({
            loc: `${DOMAIN}/immobilier/${city.slug}/${neighborhood.slug}/${propertyType.slug}/${transactionType.slug}`,
            changefreq: 'daily',
            priority: '0.75',
          });
        });
      });
    }
  });
  
  xml += '\n</urlset>';
  return xml;
}

function generateStaticPagesSitemap(): string {
  let xml = generateXmlHeader();
  
  const staticPages = [
    { url: '/', changefreq: 'daily', priority: '1.0' },
    { url: '/search', changefreq: 'hourly', priority: '0.9' },
    { url: '/acheter', changefreq: 'daily', priority: '0.9' },
    { url: '/louer', changefreq: 'daily', priority: '0.9' },
    { url: '/about', changefreq: 'monthly', priority: '0.6' },
    { url: '/contact', changefreq: 'monthly', priority: '0.6' },
    { url: '/advertise', changefreq: 'monthly', priority: '0.7' },
    { url: '/agencies', changefreq: 'weekly', priority: '0.7' },
  ];
  
  // Property type pages
  PROPERTY_TYPES.forEach(propertyType => {
    TRANSACTION_TYPES.forEach(transactionType => {
      staticPages.push({
        url: `/${transactionType.slug}-${propertyType.slug}`,
        changefreq: 'daily',
        priority: '0.8',
      });
    });
  });
  
  staticPages.forEach(page => {
    xml += generateUrlEntry({
      loc: `${DOMAIN}${page.url}`,
      changefreq: page.changefreq,
      priority: page.priority,
    });
  });
  
  xml += '\n</urlset>';
  return xml;
}

function generateSitemapIndex(): string {
  let xml = generateSitemapIndexHeader();
  const now = new Date().toISOString().split('T')[0];
  
  const sitemaps = [
    { url: '/sitemaps/static.xml', lastmod: now },
    { url: '/sitemaps/cities.xml', lastmod: now },
    { url: '/sitemaps/neighborhoods.xml', lastmod: now },
    // Note: listings.xml would be generated dynamically from database
    // { url: '/sitemaps/listings.xml', lastmod: now },
  ];
  
  sitemaps.forEach(sitemap => {
    xml += `
  <sitemap>
    <loc>${DOMAIN}${sitemap.url}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`;
  });
  
  xml += '\n</sitemapindex>';
  return xml;
}

// Generate all sitemaps
function generateAll() {
  const publicDir = join(process.cwd(), 'public');
  const sitemapsDir = join(publicDir, 'sitemaps');
  
  // Create sitemaps directory if it doesn't exist
  try {
    if (!existsSync(sitemapsDir)) {
      mkdirSync(sitemapsDir, { recursive: true });
    }
  } catch (err) {
    console.error('Error creating sitemaps directory:', err);
  }
  
  // Generate individual sitemaps
  const staticSitemap = generateStaticPagesSitemap();
  const citiesSitemap = generateCitiesSitemap();
  const neighborhoodsSitemap = generateNeighborhoodsSitemap();
  
  // Write to files
  writeFileSync(join(sitemapsDir, 'static.xml'), staticSitemap);
  console.log('✅ Generated sitemaps/static.xml');
  
  writeFileSync(join(sitemapsDir, 'cities.xml'), citiesSitemap);
  console.log('✅ Generated sitemaps/cities.xml');
  
  writeFileSync(join(sitemapsDir, 'neighborhoods.xml'), neighborhoodsSitemap);
  console.log('✅ Generated sitemaps/neighborhoods.xml');
  
  // Generate sitemap index
  const sitemapIndex = generateSitemapIndex();
  writeFileSync(join(publicDir, 'sitemap.xml'), sitemapIndex);
  console.log('✅ Generated sitemap.xml (index)');
  
  console.log('\n🎉 All sitemaps generated successfully!');
  console.log('📊 Statistics:');
  console.log(`   - Static pages: ${staticSitemap.match(/<url>/g)?.length || 0} URLs`);
  console.log(`   - City pages: ${citiesSitemap.match(/<url>/g)?.length || 0} URLs`);
  console.log(`   - Neighborhood pages: ${neighborhoodsSitemap.match(/<url>/g)?.length || 0} URLs`);
}

// Run if called directly
generateAll();

export { generateAll, generateCitiesSitemap, generateNeighborhoodsSitemap, generateStaticPagesSitemap, generateSitemapIndex };
