-- Migration: Create OTP attempts table for SMS authentication
-- This table stores OTP verification attempts for phone-based authentication
-- Supports rate limiting, lockout mechanism, and automatic expiration

-- Create otp_attempts table
CREATE TABLE IF NOT EXISTS otp_attempts (
  -- Primary key
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Phone number in E.164 format (e.g., +212664352280)
  phone text NOT NULL,
  
  -- Bcrypt hash of the OTP code (never store plain OTP)
  otp_hash text NOT NULL,
  
  -- Expiration timestamp (OTP valid for 5 minutes)
  expires_at timestamptz NOT NULL,
  
  -- Number of failed verification attempts (max 5 before lockout)
  attempts int DEFAULT 0 NOT NULL,
  
  -- Lockout timestamp (set after 5 failed attempts, locked for 15 minutes)
  locked_until timestamptz,
  
  -- Creation timestamp
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Last OTP sent timestamp (for rate limiting)
  last_sent_at timestamptz DEFAULT now() NOT NULL
);

-- Create index on phone for efficient lookups
CREATE INDEX IF NOT EXISTS idx_otp_attempts_phone ON otp_attempts(phone);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_otp_attempts_expires_at ON otp_attempts(expires_at);

-- Create index on locked_until for lockout checks
CREATE INDEX IF NOT EXISTS idx_otp_attempts_locked_until ON otp_attempts(locked_until);

-- Add comment to table
COMMENT ON TABLE otp_attempts IS 'Stores OTP verification attempts for SMS-based authentication with rate limiting and lockout mechanism';

-- Add comments to columns
COMMENT ON COLUMN otp_attempts.phone IS 'Phone number in E.164 international format (e.g., +212664352280)';
COMMENT ON COLUMN otp_attempts.otp_hash IS 'Bcrypt hash of the 6-digit OTP code (never store plain text)';
COMMENT ON COLUMN otp_attempts.expires_at IS 'OTP expiration time (5 minutes from generation)';
COMMENT ON COLUMN otp_attempts.attempts IS 'Number of failed verification attempts (locked after 5)';
COMMENT ON COLUMN otp_attempts.locked_until IS 'Lockout expiration time (15 minutes after 5 failed attempts)';
COMMENT ON COLUMN otp_attempts.last_sent_at IS 'Timestamp of last OTP sent (for hourly rate limiting)';

-- Enable Row Level Security
ALTER TABLE otp_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only service role can access (admin only)
-- This table should only be accessed via API routes with service role key
-- No direct client access allowed for security
CREATE POLICY "Service role only access" ON otp_attempts
  FOR ALL
  USING (false);
