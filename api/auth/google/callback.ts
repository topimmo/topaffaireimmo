/**
 * GET /api/auth/google/callback
 * 
 * Handles Google OAuth callback, exchanges code for tokens, 
 * retrieves user info, creates/updates user, and logs them in.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getAndDeleteOAuthState,
  exchangeCodeForTokens,
  getUserInfo,
} from '../../../lib/googleOAuth';
import { signToken } from '../../../lib/jwt';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

// Rate limiting for callback endpoint
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
    return false;
  }
  
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
    // Check rate limit
    const clientIp = getClientIp(req);
    if (!checkRateLimit(clientIp)) {
      console.log('[auth/google/callback] Rate limit exceeded for IP:', clientIp);
      return res.status(429).send('Too many requests. Please try again later.');
    }

    // Get code and state from query parameters
    const { code, state, error } = req.query;

    // Handle OAuth error from Google
    if (error) {
      console.log('[auth/google/callback] OAuth error from Google:', error);
      return res.redirect('/?auth_error=google_oauth_failed');
    }

    // Validate required parameters
    if (!code || typeof code !== 'string') {
      console.log('[auth/google/callback] Missing authorization code');
      return res.redirect('/?auth_error=missing_code');
    }

    if (!state || typeof state !== 'string') {
      console.log('[auth/google/callback] Missing state parameter');
      return res.redirect('/?auth_error=missing_state');
    }

    // Retrieve and validate state from memory
    const storedState = getAndDeleteOAuthState(state);
    if (!storedState) {
      console.log('[auth/google/callback] Invalid or expired state');
      return res.redirect('/?auth_error=invalid_state');
    }

    console.log('[auth/google/callback] State validated, exchanging code for tokens...');

    // Exchange authorization code for tokens
    let tokenResponse;
    try {
      tokenResponse = await exchangeCodeForTokens(code, storedState.codeVerifier);
    } catch (error) {
      console.error('[auth/google/callback] Token exchange failed:', error);
      return res.redirect('/?auth_error=token_exchange_failed');
    }

    console.log('[auth/google/callback] Tokens obtained, fetching user info...');

    // Get user info from Google
    let userInfo;
    try {
      userInfo = await getUserInfo(tokenResponse.access_token);
    } catch (error) {
      console.error('[auth/google/callback] Failed to get user info:', error);
      return res.redirect('/?auth_error=userinfo_failed');
    }

    if (!userInfo.email || !userInfo.verified_email) {
      console.log('[auth/google/callback] Email not verified or missing');
      return res.redirect('/?auth_error=email_not_verified');
    }

    console.log('[auth/google/callback] User info obtained for email:', userInfo.email);

    // Find or create user in database
    try {
      // First, try to find existing user by email
      const { data: existingProfile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', userInfo.email)
        .maybeSingle();

      if (fetchError) {
        console.error('[auth/google/callback] Error fetching profile:', fetchError);
        return res.redirect('/?auth_error=database_error');
      }

      let userId: string;

      if (existingProfile) {
        // User exists - update google_id if not set
        console.log('[auth/google/callback] Existing user found, updating google_id...');
        
        const updateData: any = {
          google_id: userInfo.id,
        };

        // Update name if not set
        if (!existingProfile.full_name && userInfo.name) {
          updateData.full_name = userInfo.name;
        }

        // Update avatar if not set (note: profiles table might not have avatar field)
        // We'll skip avatar for now as it's not in the schema

        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update(updateData)
          .eq('id', existingProfile.id);

        if (updateError) {
          console.error('[auth/google/callback] Error updating profile:', updateError);
          // Don't fail - continue with login
        }

        userId = existingProfile.id;
      } else {
        // New user - create auth user first, then profile
        console.log('[auth/google/callback] Creating new user...');

        // Create auth user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userInfo.email,
          email_confirm: true, // Auto-confirm since Google verified it
          user_metadata: {
            full_name: userInfo.name,
            google_id: userInfo.id,
            picture: userInfo.picture,
          },
        });

        if (authError || !authData.user) {
          console.error('[auth/google/callback] Error creating auth user:', authError);
          return res.redirect('/?auth_error=user_creation_failed');
        }

        userId = authData.user.id;

        // Create profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: userId,
            email: userInfo.email,
            full_name: userInfo.name || '',
            google_id: userInfo.id,
            user_type: 'advertiser', // Default type
          });

        if (profileError) {
          console.error('[auth/google/callback] Error creating profile:', profileError);
          // Try to clean up auth user
          await supabaseAdmin.auth.admin.deleteUser(userId);
          return res.redirect('/?auth_error=profile_creation_failed');
        }

        console.log('[auth/google/callback] New user created successfully');
      }

      // Generate JWT token for the user
      // Since we're using email-based auth via Google, we'll use email as identifier
      const token = signToken(userInfo.email);

      console.log('[auth/google/callback] Authentication successful, redirecting to app...');

      // Store token in localStorage via a redirect with token in URL hash
      // This is safer than query params as hash is not sent to server
      const redirectUrl = `/?google_auth_success=true#token=${encodeURIComponent(token)}`;
      return res.redirect(302, redirectUrl);

    } catch (error) {
      console.error('[auth/google/callback] Database operation failed:', error);
      return res.redirect('/?auth_error=database_error');
    }

  } catch (error) {
    console.error('[auth/google/callback] Unexpected error:', error);
    return res.redirect('/?auth_error=unexpected_error');
  }
}
