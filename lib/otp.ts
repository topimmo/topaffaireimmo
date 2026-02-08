/**
 * OTP Generation and Hashing Utilities
 * 
 * Provides secure OTP generation and bcrypt hashing for verification.
 */

import bcrypt from 'bcryptjs';

/**
 * Generate a random 6-digit OTP code
 * 
 * @returns 6-digit OTP as string (e.g., "123456")
 */
export function generateOTP(): string {
  // Generate random 6-digit number (100000 to 999999)
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

/**
 * Hash an OTP code using bcrypt
 * 
 * @param otp - Plain OTP code to hash
 * @param saltRounds - Number of salt rounds (default: 10)
 * @returns Bcrypt hash of the OTP
 */
export async function hashOTP(otp: string, saltRounds: number = 10): Promise<string> {
  return bcrypt.hash(otp, saltRounds);
}

/**
 * Compare a plain OTP code with a bcrypt hash
 * 
 * @param otp - Plain OTP code to compare
 * @param hash - Bcrypt hash to compare against
 * @returns true if OTP matches hash, false otherwise
 */
export async function compareOTP(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

/**
 * Validate OTP format (must be exactly 6 digits)
 * 
 * @param otp - OTP code to validate
 * @returns true if valid format, false otherwise
 */
export function isValidOTPFormat(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}
