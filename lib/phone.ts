/**
 * Phone Validation and Normalization for Morocco (+212)
 * 
 * This module provides utilities for validating and normalizing Moroccan phone numbers.
 * Uses libphonenumber-js for robust international phone number handling.
 */

import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

/**
 * Validates that a phone number is a valid Moroccan number
 * 
 * @param phone - Phone number in any format
 * @returns true if valid Moroccan number, false otherwise
 */
export function isValidMoroccanPhone(phone: string): boolean {
  if (!phone || phone.trim() === '') {
    return false;
  }

  try {
    // Parse and validate as Moroccan number
    const phoneNumber = parsePhoneNumber(phone, 'MA');
    
    // Must be valid and from Morocco (+212)
    return phoneNumber?.isValid() && phoneNumber?.country === 'MA';
  } catch (error) {
    return false;
  }
}

/**
 * Normalizes a Moroccan phone number to E.164 format (+212XXXXXXXXX)
 * 
 * @param phone - Phone number in any format (e.g., "0664352280", "+212664352280", "212664352280")
 * @returns Normalized phone number in E.164 format or null if invalid
 * 
 * @example
 * normalizeMoroccanPhone('0664352280') // Returns: '+212664352280'
 * normalizeMoroccanPhone('+212664352280') // Returns: '+212664352280'
 * normalizeMoroccanPhone('212664352280') // Returns: '+212664352280'
 * normalizeMoroccanPhone('invalid') // Returns: null
 */
export function normalizeMoroccanPhone(phone: string): string | null {
  if (!phone || phone.trim() === '') {
    return null;
  }

  try {
    // Pre-process: Convert 00212 to +212
    let processedPhone = phone.trim();
    const digitsOnly = processedPhone.replace(/[^\d]/g, '');
    
    if (digitsOnly.startsWith('00212')) {
      processedPhone = '+212' + digitsOnly.substring(5);
    } else if (digitsOnly.startsWith('212') && !processedPhone.startsWith('+')) {
      processedPhone = '+' + digitsOnly;
    }
    
    // Parse with Morocco as default country
    const phoneNumber = parsePhoneNumber(processedPhone, 'MA');
    
    // Verify it's a valid Moroccan number
    if (phoneNumber?.isValid() && phoneNumber?.country === 'MA') {
      return phoneNumber.format('E.164');
    }
  } catch (error) {
    console.debug('[phone] Failed to parse phone number:', phone, error);
  }

  return null;
}

/**
 * Validates and normalizes a Moroccan phone number
 * 
 * @param phone - Phone number in any format
 * @returns Object with validation result and normalized phone
 */
export function validateAndNormalizeMoroccanPhone(phone: string): {
  isValid: boolean;
  normalized: string | null;
  error?: string;
} {
  if (!phone || phone.trim() === '') {
    return {
      isValid: false,
      normalized: null,
      error: 'Phone number is required',
    };
  }

  const normalized = normalizeMoroccanPhone(phone);
  
  if (!normalized) {
    return {
      isValid: false,
      normalized: null,
      error: 'Invalid Moroccan phone number. Use format: +212XXXXXXXXX, 06XXXXXXXX, or 07XXXXXXXX',
    };
  }

  return {
    isValid: true,
    normalized,
  };
}
