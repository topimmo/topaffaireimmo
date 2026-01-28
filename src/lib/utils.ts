import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the site URL for auth redirects
 * Priority:
 * 1. VITE_SITE_URL environment variable
 * 2. window.location.origin (if available)
 * 3. Fallback to production domain
 * 
 * This ensures auth email links always redirect to the correct domain
 */
export function getSiteUrl(): string {
  // Priority 1: Check for explicit VITE_SITE_URL
  const envSiteUrl = import.meta.env.VITE_SITE_URL;
  if (envSiteUrl && typeof envSiteUrl === 'string' && envSiteUrl.trim()) {
    return envSiteUrl.trim();
  }
  
  // Priority 2: Use current origin if available (browser context)
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  
  // Priority 3: Fallback to production domain
  return 'https://www.topaffaireimmo.com';
}
