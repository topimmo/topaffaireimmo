import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

// Rate limiter for OTP requests (per phone + IP)
export const otpRequestLimiter = rateLimit({
  windowMs: config.rateLimit.windowMinutes * 60 * 1000,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many OTP requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator: phone + IP
  keyGenerator: (req) => {
    const phone = req.body?.phone || 'unknown';
    const ip = req.ip || 'unknown';
    return `${phone}:${ip}`;
  },
  skip: (req) => {
    // Skip rate limiting in development if needed
    return config.nodeEnv === 'development' && process.env.SKIP_RATE_LIMIT === 'true';
  },
});

// General API rate limiter (per IP)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP per 15 minutes
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
