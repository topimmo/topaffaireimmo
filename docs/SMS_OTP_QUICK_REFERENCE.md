# SMS OTP Quick Reference

Quick reference for SMS OTP authentication implementation.

## 🔑 Environment Variables

Required in Vercel (Production, Preview, Development):

```bash
SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
VONAGE_API_KEY=abc123
VONAGE_API_SECRET=xyz789
VONAGE_FROM=TopAffaire
JWT_SECRET=your-secret-min-32-chars
```

## 📁 File Structure

```
/api
  /otp
    request.ts       → POST /api/otp/request
    verify.ts        → POST /api/otp/verify
  tsconfig.json
/lib
  supabaseAdmin.ts   → Admin client with service role
  phone.ts           → Morocco phone validation
  jwt.ts             → JWT token utilities
  otp.ts             → OTP generation & hashing
/src/auth
  OTPLogin.tsx       → React component
  OTPLoginExample.tsx → Usage examples
/supabase/migrations
  086_otp_attempts_table.sql → Database schema
/docs
  SMS_OTP_AUTHENTICATION.md → Full documentation
  SMS_OTP_TESTING.md → Testing guide
```

## 🚀 API Endpoints

### Request OTP
```bash
POST /api/otp/request
Body: {"phone": "+212664352280"}
```

**Success (200):**
```json
{"ok": true, "message": "..."}
```

**Errors:**
- 400: Invalid phone format
- 429: Rate limited or locked
- 500: Server error

### Verify OTP
```bash
POST /api/otp/verify
Body: {"phone": "+212664352280", "code": "123456"}
```

**Success (200):**
```json
{
  "ok": true,
  "token": "eyJ...",
  "phone": "+212664352280"
}
```

**Errors:**
- 400: Invalid code or expired
- 429: Account locked
- 500: Server error

## 🎨 React Integration

```tsx
import { OTPLogin } from './auth/OTPLogin';

function LoginPage() {
  return (
    <OTPLogin
      onSuccess={(token, phone) => {
        localStorage.setItem('auth_token', token);
        navigate('/dashboard');
      }}
      onError={(error) => console.error(error)}
    />
  );
}
```

## 🔒 Security Features

| Feature | Limit | Action |
|---------|-------|--------|
| Rate Limiting | 3 OTP/hour | Returns 429 |
| Failed Attempts | 5 tries | Lock for 15min |
| OTP Expiration | 5 minutes | Auto-delete |
| Phone Format | Morocco only | +212 required |
| OTP Storage | Bcrypt hashed | Never plain text |

## 📊 Database Schema

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

## 🧪 Quick Test

```bash
# 1. Request OTP
curl -X POST https://your-domain.vercel.app/api/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+212664352280"}'

# 2. Check your phone for SMS

# 3. Verify OTP
curl -X POST https://your-domain.vercel.app/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+212664352280", "code": "123456"}'
```

## 🔧 Common Issues

**No SMS received:**
- Check Vonage balance
- Verify credentials
- Check phone format

**500 Error:**
- Check environment variables
- Verify database migration
- Check Vercel logs

**Rate limited:**
- Clear test data from database
- Use different phone number
- Wait for rate limit to expire

## 📝 Cleanup Test Data

```sql
DELETE FROM otp_attempts 
WHERE phone = '+212664352280';
```

## 📚 Documentation

- [Full Guide](./SMS_OTP_AUTHENTICATION.md)
- [Testing Guide](./SMS_OTP_TESTING.md)
- [Vonage Docs](https://developer.vonage.com/messaging/sms/overview)

## ✅ Deployment Checklist

- [ ] Database migration applied
- [ ] All env vars set in Vercel
- [ ] Code deployed
- [ ] Vonage account funded
- [ ] Test with real phone number
- [ ] Verify SMS delivery
- [ ] Test rate limiting
- [ ] Test lockout mechanism
- [ ] Verify JWT tokens work
- [ ] Monitor first 24 hours
