import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/topaffaireimmo',
  redisUrl: process.env.REDIS_URL,
  
  // Vonage
  vonage: {
    apiKey: process.env.VONAGE_API_KEY || '',
    apiSecret: process.env.VONAGE_API_SECRET || '',
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // OTP
  otp: {
    length: parseInt(process.env.OTP_LENGTH || '6', 10),
    ttlMinutes: parseInt(process.env.OTP_TTL_MINUTES || '5', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
    lockoutMinutes: parseInt(process.env.OTP_LOCKOUT_MINUTES || '15', 10),
  },
  
  // Rate Limiting
  rateLimit: {
    windowMinutes: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '60', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '3', 10),
  },
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Phone
  allowedCountryCode: process.env.ALLOWED_COUNTRY_CODE || '+212',
};
