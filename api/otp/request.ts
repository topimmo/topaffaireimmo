/**
 * POST /api/otp/request
 * 
 * Request an OTP code to be sent via SMS.
 * Validates phone number, checks rate limits, generates OTP, and sends SMS via Vonage.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Vonage } from '@vonage/server-sdk';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { validateAndNormalizeMoroccanPhone } from '../../lib/phone';
import { generateOTP, hashOTP } from '../../lib/otp';

// Initialize Vonage client
const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY || '',
  apiSecret: process.env.VONAGE_API_SECRET || '',
});

const VONAGE_FROM = process.env.VONAGE_FROM || 'TopAffaire';

// Rate limit: max 3 OTP requests per phone per hour
const MAX_REQUESTS_PER_HOUR = 3;
const RATE_LIMIT_WINDOW_HOURS = 1;

// OTP expiration: 5 minutes
const OTP_EXPIRATION_MINUTES = 5;

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
      return res.status(400).json({
        error: validation.error || 'Invalid phone number',
      });
    }

    const normalizedPhone = validation.normalized;

    // Check rate limit: count OTP requests in the last hour for this phone
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000);
    const { data: recentAttempts, error: countError } = await supabaseAdmin
      .from('otp_attempts')
      .select('id')
      .eq('phone', normalizedPhone)
      .gte('created_at', oneHourAgo.toISOString());

    if (countError) {
      console.error('[otp/request] Error checking rate limit:', countError);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (recentAttempts && recentAttempts.length >= MAX_REQUESTS_PER_HOUR) {
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
      console.error('[otp/request] Error checking lock status:', lockError);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Check if locked
    if (existingAttempt?.locked_until) {
      const lockedUntil = new Date(existingAttempt.locked_until);
      if (lockedUntil > new Date()) {
        const remainingMinutes = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
        return res.status(429).json({
          error: `Account locked due to too many failed attempts. Try again in ${remainingMinutes} minute(s).`,
        });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);

    // Calculate expiration time (5 minutes from now)
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

    // Store OTP in database
    const { error: insertError } = await supabaseAdmin
      .from('otp_attempts')
      .insert({
        phone: normalizedPhone,
        otp_hash: otpHash,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        locked_until: null,
      });

    if (insertError) {
      console.error('[otp/request] Error storing OTP:', insertError);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Send SMS via Vonage
    try {
      await vonage.sms.send({
        to: normalizedPhone,
        from: VONAGE_FROM,
        text: `Your TopAffaireImmo verification code is: ${otp}. Valid for ${OTP_EXPIRATION_MINUTES} minutes.`,
      });

      console.log(`[otp/request] OTP sent successfully to ${normalizedPhone}`);
    } catch (smsError) {
      console.error('[otp/request] Error sending SMS:', smsError);
      // Delete the OTP record since SMS failed
      await supabaseAdmin
        .from('otp_attempts')
        .delete()
        .eq('phone', normalizedPhone)
        .eq('otp_hash', otpHash);
      
      return res.status(500).json({
        error: 'Failed to send SMS. Please try again.',
      });
    }

    // Return success
    return res.status(200).json({
      ok: true,
      message: `Verification code sent to ${normalizedPhone}. Valid for ${OTP_EXPIRATION_MINUTES} minutes.`,
    });
  } catch (error) {
    console.error('[otp/request] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
