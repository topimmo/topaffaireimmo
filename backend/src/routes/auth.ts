import { Router } from 'express';
import { otpController } from '../controllers/otpController.js';
import { otpRequestLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// POST /auth/otp/request - Request OTP
router.post('/otp/request', otpRequestLimiter, (req, res) => 
  otpController.requestOTP(req, res)
);

// POST /auth/otp/verify - Verify OTP
router.post('/otp/verify', (req, res) => 
  otpController.verifyOTP(req, res)
);

export default router;
