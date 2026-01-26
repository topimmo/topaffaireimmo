# Supabase Auth Configuration Guide

## Overview
This guide explains how to configure Supabase authentication to ensure email confirmation links work correctly and redirect to the proper domain (not preview/temporary URLs).

## Problem Statement
By default, Supabase may generate email confirmation links that:
- Redirect to Vercel preview domains instead of production
- Result in 502 Bad Gateway errors
- Open blank pages
- Don't properly create user sessions

## Solution: Configure Redirect URLs

### Step 1: Set Production Domain Environment Variable
In your Vercel project settings or `.env` file, set:
```
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com
```
Replace with your actual production domain.

### Step 2: Configure Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Navigate to: https://app.supabase.com/project/YOUR_PROJECT_ID/auth/url-configuration

2. **Set Site URL**
   - Field: "Site URL"
   - Value: `https://topaffaireimmo.com` (your production domain)
   - This is the default redirect for authentication

3. **Add Redirect URLs**
   Add these URLs to the "Redirect URLs" list (one per line):
   
   **Production URLs:**
   ```
   https://topaffaireimmo.com/auth/callback
   https://topaffaireimmo.com/reset-password
   ```
   
   **Development URLs (for local testing):**
   ```
   http://localhost:5173/auth/callback
   http://localhost:5173/reset-password
   http://localhost:5174/auth/callback
   http://localhost:5174/reset-password
   ```
   
   **Optional: Vercel Preview URLs (if needed):**
   ```
   https://*.vercel.app/auth/callback
   https://*.vercel.app/reset-password
   ```

4. **Save Changes**
   - Click "Save" to apply the configuration

### Step 3: Verify Configuration

After configuration, test the following flows:

1. **Signup Flow:**
   - Register a new account
   - Check email for confirmation link
   - Click the link
   - Should redirect to `https://topaffaireimmo.com/auth/callback`
   - Should show success message and redirect to dashboard

2. **Password Reset Flow:**
   - Click "Forgot Password" on login page
   - Enter your email
   - Check email for reset link
   - Click the link
   - Should redirect to `https://topaffaireimmo.com/reset-password`
   - Should allow you to set a new password

## How It Works

### Auth Callback Route (`/auth/callback`)
The application includes an auth callback route that:
1. Detects email confirmation tokens in the URL
2. Exchanges them for a session using Supabase PKCE flow
3. Handles errors gracefully (no blank pages)
4. Redirects users to the appropriate dashboard based on their role

### Redirect Flow
```
User clicks email link
    ↓
Supabase validates token
    ↓
Redirects to configured URL (/auth/callback)
    ↓
React app handles callback
    ↓
Session created
    ↓
User profile loaded
    ↓
Redirect to dashboard based on role
```

## Common Issues

### Issue: Blank page after clicking email link
**Cause:** Redirect URL not configured in Supabase
**Solution:** Add `/auth/callback` to Redirect URLs in Supabase dashboard

### Issue: 502 Bad Gateway
**Cause:** Email link redirects to a Vercel preview domain that doesn't exist
**Solution:** 
1. Set VITE_PRODUCTION_DOMAIN environment variable
2. Configure Site URL in Supabase to production domain
3. Regenerate the email confirmation

### Issue: "Invalid redirect URL"
**Cause:** The redirect URL is not in the allowed list
**Solution:** Add the URL to "Redirect URLs" in Supabase dashboard

### Issue: Session not created after confirmation
**Cause:** PKCE flow not properly handled
**Solution:** The auth callback route handles this automatically. Ensure `detectSessionInUrl: true` is set in Supabase client config.

## Environment Variables Summary

Required environment variables:

```bash
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Production Domain (Required for production)
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com
```

## Security Notes

1. **Never commit `.env` to version control** - use `.env.example` as a template
2. **Use HTTPS in production** - never use HTTP for production domains
3. **Limit redirect URLs** - only add URLs you control and trust
4. **Use wildcard cautiously** - `*.vercel.app` allows all Vercel preview domains

## Related Files

- `/src/pages/AuthCallback.tsx` - Handles email confirmation callback
- `/src/contexts/AuthContext.tsx` - Auth state management
- `/src/lib/supabase.ts` - Supabase client configuration
- `/.env.example` - Environment variable template

## Testing Checklist

- [ ] VITE_PRODUCTION_DOMAIN is set
- [ ] Site URL is configured in Supabase
- [ ] Redirect URLs are added to Supabase
- [ ] Test signup → email → confirmation → dashboard flow
- [ ] Test password reset → email → reset form flow
- [ ] No blank pages during auth flows
- [ ] No 502 errors
- [ ] Session is created successfully
- [ ] User is redirected to correct dashboard
