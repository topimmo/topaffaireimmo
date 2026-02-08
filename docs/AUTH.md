# Authentication Documentation

## Overview

TopAffaireImmo uses a dual authentication system:
1. **Phone OTP (SMS)** - Vonage Verify API
2. **Google OAuth 2.0** - Google Sign-In

Email-based authentication has been removed to streamline the user experience.

## Table of Contents
- [Phone OTP Authentication](#phone-otp-authentication)
- [Google OAuth Authentication](#google-oauth-authentication)
- [Environment Variables](#environment-variables)
- [Google Cloud Console Setup](#google-cloud-console-setup)
- [Testing Checklist](#testing-checklist)
- [Production Deployment](#production-deployment)
- [Security Considerations](#security-considerations)

---

## Phone OTP Authentication

### Flow
1. User enters phone number
2. System validates format (Moroccan phone numbers: +212XXXXXXXXX, 06XXXXXXXX, 07XXXXXXXX)
3. Backend calls Vonage Verify API to send SMS with OTP code
4. User enters 6-digit code
5. Backend verifies code with Vonage
6. JWT token issued and stored in localStorage

### Endpoints
- `POST /api/auth/otp/start` - Initiate OTP verification
- `POST /api/auth/otp/check` - Verify OTP code

### Rate Limiting
- **Max OTP requests**: 3 per phone per hour
- **Failed attempts**: 5 attempts before 15-minute lockout
- **OTP expiry**: 5 minutes

### Frontend
- **UI**: `/src/pages/AuthPage.tsx`
- **2-step flow**: Phone input → OTP verification
- **Bilingual**: French and Arabic with RTL support
- **Persistence**: localStorage for refresh safety

---

## Google OAuth Authentication

### Flow
1. User clicks "Se connecter avec Google" / "الدخول عبر Google"
2. Browser redirects to `/api/auth/google/start`
3. Backend generates PKCE parameters (state + code_verifier + code_challenge)
4. Stores state in memory with 10-minute TTL
5. Redirects to Google authorization URL
6. User authenticates with Google
7. Google redirects to `/api/auth/google/callback` with authorization code
8. Backend validates state, exchanges code for tokens
9. Backend fetches user info from Google
10. Backend creates/updates user in database
11. JWT token issued and returned via URL hash
12. Frontend extracts token and completes login

### Endpoints
- `GET /api/auth/google/start` - Initiate OAuth flow
- `GET /api/auth/google/callback` - Handle OAuth callback

### Security Features
- **PKCE**: Code challenge prevents authorization code interception
- **State parameter**: CSRF protection
- **In-memory state store**: 10-minute TTL, automatic cleanup
- **Rate limiting**: 30 requests per minute per IP

### User Upsert Logic
- **Existing user (by email)**: Update `google_id`, `full_name` if empty
- **New user**: Create auth user + profile with `google_id`, `email`, `full_name`

### Database Schema
```sql
ALTER TABLE profiles ADD COLUMN google_id TEXT;
CREATE INDEX idx_profiles_google_id ON profiles(google_id);
```

---

## Environment Variables

### Required for Phone OTP
```env
VONAGE_API_KEY=your_vonage_api_key_here
VONAGE_API_SECRET=your_vonage_api_secret_here
VONAGE_FROM=TopAffaire
JWT_SECRET=your_strong_random_jwt_secret_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Required for Google OAuth
```env
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5173/api/auth/google/callback
```

### Production Values
```env
# Production redirect URI
GOOGLE_REDIRECT_URI=https://www.topaffaireimmo.com/api/auth/google/callback
```

---

## Google Cloud Console Setup

### Step 1: Create Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Google+ API** (or **Google Identity** service)

### Step 2: Configure OAuth Consent Screen
1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Fill in required fields:
   - **App name**: TopAffaireImmo
   - **User support email**: contact@topaffaireimmo.com
   - **Developer contact email**: dev@topaffaireimmo.com
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Add test users (for testing mode):
   - Add developer email addresses
   - Test users can sign in before app is published

### Step 3: Create OAuth Client
1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Configure:
   - **Name**: TopAffaireImmo Web Client
   - **Authorized JavaScript origins**:
     - `https://www.topaffaireimmo.com`
     - `http://localhost:5173` (for development)
   - **Authorized redirect URIs**:
     - `https://www.topaffaireimmo.com/api/auth/google/callback`
     - `http://localhost:5173/api/auth/google/callback`
5. Click **Create**
6. Copy **Client ID** and **Client Secret**

### Step 4: Publishing (Optional)
- In testing mode, only test users can sign in
- To allow all users:
  1. Go to **OAuth consent screen**
  2. Click **Publish App**
  3. For basic scopes (openid, email, profile), no verification required
  4. For sensitive/restricted scopes, Google verification needed

---

## Testing Checklist

### Phone OTP Testing
- [ ] Enter valid Moroccan phone number → OTP sent
- [ ] Enter invalid phone format → Error shown
- [ ] Submit correct OTP → Login successful, redirected
- [ ] Submit wrong OTP → Error shown, attempts counted
- [ ] 5 failed attempts → Account locked for 15 minutes
- [ ] Resend OTP → New code sent, 30-second cooldown
- [ ] Rate limit: 3 requests per hour enforced
- [ ] Refresh page during OTP step → State restored from localStorage
- [ ] Test French UI labels
- [ ] Test Arabic UI labels with RTL layout

### Google OAuth Testing
- [ ] Click "Se connecter avec Google" → Redirects to Google
- [ ] Cancel on Google page → Returns with error
- [ ] Complete Google sign-in with new email → User created, logged in
- [ ] Complete Google sign-in with existing email → User updated, logged in
- [ ] Test with unverified email → Error shown
- [ ] Test rate limiting (30 req/min per IP)
- [ ] Refresh during OAuth flow → State expires correctly
- [ ] Test French button label
- [ ] Test Arabic button label with RTL

### Integration Testing
- [ ] Phone OTP login → Dashboard accessible
- [ ] Google OAuth login → Dashboard accessible
- [ ] Logout → Token removed
- [ ] Access protected route → Redirects to auth
- [ ] Login → Redirects to original destination

---

## Production Deployment

### Vercel Environment Variables
Set these in Vercel project settings:

```
# Phone OTP
VONAGE_API_KEY=<your_production_key>
VONAGE_API_SECRET=<your_production_secret>
VONAGE_FROM=TopAffaire
JWT_SECRET=<strong_random_secret>

# Google OAuth
GOOGLE_CLIENT_ID=<your_production_client_id>
GOOGLE_CLIENT_SECRET=<your_production_client_secret>
GOOGLE_REDIRECT_URI=https://www.topaffaireimmo.com/api/auth/google/callback

# Supabase
VITE_SUPABASE_URL=<your_supabase_url>
VITE_SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
```

### Google Cloud Console Production Config
1. Add production redirect URI:
   - `https://www.topaffaireimmo.com/api/auth/google/callback`
2. Add production JavaScript origin:
   - `https://www.topaffaireimmo.com`
3. Keep localhost URIs for testing

### Database Migration
Run the migration to add `google_id` field:
```bash
# Via Supabase CLI
supabase db push

# Or manually in Supabase SQL Editor
-- Run: supabase/migrations/087_add_google_oauth_support.sql
```

---

## Security Considerations

### What We Do
✅ PKCE flow prevents authorization code interception  
✅ State parameter prevents CSRF attacks  
✅ In-memory state store with TTL (10 min)  
✅ Rate limiting on all endpoints  
✅ Minimal logging (no tokens, codes, or secrets)  
✅ JWT tokens with expiration (7 days)  
✅ Email verification check (Google verified emails only)  
✅ Secure token storage (localStorage)  
✅ No secrets in frontend code  

### Best Practices
- Never log tokens, codes, or secrets
- Only log high-level errors with request IDs
- Rotate JWT_SECRET periodically
- Monitor rate limit violations
- Keep Google Client Secret secure (server-side only)
- Use HTTPS in production
- Set secure cookie flags if using cookie-based auth

### Potential Improvements
- Add refresh token rotation for long-lived sessions
- Implement device fingerprinting for fraud detection
- Add 2FA option for high-security accounts
- Store tokens in httpOnly cookies instead of localStorage
- Add session management (view/revoke active sessions)
- Implement account linking (multiple auth methods per user)

---

## Troubleshooting

### Common Issues

**Phone OTP not sending**
- Check Vonage account balance
- Verify VONAGE_API_KEY and VONAGE_API_SECRET
- Check phone number format (must be E.164)
- Review Vonage dashboard for errors

**Google OAuth redirect mismatch**
- Ensure GOOGLE_REDIRECT_URI exactly matches Google Console
- Check for trailing slashes
- Verify protocol (http vs https)

**State validation failed**
- State expired (>10 min)
- Browser blocked cookies/storage
- Multiple tabs causing race condition

**User creation failed**
- Check Supabase RLS policies
- Verify SUPABASE_SERVICE_ROLE_KEY
- Check profiles table schema has required fields

**JWT verification failed**
- JWT_SECRET mismatch between environments
- Token expired (>7 days)
- Token tampered with

---

## Support

For issues or questions:
- Email: dev@topaffaireimmo.com
- Documentation: `/docs/`
- Code: `/api/auth/`, `/src/pages/AuthPage.tsx`
