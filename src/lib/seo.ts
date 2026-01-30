// SEO utilities for Morocco real estate platform
// Provides canonical URLs, meta tags, and SEO-friendly URLs

import { getSiteUrl } from '../config/site';

/**
 * Get the production domain URL
 * Falls back to default configured domain if not set
 */
export function getProductionDomain(): string {
  return getSiteUrl();
}

/**
 * Generate canonical URL for a given path
 * Always points to the main production domain
 */
export function getCanonicalUrl(path: string = ''): string {
  const domain = getProductionDomain();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${domain}${cleanPath}`;
}

/**
 * Slugify text for SEO-friendly URLs
 * Handles French and Arabic characters
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

/**
 * Morocco cities (major ones for SEO)
 */
export const MOROCCO_CITIES = [
  { id: 'casablanca', name_fr: 'Casablanca', name_ar: 'الدار البيضاء', slug: 'casablanca' },
  { id: 'rabat', name_fr: 'Rabat', name_ar: 'الرباط', slug: 'rabat' },
  { id: 'marrakech', name_fr: 'Marrakech', name_ar: 'مراكش', slug: 'marrakech' },
  { id: 'tanger', name_fr: 'Tanger', name_ar: 'طنجة', slug: 'tanger' },
  { id: 'agadir', name_fr: 'Agadir', name_ar: 'أكادير', slug: 'agadir' },
  { id: 'fes', name_fr: 'Fès', name_ar: 'فاس', slug: 'fes' },
] as const;

/**
 * Property types for SEO URLs
 */
export const PROPERTY_TYPES = [
  { id: 'apartment', name_fr: 'Appartement', name_ar: 'شقة', slug: 'appartement' },
  { id: 'villa', name_fr: 'Villa', name_ar: 'فيلا', slug: 'villa' },
  { id: 'house', name_fr: 'Maison', name_ar: 'منزل', slug: 'maison' },
  { id: 'commercial', name_fr: 'Commercial', name_ar: 'تجاري', slug: 'commercial' },
  { id: 'land', name_fr: 'Terrain', name_ar: 'أرض', slug: 'terrain' },
] as const;

/**
 * Transaction types for SEO URLs
 */
export const TRANSACTION_TYPES = [
  { id: 'sale', name_fr: 'Acheter', name_ar: 'شراء', slug: 'acheter' },
  { id: 'rent', name_fr: 'Louer', name_ar: 'إيجار', slug: 'louer' },
] as const;

/**
 * Major neighborhoods (quartiers) by city for SEO
 * These are the most popular/searched neighborhoods in each city
 */
export const MOROCCO_NEIGHBORHOODS = {
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
} as const;

/**
 * Get all neighborhoods as flat array
 */
export function getAllNeighborhoods() {
  return Object.values(MOROCCO_NEIGHBORHOODS).flat();
}

/**
 * Get neighborhoods for a specific city
 */
export function getNeighborhoodsByCity(citySlug: string) {
  return MOROCCO_NEIGHBORHOODS[citySlug as keyof typeof MOROCCO_NEIGHBORHOODS] || [];
}

/**
 * Find a neighborhood by slug across all cities
 */
export function findNeighborhood(slug: string) {
  return getAllNeighborhoods().find(n => n.slug === slug);
}

/**
 * Find a neighborhood by city and slug
 */
export function findNeighborhoodInCity(citySlug: string, neighborhoodSlug: string) {
  const neighborhoods = getNeighborhoodsByCity(citySlug);
  return neighborhoods.find(n => n.slug === neighborhoodSlug);
}

/**
 * Generate SEO-friendly URL for property search
 * Examples: /acheter-appartement-casablanca, /louer-villa-rabat-agdal
 */
export function generatePropertySearchUrl(
  transaction: 'sale' | 'rent',
  propertyType?: string,
  city?: string,
  neighborhood?: string
): string {
  const parts: string[] = [];
  
  // Transaction type
  const transactionSlug = TRANSACTION_TYPES.find(t => t.id === transaction)?.slug || 'acheter';
  parts.push(transactionSlug);
  
  // Property type
  if (propertyType) {
    const typeSlug = PROPERTY_TYPES.find(t => t.id === propertyType)?.slug || slugify(propertyType);
    parts.push(typeSlug);
  }
  
  // City
  if (city) {
    const citySlug = MOROCCO_CITIES.find(c => c.name_fr.toLowerCase() === city.toLowerCase())?.slug || slugify(city);
    parts.push(citySlug);
  }
  
  // Neighborhood
  if (neighborhood) {
    parts.push(slugify(neighborhood));
  }
  
  return `/${parts.join('-')}`;
}

/**
 * Generate meta description for Morocco real estate
 */
export function generateMetaDescription(
  transaction: 'sale' | 'rent',
  propertyType?: string,
  city?: string,
  neighborhood?: string
): string {
  const transactionText = transaction === 'sale' ? 'à vendre' : 'à louer';
  const typeText = propertyType ? PROPERTY_TYPES.find(t => t.id === propertyType)?.name_fr : 'propriétés';
  
  let description = `Trouvez les meilleures ${typeText} ${transactionText}`;
  
  if (neighborhood && city) {
    description += ` à ${neighborhood}, ${city}`;
  } else if (city) {
    description += ` à ${city}`;
  } else {
    description += ` au Maroc`;
  }
  
  description += ` sur TopAffaireImmo. Annonces vérifiées, photos, prix, et contact direct.`;
  
  return description;
}

/**
 * Generate page title for SEO
 */
export function generatePageTitle(
  transaction: 'sale' | 'rent',
  propertyType?: string,
  city?: string,
  neighborhood?: string
): string {
  const transactionText = transaction === 'sale' ? 'Vente' : 'Location';
  const typeText = propertyType ? PROPERTY_TYPES.find(t => t.id === propertyType)?.name_fr : 'Immobilier';
  
  let title = `${typeText} ${transactionText}`;
  
  if (neighborhood && city) {
    title += ` ${neighborhood}, ${city}`;
  } else if (city) {
    title += ` ${city}`;
  } else {
    title += ` Maroc`;
  }
  
  title += ` | TopAffaireImmo`;
  
  return title;
}

/**
 * Check if current environment is a Vercel preview deployment
 */
export function isVercelPreview(): boolean {
  // Check if running in browser
  if (typeof window === 'undefined') {
    return false;
  }
  
  const url = window.location.hostname;
  const productionDomain = getProductionDomain();
  // Check if we're on a vercel.app domain but not the production one
  return url.includes('vercel.app') && !window.location.origin.startsWith(productionDomain);
}

/**
 * Check if we should allow indexing
 */
export function shouldAllowIndexing(): boolean {
  // Check if running in browser
  if (typeof window === 'undefined') {
    return true; // Default to allowing indexing on server
  }
  
  const domain = getProductionDomain();
  const currentUrl = window.location.origin;
  
  // Only allow indexing on production domain
  return currentUrl === domain;
}
