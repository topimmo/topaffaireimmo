/**
 * POST /api/auth/otp/check
 * 
 * Verify an OTP code using Vonage Verify API and return a JWT token if valid.
 * Handles verification attempts, lockout, and expiration.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Vonage } from '@vonage/server-sdk';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { getPhoneForRequestId, deleteRequestId } from '../../../lib/requestIdStore';
import { signToken } from '../../../lib/jwt';
import { isValidOTPFormat } from '../../../lib/otp';

// Initialize Vonage client
const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY || '',
  apiSecret: process.env.VONAGE_API_SECRET || '',
});

// Max failed attempts before lockout
const MAX_FAILED_ATTEMPTS = 5;

// Lockout duration after max failed attempts
const LOCKOUT_DURATION_MINUTES = 15;

// Vonage Verify status codes
enum VerifyStatus {
  SUCCESS = '0',
  THROTTLED = '1',
  MISSING_PARAMS = '2',
  INVALID_REQUEST_ID = '6',
  VERIFICATION_EXPIRED = '17',
  SDK_REVISION_UNSUPPORTED = '9',
  // Status '16' can mean both invalid code format or wrong code value
  INVALID_CODE = '16',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { requestId, code } = req.body;

    // Validate requestId
    if (!requestId || typeof requestId !== 'string') {
      console.log('[auth/otp/check] Missing or invalid requestId');
      return res.status(400).json({
        error: 'Invalid request. Please start verification again.',
      });
    }

    // Validate code format
    if (!code || !isValidOTPFormat(code)) {
      console.log('[auth/otp/check] Invalid code format:', code);
      return res.status(400).json({
        error: 'Invalid verification code. Must be 6 digits.',
      });
    }

    // Get phone number from requestId mapping
    const phone = getPhoneForRequestId(requestId);
    if (!phone) {
      console.log('[auth/otp/check] No phone found for requestId:', requestId);
      return res.status(400).json({
        error: 'Verification expired or invalid. Please request a new code.',
      });
    }

    console.log('[auth/otp/check] Checking verification for phone:', phone, 'requestId:', requestId);

    // Get the most recent OTP attempt for this phone
    const { data: otpAttempt, error: fetchError } = await supabaseAdmin
      .from('otp_attempts')
      .select('*')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[auth/otp/check] Error fetching OTP attempt:', fetchError);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Check if locked
    if (otpAttempt?.locked_until) {
      const lockedUntil = new Date(otpAttempt.locked_until);
      if (lockedUntil > new Date()) {
        const remainingMinutes = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
        console.log('[auth/otp/check] Phone is locked:', phone, 'until:', lockedUntil);
        return res.status(429).json({
          error: `Account locked due to too many failed attempts. Try again in ${remainingMinutes} minute(s).`,
        });
      }
    }

    // Call Vonage Verify check API
    console.log('[auth/otp/check] Calling Vonage Verify check API...');
    try {
      const checkResult = await vonage.verify.check(requestId, code);
      
      console.log('[auth/otp/check] Vonage check result status:', checkResult.status);

      // Check if verification succeeded
      if (checkResult.status === VerifyStatus.SUCCESS) {
        console.log('[auth/otp/check] Verification successful for phone:', phone);

        // Delete the requestId from memory
        deleteRequestId(requestId);

        // Delete the OTP attempt record from database
        if (otpAttempt) {
          await supabaseAdmin
            .from('otp_attempts')
            .delete()
            .eq('id', otpAttempt.id);
        }

        // Generate JWT token
        const token = signToken(phone);

        console.log('[auth/otp/check] Successfully verified OTP for', phone);

        // Return success with token
        return res.status(200).json({
          ok: true,
          token,
          phone,
          message: 'Verification successful',
        });
      } else {
        // Verification failed
        let errorMessage = 'Invalid verification code.';
        let statusCode = 400;

        // Handle specific error codes
        if (checkResult.status === VerifyStatus.VERIFICATION_EXPIRED) {
          errorMessage = 'Verification code has expired. Please request a new code.';
          deleteRequestId(requestId);
          
          // Delete expired OTP attempt
          if (otpAttempt) {
            await supabaseAdmin
              .from('otp_attempts')
              .delete()
              .eq('id', otpAttempt.id);
          }
        } else if (checkResult.status === VerifyStatus.INVALID_REQUEST_ID) {
          errorMessage = 'Invalid or expired verification request. Please start again.';
          deleteRequestId(requestId);
        } else if (checkResult.status === VerifyStatus.INVALID_CODE) {
          // Increment failed attempts
          const currentAttempts = otpAttempt?.attempts || 0;
          const newAttempts = currentAttempts + 1;

          // Check if we should lock the account
          if (newAttempts >= MAX_FAILED_ATTEMPTS) {
            const lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);

            if (otpAttempt) {
              await supabaseAdmin
                .from('otp_attempts')
                .update({
                  attempts: newAttempts,
                  locked_until: lockUntil.toISOString(),
                })
                .eq('id', otpAttempt.id);
            }

            console.log('[auth/otp/check] Account locked for phone:', phone, 'until:', lockUntil);
            statusCode = 429;
            errorMessage = `Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.`;
          } else {
            // Just increment attempts
            if (otpAttempt) {
              await supabaseAdmin
                .from('otp_attempts')
                .update({ attempts: newAttempts })
                .eq('id', otpAttempt.id);
            }

            const remainingAttempts = MAX_FAILED_ATTEMPTS - newAttempts;
            errorMessage = `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`;
            console.log('[auth/otp/check] Failed attempt', newAttempts, 'for phone:', phone);
          }
        }

        return res.status(statusCode).json({ error: errorMessage });
      }
    } catch (verifyError: any) {
      console.error('[auth/otp/check] Vonage Verify check error:', verifyError);

      // Handle Vonage API errors
      let errorMessage = 'Failed to verify code. Please try again.';
      
      if (verifyError?.body?.error_text) {
        const errorText = verifyError.body.error_text.toLowerCase();
        
        if (errorText.includes('expired')) {
          errorMessage = 'Verification code has expired. Please request a new code.';
          deleteRequestId(requestId);
        } else if (errorText.includes('invalid') || errorText.includes('not found')) {
          errorMessage = 'Invalid verification request. Please start again.';
          deleteRequestId(requestId);
        }
      }

      return res.status(400).json({ error: errorMessage });
    }
  } catch (error) {
    console.error('[auth/otp/check] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
