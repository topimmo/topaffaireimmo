/**
 * Sample Listings Seed Script for TopAffaireImmo
 * 
 * This script generates realistic sample property listings across Morocco,
 * including major cities and Sahara regions, using stock photos from Pexels.
 * 
 * Requirements:
 * - Node.js >= 18
 * - Environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PEXELS_API_KEY
 * 
 * Usage:
 *   npm run seed:sample-listings
 * 
 * Features:
 * - Idempotent: Uses external_key to prevent duplicates
 * - Covers Morocco broadly (major cities + Sahara regions)
 * - Realistic pricing by region
 * - Stock photos from Pexels (no scraping)
 * - Bilingual content (French + Arabic)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// =====================================================
// CONFIGURATION
// =====================================================

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';
const LISTINGS_COUNT = parseInt(process.env.LISTINGS_COUNT || '50', 10);

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: Missing required environment variables:');
  console.error('  - SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  console.error('  - PEXELS_API_KEY:', PEXELS_API_KEY ? '✓ (optional)' : '⚠️  (will use placeholder images)');
  process.exit(1);
}

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// =====================================================
// MOROCCO CITIES AND NEIGHBORHOODS DATA
// =====================================================

interface CityData {
  name_fr: string;
  name_ar: string;
  neighborhoods: string[];
  priceMultiplier: number; // Relative to base price
  region: 'north' | 'center' | 'south' | 'sahara';
}

const MOROCCO_CITIES: Record<string, CityData> = {
  // Major metropolitan cities
  casablanca: {
    name_fr: 'Casablanca',
    name_ar: 'الدار البيضاء',
    neighborhoods: ['Maarif', 'Bourgogne', 'Gauthier', 'Ain Diab', 'Sidi Maârouf', 'Anfa', 'California', 'Racine'],
    priceMultiplier: 1.2,
    region: 'center'
  },
  rabat: {
    name_fr: 'Rabat',
    name_ar: 'الرباط',
    neighborhoods: ['Agdal', 'Hay Riad', 'Hassan', 'Souissi', 'Ocean', 'Medina', 'Yacoub El Mansour'],
    priceMultiplier: 1.1,
    region: 'center'
  },
  marrakech: {
    name_fr: 'Marrakech',
    name_ar: 'مراكش',
    neighborhoods: ['Guéliz', 'Hivernage', 'Palmeraie', 'Medina', 'Targa', 'Massira'],
    priceMultiplier: 1.0,
    region: 'center'
  },
  tanger: {
    name_fr: 'Tanger',
    name_ar: 'طنجة',
    neighborhoods: ['Malabata', 'Iberia', 'Marshan', 'Medina', 'Boukhalef', 'California'],
    priceMultiplier: 0.9,
    region: 'north'
  },
  agadir: {
    name_fr: 'Agadir',
    name_ar: 'أكادير',
    neighborhoods: ['Talborjt', 'Dakhla Road area', 'Founty', 'Secteur Touristique', 'Tikiouine'],
    priceMultiplier: 0.85,
    region: 'south'
  },
  fes: {
    name_fr: 'Fès',
    name_ar: 'فاس',
    neighborhoods: ['Ville Nouvelle', 'Narjiss', 'Atlas', 'Bensouda', 'Saiss'],
    priceMultiplier: 0.75,
    region: 'center'
  },
  oujda: {
    name_fr: 'Oujda',
    name_ar: 'وجدة',
    neighborhoods: ['Hay Al Qods', 'Lazaret', 'Centre Ville', 'Hay Salam'],
    priceMultiplier: 0.65,
    region: 'center'
  },
  // Sahara and southern regions
  laayoune: {
    name_fr: 'Laâyoune',
    name_ar: 'العيون',
    neighborhoods: ['Hay Al Wifaq', 'Centre Ville', 'Hay Nasr', 'Maatalla'],
    priceMultiplier: 0.6,
    region: 'sahara'
  },
  dakhla: {
    name_fr: 'Dakhla',
    name_ar: 'الداخلة',
    neighborhoods: ['Centre Ville', 'Corniche', 'Hay Essalam', 'Port'],
    priceMultiplier: 0.55,
    region: 'sahara'
  },
  smara: {
    name_fr: 'Smara',
    name_ar: 'السمارة',
    neighborhoods: ['Centre Ville', 'Hay Moulay Abdellah', 'Hay Essalam'],
    priceMultiplier: 0.5,
    region: 'sahara'
  },
  boujdour: {
    name_fr: 'Boujdour',
    name_ar: 'بوجدور',
    neighborhoods: ['Centre Ville', 'Hay Al Massira', 'Hay Al Wahda'],
    priceMultiplier: 0.5,
    region: 'sahara'
  },
  // Near Sahara cities
  tantan: {
    name_fr: 'Tan-Tan',
    name_ar: 'طانطان',
    neighborhoods: ['Centre Ville', 'Hay Al Massira', 'Hay Nasr'],
    priceMultiplier: 0.55,
    region: 'sahara'
  },
  guelmim: {
    name_fr: 'Guelmim',
    name_ar: 'كلميم',
    neighborhoods: ['Centre Ville', 'Hay Salam', 'Hay Al Massira'],
    priceMultiplier: 0.55,
    region: 'sahara'
  },
  zagora: {
    name_fr: 'Zagora',
    name_ar: 'زاكورة',
    neighborhoods: ['Centre Ville', 'Amezrou', 'Hay Al Massira'],
    priceMultiplier: 0.5,
    region: 'sahara'
  },
  errachidia: {
    name_fr: 'Errachidia',
    name_ar: 'الرشيدية',
    neighborhoods: ['Centre Ville', 'Hay Al Massira', 'Hay Nasr'],
    priceMultiplier: 0.55,
    region: 'sahara'
  }
};

// =====================================================
// PROPERTY TEMPLATES
// =====================================================

interface PropertyTemplate {
  type: 'apartment' | 'house' | 'villa' | 'commercial' | 'land';
  transaction: 'sale' | 'rent';
  title_fr_template: string;
  title_ar_template: string;
  description_fr_template: string;
  description_ar_template: string;
  basePrice: number; // Base price in MAD
  area_range: [number, number]; // Min and max area in m²
  bedrooms_range?: [number, number];
  bathrooms_range?: [number, number];
  pexels_query: string; // Search query for Pexels
}

const PROPERTY_TEMPLATES: PropertyTemplate[] = [
  // Apartments for sale
  {
    type: 'apartment',
    transaction: 'sale',
    title_fr_template: 'Appartement moderne à {neighborhood}, {city}',
    title_ar_template: 'شقة عصرية في {neighborhood}، {city}',
    description_fr_template: 'Superbe appartement de {bedrooms} chambres avec {bathrooms} salles de bain, situé dans le quartier prisé de {neighborhood} à {city}. Proche de toutes commodités.',
    description_ar_template: 'شقة رائعة من {bedrooms} غرف نوم و {bathrooms} حمامات، تقع في حي {neighborhood} المرموق في {city}. قريبة من جميع المرافق.',
    basePrice: 800000,
    area_range: [60, 150],
    bedrooms_range: [1, 4],
    bathrooms_range: [1, 3],
    pexels_query: 'modern apartment interior'
  },
  // Apartments for rent
  {
    type: 'apartment',
    transaction: 'rent',
    title_fr_template: 'Appartement à louer {neighborhood}, {city}',
    title_ar_template: 'شقة للإيجار في {neighborhood}، {city}',
    description_fr_template: 'Bel appartement meublé de {bedrooms} chambres à louer dans {neighborhood}, {city}. Idéal pour famille ou professionnel.',
    description_ar_template: 'شقة مفروشة جميلة من {bedrooms} غرف للإيجار في {neighborhood}، {city}. مثالية للعائلة أو المهنيين.',
    basePrice: 4000,
    area_range: [50, 120],
    bedrooms_range: [1, 3],
    bathrooms_range: [1, 2],
    pexels_query: 'apartment living room'
  },
  // Villas for sale
  {
    type: 'villa',
    transaction: 'sale',
    title_fr_template: 'Villa luxueuse {neighborhood}, {city}',
    title_ar_template: 'فيلا فاخرة في {neighborhood}، {city}',
    description_fr_template: 'Magnifique villa de {bedrooms} chambres avec jardin et piscine, située à {neighborhood}, {city}. Standing élevé.',
    description_ar_template: 'فيلا رائعة من {bedrooms} غرف مع حديقة ومسبح، تقع في {neighborhood}، {city}. مستوى راقٍ.',
    basePrice: 2500000,
    area_range: [200, 500],
    bedrooms_range: [3, 6],
    bathrooms_range: [2, 5],
    pexels_query: 'luxury villa exterior'
  },
  // Houses for sale
  {
    type: 'house',
    transaction: 'sale',
    title_fr_template: 'Maison familiale {neighborhood}, {city}',
    title_ar_template: 'منزل عائلي في {neighborhood}، {city}',
    description_fr_template: 'Belle maison de {bedrooms} chambres avec terrasse, idéale pour famille à {neighborhood}, {city}.',
    description_ar_template: 'منزل جميل من {bedrooms} غرف مع شرفة، مثالي للعائلة في {neighborhood}، {city}.',
    basePrice: 1500000,
    area_range: [120, 250],
    bedrooms_range: [2, 5],
    bathrooms_range: [2, 4],
    pexels_query: 'house exterior'
  },
  // Commercial property
  {
    type: 'commercial',
    transaction: 'sale',
    title_fr_template: 'Local commercial {neighborhood}, {city}',
    title_ar_template: 'محل تجاري في {neighborhood}، {city}',
    description_fr_template: 'Espace commercial bien situé à {neighborhood}, {city}. Parfait pour commerce ou bureau.',
    description_ar_template: 'مساحة تجارية في موقع ممتاز في {neighborhood}، {city}. مثالية للتجارة أو المكتب.',
    basePrice: 1200000,
    area_range: [50, 200],
    pexels_query: 'commercial space interior'
  },
  // Land for sale
  {
    type: 'land',
    transaction: 'sale',
    title_fr_template: 'Terrain à vendre {neighborhood}, {city}',
    title_ar_template: 'أرض للبيع في {neighborhood}، {city}',
    description_fr_template: 'Terrain constructible bien situé à {neighborhood}, {city}. Titre foncier disponible.',
    description_ar_template: 'أرض قابلة للبناء في موقع جيد في {neighborhood}، {city}. الملكية العقارية متاحة.',
    basePrice: 600000,
    area_range: [100, 1000],
    pexels_query: 'empty land plot'
  }
];

// =====================================================
// PEXELS API INTEGRATION
// =====================================================

interface PexelsPhoto {
  id: number;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
  };
}

async function fetchPexelsImages(query: string, count: number = 3): Promise<string[]> {
  if (!PEXELS_API_KEY) {
    console.warn('⚠️  No PEXELS_API_KEY provided, using placeholder images');
    return Array(count).fill('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800');
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
      {
        headers: {
          Authorization: PEXELS_API_KEY
        }
      }
    );

    if (!response.ok) {
      console.warn(`⚠️  Pexels API error: ${response.status}, using placeholder images`);
      return Array(count).fill('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800');
    }

    const data = await response.json();
    const photos = data.photos as PexelsPhoto[];
    
    if (!photos || photos.length === 0) {
      return Array(count).fill('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800');
    }

    return photos.slice(0, count).map(photo => photo.src.large);
  } catch (error) {
    console.warn('⚠️  Error fetching from Pexels, using placeholder:', error);
    return Array(count).fill('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800');
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function calculatePrice(
  basePrice: number,
  cityMultiplier: number,
  area: number,
  transaction: 'sale' | 'rent'
): number {
  // Adjust price based on area (larger properties cost more per m²)
  const areaFactor = area / 100;
  const price = Math.round(basePrice * cityMultiplier * areaFactor);
  
  // Add some randomness (±15%)
  const randomFactor = 0.85 + Math.random() * 0.3;
  return Math.round(price * randomFactor);
}

// =====================================================
// MAIN SEED FUNCTION
// =====================================================

async function seedSampleListings() {
  console.log('🌱 Starting sample listings seed...');
  console.log(`📊 Target: ${LISTINGS_COUNT} listings`);
  console.log('');

  // Step 1: Get cities from database
  console.log('📍 Fetching cities from database...');
  const { data: cities, error: citiesError } = await supabase
    .from('cities')
    .select('id, name_fr, name_ar')
    .eq('is_active', true);

  if (citiesError || !cities) {
    console.error('❌ Error fetching cities:', citiesError);
    return;
  }

  console.log(`✓ Found ${cities.length} cities in database`);

  // Create a mapping of city names to IDs
  const cityNameToId = new Map<string, number>();
  cities.forEach(city => {
    const normalizedName = city.name_fr.toLowerCase().replace(/[àâ]/g, 'a').replace(/[éèê]/g, 'e');
    cityNameToId.set(normalizedName, city.id);
  });

  // Step 2: Get or create a system user for sample listings
  console.log('👤 Setting up system user for sample listings...');
  
  // Try to find existing admin user
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_role', 'admin')
    .limit(1);

  let ownerId: string;
  
  if (profiles && profiles.length > 0) {
    ownerId = profiles[0].id;
    console.log(`✓ Using existing admin user: ${ownerId}`);
  } else {
    console.error('❌ No admin user found. Please create an admin user first.');
    return;
  }

  // Step 3: Delete existing sample listings (for idempotency)
  console.log('🧹 Cleaning up existing sample listings...');
  const { error: deleteError } = await supabase
    .from('properties')
    .delete()
    .eq('is_sample', true);

  if (deleteError) {
    console.warn('⚠️  Warning: Could not delete existing samples:', deleteError);
  }

  // Step 4: Generate sample listings
  console.log('🏠 Generating sample listings...');
  console.log('');

  const sampleListings = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < LISTINGS_COUNT; i++) {
    try {
      // Pick a random city and template
      const cityKey = randomChoice(Object.keys(MOROCCO_CITIES));
      const cityData = MOROCCO_CITIES[cityKey];
      const template = randomChoice(PROPERTY_TEMPLATES);
      
      // Get city ID from database
      const normalizedCityName = cityData.name_fr.toLowerCase().replace(/[àâ]/g, 'a').replace(/[éèê]/g, 'e');
      const cityId = cityNameToId.get(normalizedCityName);
      
      if (!cityId) {
        console.warn(`⚠️  City not found in database: ${cityData.name_fr}`);
        continue;
      }

      // Generate property attributes
      const neighborhood = randomChoice(cityData.neighborhoods);
      const area = randomInt(template.area_range[0], template.area_range[1]);
      const bedrooms = template.bedrooms_range ? randomInt(template.bedrooms_range[0], template.bedrooms_range[1]) : undefined;
      const bathrooms = template.bathrooms_range ? randomInt(template.bathrooms_range[0], template.bathrooms_range[1]) : undefined;
      const price = calculatePrice(template.basePrice, cityData.priceMultiplier, area, template.transaction);

      // Generate titles and descriptions
      const replacements = {
        '{city}': cityData.name_fr,
        '{neighborhood}': neighborhood,
        '{bedrooms}': bedrooms?.toString() || '',
        '{bathrooms}': bathrooms?.toString() || ''
      };

      let title_fr = template.title_fr_template;
      let title_ar = template.title_ar_template;
      let description_fr = template.description_fr_template;
      let description_ar = template.description_ar_template;

      Object.entries(replacements).forEach(([key, value]) => {
        title_fr = title_fr.replace(new RegExp(key, 'g'), value);
        title_ar = title_ar.replace(new RegExp(key, 'g'), value);
        description_fr = description_fr.replace(new RegExp(key, 'g'), value);
        description_ar = description_ar.replace(new RegExp(key, 'g'), value);
      });

      // Fetch images from Pexels
      const images = await fetchPexelsImages(template.pexels_query, 3);

      // Create property object
      const property = {
        owner_id: ownerId,
        created_by: ownerId,
        transaction_type: template.transaction,
        property_type: template.type,
        city_id: cityId,
        custom_neighborhood: neighborhood,
        price,
        area,
        bedrooms,
        bathrooms,
        title_fr,
        title_ar,
        description_fr,
        description_ar,
        images,
        is_sample: true,
        external_key: `sample_${cityKey}_${template.type}_${i}`,
        status: 'approved', // Sample listings are pre-approved
        advertiser_type: 'owner',
        contact_phone: '+212 6 00 00 00 00',
        contact_whatsapp: '+212 6 00 00 00 00',
        features: [],
        amenities: []
      };

      sampleListings.push(property);

      // Show progress every 10 listings
      if ((i + 1) % 10 === 0) {
        console.log(`  Generated ${i + 1}/${LISTINGS_COUNT} listings...`);
      }

    } catch (error) {
      console.error(`❌ Error generating listing ${i}:`, error);
      errorCount++;
    }
  }

  console.log('');
  console.log(`✓ Generated ${sampleListings.length} sample listings`);

  // Step 5: Insert listings into database
  console.log('💾 Inserting listings into database...');
  
  // Insert in batches of 10 to avoid overwhelming the database
  const batchSize = 10;
  for (let i = 0; i < sampleListings.length; i += batchSize) {
    const batch = sampleListings.slice(i, i + batchSize);
    
    const { error: insertError } = await supabase
      .from('properties')
      .insert(batch);

    if (insertError) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, insertError);
      errorCount += batch.length;
    } else {
      successCount += batch.length;
    }

    // Show progress
    console.log(`  Inserted ${Math.min(i + batchSize, sampleListings.length)}/${sampleListings.length} listings...`);
  }

  // Step 6: Summary
  console.log('');
  console.log('✅ Seed completed!');
  console.log(`  Success: ${successCount} listings`);
  console.log(`  Errors: ${errorCount} listings`);
  console.log('');
}

// =====================================================
// RUN SCRIPT
// =====================================================

seedSampleListings()
  .then(() => {
    console.log('🎉 Sample listings seed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
