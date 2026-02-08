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
  
  // Remove old requests outside the window (lazy cleanup)
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Debug log all required ENV variables
    console.error('[auth/google/start] Validating ENV variables...');
    
    // Check Supabase ENV variables
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    
    console.error('[auth/google/start] Supabase ENV Variables:');
    console.error(`  SUPABASE_URL: ${supabaseUrl ? 'SET (' + supabaseUrl + ')' : 'MISSING'}`);
    console.error(`  SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET (length: ' + supabaseAnonKey.length + ')' : 'MISSING'}`);
    
    const missingEnvVars: string[] = [];
    if (!supabaseUrl) missingEnvVars.push('SUPABASE_URL (or VITE_SUPABASE_URL)');
    if (!supabaseAnonKey) missingEnvVars.push('SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY)');
    
    if (missingEnvVars.length > 0) {
      const errorMsg = `Missing required ENV variables: ${missingEnvVars.join(', ')}`;
      console.error(`[auth/google/start] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    // Validate Google OAuth configuration (this will log and throw if missing)
    validateConfig();

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
    // Log the actual error details
    console.error('[auth/google/start] Error occurred:', error);
    
    // If it's an ENV validation error, return more specific message
    if (error instanceof Error && error.message.includes('Missing required ENV variables')) {
      console.error('[auth/google/start] ENV validation failed:', error.message);
      return res.status(500).json({ 
        error: 'Server configuration error: ' + error.message 
      });
    }
    
    // Generic error fallback
    console.error('[auth/google/start] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
