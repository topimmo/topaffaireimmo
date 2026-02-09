/**
 * Phone number normalization and validation utilities
 * Using libphonenumber-js for international phone number handling
 */

import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

// Regex pattern to clean phone numbers (remove whitespace and common separators)
const PHONE_CLEANUP_REGEX = /[\s\-().]/g;

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
  const cleaned = input.replace(PHONE_CLEANUP_REGEX, '');

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
    const cleaned = input.replace(PHONE_CLEANUP_REGEX, '');
    
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

/**
 * Mask a phone number for privacy display
 * Shows country code and first/last few digits, hides middle
 * 
 * Examples:
 * - "+212612345678" -> "+212 6** *** **78"
 * - "+33612345678" -> "+33 6** *** **78"
 * 
 * @param phone - Phone number in E.164 format
 * @returns Masked phone number for display
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return phone;
  }

  try {
    const phoneNumber = parsePhoneNumber(phone);
    if (!phoneNumber || !phoneNumber.isValid()) {
      return phone;
    }

    // Get country code and national number
    const countryCode = phoneNumber.countryCallingCode;
    const nationalNumber = phoneNumber.nationalNumber;

    // Convert to string for masking
    const digits = nationalNumber.toString();
    
    if (digits.length < 6) {
      // Too short to mask meaningfully
      return phone;
    }

    // Show first 1 and last 2 digits, mask the middle
    const first = digits.substring(0, 1);
    const last = digits.substring(digits.length - 2);
    const middleLength = digits.length - 3;
    
    // Create masked middle section with appropriate length
    let maskedMiddle = '';
    if (middleLength <= 3) {
      maskedMiddle = '*'.repeat(middleLength);
    } else {
      // For longer numbers, use grouped asterisks for readability
      maskedMiddle = '** *** **';
    }

    return `+${countryCode} ${first}${maskedMiddle}${last}`;
  } catch (error) {
    console.error('Phone masking error:', error);
    return phone;
  }
}

