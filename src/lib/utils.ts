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

/**
 * Maps UI transaction type values to database values
 * Ensures that only 'sale' or 'rent' are sent to the database
 * 
 * @param value - The transaction type value to map (may be a UI label or database value)
 * @returns 'sale' or 'rent' - the database-safe value
 */
export function mapTransactionType(value: string): 'sale' | 'rent' {
  // Return early for already correct database values (most common case)
  if (value === 'sale' || value === 'rent') {
    return value;
  }
  
  // Normalize the value for comparison
  const normalized = value?.toLowerCase().trim();
  
  // Already correct after normalization
  if (normalized === 'sale') {
    return 'sale';
  }
  if (normalized === 'rent') {
    return 'rent';
  }
  
  // Map French labels to database values
  if (normalized === 'vente' || normalized === 'à vendre') {
    return 'sale';
  }
  if (normalized === 'location' || normalized === 'à louer') {
    return 'rent';
  }
  
  // Map Arabic labels to database values
  // Note: toLowerCase() has no effect on Arabic text but kept for consistency
  if (normalized === 'للبيع') {
    return 'sale';
  }
  if (normalized === 'للإيجار') {
    return 'rent';
  }
  
  // Log warning for unrecognized values to help with debugging
  console.warn(`[mapTransactionType] Unrecognized transaction type value: "${value}", defaulting to "sale"`);
  
  // Default to 'sale' for any unrecognized value
  return 'sale';
}
