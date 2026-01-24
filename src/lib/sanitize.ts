import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param dirty - Potentially unsafe HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string | undefined | null): string {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Strips all HTML tags from a string
 * @param dirty - String that may contain HTML
 * @returns Plain text without HTML tags
 */
export function stripHtml(dirty: string | undefined | null): string {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitizes text for use in titles and short text fields
 * Removes all HTML and special characters that could be used for XSS
 */
export function sanitizeText(text: string | undefined | null): string {
  if (!text) return '';
  
  // Strip HTML first
  const stripped = stripHtml(text);
  
  // Remove any remaining script-like patterns
  return stripped
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * Validates and sanitizes a URL
 * Only allows http:// and https:// protocols
 */
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    
    return parsed.toString();
  } catch {
    // Invalid URL
    return '';
  }
}

/**
 * Sanitizes phone number - removes all non-digit characters except +
 */
export function sanitizePhone(phone: string | undefined | null): string {
  if (!phone) return '';
  
  return phone.replace(/[^\d+\s-]/g, '').trim();
}

/**
 * Sanitizes email - basic validation and normalization
 */
export function sanitizeEmail(email: string | undefined | null): string {
  if (!email) return '';
  
  return email.toLowerCase().trim();
}
