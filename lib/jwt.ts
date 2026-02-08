/**
 * JWT Token Utilities
 * 
 * Provides JWT signing and verification for OTP authentication.
 * Tokens are signed with HS256 using JWT_SECRET from environment variables.
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable');
}

/**
 * JWT payload structure for OTP authentication
 */
export interface OTPTokenPayload {
  phone: string;
  iat?: number;
  exp?: number;
}

/**
 * Sign a JWT token for authenticated phone number
 * 
 * @param phone - Normalized phone number in E.164 format
 * @param expiresIn - Token expiration (default: '7d' for 7 days)
 * @returns Signed JWT token
 */
export function signToken(phone: string, expiresIn: string = '7d'): string {
  const payload: OTPTokenPayload = {
    phone,
  };

  return jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn,
  });
}

/**
 * Verify and decode a JWT token
 * 
 * @param token - JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): OTPTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as OTPTokenPayload;

    return decoded;
  } catch (error) {
    console.debug('[jwt] Token verification failed:', error);
    return null;
  }
}

/**
 * Decode a JWT token without verification (for debugging)
 * 
 * @param token - JWT token to decode
 * @returns Decoded payload or null if invalid format
 */
export function decodeToken(token: string): OTPTokenPayload | null {
  try {
    const decoded = jwt.decode(token) as OTPTokenPayload;
    return decoded;
  } catch (error) {
    console.debug('[jwt] Token decode failed:', error);
    return null;
  }
}
