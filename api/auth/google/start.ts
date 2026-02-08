/**
 * GET /api/auth/google/start
 * 
 * Initiates Google OAuth 2.0 authorization flow with PKCE.
 * Generates state and code_verifier, stores them, then redirects to Google.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  buildAuthorizationUrl,
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
  storeOAuthState,
  validateConfig,
} from '../../../lib/googleOAuth';

// Rate limiting: simple in-memory tracking
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

/**
 * Get client IP address
 */
function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Check rate limit for IP
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(ip) || [];
  
  // Remove old requests outside the window
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  
  return true;
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, requests] of rateLimitMap.entries()) {
    const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
    if (recentRequests.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, recentRequests);
    }
  }
}, 60 * 1000);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate Google OAuth configuration
    if (!validateConfig()) {
      console.error('[auth/google/start] Missing Google OAuth configuration');
      return res.status(500).json({
        error: 'Google authentication is not configured. Please contact support.',
      });
    }

    // Check rate limit
    const clientIp = getClientIp(req);
    if (!checkRateLimit(clientIp)) {
      console.log('[auth/google/start] Rate limit exceeded for IP:', clientIp);
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
      });
    }

    // Generate PKCE parameters
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    // Store state and code_verifier in memory (10 min TTL)
    storeOAuthState(state, codeVerifier);

    // Build Google authorization URL
    const authUrl = buildAuthorizationUrl(state, codeChallenge);

    console.log('[auth/google/start] Redirecting to Google OAuth, state:', state.substring(0, 8) + '...');

    // Redirect to Google authorization page
    return res.redirect(307, authUrl);
  } catch (error) {
    console.error('[auth/google/start] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
