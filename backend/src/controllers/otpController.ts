import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { validateMoroccanPhone, generateOTP } from '../utils/phoneValidator.js';
import { vonageSMS } from '../utils/vonageSMS.js';
import { generateToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { OTPAttempt } from '../models/OTPAttempt.js';
import { redisStorage } from '../utils/redisStorage.js';
import { config } from '../config/index.js';

const SALT_ROUNDS = 10;

export class OTPController {
  /**
   * POST /auth/otp/request
   * Generates and sends OTP via SMS
   */
  async requestOTP(req: Request, res: Response): Promise<void> {
    try {
      const { phone } = req.body;

      if (!phone) {
        res.status(400).json({
          success: false,
          error: 'Phone number is required',
        });
        return;
      }

      // Validate phone number
      const validation = validateMoroccanPhone(phone);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: validation.error || 'Invalid phone number',
        });
        return;
      }

      const formattedPhone = validation.formatted!;

      // Check if account is locked (too many failed attempts)
      const isLocked = await this.isAccountLocked(formattedPhone);
      if (isLocked) {
        res.status(429).json({
          success: false,
          error: 'Account temporarily locked due to too many failed attempts. Please try again later.',
        });
        return;
      }

      // Generate OTP
      const otp = await generateOTP(config.otp.length);
      
      // Hash OTP before storing
      const hashedOtp = await bcrypt.hash(otp, SALT_ROUNDS);

      // Store OTP (Redis or MongoDB)
      await this.storeOTP(formattedPhone, hashedOtp);

      // Send OTP via Vonage SMS
      const smsResult = await vonageSMS.sendOTP(formattedPhone, otp);

      if (!smsResult.success) {
        res.status(500).json({
          success: false,
          error: 'Failed to send OTP. Please try again.',
        });
        return;
      }

      // Success - do NOT return the OTP in response
      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
      });
    } catch (error: any) {
      console.error('Request OTP error:', error);
      res.status(500).json({
        success: false,
        error: 'An error occurred. Please try again.',
      });
    }
  }

  /**
   * POST /auth/otp/verify
   * Verifies OTP and returns JWT token
   */
  async verifyOTP(req: Request, res: Response): Promise<void> {
    try {
      const { phone, code } = req.body;

      if (!phone || !code) {
        res.status(400).json({
          success: false,
          error: 'Phone number and verification code are required',
        });
        return;
      }

      // Validate phone number
      const validation = validateMoroccanPhone(phone);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Invalid phone number',
        });
        return;
      }

      const formattedPhone = validation.formatted!;

      // Check if account is locked
      const isLocked = await this.isAccountLocked(formattedPhone);
      if (isLocked) {
        res.status(429).json({
          success: false,
          error: 'Account temporarily locked. Please try again later.',
        });
        return;
      }

      // Retrieve stored OTP
      const storedHashedOtp = await this.getStoredOTP(formattedPhone);
      
      if (!storedHashedOtp) {
        res.status(400).json({
          success: false,
          error: 'Invalid or expired verification code',
        });
        return;
      }

      // Verify OTP using constant-time comparison (bcrypt.compare)
      const isValid = await bcrypt.compare(code, storedHashedOtp);

      if (!isValid) {
        // Increment failed attempts
        await this.incrementFailedAttempts(formattedPhone);
        
        res.status(400).json({
          success: false,
          error: 'Invalid verification code',
        });
        return;
      }

      // OTP is valid - delete it to prevent replay attacks
      await this.deleteOTP(formattedPhone);
      await this.clearFailedAttempts(formattedPhone);

      // Find or create user
      let user = await User.findOne({ phone: formattedPhone });
      
      if (!user) {
        user = await User.create({ phone: formattedPhone });
      }

      // Generate JWT token
      const token = generateToken({
        userId: user._id.toString(),
        phone: user.phone,
      });

      res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          phone: user.phone,
          createdAt: user.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      res.status(500).json({
        success: false,
        error: 'An error occurred. Please try again.',
      });
    }
  }

  // Helper methods for OTP storage (Redis or MongoDB fallback)
  
  private async storeOTP(phone: string, hashedOtp: string): Promise<void> {
    const ttlSeconds = config.otp.ttlMinutes * 60;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    if (redisStorage.isAvailable()) {
      await redisStorage.setOTP(phone, hashedOtp, ttlSeconds);
    } else {
      // Fallback to MongoDB
      await OTPAttempt.findOneAndUpdate(
        { phone },
        {
          phone,
          hashedOtp,
          attempts: 0,
          expiresAt,
        },
        { upsert: true, new: true }
      );
    }
  }

  private async getStoredOTP(phone: string): Promise<string | null> {
    if (redisStorage.isAvailable()) {
      return await redisStorage.getOTP(phone);
    } else {
      // Fallback to MongoDB
      const otpAttempt = await OTPAttempt.findOne({
        phone,
        expiresAt: { $gt: new Date() },
      });
      return otpAttempt?.hashedOtp || null;
    }
  }

  private async deleteOTP(phone: string): Promise<void> {
    if (redisStorage.isAvailable()) {
      await redisStorage.deleteOTP(phone);
    } else {
      await OTPAttempt.deleteOne({ phone });
    }
  }

  private async incrementFailedAttempts(phone: string): Promise<void> {
    if (redisStorage.isAvailable()) {
      const attempts = await redisStorage.incrementAttempts(phone);
      
      if (attempts >= config.otp.maxAttempts) {
        const lockoutSeconds = config.otp.lockoutMinutes * 60;
        await redisStorage.setLock(phone, lockoutSeconds);
      }
    } else {
      const otpAttempt = await OTPAttempt.findOne({ phone });
      
      if (otpAttempt) {
        otpAttempt.attempts += 1;
        
        if (otpAttempt.attempts >= config.otp.maxAttempts) {
          otpAttempt.lockedUntil = new Date(Date.now() + config.otp.lockoutMinutes * 60 * 1000);
        }
        
        await otpAttempt.save();
      }
    }
  }

  private async isAccountLocked(phone: string): Promise<boolean> {
    if (redisStorage.isAvailable()) {
      return await redisStorage.isLocked(phone);
    } else {
      const otpAttempt = await OTPAttempt.findOne({ phone });
      
      if (otpAttempt?.lockedUntil && otpAttempt.lockedUntil > new Date()) {
        return true;
      }
      
      return false;
    }
  }

  private async clearFailedAttempts(phone: string): Promise<void> {
    if (redisStorage.isAvailable()) {
      await redisStorage.clearAttempts(phone);
    } else {
      await OTPAttempt.updateOne(
        { phone },
        { $set: { attempts: 0, lockedUntil: null } }
      );
    }
  }
}

export const otpController = new OTPController();
