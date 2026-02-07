import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

/**
 * Normalize a phone number to E.164 international format
 * 
 * @param phone - The phone number to normalize (can include spaces, dashes, etc.)
 * @param defaultCountry - Default country code (defaults to 'MA' for Morocco)
 * @returns Normalized phone number in E.164 format (e.g., +212664352280) or null if invalid
 */
export function normalizePhone(phone: string, defaultCountry: CountryCode = 'MA'): string | null {
  if (!phone || phone.trim() === '') {
    return null;
  }

  try {
    // Parse the phone number with country context
    const phoneNumber = parsePhoneNumber(phone, defaultCountry);
    
    // Return E.164 format if valid
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.format('E.164');
    }
  } catch (error) {
    // If parsing fails, return null
    console.debug('[phoneValidation] Failed to parse phone number:', phone, error);
  }

  return null;
}

/**
 * Validate if a phone number is valid
 * 
 * @param phone - The phone number to validate
 * @param defaultCountry - Default country code (defaults to 'MA' for Morocco)
 * @returns true if valid, false otherwise
 */
export function isValidPhone(phone: string, defaultCountry: CountryCode = 'MA'): boolean {
  if (!phone || phone.trim() === '') {
    return true; // Empty is valid (optional field)
  }

  try {
    return isValidPhoneNumber(phone, defaultCountry);
  } catch (error) {
    return false;
  }
}

/**
 * Get a user-friendly error message for an invalid phone number
 * 
 * @param phone - The phone number that failed validation
 * @param isRTL - Whether to return Arabic (RTL) or French message
 * @returns User-friendly error message
 */
export function getPhoneError(phone: string, isRTL: boolean): string {
  if (!phone || phone.trim() === '') {
    return '';
  }

  // Check if it's completely invalid
  if (!isValidPhone(phone)) {
    return isRTL
      ? 'رقم الهاتف غير صالح. استخدم التنسيق: +212..., 06..., 07..., أو التنسيق الدولي'
      : 'Numéro invalide. Utilisez le format: +212..., 06..., 07..., ou format international';
  }

  return '';
}

/**
 * Format a phone number for display (with spacing)
 * 
 * @param phone - Phone number in any format
 * @param defaultCountry - Default country code
 * @returns Formatted phone number or original if parsing fails
 */
export function formatPhoneForDisplay(phone: string, defaultCountry: CountryCode = 'MA'): string {
  if (!phone) return '';

  try {
    const phoneNumber = parsePhoneNumber(phone, defaultCountry);
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.formatInternational();
    }
  } catch (error) {
    // Return original if formatting fails
  }

  return phone;
}
