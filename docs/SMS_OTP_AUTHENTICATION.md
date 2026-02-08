# SMS OTP Authentication

Complete guide for implementing and testing SMS-based OTP (One-Time Password) authentication using Vonage on Vercel serverless functions.

## 📋 Overview

This implementation provides a secure phone-based authentication system specifically for Moroccan phone numbers (+212):

- **SMS Provider**: Vonage (formerly Nexmo)
- **Storage**: Supabase (otp_attempts table)
- **Deployment**: Vercel serverless functions
- **Security Features**:
  - Rate limiting (max 3 OTP requests per hour)
  - Account lockout (15 minutes after 5 failed attempts)
  - OTP expiration (5 minutes)
  - Bcrypt hashing for OTP storage
  - Morocco-only phone validation (+212)

## 🚀 Quick Start

### 1. Prerequisites

- Vonage account with API credentials
- Supabase project with service role key
- Vercel account for deployment

### 2. Environment Variables

Add the following environment variables to your Vercel project and local `.env` file:

```bash
# Supabase Configuration (already configured)
SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Vonage SMS Configuration
VONAGE_API_KEY=your_vonage_api_key
VONAGE_API_SECRET=your_vonage_api_secret
VONAGE_FROM=TopAffaire

# JWT Secret for token signing
JWT_SECRET=your_strong_random_secret_here
```

### 3. Run Database Migration

Apply the OTP table migration to your Supabase database:

```bash
# Using Supabase CLI
supabase db push

# Or manually apply the migration file:
# /supabase/migrations/086_otp_attempts_table.sql
```

The migration creates the `otp_attempts` table with the following schema:

```sql
CREATE TABLE otp_attempts (
  id uuid PRIMARY KEY,
  phone text NOT NULL,
  otp_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts int DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz DEFAULT now(),
  last_sent_at timestamptz DEFAULT now()
);
```

## 📡 API Endpoints

### POST /api/otp/request

Request an OTP code to be sent via SMS.

**Request Body:**
```json
{
  "phone": "+212664352280"
}
```

**Response (Success - 200):**
```json
{
  "ok": true,
  "message": "Verification code sent to +212664352280. Valid for 5 minutes."
}
```

**Response (Rate Limited - 429):**
```json
{
  "error": "Too many OTP requests. Please try again later. (Max 3 per hour)"
}
```

**Response (Account Locked - 429):**
```json
{
  "error": "Account locked due to too many failed attempts. Try again in 12 minute(s)."
}
```

**Response (Invalid Phone - 400):**
```json
{
  "error": "Invalid Moroccan phone number. Use format: +212XXXXXXXXX, 06XXXXXXXX, or 07XXXXXXXX"
}
```

### POST /api/otp/verify

Verify an OTP code and receive a JWT token.

**Request Body:**
```json
{
  "phone": "+212664352280",
  "code": "123456"
}
```

**Response (Success - 200):**
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "phone": "+212664352280",
  "message": "Verification successful"
}
```

**Response (Invalid Code - 400):**
```json
{
  "error": "Invalid verification code. 4 attempt(s) remaining."
}
```

**Response (Expired - 400):**
```json
{
  "error": "Verification code has expired. Please request a new code."
}
```

**Response (Locked - 429):**
```json
{
  "error": "Too many failed attempts. Account locked for 15 minutes."
}
```

## 🔧 Local Testing

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### 3. Run Vercel Dev Server

To test the serverless functions locally:

```bash
npx vercel dev
```

This will start a local development server that simulates Vercel's serverless environment.

### 4. Test the API Endpoints

**Request OTP:**
```bash
curl -X POST http://localhost:3000/api/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+212664352280"}'
```

**Verify OTP:**
```bash
curl -X POST http://localhost:3000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+212664352280", "code": "123456"}'
```

### 5. Test the UI Component

Add the OTP login component to your app:

```tsx
import { OTPLogin } from './auth/OTPLogin';

function LoginPage() {
  const handleSuccess = (token: string, phone: string) => {
    console.log('Login successful!', { token, phone });
    // Store token and redirect
    localStorage.setItem('auth_token', token);
    navigate('/dashboard');
  };

  const handleError = (error: string) => {
    console.error('Login failed:', error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <OTPLogin onSuccess={handleSuccess} onError={handleError} />
    </div>
  );
}
```

## 🔒 Security Features

### Rate Limiting

- **3 OTP requests per phone per hour**: Prevents SMS spam and abuse
- Tracked in database using `created_at` timestamp
- Returns 429 status when limit exceeded

### Account Lockout

- **5 failed verification attempts**: Account locked for 15 minutes
- Prevents brute-force attacks on OTP codes
- Tracked using `attempts` and `locked_until` columns

### OTP Expiration

- **5-minute validity**: OTP expires after 5 minutes
- Expired OTPs are automatically deleted on verification attempt
- Prevents replay attacks

### Bcrypt Hashing

- OTP codes are hashed with bcrypt before storage
- Never store plain-text OTP in database
- Uses 10 salt rounds by default

### Phone Number Validation

- **Morocco only**: Only accepts +212 country code
- Validates format using libphonenumber-js
- Normalizes to E.164 format (+212XXXXXXXXX)

## 📱 Frontend Integration

The `OTPLogin` component provides a complete UI for the authentication flow:

**Features:**
- Two-step process (phone entry → OTP verification)
- Real-time validation and error messages
- Loading states and disabled buttons
- Responsive design
- French language (can be extended for Arabic)

**Props:**
```tsx
interface OTPLoginProps {
  onSuccess?: (token: string, phone: string) => void;
  onError?: (error: string) => void;
}
```

## 🚢 Deployment to Vercel

### 1. Add Environment Variables

In your Vercel project settings, add all required environment variables:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add each variable for Production, Preview, and Development:
   - `SUPABASE_URL`
   - `VITE_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VONAGE_API_KEY`
   - `VONAGE_API_SECRET`
   - `VONAGE_FROM`
   - `JWT_SECRET`

### 2. Deploy

```bash
# Using Vercel CLI
vercel --prod

# Or push to Git (if connected to Vercel)
git push origin main
```

### 3. Verify Deployment

Test the deployed API endpoints:

```bash
curl -X POST https://your-domain.vercel.app/api/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+212664352280"}'
```

## 🐛 Troubleshooting

### SMS Not Sending

**Symptom:** OTP request succeeds but no SMS received

**Solutions:**
1. Check Vonage API credentials are correct
2. Verify Vonage account has sufficient balance
3. Check Vonage logs in dashboard for delivery status
4. Ensure phone number is in valid Morocco format (+212XXXXXXXXX)
5. Check VONAGE_FROM is configured correctly (max 11 chars or valid number)

### "Missing environment variable" Error

**Symptom:** 500 error with environment variable message

**Solutions:**
1. Verify all environment variables are set in Vercel
2. Redeploy after adding environment variables
3. Check variable names match exactly (case-sensitive)
4. For local testing, ensure `.env` file exists and is loaded

### Database Connection Errors

**Symptom:** Cannot connect to Supabase or table not found

**Solutions:**
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
2. Run the migration to create `otp_attempts` table
3. Check Supabase project is active and accessible
4. Verify RLS policies allow service role access

### Rate Limit or Lockout Issues

**Symptom:** Getting locked out during testing

**Solutions:**
1. Clear test data from `otp_attempts` table:
   ```sql
   DELETE FROM otp_attempts WHERE phone = '+212664352280';
   ```
2. Use different phone numbers for testing
3. Wait for lockout period to expire (15 minutes)

### JWT Token Issues

**Symptom:** Token verification fails or invalid tokens

**Solutions:**
1. Ensure `JWT_SECRET` is set and matches between request/verify
2. Generate a strong secret: `openssl rand -base64 32`
3. Redeploy after changing JWT_SECRET
4. Check token expiration (default 7 days)

## 📊 Monitoring

### Database Queries

Monitor OTP usage and issues:

```sql
-- Check recent OTP attempts
SELECT phone, attempts, locked_until, created_at, expires_at
FROM otp_attempts
ORDER BY created_at DESC
LIMIT 10;

-- Find locked accounts
SELECT phone, locked_until, attempts
FROM otp_attempts
WHERE locked_until > NOW()
ORDER BY locked_until DESC;

-- Clean up expired OTPs (automatic in verify, but can run manually)
DELETE FROM otp_attempts
WHERE expires_at < NOW();
```

### Vonage Dashboard

Monitor SMS delivery and costs:
1. Go to [Vonage Dashboard](https://dashboard.nexmo.com/)
2. Check **SMS** → **Logs** for delivery status
3. Monitor account balance and usage

## 🔐 Best Practices

1. **Never expose service role key**: Only use in serverless functions
2. **Use strong JWT secret**: At least 32 random characters
3. **Rotate secrets regularly**: Update JWT_SECRET periodically
4. **Monitor SMS costs**: Set up Vonage alerts for unusual usage
5. **Clean up old data**: Periodically delete expired OTP records
6. **Log security events**: Monitor failed attempts and lockouts
7. **Use HTTPS only**: Never send OTP over insecure connections
8. **Implement CORS**: Restrict API access to your domain only

## 📚 Additional Resources

- [Vonage SMS API Documentation](https://developer.vonage.com/messaging/sms/overview)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [libphonenumber-js](https://gitlab.com/catamphetamine/libphonenumber-js)
- [bcrypt.js](https://github.com/dcodeIO/bcrypt.js)
- [JWT Introduction](https://jwt.io/introduction)
