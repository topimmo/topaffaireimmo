# SMS OTP Testing Guide

This guide provides step-by-step instructions for testing the SMS OTP authentication implementation.

## Prerequisites

Before testing, ensure you have:

1. ✅ Applied the database migration (`086_otp_attempts_table.sql`)
2. ✅ Set all required environment variables in Vercel
3. ✅ Deployed the code to Vercel
4. ✅ Vonage account with sufficient balance
5. ✅ Morocco phone number for testing (+212)

## Environment Variables Checklist

Verify these are set in Vercel (Project Settings → Environment Variables):

- [ ] `SUPABASE_URL` or `VITE_SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `VONAGE_API_KEY`
- [ ] `VONAGE_API_SECRET`
- [ ] `VONAGE_FROM`
- [ ] `JWT_SECRET`

## Testing Workflow

### 1. Database Setup

First, verify the `otp_attempts` table exists:

```sql
-- Run in Supabase SQL Editor
SELECT * FROM otp_attempts LIMIT 1;
```

If you get an error, run the migration:

```bash
# Using Supabase CLI
supabase db push

# Or apply manually in Supabase SQL Editor:
# Copy contents of supabase/migrations/086_otp_attempts_table.sql
```

### 2. Test API Endpoints (cURL)

#### Test 1: Request OTP

```bash
# Replace YOUR_DOMAIN with your Vercel domain
curl -X POST https://YOUR_DOMAIN.vercel.app/api/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+212664352280"}'
```

**Expected Response (200):**
```json
{
  "ok": true,
  "message": "Verification code sent to +212664352280. Valid for 5 minutes."
}
```

**What to verify:**
- ✅ You receive an SMS with a 6-digit code
- ✅ Response is successful (200 status)
- ✅ Message confirms the phone number

**Common Errors:**
- 400: Invalid phone format → Fix phone number format
- 429: Rate limited → Wait or use different phone number
- 500: Check Vonage credentials and Supabase connection

#### Test 2: Verify OTP

```bash
# Use the code you received via SMS
curl -X POST https://YOUR_DOMAIN.vercel.app/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+212664352280", "code": "123456"}'
```

**Expected Response (200):**
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "phone": "+212664352280",
  "message": "Verification successful"
}
```

**What to verify:**
- ✅ Token is returned (JWT format)
- ✅ Phone number is correct
- ✅ Database record is deleted after success

### 3. Test Phone Number Formats

Test different phone number formats to verify normalization:

```bash
# Format 1: International with +
curl -X POST https://YOUR_DOMAIN.vercel.app/api/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+212664352280"}'

# Format 2: Morocco local (06...)
curl -X POST https://YOUR_DOMAIN.vercel.app/api/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "0664352280"}'

# Format 3: International without +
curl -X POST https://YOUR_DOMAIN.vercel.app/api/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "212664352280"}'

# Format 4: With spaces
curl -X POST https://YOUR_DOMAIN.vercel.app/api/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+212 6 64 35 22 80"}'
```

All formats should work and normalize to `+212664352280`.

### 4. Test Security Features

#### Rate Limiting (3 requests per hour)

```bash
# Request 1
curl -X POST https://YOUR_DOMAIN.vercel.app/api/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+212664352280"}'

# Request 2 (should work)
curl -X POST https://YOUR_DOMAIN.vercel.app/api/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+212664352280"}'

# Request 3 (should work)
curl -X POST https://YOUR_DOMAIN.vercel.app/api/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+212664352280"}'

# Request 4 (should fail with 429)
curl -X POST https://YOUR_DOMAIN.vercel.app/api/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+212664352280"}'
```

**Expected Response (429):**
```json
{
  "error": "Too many OTP requests. Please try again later. (Max 3 per hour)"
}
```

#### Failed Attempt Lockout (5 attempts)

```bash
# First, request an OTP
curl -X POST https://YOUR_DOMAIN.vercel.app/api/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+212664352281"}'

# Then try wrong codes 5 times
for i in {1..5}; do
  curl -X POST https://YOUR_DOMAIN.vercel.app/api/otp/verify \
    -H "Content-Type: application/json" \
    -d '{"phone": "+212664352281", "code": "999999"}'
  echo "\nAttempt $i"
done
```

**Expected:**
- Attempts 1-4: Error message with remaining attempts
- Attempt 5: Account locked for 15 minutes (429 status)

#### OTP Expiration (5 minutes)

```bash
# Request OTP
curl -X POST https://YOUR_DOMAIN.vercel.app/api/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+212664352282"}'

# Wait 6 minutes...

# Try to verify (should fail)
curl -X POST https://YOUR_DOMAIN.vercel.app/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+212664352282", "code": "123456"}'
```

**Expected Response (400):**
```json
{
  "error": "Verification code has expired. Please request a new code."
}
```

### 5. Test UI Component

#### Basic Flow Test

1. Navigate to your login page (add OTPLogin component)
2. Enter phone number: `+212 6 64 35 22 80`
3. Click "Envoyer le code"
4. Verify SMS received
5. Enter the 6-digit code
6. Click "Vérifier"
7. Verify token is stored in localStorage
8. Verify success callback is triggered

#### Error Handling Test

1. **Invalid Phone:**
   - Enter: `123456789`
   - Expect: Error message about format

2. **Wrong Code:**
   - Enter correct phone, get OTP
   - Enter wrong code: `000000`
   - Expect: Error with remaining attempts

3. **Resend Code:**
   - Request initial OTP
   - Click "Renvoyer le code"
   - Verify new SMS received
   - Verify old code doesn't work

### 6. Database Verification

After testing, verify the database state:

```sql
-- Check OTP attempts
SELECT 
  phone,
  attempts,
  locked_until,
  expires_at,
  created_at
FROM otp_attempts
ORDER BY created_at DESC
LIMIT 10;

-- Check for locked accounts
SELECT 
  phone,
  locked_until,
  attempts
FROM otp_attempts
WHERE locked_until > NOW()
ORDER BY locked_until DESC;

-- Clean up test data
DELETE FROM otp_attempts 
WHERE phone IN ('+212664352280', '+212664352281', '+212664352282');
```

## Testing Checklist

Use this checklist to ensure comprehensive testing:

### API Endpoints
- [ ] Request OTP with valid Morocco number
- [ ] Request OTP with invalid format
- [ ] Request OTP with non-Morocco number
- [ ] Verify OTP with correct code
- [ ] Verify OTP with incorrect code
- [ ] Verify OTP with expired code

### Security Features
- [ ] Rate limiting works (max 3 per hour)
- [ ] Account lockout after 5 failed attempts
- [ ] OTP expires after 5 minutes
- [ ] Locked account remains locked for 15 minutes
- [ ] OTP is hashed in database (never plain text)

### Phone Number Formats
- [ ] International format (+212...)
- [ ] Local format (06... or 07...)
- [ ] With spaces
- [ ] With dashes
- [ ] 00212 prefix format

### UI Component
- [ ] Phone number input validates format
- [ ] OTP input only accepts 6 digits
- [ ] Loading states show during API calls
- [ ] Error messages display correctly
- [ ] Success callback triggers with token
- [ ] Token stored in localStorage
- [ ] Resend code button works

### Database
- [ ] OTP records created on request
- [ ] OTP records deleted on success
- [ ] Failed attempts increment correctly
- [ ] Locked accounts have locked_until set
- [ ] Expired OTPs cleaned up on verify

## Troubleshooting

### No SMS Received

1. Check Vonage dashboard for delivery status
2. Verify phone number is in correct format
3. Check Vonage account balance
4. Verify VONAGE_FROM is valid (max 11 chars)
5. Check Vonage API credentials

### API Returns 500 Error

1. Check Vercel function logs:
   - Go to Vercel Dashboard → Project → Functions
   - Click on the function to see logs
2. Verify environment variables are set
3. Check Supabase connection
4. Verify database migration applied

### JWT Token Invalid

1. Verify JWT_SECRET is set consistently
2. Check token hasn't expired (default 7 days)
3. Verify token format is correct (3 parts separated by dots)

### Database Connection Failed

1. Verify SUPABASE_SERVICE_ROLE_KEY is correct
2. Check Supabase project is active
3. Verify RLS policies allow service role access
4. Check migration created the table

## Monitoring

### Production Monitoring

1. **Vonage Dashboard:**
   - Monitor SMS delivery rates
   - Check failed messages
   - Track costs

2. **Supabase Dashboard:**
   - Monitor database queries
   - Check error logs
   - Track storage usage

3. **Vercel Analytics:**
   - Function execution times
   - Error rates
   - Request volumes

### SQL Queries for Monitoring

```sql
-- Most active phones (potential abuse)
SELECT 
  phone,
  COUNT(*) as request_count,
  MAX(created_at) as last_request
FROM otp_attempts
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY phone
HAVING COUNT(*) > 5
ORDER BY request_count DESC;

-- Failed verification stats
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE attempts >= 5) as locked_accounts
FROM otp_attempts
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- Cleanup old expired records
DELETE FROM otp_attempts
WHERE expires_at < NOW() - INTERVAL '1 day';
```

## Success Criteria

The implementation is working correctly if:

✅ SMS messages are delivered within 30 seconds
✅ OTP codes work on first try
✅ Rate limiting prevents abuse
✅ Lockout protects against brute force
✅ OTP expires after 5 minutes
✅ JWT tokens are valid and verifiable
✅ Database records are properly managed
✅ No security vulnerabilities in logs
✅ Phone numbers normalize correctly
✅ UI provides good user experience

## Next Steps

After successful testing:

1. Monitor production usage for the first week
2. Set up alerts for high failure rates
3. Implement analytics tracking for conversion rates
4. Consider adding SMS templates for different languages (Arabic)
5. Plan for backup SMS provider (redundancy)
6. Document operational runbooks
