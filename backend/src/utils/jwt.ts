import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface JWTPayload {
  userId: string;
  phone: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload as object, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
  } catch (error) {
    return null;
  }
}
