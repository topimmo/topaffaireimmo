# Supabase Configuration Guide for Production

This guide provides the critical Supabase configuration needed to fix authentication and redirect issues.

## Overview

The application uses Supabase for authentication with support for:
- Email/Password signup and login
- Google OAuth
- Email confirmation
- Password reset

## Critical Configuration Settings

### 1. Site URL Configuration

**Location**: Supabase Dashboard > Authentication > URL Configuration

**Site URL**:
```
https://www.topaffaireimmo.com
```

**Purpose**: This is the default URL where users are redirected after authentication actions.

### 2. Redirect URLs Configuration

**Location**: Supabase Dashboard > Authentication > URL Configuration

**Redirect URLs** (add all of these):
```
https://topaffaireimmo.com/*
https://www.topaffaireimmo.com/*
http://localhost:5173/*
```

**Purpose**: These URLs are allowed as redirect targets after authentication. The wildcard `/*` allows any path.

**Important**: 
- Always include both www and non-www versions if you support both
- Include localhost for development
- The wildcard is essential for the auth callback to work

### 3. Email Templates

**Location**: Supabase Dashboard > Authentication > Email Templates

#### Confirm Signup Template

**Subject**: Confirm your email for TopAffaireImmo

**Email Body** should include:
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

**Confirmation URL**: Make sure it points to:
```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email
```

#### Reset Password Template

**Subject**: Reset your password for TopAffaireImmo

**Email Body** should include:
```html
<h2>Reset your password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset password</a></p>
```

**Confirmation URL**:
```
{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery
```

### 4. Google OAuth Provider Configuration

**Location**: Supabase Dashboard > Authentication > Providers > Google

**Settings**:
- **Enabled**: ✅ Yes
- **Client ID**: [From Google Cloud Console]
- **Client Secret**: [From Google Cloud Console]
- **Redirect URL**: `https://ghzdehknuzrtmfrimzdw.supabase.co/auth/v1/callback`

**Skip nonce check**: ❌ No (keep default for security)

**Note**: See `GOOGLE_OAUTH_CONFIGURATION.md` for detailed Google setup.

### 5. Email Auth Settings

**Location**: Supabase Dashboard > Authentication > Providers > Email

**Settings**:
- **Enabled**: ✅ Yes
- **Confirm email**: ✅ Yes (recommended for production)
- **Secure email change**: ✅ Yes (recommended)
- **Double confirm email change**: ✅ Yes (recommended)

### 6. Auth Security Settings

**Location**: Supabase Dashboard > Authentication > Configuration

#### JWT Settings:
- **JWT expiry**: `3600` (1 hour - default is fine)
- **Refresh token expiry**: `2592000` (30 days - default is fine)

#### Session Settings:
- **Disable signup**: ❌ No (allow new signups)
- **Enable email confirmations**: ✅ Yes
- **Enable manual linking**: ❌ No (unless needed)

#### Rate Limiting:
Keep default values unless you experience issues:
- **Rate limit for sending emails**: 3 per hour per IP
- **Rate limit for verifying emails**: 60 per hour per IP

### 7. PKCE Flow Configuration

**Location**: Supabase Dashboard > Authentication > Configuration

**PKCE Settings**:
- **Enable PKCE flow**: ✅ Yes (recommended for web apps)

**Why**: PKCE (Proof Key for Code Exchange) is more secure for web applications.

**How it works**:
1. User clicks Google/Email link
2. Redirected to provider with code challenge
3. Provider redirects back with code
4. Code exchanged for session via `/auth/callback`

## Environment Variables

Ensure these are set in your application:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://ghzdehknuzrtmfrimzdw.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Optional: For server-side operations
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Security**:
- ✅ Anon key is safe to expose in frontend
- ❌ Service role key must NEVER be exposed in frontend
- ✅ Both should be stored as environment variables

## Auth Callback Route

The application must have a dedicated route: `/auth/callback`

**Purpose**: Handles OAuth redirects and email confirmations.

**Location**: `src/pages/AuthCallback.tsx`

**Flow**:
```
1. User completes auth action (login, signup, confirm email)
2. Redirected to: https://www.topaffaireimmo.com/auth/callback?code=...
3. AuthCallback component:
   - Extracts code/token from URL
   - Exchanges code for session
   - Redirects user to dashboard/admin/home
```

## Common Configuration Issues

### Issue 1: "Invalid redirect URL" error

**Cause**: The redirect URL is not in Supabase's allowed list.

**Solution**:
1. Go to Supabase > Authentication > URL Configuration
2. Add the exact URL showing in the error
3. Save changes
4. Try again

### Issue 2: Email confirmation stuck on "Confirmation en cours..."

**Possible causes**:
1. Wrong confirmation URL in email template
2. Auth callback route not working
3. Session not being created

**Solution**:
1. Check email template confirmation URL format
2. Verify `/auth/callback` route exists and is public
3. Check browser console for errors
4. See `AuthCallback.tsx` logs

### Issue 3: Google OAuth shows Supabase project reference

**Cause**: Google OAuth consent screen not configured.

**Solution**: See `GOOGLE_OAUTH_CONFIGURATION.md` for full setup.

### Issue 4: Session not persisting after login

**Possible causes**:
1. Browser blocking cookies
2. Cookie domain mismatch
3. HTTPS/HTTP mismatch

**Solution**:
1. Check browser cookie settings
2. Verify www/non-www consistency
3. Ensure all URLs use HTTPS

### Issue 5: Redirect loop after login

**Possible causes**:
1. Protected route checking auth on every render
2. Auth state not hydrating properly
3. Circular redirect logic

**Solution**:
1. Check `ProtectedRoute.tsx` logic
2. Verify `AuthContext.tsx` hydration timeout
3. Check for circular redirects

## Vercel Configuration

If deploying on Vercel, ensure:

**vercel.json**:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

**Environment Variables in Vercel**:
1. Go to Vercel Project Settings > Environment Variables
2. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Select **Production**, **Preview**, and **Development**
4. Redeploy

## Testing Authentication

### Test Email Signup:
1. Go to `/register`
2. Enter email and password
3. Check email for confirmation link
4. Click link → should redirect to `/auth/callback` → then to dashboard
5. Verify session is created

### Test Google OAuth:
1. Go to `/login`
2. Click "Sign in with Google"
3. Should show "Access to application TopAffaireImmo"
4. After approving → redirect to `/auth/callback` → then to dashboard
5. Verify profile is created

### Test Password Reset:
1. Go to `/login`
2. Click "Forgot password"
3. Enter email
4. Check email for reset link
5. Click link → should redirect to `/reset-password`
6. Enter new password
7. Should redirect to dashboard

## Monitoring and Debugging

### Supabase Auth Logs

**Location**: Supabase Dashboard > Authentication > Logs

**What to check**:
- Recent authentication attempts
- Failed login attempts
- OAuth callback errors
- Email sending errors

### Browser Console Logs

The application logs auth events:
- `🔐 Auth callback triggered` - When callback route loads
- `✅ Session created successfully` - When session is established
- `❌ Error getting session` - When session creation fails

### Common Log Patterns

**Successful OAuth**:
```
🔐 Auth callback triggered
🔑 PKCE flow detected - exchanging code for session
✅ Session created successfully
  - User ID: xxx-xxx-xxx
  - Redirect destination: /dashboard
```

**Failed OAuth**:
```
🔐 Auth callback triggered
❌ Error exchanging code for session
Redirecting to /login?err=oauth
```

## Security Checklist

- [ ] Site URL is set to production domain
- [ ] All redirect URLs use HTTPS
- [ ] Email confirmation is enabled
- [ ] PKCE flow is enabled
- [ ] Service role key is NOT in frontend code
- [ ] Rate limiting is configured
- [ ] Email templates use correct URLs
- [ ] Google OAuth consent screen is configured
- [ ] Test users can signup, login, and reset password
- [ ] Sessions persist after page refresh

## Support Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase URL Configuration](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase OAuth Providers](https://supabase.com/docs/guides/auth/social-login)

## Getting Help

If authentication issues persist:

1. **Check Supabase Logs**: Authentication > Logs
2. **Check Browser Console**: Look for auth errors
3. **Test in Incognito**: Rules out cache issues
4. **Verify Configuration**: Double-check all settings above
5. **Review Code**: Check `AuthContext.tsx` and `AuthCallback.tsx`
