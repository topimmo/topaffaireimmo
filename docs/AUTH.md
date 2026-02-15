# Authentication Documentation

This document describes the authentication system used in TopAffaireImmo.

---

## Table of Contents
1. [Overview](#overview)
2. [Phone OTP Authentication](#phone-otp-authentication)
3. [Google OAuth Authentication (Supabase)](#google-oauth-authentication-supabase)
4. [Environment Variables](#environment-variables)
5. [Deployment](#deployment)

---

## Overview

TopAffaireImmo supports two authentication methods:
1. **Phone OTP** - SMS-based verification using Vonage Verify API
2. **Google OAuth** - Social login via Supabase OAuth

Both methods create user profiles in the database and establish authenticated sessions.

---

## Phone OTP Authentication

### Flow
1. User enters phone number
2. System validates format (Moroccan phone numbers)
3. Backend calls Vonage Verify API to send SMS with OTP code
4. User enters 6-digit code
5. Backend verifies code with Vonage
6. JWT token issued and stored

### Endpoints
- `POST /api/auth/otp/start` - Initiate OTP verification
- `POST /api/auth/otp/check` - Verify OTP code

### Rate Limiting
- **Max OTP requests**: 3 per phone per hour
- **Failed attempts**: 5 attempts before 15-minute lockout
- **OTP expiry**: 5 minutes

---

## Google OAuth Authentication (Supabase)

### Overview
Google OAuth is implemented using **Supabase's built-in OAuth provider**. This provides:
- Secure OAuth 2.0 flow with PKCE
- Automatic session management
- No custom backend code needed
- Mobile and desktop compatibility

### Flow
1. User clicks "Sign in with Google" button
2. Frontend calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. Browser redirects to Google authorization page
4. User authenticates with Google
5. Google redirects back to `/auth/callback`
6. Supabase automatically exchanges code for tokens
7. Frontend calls `getSession()` to retrieve session
8. User is redirected to home page
9. AuthContext loads user profile

### Implementation

**AuthContext (`src/contexts/AuthContext.tsx`):**
```typescript
const signInWithOAuth = async (provider: 'google' | 'facebook') => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: { prompt: 'select_account' }
    }
  });
  return { error };
};
```

**Callback Page (`src/pages/auth/OAuthCallbackPage.tsx`):**
```typescript
const { data: { session }, error } = await supabase.auth.getSession();
if (session) {
  navigate('/'); // Success
} else {
  navigate('/login'); // Error
}
```

### Security Features
- **PKCE Flow**: Automatic via Supabase
- **State Validation**: Handled by Supabase
- **CSRF Protection**: Built into Supabase OAuth
- **Rate Limiting**: Managed by Supabase infrastructure
- **No credentials in frontend**: All OAuth secrets stored in Supabase Dashboard

---

## Environment Variables

### Required for All Authentication

```env
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Required for Phone OTP

```env
# Vonage Verify API
VONAGE_API_KEY=your_vonage_api_key
VONAGE_API_SECRET=your_vonage_api_secret
VONAGE_FROM=TopAffaire

# JWT Secret for signing tokens
JWT_SECRET=your_strong_random_jwt_secret

# Supabase Service Role Key (server-side only)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Google OAuth Configuration

**Google OAuth is configured in Supabase Dashboard, NOT via environment variables.**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to Authentication → Providers
3. Enable "Google" provider
4. Add your Google Client ID and Client Secret from Google Cloud Console
5. Configure Site URL and Redirect URLs (see Deployment section)

---

## Deployment

### Supabase Dashboard Configuration

#### 1. Enable Google Provider
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication → Providers**
4. Find "Google" and click **Enable**
5. Enter your Google OAuth credentials:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)
6. Click **Save**

#### 2. Configure Site URL
Navigate to: **Authentication → URL Configuration → Site URL**

```
Production: https://topaffaireimmo.com
Development: http://localhost:5173
```

#### 3. Configure Redirect URLs
Navigate to: **Authentication → URL Configuration → Redirect URLs**

Add both production and development URLs:
```
https://topaffaireimmo.com/auth/callback
https://www.topaffaireimmo.com/auth/callback
http://localhost:5173/auth/callback
```

### Google Cloud Console Setup

#### Step 1: Create OAuth Client
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services → Credentials**
3. Click **Create Credentials → OAuth client ID**
4. Select **Web application**

#### Step 2: Configure OAuth Client
5. Set **Application type**: Web application
6. Add **Authorized JavaScript origins**:
   - `https://topaffaireimmo.com`
   - `https://www.topaffaireimmo.com`
   - `http://localhost:5173` (for development)

7. Add **Authorized redirect URIs**:
   - Get your Supabase callback URL from Dashboard (format: `https://[project-id].supabase.co/auth/v1/callback`)
   - Example: `https://abcdefghijklmno.supabase.co/auth/v1/callback`

8. Click **Create**
9. Copy **Client ID** and **Client Secret**
10. Paste into Supabase Dashboard Google provider settings

#### Step 3: Configure OAuth Consent Screen
1. Navigate to **APIs & Services → OAuth consent screen**
2. Configure your app information
3. Add scopes: `openid`, `email`, `profile`
4. Add test users during development
5. Publish app when ready for production

### Production Environment Variables

Set these in your deployment platform (Vercel, Netlify, etc.):

```env
# Supabase (REQUIRED - Frontend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Phone OTP (Server-side only)
VONAGE_API_KEY=<your_production_api_key>
VONAGE_API_SECRET=<your_production_api_secret>
VONAGE_FROM=TopAffaire
JWT_SECRET=<strong_random_secret>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>

# Note: Google OAuth credentials are configured in Supabase Dashboard
# No additional environment variables needed for OAuth
```

---

## Testing

### Local Development
1. Set environment variables in `.env`
2. Start development server: `npm run dev`
3. Test Google OAuth: Click "Sign in with Google"
4. Should redirect to Google, then back to `/auth/callback`
5. Verify session in browser console

### Production Testing
1. Deploy to production environment
2. Configure Supabase production URLs
3. Test OAuth flow on production domain
4. Verify session persistence across page refreshes
5. Test on mobile devices

---

## Security Considerations

### OAuth Security
- ✅ PKCE flow prevents code interception
- ✅ State parameter prevents CSRF attacks
- ✅ Secrets stored in Supabase (not in code)
- ✅ HTTPS required in production
- ✅ Rate limiting via Supabase infrastructure

### Best Practices
- Never commit `.env` files
- Use strong, random JWT secrets
- Rotate secrets periodically
- Monitor authentication logs
- Keep Supabase SDK updated

---

## Troubleshooting

### Google OAuth Not Working
1. Check Supabase Dashboard → Google provider is enabled
2. Verify Client ID and Secret are correct
3. Check redirect URLs match exactly (including trailing slashes)
4. Verify Site URL is set correctly
5. Check browser console for errors

### Redirect Loop
- Ensure `/auth/callback` route exists
- Verify `getSession()` is called correctly
- Check AuthContext is properly initialized

### Session Not Persisting
- Verify localStorage is enabled
- Check Supabase client configuration
- Ensure cookies are not blocked

---

## References

- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Vonage Verify API](https://developer.vonage.com/verify/overview)
