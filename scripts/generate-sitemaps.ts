/**
 * Sitemap Generator for TopAffaireImmo
 * Generates multiple sitemap files for better organization and SEO
 * Run with: npx tsx scripts/generate-sitemaps.ts
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use production domain from environment variable, fallback to www.topaffaireimmo.com
const DOMAIN = process.env.VITE_PRODUCTION_DOMAIN || 
               process.env.VITE_SITE_URL || 
               'https://www.topaffaireimmo.com';

// Define data inline to avoid import issues
const MOROCCO_CITIES = [
  // Major metropolitan cities
  { id: 'casablanca', name_fr: 'Casablanca', name_ar: 'الدار البيضاء', slug: 'casablanca' },
  { id: 'rabat', name_fr: 'Rabat', name_ar: 'الرباط', slug: 'rabat' },
  { id: 'marrakech', name_fr: 'Marrakech', name_ar: 'مراكش', slug: 'marrakech' },
  { id: 'tanger', name_fr: 'Tanger', name_ar: 'طنجة', slug: 'tanger' },
  { id: 'agadir', name_fr: 'Agadir', name_ar: 'أكادير', slug: 'agadir' },
  { id: 'fes', name_fr: 'Fès', name_ar: 'فاس', slug: 'fes' },
  { id: 'meknes', name_fr: 'Meknès', name_ar: 'مكناس', slug: 'meknes' },
  { id: 'oujda', name_fr: 'Oujda', name_ar: 'وجدة', slug: 'oujda' },
  { id: 'kenitra', name_fr: 'Kenitra', name_ar: 'القنيطرة', slug: 'kenitra' },
  { id: 'tetouan', name_fr: 'Tétouan', name_ar: 'تطوان', slug: 'tetouan' },
  { id: 'nador', name_fr: 'Nador', name_ar: 'الناظور', slug: 'nador' },
  { id: 'el-jadida', name_fr: 'El Jadida', name_ar: 'الجديدة', slug: 'el-jadida' },
  { id: 'safi', name_fr: 'Safi', name_ar: 'آسفي', slug: 'safi' },
  { id: 'settat', name_fr: 'Settat', name_ar: 'سطات', slug: 'settat' },
  { id: 'beni-mellal', name_fr: 'Beni Mellal', name_ar: 'بني ملال', slug: 'beni-mellal' },
  { id: 'khouribga', name_fr: 'Khouribga', name_ar: 'خريبكة', slug: 'khouribga' },
  { id: 'mohammedia', name_fr: 'Mohammedia', name_ar: 'المحمدية', slug: 'mohammedia' },
  { id: 'essaouira', name_fr: 'Essaouira', name_ar: 'الصويرة', slug: 'essaouira' },
  { id: 'ouarzazate', name_fr: 'Ouarzazate', name_ar: 'ورزازات', slug: 'ouarzazate' },
  { id: 'taza', name_fr: 'Taza', name_ar: 'تازة', slug: 'taza' },
  { id: 'berkane', name_fr: 'Berkane', name_ar: 'بركان', slug: 'berkane' },
  
  // Moroccan Sahara cities (Provinces du Sud)
  { id: 'laayoune', name_fr: 'Laâyoune', name_ar: 'العيون', slug: 'laayoune' },
  { id: 'dakhla', name_fr: 'Dakhla', name_ar: 'الداخلة', slug: 'dakhla' },
  { id: 'boujdour', name_fr: 'Boujdour', name_ar: 'بوجدور', slug: 'boujdour' },
  { id: 'smara', name_fr: 'Smara', name_ar: 'السمارة', slug: 'smara' },
  { id: 'tarfaya', name_fr: 'Tarfaya', name_ar: 'طرفاية', slug: 'tarfaya' },
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
  
  // City landing pages: /[city]
  MOROCCO_CITIES.forEach(city => {
    xml += generateUrlEntry({
      loc: `${DOMAIN}/${city.slug}`,
      changefreq: 'weekly',
      priority: '0.8',
    });
  });
  
  // City + Transaction Type pages: /[city]/vente, /[city]/location
  MOROCCO_CITIES.forEach(city => {
    xml += generateUrlEntry({
      loc: `${DOMAIN}/${city.slug}/vente`,
      changefreq: 'daily',
      priority: '0.85',
    });
    xml += generateUrlEntry({
      loc: `${DOMAIN}/${city.slug}/location`,
      changefreq: 'daily',
      priority: '0.85',
    });
  });
  
  // City + Property Type pages: /[city]/appartements, /[city]/maisons, etc.
  const propertyTypePlurals = ['appartements', 'maisons', 'villas', 'terrains', 'commerciaux'];
  MOROCCO_CITIES.forEach(city => {
    propertyTypePlurals.forEach(propertyType => {
      xml += generateUrlEntry({
        loc: `${DOMAIN}/${city.slug}/${propertyType}`,
        changefreq: 'daily',
        priority: '0.8',
      });
    });
  });
  
  // City immobilier pages: /immobilier/[city]
  MOROCCO_CITIES.forEach(city => {
    xml += generateUrlEntry({
      loc: `${DOMAIN}/immobilier/${city.slug}`,
      changefreq: 'daily',
      priority: '0.9',
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
    { url: '/sahara-marocain', changefreq: 'weekly', priority: '0.85' },
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

async function generateListingsSitemap(): Promise<string> {
  let xml = generateXmlHeader();
  
  // Try to connect to Supabase to fetch published listings
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Skipping listings sitemap: Supabase credentials not found');
    console.warn('   Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to include listings');
    xml += '\n</urlset>';
    return xml;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch only published properties (exclude draft, pending, rejected, archived, sold, rented, inactive)
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, updated_at, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(5000); // Sitemap limit is 50,000 URLs
    
    if (error) {
      console.warn('⚠️  Error fetching listings from Supabase:', error.message);
      xml += '\n</urlset>';
      return xml;
    }
    
    if (!properties || properties.length === 0) {
      console.warn('⚠️  No published properties found in database');
      xml += '\n</urlset>';
      return xml;
    }
    
    // Add each published property to the sitemap
    properties.forEach(property => {
      const lastmod = property.updated_at || property.created_at;
      const date = lastmod ? new Date(lastmod).toISOString().split('T')[0] : undefined;
      
      xml += generateUrlEntry({
        loc: `${DOMAIN}/property/${property.id}`,
        changefreq: 'weekly',
        priority: '0.7',
        lastmod: date,
      });
    });
    
    console.log(`✅ Added ${properties.length} published properties to listings sitemap`);
  } catch (err) {
    console.warn('⚠️  Error generating listings sitemap:', err instanceof Error ? err.message : String(err));
  }
  
  xml += '\n</urlset>';
  return xml;
}

function generateSitemapIndex(includeListings: boolean = true): string {
  let xml = generateSitemapIndexHeader();
  const now = new Date().toISOString().split('T')[0];
  
  const sitemaps = [
    { url: '/sitemaps/static.xml', lastmod: now },
    { url: '/sitemaps/cities.xml', lastmod: now },
    { url: '/sitemaps/neighborhoods.xml', lastmod: now },
  ];
  
  // Include listings sitemap if it was generated successfully
  if (includeListings) {
    sitemaps.push({ url: '/sitemaps/listings.xml', lastmod: now });
  }
  
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
async function generateAll() {
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
  
  console.log('🗺️  Generating sitemaps for TopAffaireImmo...\n');
  
  // Generate individual sitemaps
  const staticSitemap = generateStaticPagesSitemap();
  const citiesSitemap = generateCitiesSitemap();
  const neighborhoodsSitemap = generateNeighborhoodsSitemap();
  const listingsSitemap = await generateListingsSitemap();
  
  // Write to files
  writeFileSync(join(sitemapsDir, 'static.xml'), staticSitemap);
  console.log('✅ Generated sitemaps/static.xml');
  
  writeFileSync(join(sitemapsDir, 'cities.xml'), citiesSitemap);
  console.log('✅ Generated sitemaps/cities.xml');
  
  writeFileSync(join(sitemapsDir, 'neighborhoods.xml'), neighborhoodsSitemap);
  console.log('✅ Generated sitemaps/neighborhoods.xml');
  
  // Only write listings sitemap if it has content beyond the XML wrapper
  const hasListings = listingsSitemap.includes('<url>');
  if (hasListings) {
    writeFileSync(join(sitemapsDir, 'listings.xml'), listingsSitemap);
    console.log('✅ Generated sitemaps/listings.xml');
  }
  
  // Generate sitemap index
  const sitemapIndex = generateSitemapIndex(hasListings);
  writeFileSync(join(publicDir, 'sitemap.xml'), sitemapIndex);
  console.log('✅ Generated sitemap.xml (index)');
  
  console.log('\n🎉 All sitemaps generated successfully!');
  console.log('📊 Statistics:');
  console.log(`   - Static pages: ${staticSitemap.match(/<url>/g)?.length || 0} URLs`);
  console.log(`   - City pages: ${citiesSitemap.match(/<url>/g)?.length || 0} URLs`);
  console.log(`   - Neighborhood pages: ${neighborhoodsSitemap.match(/<url>/g)?.length || 0} URLs`);
  console.log(`   - Property listings: ${listingsSitemap.match(/<url>/g)?.length || 0} URLs`);
  console.log(`   - Total: ${(staticSitemap.match(/<url>/g)?.length || 0) + (citiesSitemap.match(/<url>/g)?.length || 0) + (neighborhoodsSitemap.match(/<url>/g)?.length || 0) + (listingsSitemap.match(/<url>/g)?.length || 0)} URLs\n`);
}

// Run if called directly
generateAll().catch(err => {
  console.error('❌ Error generating sitemaps:', err);
  process.exit(1);
});

export { generateAll, generateCitiesSitemap, generateNeighborhoodsSitemap, generateStaticPagesSitemap, generateSitemapIndex, generateListingsSitemap };
