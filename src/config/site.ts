/**
 * Site Configuration
 * Centralized configuration for site URLs and domain-related settings
 */

/**
 * Get the base site URL for the current environment
 * Priority:
 * 1. VITE_PRODUCTION_DOMAIN env var (production deployments)
 * 2. VITE_SITE_URL env var (fallback)
 * 3. Default to www.topaffaireimmo.com
 */
export function getSiteUrl(): string {
  return import.meta.env.VITE_PRODUCTION_DOMAIN || 
         import.meta.env.VITE_SITE_URL || 
         'https://www.topaffaireimmo.com';
}

/**
 * The base URL for the site (without trailing slash)
 */
export const SITE_URL = getSiteUrl();

/**
 * Site metadata
 */
export const SITE_CONFIG = {
  name: 'TopAffaireImmo',
  description: 'Plateforme immobilière de référence au Maroc',
  url: SITE_URL,
} as const;
