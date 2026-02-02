# Supabase Email Auth Flows - Testing Guide

This document provides instructions for testing the Supabase authentication flows implemented in this PR.

## Overview

This implementation ensures that Supabase email authentication flows work end-to-end on both localhost and production (`https://www.topaffaireimmo.com`).

## Prerequisites

### Environment Variables
Ensure the following environment variables are set in your `.env` file:
```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SITE_URL=https://www.topaffaireimmo.com  # Or http://localhost:5173 for local
```

### Supabase Dashboard Configuration

#### 1. URL Configuration
Go to: **Supabase Dashboard → Authentication → URL Configuration**

**Site URL:**
```
https://www.topaffaireimmo.com
```

**Redirect URLs (add all):**
```
https://www.topaffaireimmo.com/**
https://www.topaffaireimmo.com/reset-password
https://www.topaffaireimmo.com/auth/callback
http://localhost:5173/**
http://localhost:5173/reset-password
http://localhost:5173/auth/callback
```

#### 2. Email Templates
Ensure the password reset email template is configured correctly. The default template should work, as it uses Supabase's standard token parameters.

## Testing Scenarios

### 1. Password Reset Flow (Primary Flow)

#### Steps:
1. **Navigate to Login Page**
   - Go to `/login`
   - Click "Forgot Password" link

2. **Request Password Reset**
   - Enter your email address
   - Click "Send Reset Link"
   - Verify success message appears
   - Check browser console for log: `🔐 Password reset requested`
   - Verify redirect URL in console: `Redirect URL: https://www.topaffaireimmo.com/reset-password`

3. **Check Email**
   - Open your email inbox
   - Find the password reset email from Supabase
   - Click the reset password link

4. **Reset Password Page**
   - Should land on `/reset-password`
   - Check browser console for logs:
     - `🔐 Reset password page loaded`
     - Either `🔑 PKCE flow detected` or `🔑 Hash-based recovery flow detected`
     - `✅ Session established`
   - Page should show password reset form (not error message)
   - Page should show loading spinner initially, then form

5. **Set New Password**
   - Enter new password (minimum 6 characters)
   - Enter same password in "Confirm Password" field
   - Click "Change Password" button
   - Should see success message
   - Check console for: `✅ Password updated successfully`
   - Should redirect to home page (`/`) after 2 seconds

6. **Verify New Password Works**
   - Go to `/login`
   - Log in with email and new password
   - Should successfully log in

#### Expected Results:
- ✅ Password reset email received
- ✅ Link redirects to `/reset-password` (NOT `/auth/callback`)
- ✅ Session established automatically
- ✅ Form displayed (not error)
- ✅ Password update succeeds
- ✅ Can log in with new password
- ✅ URL is clean (no tokens visible after session establishment)

### 2. Magic Link Login Flow

#### Steps:
1. **Request Magic Link**
   - If your app supports magic link login, request one
   - Check email for magic link

2. **Click Magic Link**
   - Should redirect to `/auth/callback`
   - Check console for:
     - `🔐 Auth callback triggered`
     - Either `🔑 PKCE flow detected` or `✅ Access token found`
     - `✅ Session created`
   - Should redirect to home or dashboard based on user role

#### Expected Results:
- ✅ Magic link email received
- ✅ Link redirects to `/auth/callback`
- ✅ Session established
- ✅ Redirected to appropriate page (home or admin dashboard)

### 3. Email Confirmation (Sign Up)

#### Steps:
1. **Register New Account**
   - Go to `/register`
   - Fill in registration form
   - Submit

2. **Check Email**
   - Open confirmation email
   - Click confirmation link

3. **Verify Confirmation**
   - Should redirect to `/auth/callback`
   - Check console for:
     - `✅ Email confirmation type: signup`
     - `✅ Session created successfully`
   - Should redirect to home or admin dashboard

#### Expected Results:
- ✅ Confirmation email received
- ✅ Link redirects to `/auth/callback`
- ✅ Account confirmed
- ✅ User logged in automatically

### 4. OAuth Flows (Google, GitHub, etc.)

If OAuth providers are configured:

#### Steps:
1. Click OAuth provider button on login page
2. Complete OAuth flow on provider's site
3. Should redirect back to `/auth/callback`
4. Should establish session and redirect to home

#### Expected Results:
- ✅ OAuth flow completes
- ✅ Redirects to `/auth/callback`
- ✅ Session established
- ✅ Redirected to appropriate page

## Debugging

### Console Logs

The implementation includes comprehensive logging. Check the browser console for:

**Password Reset Flow:**
```
🔐 Reset password page loaded
  - Current URL: [full URL]
  - Auth parameters: { hasCode: true/false, hasAccessToken: true/false, ... }
🔑 PKCE flow detected - exchanging code for session
✅ Session established via PKCE code exchange
  - User ID: [uuid]
  - User Email: [email]
🔐 Updating user password
✅ Password updated successfully
```

**Auth Callback Flow:**
```
🔐 Auth callback triggered
  - Current URL: [full URL]
  - Auth parameters: { hasCode: true/false, ... }
🔑 PKCE flow detected - exchanging code for session
✅ Session created via PKCE code exchange
  - User ID: [uuid]
  - User Email: [email]
🔍 Checking admin status for user: [uuid]
  - Redirect destination: /admin or /
```

### Common Issues

#### Issue: "Invalid Link" Error on Reset Password
**Possible Causes:**
- Link expired (Supabase tokens expire after 1 hour)
- Redirect URL not whitelisted in Supabase Dashboard
- PKCE code already used

**Solutions:**
- Request a new password reset email
- Verify Supabase redirect URLs are configured correctly
- Check Supabase dashboard → Authentication → URL Configuration

#### Issue: Session Not Established
**Possible Causes:**
- Missing environment variables
- Incorrect Supabase configuration
- CORS issues

**Solutions:**
- Verify `.env` file has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check browser console for specific error messages
- Verify Supabase project is active

#### Issue: Redirect Goes to Wrong Page
**Possible Causes:**
- Cached redirect URL in Supabase
- Browser cache

**Solutions:**
- Clear browser cache and cookies
- Try in incognito/private browsing mode
- Verify email template in Supabase uses correct URL

## Implementation Details

### Files Changed

1. **`src/lib/utils.ts`**
   - Added `parseHashParams()`: Extracts tokens from URL hash
   - Added `clearUrlHash()`: Cleans URL after session establishment

2. **`src/pages/Login.tsx`**
   - Updated forgot password redirect from `/auth/callback` to `/reset-password`

3. **`src/pages/ResetPassword.tsx`**
   - Complete rewrite to handle both PKCE and hash-based flows
   - Establishes session before showing form
   - Handles errors gracefully
   - Supports both French and Arabic languages

### Authentication Flows Supported

#### PKCE Flow (Modern, Recommended)
```
User clicks email link with ?code=...
  ↓
Page calls exchangeCodeForSession(code)
  ↓
Supabase returns session
  ↓
Page displays form / redirects
```

#### Hash Token Flow (Legacy)
```
User clicks email link with #access_token=...&refresh_token=...
  ↓
Page calls setSession({ access_token, refresh_token })
  ↓
Supabase establishes session
  ↓
Page displays form / redirects
```

#### Auto-Detection Flow
```
User clicks email link
  ↓
Supabase's detectSessionInUrl automatically processes tokens
  ↓
Page checks for existing session
  ↓
Page displays form / redirects
```

## Security Considerations

✅ **No secrets in code**: All credentials in environment variables  
✅ **PKCE flow**: Modern, secure OAuth flow  
✅ **Session validation**: Always verifies session before allowing password update  
✅ **Error handling**: Graceful error messages without exposing sensitive info  
✅ **URL cleaning**: Removes tokens from URL after use  
✅ **CodeQL scan**: No security vulnerabilities detected  

## Production Checklist

Before deploying to production:

- [ ] Set `VITE_SITE_URL=https://www.topaffaireimmo.com` in production environment
- [ ] Configure Supabase redirect URLs to include production domain
- [ ] Test password reset flow end-to-end in production
- [ ] Verify email templates use correct production URLs
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices
- [ ] Verify HTTPS is enforced
- [ ] Check that old password reset links are invalidated after use

## Support

If you encounter issues:

1. Check browser console for error messages
2. Verify Supabase configuration
3. Check Supabase dashboard logs (Authentication → Logs)
4. Ensure environment variables are set correctly
5. Try in incognito mode to rule out cache issues

## Related Documentation

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [PKCE Flow Explained](https://oauth.net/2/pkce/)
