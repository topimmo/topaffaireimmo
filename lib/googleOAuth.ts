/**
 * Google OAuth Helper Functions
 * 
 * Provides utilities for Google OAuth 2.0 Authorization Code flow with PKCE.
 * Handles authorization URL generation, token exchange, and user info retrieval.
 */

import crypto from 'crypto';

// Google OAuth endpoints
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

// OAuth configuration from environment
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || '';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  console.warn('[googleOAuth] Missing Google OAuth configuration in environment variables');
}

/**
 * OAuth state stored in memory with TTL
 */
interface OAuthState {
  state: string;
  codeVerifier: string;
  createdAt: number;
}

// In-memory state store with 10-minute TTL
const stateStore = new Map<string, OAuthState>();
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Clean up expired states (lazy cleanup - called during retrieval)
 */
function cleanupExpiredStates() {
  const now = Date.now();
  for (const [state, data] of stateStore.entries()) {
    if (now - data.createdAt > STATE_TTL_MS) {
      stateStore.delete(state);
    }
  }
}

/**
 * Generate random state parameter for CSRF protection
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate PKCE code verifier
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate PKCE code challenge from verifier
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

/**
 * Store OAuth state in memory
 */
export function storeOAuthState(state: string, codeVerifier: string): void {
  stateStore.set(state, {
    state,
    codeVerifier,
    createdAt: Date.now(),
  });
}

/**
 * Retrieve and delete OAuth state from memory
 */
export function getAndDeleteOAuthState(state: string): OAuthState | null {
  // Lazy cleanup of expired states
  cleanupExpiredStates();
  
  const data = stateStore.get(state);
  if (data) {
    stateStore.delete(state);
    return data;
  }
  return null;
}

/**
 * Build Google OAuth authorization URL with PKCE
 */
export function buildAuthorizationUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'select_account',
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Google token response
 */
export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
  refresh_token?: string;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<GoogleTokenResponse> {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    code: code,
    code_verifier: codeVerifier,
    grant_type: 'authorization_code',
    redirect_uri: GOOGLE_REDIRECT_URI,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[googleOAuth] Token exchange failed:', response.status, errorText);
    throw new Error('Failed to exchange code for tokens');
  }

  return response.json();
}

/**
 * Google user info from userinfo endpoint
 */
export interface GoogleUserInfo {
  id: string; // Google user ID
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

/**
 * Get user info from Google userinfo endpoint
 */
export async function getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[googleOAuth] Failed to get user info:', response.status, errorText);
    throw new Error('Failed to get user info from Google');
  }

  return response.json();
}

/**
 * Validate environment configuration
 */
export function validateConfig(): boolean {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REDIRECT_URI);
}
