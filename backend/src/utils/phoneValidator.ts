import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { config } from '../config/index.js';

export function validateMoroccanPhone(phone: string): { isValid: boolean; formatted?: string; error?: string } {
  try {
    // Check if phone starts with allowed country code
    if (!phone.startsWith(config.allowedCountryCode)) {
      return {
        isValid: false,
        error: `Phone number must start with ${config.allowedCountryCode}`,
      };
    }

    // Validate using libphonenumber-js
    if (!isValidPhoneNumber(phone, 'MA')) {
      return {
        isValid: false,
        error: 'Invalid Moroccan phone number format',
      };
    }

    // Parse and format
    const phoneNumber = parsePhoneNumber(phone, 'MA');
    
    return {
      isValid: true,
      formatted: phoneNumber.format('E.164'),
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid phone number',
    };
  }
}

export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  
  // Use crypto for secure random generation
  const crypto = await import('crypto');
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % digits.length];
  }
  
  return otp;
}
