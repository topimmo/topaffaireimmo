/**
 * Site Configuration
 * Centralized configuration for site URLs and domain-related settings
 * 
 * PRODUCTION SAFETY: All env access is defensive and never throws
 */

import { getEnv } from '@/lib/env'

/**
 * Get the base site URL for the current environment
 * Priority:
 * 1. VITE_PRODUCTION_DOMAIN env var (production deployments)
 * 2. VITE_SITE_URL env var (fallback)
 * 3. Default to www.topaffaireimmo.com
 * 
 * PRODUCTION SAFETY: Never throws, always returns a valid URL
 */
export function getSiteUrl(): string {
  try {
    return getEnv('VITE_PRODUCTION_DOMAIN') || 
           getEnv('VITE_SITE_URL') || 
           'https://www.topaffaireimmo.com'
  } catch (error) {
    console.error('[SiteConfig] Failed to get site URL:', error instanceof Error ? error.message : 'Unknown error')
    return 'https://www.topaffaireimmo.com'
  }
}

/**
 * The base URL for the site (without trailing slash)
 * PRODUCTION SAFETY: Wrapped in try-catch to prevent module initialization crash
 */
export const SITE_URL = (() => {
  try {
    return getSiteUrl()
  } catch (error) {
    console.error('[SiteConfig] Failed to initialize SITE_URL:', error instanceof Error ? error.message : 'Unknown error')
    return 'https://www.topaffaireimmo.com'
  }
})()

/**
 * Site metadata
 * PRODUCTION SAFETY: Safe initialization with fallbacks
 */
export const SITE_CONFIG = {
  name: 'TopAffaireImmo',
  description: 'Plateforme immobilière de référence au Maroc',
  url: SITE_URL,
} as const
