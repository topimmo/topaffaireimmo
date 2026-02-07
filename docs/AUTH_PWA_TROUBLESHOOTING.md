# Authentication & PWA Troubleshooting Guide

## Overview

This document provides troubleshooting steps for authentication issues related to password reset, magic links, and PWA (Progressive Web App) functionality.

## Common Issues

### 1. "Lien invalide / Expiré" (Invalid/Expired Link) Error

**Symptoms:**
- User clicks password reset link from email
- Message "Lien invalide / Expiré" appears immediately or within seconds
- Link seems to expire too quickly

**Root Causes:**

1. **Supabase Redirect URL Mismatch**
   - The redirect URL in the email doesn't match the allowed URLs in Supabase Dashboard
   - Common mismatch: `topaffaireimmo.com` vs `www.topaffaireimmo.com`

2. **Service Worker Interference**
   - Service Worker caching auth routes (now fixed in v1.2.0)
   - Auth tokens being cached or intercepted

3. **Network Issues**
   - Slow or unstable network connection
   - PWA offline mode interfering with token exchange

**Solution Steps:**

#### Step 1: Configure Supabase Redirect URLs

Go to Supabase Dashboard → Authentication → URL Configuration:

**Site URL:**
```
https://www.topaffaireimmo.com
```

**Redirect URLs** (add all of these):
```
https://www.topaffaireimmo.com/**
https://topaffaireimmo.com/**
https://www.topaffaireimmo.com/auth/callback
https://topaffaireimmo.com/auth/callback
https://www.topaffaireimmo.com/reset-password
https://topaffaireimmo.com/reset-password
http://localhost:5173/**
http://localhost:5173/auth/callback
http://localhost:5173/reset-password
http://127.0.0.1:5173/**
```

For Vercel previews (if applicable):
```
https://*.vercel.app/**
```

#### Step 2: Verify Environment Variables

Check that `.env` has:
```bash
VITE_SITE_URL=https://www.topaffaireimmo.com
VITE_PRODUCTION_DOMAIN=https://www.topaffaireimmo.com
```

#### Step 3: Clear Service Worker Cache

If the issue persists after updating Supabase config:

1. Open browser DevTools (F12)
2. Go to Application → Service Workers
3. Click "Unregister" for the service worker
4. Go to Application → Cache Storage
5. Delete all caches
6. Reload the page

### 2. PWA Shows "Internet not available" or Blank Page

**Symptoms:**
- Site installed as PWA (Add to Home Screen)
- Clicking auth link from email shows "Internet not available"
- Or shows a blank page
- Only happens in PWA, works fine in normal browser

**Root Cause:**
Service Worker returning offline page or cached shell for auth routes instead of letting the network request through.

**Solution:**
The Service Worker has been updated (v1.2.0) to:
- Always bypass caching for `/auth/callback` and `/reset-password`
- Force network-only requests for auth routes
- Show proper error messages when truly offline

**Manual Fix (if needed):**
1. Uninstall the PWA
2. Clear browser cache and Service Worker
3. Reinstall the PWA
4. Service Worker v1.2.0+ will be installed automatically

### 3. Auth Links Work in Browser but Not in PWA

**Symptoms:**
- Password reset works fine when opening in Chrome/Safari
- Same link fails when opened in installed PWA
- May show "Network error" or blank page

**Diagnosis:**
1. Check if the link opens in the PWA or in a new browser tab
2. Some mobile browsers open links from email in a new browser context
3. PWA may not be registered as the default handler for the domain

**Solution:**

#### Android:
1. Open link from email
2. Select "Open with TopAffaireImmo" if prompted
3. Or manually copy link and paste into PWA

#### iOS:
1. Long-press the link in email
2. Choose "Open" (not "Open in Safari")
3. Or manually copy and paste into PWA

**App Association Fix:**
For iOS Universal Links and Android App Links, see `docs/PWA_DEEP_LINKING.md` (to be created).

### 4. Token Expires During Slow Network Connection

**Symptoms:**
- Link works fine on fast WiFi
- Fails with "expired" error on slow mobile data
- Takes more than a few seconds to load

**Solution:**
Supabase PKCE tokens have a short expiration (typically 5 minutes for the code exchange).

**Workarounds:**
1. Ensure stable internet connection before clicking link
2. Use WiFi instead of mobile data for reset
3. If timeout occurs, request a new reset link

**Code Improvement (already implemented):**
- Early offline detection before attempting token exchange
- Clear error messages distinguishing network issues from expired tokens
- Retry mechanism for transient network failures

## Service Worker Configuration

### Auth Routes (Network-Only)

These routes **always** bypass the Service Worker and hit the network directly:

- `/auth/callback` - OAuth/email confirmation handler
- `/reset-password` - Password reset form
- `/login` - Login page
- `/register` - Registration page

### Why Auth Routes Bypass Service Worker

1. **Token Freshness**: Auth tokens in URLs must be processed fresh, never cached
2. **PKCE Flow**: Code exchange requires immediate network communication
3. **Prevent Token Leakage**: Cached auth tokens could be security risk
4. **Error Handling**: Network errors should be handled by the app, not SW

### Service Worker Version History

- **v1.0.0**: Initial PWA support with basic offline fallback
- **v1.1.0**: Smart offline fallback logic for critical routes
- **v1.2.0**: Auth routes bypass SW entirely, improved offline detection

## Testing Checklist

### Normal Browser Testing

- [ ] Password reset link works from email
- [ ] Email confirmation link works
- [ ] Magic link works (if implemented)
- [ ] No "invalid/expired" errors on fresh links
- [ ] Clear error messages on truly expired links

### PWA Testing (Android)

- [ ] Install site as PWA (Add to Home Screen)
- [ ] Click password reset link from email
- [ ] Verify it opens in PWA, not new browser tab
- [ ] Complete password reset flow
- [ ] No "Internet not available" errors when online
- [ ] Proper offline message when truly offline

### PWA Testing (iOS)

- [ ] Add to Home Screen
- [ ] Test password reset from Mail app
- [ ] Test email confirmation
- [ ] Verify proper error handling
- [ ] Check offline behavior

### Network Condition Testing

- [ ] Test on fast WiFi
- [ ] Test on slow 3G connection
- [ ] Test with airplane mode (should show offline error)
- [ ] Test with unstable connection (simulate in DevTools)

## Debugging Tips

### Enable Verbose Logging

The app already logs detailed auth flow information. Check browser console:

**Password Reset Flow:**
```
🔐 Reset password page loaded
  - Current URL: https://www.topaffaireimmo.com/reset-password?code=...
  - Online status: true
  - Auth parameters: { hasCode: true, ... }
```

**Auth Callback Flow:**
```
🔐 Auth callback triggered
  - Current URL: https://www.topaffaireimmo.com/auth/callback?code=...
  - Online status: true
  - Auth parameters: { hasCode: true, type: 'signup' }
```

**Service Worker:**
```
[SW] Auth route detected, bypassing cache: /reset-password
[SW] Navigation request failed: /dashboard (offline)
[SW] Critical route failed, returning cached shell
```

### Check Network Tab

1. Open DevTools → Network
2. Filter for Supabase requests
3. Look for failed auth/token requests
4. Check response codes:
   - 200: Success
   - 400: Bad request (invalid code/token)
   - 401: Unauthorized (expired token)
   - 422: Validation error (code already used)

### Service Worker State

Check Application → Service Workers in DevTools:
- **Status**: Should show "activated and running"
- **Version**: Check SW_VERSION in sw.js (should be 1.2.0+)
- **Scope**: Should be `/`

## Related Documentation

- `docs/AUTH_FLOW_DIAGRAM.md` - Visual auth flow diagrams
- `docs/SUPABASE_AUTH_REDIRECT_URLS.md` - Redirect URL configuration
- `.env.example` - Environment variable requirements
- `src/pages/ResetPassword.tsx` - Password reset implementation
- `src/pages/AuthCallback.tsx` - Auth callback implementation
- `src/sw.ts` - Service Worker configuration

## Support

If issues persist after following this guide:

1. Check browser console for detailed error logs
2. Verify Supabase Dashboard configuration matches exactly
3. Clear all caches and Service Workers
4. Try in incognito/private mode
5. Test on different device/browser

For production issues, capture:
- Full console logs (with auth params redacted)
- Network tab showing failed requests
- Service Worker state
- Browser and OS versions
- Steps to reproduce
