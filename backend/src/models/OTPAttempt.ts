import mongoose, { Schema, Document } from 'mongoose';

export interface IOTPAttempt extends Document {
  phone: string;
  hashedOtp: string;
  attempts: number;
  lockedUntil?: Date;
  expiresAt: Date;
  createdAt: Date;
}

const otpAttemptSchema = new Schema<IOTPAttempt>({
  phone: {
    type: String,
    required: true,
    index: true,
  },
  hashedOtp: {
    type: String,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  lockedUntil: {
    type: Date,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

// TTL index - MongoDB will automatically delete expired OTPs
otpAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTPAttempt = mongoose.model<IOTPAttempt>('OTPAttempt', otpAttemptSchema);
