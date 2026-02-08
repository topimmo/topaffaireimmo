# Vonage Verify API Implementation Guide

## Overview

The TopAffaireImmo platform now uses **Vonage Verify API** for phone-based OTP authentication. This is a complete 2FA solution where Vonage generates, sends, and manages the OTP codes automatically.

## Key Differences: Vonage Verify vs SMS API

| Feature | Verify API (Current) | SMS API (Previous) |
|---------|---------------------|-------------------|
| **OTP Generation** | Vonage handles it | We generate it server-side |
| **OTP Storage** | Vonage manages it | We store hash in database |
| **Expiration** | Vonage enforces (5 min default) | We track in database |
| **Verification** | `verify.check()` API | Bcrypt comparison |
| **Workflow** | Built-in 2FA flow | Custom implementation |
| **API Endpoints** | `/api/auth/otp/start`, `/api/auth/otp/check` | `/api/otp/request`, `/api/otp/verify` |

## Architecture

### Flow Diagram

```
User enters phone → Frontend calls /api/auth/otp/start
                 ↓
    Vonage Verify API (start) sends SMS with OTP
                 ↓
    Server receives requestId from Vonage
                 ↓
    Server stores requestId → phone mapping (in-memory)
                 ↓
    Frontend receives requestId
                 ↓
User enters OTP → Frontend calls /api/auth/otp/check
                 ↓
    Server retrieves phone from requestId
                 ↓
    Vonage Verify API (check) validates OTP
                 ↓
    On success: Generate JWT, return to frontend
```

### Components

1. **`/api/auth/otp/start`** - Start verification
   - Validates phone (Morocco +212 only)
   - Checks rate limiting (3 per hour)
   - Checks account lockout status
   - Calls `vonage.verify.start()`
   - Returns `{ requestId }` to frontend

2. **`/api/auth/otp/check`** - Verify OTP code
   - Validates requestId and code
   - Retrieves phone from requestId mapping
   - Calls `vonage.verify.check()`
   - Handles failed attempts and lockout
   - Returns JWT token on success

3. **`lib/requestIdStore.ts`** - In-memory request ID storage
   - Maps requestId to phone number
   - TTL: 10 minutes (auto-cleanup)
   - Prevents misuse and validates ownership

4. **Frontend (`AuthPage.tsx`)**
   - Stores requestId (not phone) between steps
   - Calls new API endpoints
   - Handles Vonage-specific error messages

## Environment Variables

Required in Vercel/deployment environment:

```bash
# Vonage Verify API
VONAGE_API_KEY=your_api_key
VONAGE_API_SECRET=your_api_secret
VONAGE_FROM=TopAffaire  # Brand name (max 18 chars)

# JWT Authentication
JWT_SECRET=your_strong_random_secret

# Supabase (for rate limiting & user management)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Security Features

✅ **Rate Limiting**: Max 3 OTP requests per phone per hour  
✅ **Account Lockout**: 15 minutes after 5 failed verification attempts  
✅ **OTP Expiration**: Vonage enforces 5-minute validity  
✅ **Server-side Secrets**: No credentials exposed to frontend  
✅ **RequestId Validation**: Links requestId to phone to prevent misuse  
✅ **Auto-cleanup**: Expired requestIds removed automatically  
✅ **Logging**: Comprehensive logs without leaking secrets

## Error Messages

Clear, user-friendly error messages are returned:

- **Invalid phone**: "Invalid Moroccan phone number. Use format: +212XXXXXXXXX"
- **Rate limited**: "Too many OTP requests. Please try again later."
- **Account locked**: "Account locked due to too many failed attempts. Try again in X minute(s)."
- **Invalid code**: "Invalid verification code. X attempt(s) remaining."
- **Expired code**: "Verification code has expired. Please request a new code."
- **Expired request**: "Verification expired or invalid. Please request a new code."

## Testing

### Local Development

1. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your Vonage credentials
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Test the flow:
   - Navigate to login page
   - Enter Morocco phone number (+212XXXXXXXXX)
   - Receive SMS with OTP code
   - Enter code to complete authentication

### Production Deployment

1. Set environment variables in Vercel
2. Deploy the application
3. Test with real phone numbers
4. Monitor logs for errors

## Monitoring

Check these logs for debugging:

```
[auth/otp/start] Starting verification for phone: +212...
[auth/otp/start] Vonage Verify started successfully. Request ID: xxx
[auth/otp/check] Checking verification for phone: +212... requestId: xxx
[auth/otp/check] Vonage check result status: 0
[auth/otp/check] Successfully verified OTP for +212...
```

Error logs:
```
[auth/otp/start] Invalid phone number: ...
[auth/otp/start] Rate limit exceeded for phone: ...
[auth/otp/start] Phone is locked: ... until: ...
[auth/otp/check] No phone found for requestId: ...
[auth/otp/check] Account locked for phone: ...
```

## Migration from SMS API

If migrating from the old SMS API (`/api/otp/request`, `/api/otp/verify`):

1. The old endpoints still exist but are not used
2. Frontend now uses `/api/auth/otp/start` and `/api/auth/otp/check`
3. Database schema remains the same (backwards compatible)
4. No data migration required

## Troubleshooting

**Issue**: "Failed to send verification code"
- Check Vonage API credentials
- Verify account has sufficient balance
- Check Vonage dashboard for errors

**Issue**: "Verification expired or invalid"
- requestId may have expired (10 min TTL)
- Ask user to request a new code

**Issue**: "Account locked"
- User failed verification 5 times
- Wait 15 minutes or manually unlock in database

**Issue**: Rate limiting too strict
- Adjust `MAX_REQUESTS_PER_HOUR` in `start.ts`
- Current: 3 requests per hour

## Best Practices

1. **Always validate phone numbers** before calling Vonage API
2. **Monitor Vonage costs** - each verification costs money
3. **Set up alerts** for unusual activity (spam, abuse)
4. **Keep secrets secure** - never commit to git
5. **Test with test phone numbers** during development
6. **Log errors** but never log OTP codes or secrets

## Support

For issues:
1. Check Vercel function logs
2. Check Vonage dashboard
3. Review Supabase database (`otp_attempts` table)
4. Enable debug mode in development

## References

- [Vonage Verify API Documentation](https://developer.vonage.com/en/verify/overview)
- [Vonage Dashboard](https://dashboard.nexmo.com/)
- [Supabase Documentation](https://supabase.com/docs)
