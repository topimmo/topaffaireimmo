/**
 * POST /api/auth/otp/start
 * 
 * Start a Vonage Verify request for phone authentication.
 * Validates phone number, checks rate limits, calls Vonage Verify API, and returns requestId.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Vonage } from '@vonage/server-sdk';
import { supabaseAdmin } from '../../../lib/supabaseAdmin.js';
import { validateAndNormalizeMoroccanPhone } from '../../../lib/phone.js';
import { storeRequestId } from '../../../lib/requestIdStore.js';

// Initialize Vonage client
const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY || '',
  apiSecret: process.env.VONAGE_API_SECRET || '',
});

const VONAGE_FROM = process.env.VONAGE_FROM || 'TopAffaire';

// Rate limit: max 3 OTP requests per phone per hour
const MAX_REQUESTS_PER_HOUR = 3;
const RATE_LIMIT_WINDOW_HOURS = 1;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone } = req.body;

    // Validate phone number
    const validation = validateAndNormalizeMoroccanPhone(phone);
    if (!validation.isValid || !validation.normalized) {
      console.log('[auth/otp/start] Invalid phone number:', phone);
      return res.status(400).json({
        error: validation.error || 'Invalid phone number',
      });
    }

    const normalizedPhone = validation.normalized;
    console.log('[auth/otp/start] Starting verification for phone:', normalizedPhone);

    // Check rate limit: count OTP requests in the last hour for this phone
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000);
    const { data: recentAttempts, error: countError } = await supabaseAdmin
      .from('otp_attempts')
      .select('id')
      .eq('phone', normalizedPhone)
      .gte('created_at', oneHourAgo.toISOString());

    if (countError) {
      console.error('[auth/otp/start] Error checking rate limit:', countError);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (recentAttempts && recentAttempts.length >= MAX_REQUESTS_PER_HOUR) {
      console.log('[auth/otp/start] Rate limit exceeded for phone:', normalizedPhone);
      return res.status(429).json({
        error: `Too many OTP requests. Please try again later. (Max ${MAX_REQUESTS_PER_HOUR} per hour)`,
      });
    }

    // Check if phone is currently locked
    const { data: existingAttempt, error: lockError } = await supabaseAdmin
      .from('otp_attempts')
      .select('locked_until')
      .eq('phone', normalizedPhone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lockError && lockError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[auth/otp/start] Error checking lock status:', lockError);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Check if locked
    if (existingAttempt?.locked_until) {
      const lockedUntil = new Date(existingAttempt.locked_until);
      if (lockedUntil > new Date()) {
        const remainingMinutes = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
        console.log('[auth/otp/start] Phone is locked:', normalizedPhone, 'until:', lockedUntil);
        return res.status(429).json({
          error: `Account locked due to too many failed attempts. Try again in ${remainingMinutes} minute(s).`,
        });
      }
    }

    // Call Vonage Verify API to start verification
    console.log('[auth/otp/start] Calling Vonage Verify API...');
    try {
      const verifyResult = await vonage.verify.start({
        number: normalizedPhone,
        brand: VONAGE_FROM,
      });

      if (!verifyResult.request_id) {
        console.error('[auth/otp/start] No request_id in Vonage response:', verifyResult);
        return res.status(500).json({
          error: 'Failed to start verification. Please try again.',
        });
      }

      const requestId = verifyResult.request_id;
      console.log('[auth/otp/start] Vonage Verify started successfully. Request ID:', requestId);

      // Store requestId mapping in memory
      storeRequestId(requestId, normalizedPhone);

      // Create a record in the database to track this request for rate limiting
      const { error: insertError } = await supabaseAdmin
        .from('otp_attempts')
        .insert({
          phone: normalizedPhone,
          otp_hash: requestId, // Store requestId temporarily for tracking
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min expiry
          attempts: 0,
          locked_until: null,
        });

      if (insertError) {
        console.error('[auth/otp/start] Error storing verification attempt:', insertError);
        // Don't fail the request, just log the error
      }

      // Return success with requestId
      return res.status(200).json({
        requestId,
        message: `Verification code sent to ${normalizedPhone}`,
      });
    } catch (verifyError: any) {
      console.error('[auth/otp/start] Vonage Verify API error:', verifyError);
      
      // Handle specific Vonage error codes
      const errorStatus = verifyError?.status || verifyError?.error_text || '';
      let errorMessage = 'Failed to send verification code. Please try again.';
      
      if (errorStatus.includes('throttled') || errorStatus.includes('rate')) {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (errorStatus.includes('invalid')) {
        errorMessage = 'Invalid phone number format.';
      }

      return res.status(500).json({
        error: errorMessage,
      });
    }
  } catch (error) {
    console.error('[auth/otp/start] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
