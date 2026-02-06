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

/**
 * Parse hash parameters from URL
 * Safely extracts parameters from URL hash (e.g., #access_token=...&refresh_token=...)
 * Used for handling Supabase auth flows that use hash-based tokens
 * 
 * @returns Object containing parsed hash parameters
 */
export function parseHashParams(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }

  const hash = window.location.hash.substring(1); // Remove the '#'
  if (!hash) {
    return {};
  }

  const params: Record<string, string> = {};
  const pairs = hash.split('&');

  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  }

  return params;
}

/**
 * Clear URL hash without reloading the page
 * Useful after extracting auth tokens from hash to clean up the URL
 */
export function clearUrlHash(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Use history.replaceState to remove hash without page reload
  if (window.history && window.history.replaceState) {
    const urlWithoutHash = window.location.pathname + window.location.search;
    window.history.replaceState(null, '', urlWithoutHash);
  }
}

/**
 * Normalize a phone number by removing spaces, dashes, parentheses, and other non-digit characters
 * Preserves the leading + sign for E.164 format
 * 
 * @param phone - The phone number to normalize
 * @returns Normalized phone number (e.g., "+212664228976")
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all characters except digits and +
  const normalized = phone.replace(/[^\d+]/g, '');
  
  // Ensure it starts with + if it contains digits
  if (normalized && !normalized.startsWith('+')) {
    return '+' + normalized;
  }
  
  return normalized;
}

/**
 * Validate a phone number in international format
 * International format: +[country code][subscriber number]
 * - Must start with +
 * - Total digits after '+': 7-15 (includes country code and subscriber number)
 * - Valid examples: +212664228976, +33123456789, +14155552671, +356123456
 * 
 * @param phone - The phone number to validate
 * @returns true if valid international format, false otherwise
 */
export function validateE164Phone(phone: string): boolean {
  if (!phone) return true; // Allow empty (optional field)
  
  // Normalize first to remove formatting
  const normalized = normalizePhoneNumber(phone);
  
  // International phone regex: + followed by 7-15 digits
  // Accepts any international phone number format
  const internationalPhoneRegex = /^\+\d{7,15}$/;
  
  return internationalPhoneRegex.test(normalized);
}

/**
 * Format a phone number for WhatsApp wa.me link
 * Converts E.164 format to wa.me format (removes the + sign)
 * 
 * @param phone - Phone number in E.164 format (e.g., "+212664228976")
 * @returns WhatsApp URL (e.g., "https://wa.me/212664228976")
 */
export function formatWhatsAppLink(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (!digitsOnly) return '';
  
  return `https://wa.me/${digitsOnly}`;
}

/**
 * Get user-friendly error message for invalid phone number
 * 
 * @param phone - The invalid phone number
 * @param isRTL - Whether to return RTL (Arabic) message
 * @returns Error message
 */
export function getPhoneValidationError(phone: string, isRTL: boolean): string {
  if (!phone || phone.trim() === '') {
    return ''; // No error for empty field
  }
  
  const normalized = normalizePhoneNumber(phone);
  
  if (!normalized.startsWith('+')) {
    return isRTL
      ? 'يجب أن يبدأ الرقم بـ + متبوعًا برمز البلد'
      : 'Le numéro doit commencer par + suivi du code pays';
  }
  
  // International format allows 7-15 digits after '+', so normalized length should be 8-16 (including '+')
  if (normalized.length < 8) {
    return isRTL
      ? 'الرقم قصير جدًا'
      : 'Le numéro est trop court';
  }
  
  if (normalized.length > 16) {
    return isRTL
      ? 'الرقم طويل جدًا'
      : 'Le numéro est trop long';
  }
  
  return isRTL
    ? 'تنسيق غير صالح. استخدم التنسيق الدولي (مثال: +212...)'
    : 'Format invalide. Veuillez entrer un numéro de téléphone au format international (ex: +212...)';
}
