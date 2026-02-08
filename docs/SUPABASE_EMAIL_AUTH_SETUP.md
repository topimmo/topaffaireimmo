# Supabase Email Confirmation & Password Reset Setup Guide

## Overview
This guide provides step-by-step instructions for configuring Supabase to make email confirmation (signup) and password reset flows work reliably on both mobile and desktop.

## Problem Statement
- After signup, users receive a Supabase verification link that redirects to `https://www.topaffaireimmo.com/auth/callback`
- Clicking the link may show: **"Email link is invalid or has expired"**
- Password recovery links have the same issue

## Root Causes
1. **Redirect URLs not configured** in Supabase Dashboard
2. **Site URL mismatch** between `.env` and Supabase settings
3. **In-app browser issues** (Gmail, Facebook webviews strip URL fragments)
4. **Service Worker caching** auth routes (fixed in v1.2.0+)

---

## 1. Supabase Dashboard Configuration

### Step 1: Navigate to Authentication Settings
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**

### Step 2: Set Site URL
Set the **Site URL** to your primary production domain:

```
https://www.topaffaireimmo.com
```

**Important:** This must match your `.env` file's `VITE_SITE_URL` variable.

### Step 3: Add Redirect URLs
Add the following URLs to **Additional Redirect URLs** section (one per line):

#### Production URLs (REQUIRED)
```
https://www.topaffaireimmo.com/**
https://www.topaffaireimmo.com/auth/callback
https://www.topaffaireimmo.com/auth/reset
https://www.topaffaireimmo.com/reset-password
https://topaffaireimmo.com/**
https://topaffaireimmo.com/auth/callback
https://topaffaireimmo.com/auth/reset
https://topaffaireimmo.com/reset-password
```

#### Development URLs (for local testing)
```
http://localhost:5173/**
http://localhost:5173/auth/callback
http://localhost:5173/auth/reset
http://localhost:5173/reset-password
http://127.0.0.1:5173/**
```

#### Vercel Preview Deployments (if using Vercel)
```
https://*.vercel.app/**
https://topaffaireimmo-*.vercel.app/**
```

### Why These URLs?
- `/**` - Wildcard to allow all subpaths under the domain
- `/auth/callback` - Handles signup confirmation and magic links
- `/auth/reset` - Alternative route for password reset
- `/reset-password` - Primary route for password reset
- Both `www` and non-`www` variants ensure it works regardless of subdomain

---

## 2. Environment Variables

Ensure your `.env` file contains:

```bash
# Production domain (used for email redirect URLs)
VITE_SITE_URL=https://www.topaffaireimmo.com
VITE_PRODUCTION_DOMAIN=https://www.topaffaireimmo.com

# Supabase configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Critical:** After changing `VITE_SITE_URL`, rebuild and redeploy your application.

---

## 3. Frontend Implementation

The application uses two main routes for authentication:

### A) `/auth/callback` - Email Confirmation & Magic Links
**Handles:**
- Signup confirmations (`type=signup`)
- Magic link logins
- OAuth callbacks (future)

**Flow:**
1. User clicks email link → redirected to `/auth/callback?code=...`
2. Page reads URL params:
   - If `code` exists: calls `supabase.auth.exchangeCodeForSession(code)` (PKCE flow)
   - If `access_token` & `refresh_token` exist: calls `supabase.auth.setSession(...)` (legacy flow)
3. On success: redirects to home or admin dashboard
4. On error: shows friendly error message with button to request new link

**File:** `/src/pages/AuthCallback.tsx`

### B) `/auth/reset` or `/reset-password` - Password Recovery
**Handles:**
- Password reset flow (`type=recovery`)

**Flow:**
1. User clicks reset link → redirected to `/auth/reset?code=...` or `/reset-password?code=...`
2. Page establishes session using `code` or tokens
3. Shows "Set New Password" form
4. Calls `supabase.auth.updateUser({ password: NEW_PASSWORD })`
5. On success: signs out and redirects to login with success message

**File:** `/src/pages/ResetPassword.tsx`

---

## 4. Testing Instructions

### Test Email Confirmation (Signup)

1. **Sign up with a new email:**
   ```
   Navigate to: https://www.topaffaireimmo.com/register
   Email: test@example.com
   Password: Test1234!
   ```

2. **Check your inbox** for the confirmation email

3. **Click the confirmation link** - should redirect to `/auth/callback`

4. **Verify success:**
   - ✅ Should show "Email confirmed successfully!"
   - ✅ Should redirect to home page or admin dashboard
   - ✅ User should be logged in

5. **Check for errors:**
   - ❌ "Email link is invalid or has expired" → Redirect URLs not configured
   - ❌ "No authentication data found" → Link opened in wrong browser context
   - ❌ Blank page → Service Worker caching issue (clear cache)

### Test Password Reset

1. **Request password reset:**
   ```
   Navigate to: https://www.topaffaireimmo.com/login
   Click "Mot de passe oublié?"
   Enter email: test@example.com
   ```

2. **Check your inbox** for the reset email

3. **Click the reset link** - should redirect to `/auth/reset` or `/reset-password`

4. **Enter new password:**
   ```
   New Password: NewTest1234!
   Confirm: NewTest1234!
   Click "Changer le mot de passe"
   ```

5. **Verify success:**
   - ✅ Should show "Password changed successfully!"
   - ✅ Should redirect to login page
   - ✅ Should be able to log in with new password

6. **Check for errors:**
   - ❌ "Reset link has expired" → User took too long (links expire after 1 hour)
   - ❌ "Invalid link" → Redirect URLs not configured
   - ❌ "Session has expired" → User clicked link twice

---

## 5. Common Pitfalls & Solutions

### Issue: "Email link is invalid or has expired"
**Causes:**
- Redirect URLs not configured in Supabase Dashboard
- Site URL mismatch
- Link opened in in-app browser (Gmail, Facebook)

**Solutions:**
1. Verify redirect URLs in Supabase Dashboard (see Step 3)
2. Ensure `VITE_SITE_URL` matches Supabase Site URL
3. If in Gmail/Facebook app, copy link and open in Chrome/Safari

### Issue: Link works in browser but not in PWA
**Cause:** Service Worker caching auth routes

**Solution:**
1. Update to Service Worker v1.2.0+
2. Uninstall PWA
3. Clear Service Worker cache in DevTools
4. Reinstall PWA

### Issue: "No session after email confirmation"
**Causes:**
- Callback page not handling URL params correctly
- Network connectivity issue during code exchange

**Solutions:**
1. Check browser console for errors
2. Verify internet connection
3. Try clearing browser cache and cookies

### Issue: In-app browser (Gmail, Facebook) not working
**Detection:** The app automatically detects in-app browsers

**Solutions:**
1. App shows warning: "Open in your default browser"
2. User can copy link and paste in Chrome/Safari
3. App provides step-by-step instructions

**Affected Browsers:**
- Gmail in-app browser (Android)
- Facebook in-app browser
- Instagram in-app browser
- LinkedIn in-app browser

---

## 6. Security Considerations

### Do NOT Add to Redirect URLs:
- ❌ Untrusted third-party domains
- ❌ Overly broad wildcards like `https://**` (allows ANY domain)
- ❌ HTTP URLs in production (except localhost)

### Best Practices:
- ✅ Use HTTPS for all production URLs
- ✅ Keep redirect list as specific as possible
- ✅ Review redirect URLs periodically
- ✅ Remove old/unused domains
- ✅ Never share your `SUPABASE_SERVICE_ROLE_KEY`

---

## 7. Debugging Tips

### Enable Debug Logging
Open browser DevTools Console to see detailed logs:

```javascript
// Look for these log messages:
🔐 Auth callback triggered
  - Current URL: ...
  - Auth parameters: { hasCode: true, ... }
  
🔑 PKCE flow detected - exchanging code for session
✅ Session created via PKCE code exchange
  - User ID: ...
  - User Email: ...
```

### Check Supabase Dashboard Logs
1. Go to Supabase Dashboard → **Logs** → **Auth**
2. Look for errors related to:
   - Invalid redirect URLs
   - Expired tokens
   - Failed code exchanges

### Network Tab Inspection
1. Open DevTools → **Network** tab
2. Click auth link
3. Look for failed requests to Supabase
4. Check response errors for details

---

## 8. Email Template Configuration

### Confirmation Email Template
In Supabase Dashboard → **Authentication** → **Email Templates** → **Confirm signup**

Ensure the template uses:
```html
<p>Confirm your signup by clicking this link:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
```

**Important:** `{{ .ConfirmationURL }}` is Go template syntax (not JavaScript)

### Password Reset Email Template
In Supabase Dashboard → **Authentication** → **Email Templates** → **Reset password**

Ensure the template uses:
```html
<p>Reset your password by clicking this link:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

The `{{ .ConfirmationURL }}` will automatically redirect to:
```
https://www.topaffaireimmo.com/reset-password?code=...
```

To use `/auth/reset` instead, modify the template to:
```html
<p><a href="{{ .SiteURL }}/auth/reset?code={{ .Token }}">Reset Password</a></p>
```

---

## 9. Advanced Configuration

### Using Custom Email Redirect URLs

If you want to use different redirect URLs per environment:

**Development:**
```bash
VITE_SITE_URL=http://localhost:5173
```

**Staging:**
```bash
VITE_SITE_URL=https://staging.topaffaireimmo.com
```

**Production:**
```bash
VITE_SITE_URL=https://www.topaffaireimmo.com
```

Then add all these URLs to Supabase redirect URLs list.

### Custom Redirect After Success

To redirect users to a specific page after email confirmation:

1. Add query param to signup call:
   ```typescript
   const { error } = await supabase.auth.signUp({
     email,
     password,
     options: {
       emailRedirectTo: `${window.location.origin}/welcome`
     }
   })
   ```

2. Update `/welcome` route to handle the callback
3. Add `/welcome` to Supabase redirect URLs

---

## 10. Support & Resources

### Documentation
- [SUPABASE_AUTH_REDIRECT_URLS.md](./SUPABASE_AUTH_REDIRECT_URLS.md) - Detailed redirect URL configuration
- [AUTH_PWA_TROUBLESHOOTING.md](./AUTH_PWA_TROUBLESHOOTING.md) - PWA-specific auth issues
- [PASSWORD_RESET_TESTING_GUIDE.md](./PASSWORD_RESET_TESTING_GUIDE.md) - Password reset testing

### External Resources
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [URL Configuration Guide](https://supabase.com/docs/guides/auth/redirect-urls)
- [PKCE Flow](https://supabase.com/docs/guides/auth/server-side/pkce-flow)

### Getting Help
If you encounter issues:
1. Check browser console for error messages
2. Review Supabase Dashboard → Logs → Auth
3. Verify environment variables are set correctly
4. Ensure redirect URLs are configured
5. Test in incognito mode to rule out cache issues

---

## Summary Checklist

Before deploying to production, verify:

- [ ] **Supabase Site URL** is set to `https://www.topaffaireimmo.com`
- [ ] **Redirect URLs** include all production URLs (www and non-www)
- [ ] **Redirect URLs** include `/auth/callback`, `/auth/reset`, and `/reset-password`
- [ ] **`.env` file** has `VITE_SITE_URL` matching Supabase Site URL
- [ ] **Email templates** use `{{ .ConfirmationURL }}` correctly
- [ ] **Routes** `/auth/callback` and `/auth/reset` exist and are public
- [ ] **Service Worker** v1.2.0+ does not cache auth routes
- [ ] **Testing** completed for both signup and password reset flows
- [ ] **Error handling** shows user-friendly messages
- [ ] **Logs** are enabled for debugging in production

---

**Last Updated:** February 2026
**Version:** 1.0
