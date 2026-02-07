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
 * Detects if the user is viewing the page in an in-app browser (webview)
 * In-app browsers like Gmail, Facebook, WhatsApp, etc. can have issues with:
 * - Hash fragments being stripped from URLs
 * - Auth flows not working properly
 * - Session storage limitations
 * 
 * @returns Object with detection results
 */
export function detectInAppBrowser(): {
  isInApp: boolean;
  browserName: string;
  userAgent: string;
} {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isInApp: false, browserName: 'unknown', userAgent: '' };
  }

  const ua = navigator.userAgent || '';
  const uaLower = ua.toLowerCase();

  // Detect specific in-app browsers
  if (uaLower.includes('instagram')) {
    return { isInApp: true, browserName: 'Instagram', userAgent: ua };
  }
  
  if (uaLower.includes('fban') || uaLower.includes('fbav') || uaLower.includes('facebook')) {
    return { isInApp: true, browserName: 'Facebook', userAgent: ua };
  }
  
  if (uaLower.includes('whatsapp')) {
    return { isInApp: true, browserName: 'WhatsApp', userAgent: ua };
  }
  
  if (uaLower.includes('linkedin')) {
    return { isInApp: true, browserName: 'LinkedIn', userAgent: ua };
  }
  
  if (uaLower.includes('twitter')) {
    return { isInApp: true, browserName: 'Twitter', userAgent: ua };
  }
  
  // Gmail in-app browser detection (Android)
  // Gmail app uses Chrome Custom Tabs which may strip hash fragments
  if (uaLower.includes('gsa/')) {
    return { isInApp: true, browserName: 'Gmail', userAgent: ua };
  }
  
  // iOS webview detection
  // iOS in-app browsers don't include Safari in the user agent
  const isIOS = /iphone|ipod|ipad/i.test(uaLower);
  const isSafari = /safari/i.test(ua);
  const isWebKit = /webkit/i.test(uaLower);
  
  if (isIOS && isWebKit && !isSafari) {
    return { isInApp: true, browserName: 'iOS WebView', userAgent: ua };
  }
  
  // Generic webview detection
  if (uaLower.includes('webview') || uaLower.includes('wv')) {
    return { isInApp: true, browserName: 'WebView', userAgent: ua };
  }

  return { isInApp: false, browserName: 'Browser', userAgent: ua };
}

/**
 * Generates instructions for opening the current page in an external browser
 * @param isRTL - Whether to use RTL (Arabic) language
 * @returns Object with instructions and action button text
 */
export function getOpenInBrowserInstructions(isRTL: boolean): {
  title: string;
  instructions: string[];
  actionText: string;
} {
  const detection = detectInAppBrowser();
  
  if (!detection.isInApp) {
    return {
      title: '',
      instructions: [],
      actionText: ''
    };
  }

  // Platform-specific instructions
  const isIOS = /iphone|ipod|ipad/i.test(navigator.userAgent.toLowerCase());
  const isAndroid = /android/i.test(navigator.userAgent.toLowerCase());

  if (isRTL) {
    if (isIOS) {
      return {
        title: 'افتح في المتصفح',
        instructions: [
          'اضغط على زر المشاركة (↗️) في الأسفل',
          'اختر "فتح في Safari"',
          'أو انسخ الرابط والصقه في Safari'
        ],
        actionText: 'نسخ الرابط'
      };
    } else if (isAndroid) {
      return {
        title: 'افتح في المتصفح',
        instructions: [
          'اضغط على القائمة (⋮) في الأعلى',
          'اختر "فتح في المتصفح" أو "فتح في Chrome"',
          'أو انسخ الرابط والصقه في Chrome'
        ],
        actionText: 'نسخ الرابط'
      };
    }
    
    return {
      title: 'افتح في المتصفح',
      instructions: [
        'انسخ هذا الرابط',
        'افتح متصفحك (Chrome أو Safari)',
        'الصق الرابط في شريط العناوين'
      ],
      actionText: 'نسخ الرابط'
    };
  }
  
  // French/LTR instructions
  if (isIOS) {
    return {
      title: 'Ouvrir dans le navigateur',
      instructions: [
        'Appuyez sur le bouton de partage (↗️) en bas',
        'Sélectionnez "Ouvrir dans Safari"',
        'Ou copiez le lien et collez-le dans Safari'
      ],
      actionText: 'Copier le lien'
    };
  } else if (isAndroid) {
    return {
      title: 'Ouvrir dans le navigateur',
      instructions: [
        'Appuyez sur le menu (⋮) en haut',
        'Sélectionnez "Ouvrir dans le navigateur" ou "Ouvrir dans Chrome"',
        'Ou copiez le lien et collez-le dans Chrome'
      ],
      actionText: 'Copier le lien'
    };
  }
  
  return {
    title: 'Ouvrir dans le navigateur',
    instructions: [
      'Copiez ce lien',
      'Ouvrez votre navigateur (Chrome ou Safari)',
      'Collez le lien dans la barre d\'adresse'
    ],
    actionText: 'Copier le lien'
  };
}

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise that resolves to true if successful
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.clipboard) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      console.error('Failed to copy text:', err);
      return false;
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text:', err);
    return false;
  }
}

/**
 * Normalize a phone number by removing spaces, dashes, parentheses, and other non-digit characters
 * Converts Moroccan local format (06/07/05) to E.164 international format
 * Preserves the leading + sign for E.164 format
 * 
 * @param phone - The phone number to normalize
 * @returns Normalized phone number (e.g., "+212664228976")
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all characters except digits and +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // Handle international format starting with 00 (e.g., 00212... -> +212...)
  if (normalized.startsWith('00')) {
    normalized = '+' + normalized.substring(2);
  }
  
  // Handle Moroccan local format: 06/07/05 -> +2126/+2127/+2125
  if (normalized && !normalized.startsWith('+') && /^0[567]\d{8}$/.test(normalized)) {
    // Moroccan mobile numbers: 0[567]XXXXXXXX (10 digits total)
    // Convert to international: +212[567]XXXXXXXX
    return '+212' + normalized.substring(1);
  }
  
  // Ensure it starts with + if it contains digits
  if (normalized && !normalized.startsWith('+')) {
    return '+' + normalized;
  }
  
  return normalized;
}

/**
 * Validate a phone number in international format
 * International format: +[country code][subscriber number]
 * - Must start with + followed by non-zero digit (E.164 standard)
 * - Total digits after '+': 7-15 (includes country code and subscriber number)
 * - Country codes cannot start with 0 per E.164 standard
 * - Valid examples: +212664228976, +33123456789, +14155552671, +356123456
 * 
 * @param phone - The phone number to validate
 * @returns true if valid international format, false otherwise
 */
export function validateE164Phone(phone: string): boolean {
  if (!phone) return true; // Allow empty (optional field)
  
  // Normalize first to remove formatting
  const normalized = normalizePhoneNumber(phone);
  
  // International phone regex: + followed by non-zero digit, then 6-14 more digits
  // This gives us 7-15 total digits while enforcing E.164 standard (no leading 0)
  const internationalPhoneRegex = /^\+[1-9]\d{6,14}$/;
  
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
  
  // Check if first digit after + is 0 (invalid per E.164)
  if (normalized.length > 1 && normalized[1] === '0') {
    return isRTL
      ? 'رمز البلد لا يمكن أن يبدأ بـ 0'
      : 'Le code pays ne peut pas commencer par 0';
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
