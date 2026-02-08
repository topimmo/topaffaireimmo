import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable');
}

interface OTPTokenPayload {
  phone: string;
  iat?: number;
  exp?: number;
}

// Test the problematic code
export function signToken(phone: string, expiresIn: string = '7d'): string {
  const payload: OTPTokenPayload = {
    phone,
  };

  return jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn,
  });
}
