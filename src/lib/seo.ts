// SEO utilities for Morocco real estate platform
// Provides canonical URLs, meta tags, and SEO-friendly URLs

/**
 * Get the production domain URL
 * Falls back to Vercel deployment URL if not configured
 */
export function getProductionDomain(): string {
  return import.meta.env.VITE_PRODUCTION_DOMAIN || 'https://topaffaireimmo.vercel.app';
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
  return url.includes('vercel.app') && !url.includes('topaffaireimmo.vercel.app');
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
