/**
 * Phone number normalization and validation utilities
 * Using libphonenumber-js for international phone number handling
 */

import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

/**
 * Normalize a phone number to E.164 format
 * Supports Morocco (default) and international formats
 * 
 * Examples:
 * - "0612345678" -> "+212612345678"
 * - "06 12 34 56 78" -> "+212612345678"
 * - "+212 612345678" -> "+212612345678"
 * - "+33612345678" -> "+33612345678"
 * 
 * @param input - Raw phone number input
 * @param defaultCountry - Default country code (defaults to 'MA' for Morocco)
 * @returns Normalized phone number in E.164 format or null if invalid
 */
export function normalizePhone(input: string, defaultCountry: CountryCode = 'MA'): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Remove all whitespace and common separators
  const cleaned = input.replace(/[\s\-().]/g, '');

  try {
    // If it starts with +, parse as international
    if (cleaned.startsWith('+')) {
      const phoneNumber = parsePhoneNumber(cleaned);
      if (phoneNumber && phoneNumber.isValid()) {
        return phoneNumber.format('E.164');
      }
    }

    // If it starts with 0, assume it's a national number for the default country
    if (cleaned.startsWith('0')) {
      const phoneNumber = parsePhoneNumber(cleaned, defaultCountry);
      if (phoneNumber && phoneNumber.isValid()) {
        return phoneNumber.format('E.164');
      }
    }

    // Try parsing with default country
    const phoneNumber = parsePhoneNumber(cleaned, defaultCountry);
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.format('E.164');
    }

    // Last attempt: try adding country code if missing
    if (!cleaned.startsWith('+') && !cleaned.startsWith('0')) {
      const withPlus = '+' + cleaned;
      const phoneNumber = parsePhoneNumber(withPlus);
      if (phoneNumber && phoneNumber.isValid()) {
        return phoneNumber.format('E.164');
      }
    }

    return null;
  } catch (error) {
    console.error('Phone normalization error:', error);
    return null;
  }
}

/**
 * Validate if a phone number is valid
 * 
 * @param input - Raw phone number input
 * @param defaultCountry - Default country code (defaults to 'MA' for Morocco)
 * @returns True if valid, false otherwise
 */
export function isValidPhone(input: string, defaultCountry: CountryCode = 'MA'): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const cleaned = input.replace(/[\s\-().]/g, '');

  try {
    // If it starts with +, validate as international
    if (cleaned.startsWith('+')) {
      return isValidPhoneNumber(cleaned);
    }

    // Otherwise validate with default country
    return isValidPhoneNumber(cleaned, defaultCountry);
  } catch (error) {
    return false;
  }
}

/**
 * Format a phone number for display
 * 
 * @param input - Phone number to format
 * @param defaultCountry - Default country code (defaults to 'MA' for Morocco)
 * @returns Formatted phone number or original input if invalid
 */
export function formatPhoneForDisplay(input: string, defaultCountry: CountryCode = 'MA'): string {
  if (!input) return input;

  try {
    const cleaned = input.replace(/[\s\-().]/g, '');
    
    if (cleaned.startsWith('+')) {
      const phoneNumber = parsePhoneNumber(cleaned);
      if (phoneNumber && phoneNumber.isValid()) {
        return phoneNumber.formatInternational();
      }
    } else {
      const phoneNumber = parsePhoneNumber(cleaned, defaultCountry);
      if (phoneNumber && phoneNumber.isValid()) {
        return phoneNumber.formatInternational();
      }
    }
    
    return input;
  } catch (error) {
    return input;
  }
}
