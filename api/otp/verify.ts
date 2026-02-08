/**
 * POST /api/otp/verify
 * 
 * Verify an OTP code and return a JWT token if valid.
 * Handles verification attempts, lockout, and expiration.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { validateAndNormalizeMoroccanPhone } from '../../lib/phone';
import { compareOTP, isValidOTPFormat } from '../../lib/otp';
import { signToken } from '../../lib/jwt';

// Max failed attempts before lockout
const MAX_FAILED_ATTEMPTS = 5;

// Lockout duration after max failed attempts
const LOCKOUT_DURATION_MINUTES = 15;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone, code } = req.body;

    // Validate phone number
    const validation = validateAndNormalizeMoroccanPhone(phone);
    if (!validation.isValid || !validation.normalized) {
      return res.status(400).json({
        error: validation.error || 'Invalid phone number',
      });
    }

    const normalizedPhone = validation.normalized;

    // Validate OTP code format
    if (!code || !isValidOTPFormat(code)) {
      return res.status(400).json({
        error: 'Invalid verification code. Must be 6 digits.',
      });
    }

    // Get the most recent OTP attempt for this phone
    const { data: otpAttempt, error: fetchError } = await supabaseAdmin
      .from('otp_attempts')
      .select('*')
      .eq('phone', normalizedPhone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpAttempt) {
      return res.status(400).json({
        error: 'No verification code found. Please request a new code.',
      });
    }

    // Check if locked
    if (otpAttempt.locked_until) {
      const lockedUntil = new Date(otpAttempt.locked_until);
      if (lockedUntil > new Date()) {
        const remainingMinutes = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
        return res.status(429).json({
          error: `Account locked due to too many failed attempts. Try again in ${remainingMinutes} minute(s).`,
        });
      }
    }

    // Check if OTP has expired
    const expiresAt = new Date(otpAttempt.expires_at);
    if (expiresAt < new Date()) {
      // Delete expired OTP
      await supabaseAdmin
        .from('otp_attempts')
        .delete()
        .eq('id', otpAttempt.id);

      return res.status(400).json({
        error: 'Verification code has expired. Please request a new code.',
      });
    }

    // Verify OTP code
    const isValid = await compareOTP(code, otpAttempt.otp_hash);

    if (!isValid) {
      // Increment failed attempts
      const newAttempts = (otpAttempt.attempts || 0) + 1;
      
      // Check if we should lock the account
      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
        
        await supabaseAdmin
          .from('otp_attempts')
          .update({
            attempts: newAttempts,
            locked_until: lockUntil.toISOString(),
          })
          .eq('id', otpAttempt.id);

        return res.status(429).json({
          error: `Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.`,
        });
      } else {
        // Just increment attempts
        await supabaseAdmin
          .from('otp_attempts')
          .update({
            attempts: newAttempts,
          })
          .eq('id', otpAttempt.id);

        const remainingAttempts = MAX_FAILED_ATTEMPTS - newAttempts;
        return res.status(400).json({
          error: `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`,
        });
      }
    }

    // OTP is valid! Delete the OTP record
    await supabaseAdmin
      .from('otp_attempts')
      .delete()
      .eq('id', otpAttempt.id);

    // Generate JWT token
    const token = signToken(normalizedPhone);

    console.log(`[otp/verify] Successfully verified OTP for ${normalizedPhone}`);

    // Return success with token
    return res.status(200).json({
      ok: true,
      token,
      phone: normalizedPhone,
      message: 'Verification successful',
    });
  } catch (error) {
    console.error('[otp/verify] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
