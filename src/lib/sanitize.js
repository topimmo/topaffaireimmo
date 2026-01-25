import DOMPurify from 'dompurify';
/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param dirty - Potentially unsafe HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty) {
    if (!dirty)
        return '';
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
export function stripHtml(dirty) {
    if (!dirty)
        return '';
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
    });
}
/**
 * Sanitizes text for use in titles and short text fields
 * Removes all HTML tags
 */
export function sanitizeText(text) {
    if (!text)
        return '';
    // DOMPurify handles all XSS patterns comprehensively
    return stripHtml(text);
}
/**
 * Validates and sanitizes a URL
 * Only allows http:// and https:// protocols
 */
export function sanitizeUrl(url) {
    if (!url)
        return '';
    try {
        const parsed = new URL(url);
        // Only allow http and https protocols
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return '';
        }
        return parsed.toString();
    }
    catch {
        // Invalid URL
        return '';
    }
}
/**
 * Sanitizes phone number - removes all non-digit characters except +
 */
export function sanitizePhone(phone) {
    if (!phone)
        return '';
    return phone.replace(/[^\d+\s-]/g, '').trim();
}
/**
 * Sanitizes email - basic validation and normalization
 */
export function sanitizeEmail(email) {
    if (!email)
        return '';
    return email.toLowerCase().trim();
}
