# Password Reset Flow - Manual Testing Guide

## Overview
This guide provides step-by-step instructions for testing the Supabase password reset flow to ensure it works correctly in all scenarios.

## Prerequisites

### 1. Supabase Dashboard Configuration
Before testing, verify the following in your Supabase Dashboard:

#### Navigate to: Authentication → URL Configuration

**Site URL:**
```
https://topaffaireimmo.com
```
or
```
https://www.topaffaireimmo.com
```

**Redirect URLs (must include ALL of these):**

For Production:
```
https://topaffaireimmo.com/**
https://www.topaffaireimmo.com/**
https://topaffaireimmo.com/reset-password
https://www.topaffaireimmo.com/reset-password
https://topaffaireimmo.com/auth/callback
https://www.topaffaireimmo.com/auth/callback
```

For Development:
```
http://localhost:5173/**
http://localhost:5173/reset-password
http://localhost:5173/auth/callback
http://127.0.0.1:5173/**
```

For Vercel Previews (if applicable):
```
https://*.vercel.app/**
```

### 2. Environment Variables
Verify your `.env` file contains:
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SITE_URL=https://www.topaffaireimmo.com
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com
```

### 3. Email Configuration
Ensure SMTP is configured in Supabase Dashboard → Settings → Auth → SMTP Settings

## Test Scenarios

### Test 1: Happy Path - Successful Password Reset
**Objective:** Verify the complete password reset flow works correctly.

**Steps:**
1. Navigate to `/login` page
2. Click "Mot de passe oublié?" (Forgot password?) link
3. Enter a valid email address (use a real email you can access)
4. Click submit
5. Verify you see success message: "Email envoyé" or similar
6. Open your email inbox
7. **IMPORTANT:** Click the reset link within 1 minute of receiving it
8. Verify you are redirected to `/reset-password` page
9. Verify you see the password reset form (not an error message)
10. Enter a new password (minimum 6 characters)
11. Enter the same password in the confirm field
12. Click "Changer le mot de passe" (Change password)
13. Verify you see success message
14. Verify you are redirected to home page after 2 seconds
15. Navigate to `/login`
16. Login with your email and the NEW password
17. Verify login is successful

**Expected Results:**
- ✅ Reset email received within 1 minute
- ✅ Link redirects to `/reset-password` without errors
- ✅ Form displays correctly
- ✅ Password update succeeds
- ✅ Can login with new password
- ✅ Console shows successful authentication logs

**Browser Console Logs to Look For:**
```
🔐 Reset password page loaded
  - Current URL: https://yoursite.com/reset-password?code=...
  - Auth parameters: { hasCode: true, ... }
🔑 PKCE flow detected - exchanging code for session
✅ Session established via PKCE code exchange
  - User ID: ...
  - User Email: ...
🔐 Updating user password
✅ Password updated successfully
```

---

### Test 2: Link Already Used
**Objective:** Verify proper error handling when reset link is used twice.

**Steps:**
1. Complete Test 1 successfully
2. Go back to your email
3. Click the SAME reset link again
4. Verify you see an error message

**Expected Results:**
- ✅ Error message displayed: "Le lien a peut-être déjà été utilisé ou a expiré"
- ✅ Clear call-to-action to request a new link
- ✅ No session created (validSession = false)

**Browser Console Logs to Look For:**
```
❌ Error in reset password URL:
  - Error: access_denied (or similar)
  - Error Code: ...
  - Description: ...
```

---

### Test 3: Expired Link
**Objective:** Verify proper error handling when link has expired.

**Steps:**
1. Request a password reset from `/login`
2. Wait for the link to expire (Supabase default: 1 hour, configurable in Dashboard)
3. Click the reset link
4. Verify you see an error message

**Expected Results:**
- ✅ Error message displayed: "Le lien de réinitialisation du mot de passe a expiré"
- ✅ Clear call-to-action to request a new link
- ✅ No session created

**Browser Console Logs to Look For:**
```
❌ Error in reset password URL:
  - Error: otp_expired
  - Error Code: otp_expired
```

---

### Test 4: Invalid/Malformed Link
**Objective:** Verify error handling for tampered or invalid links.

**Steps:**
1. Manually create an invalid URL: `https://yoursite.com/reset-password?code=invalid123`
2. Navigate to this URL
3. Verify you see an error message

**Expected Results:**
- ✅ Error message displayed
- ✅ No crash or blank page
- ✅ User can navigate back to login

---

### Test 5: Password Validation
**Objective:** Verify client-side password validation works correctly.

**Steps:**
1. Follow Test 1 steps 1-9 to get to the password reset form
2. Try these scenarios:
   - Enter password with only 4 characters → Should show error
   - Enter password and different confirm password → Should show error
   - Enter valid matching passwords → Should succeed

**Expected Results:**
- ✅ Too-short password rejected
- ✅ Mismatched passwords rejected
- ✅ Valid passwords accepted

---

### Test 6: Session Timeout During Password Reset
**Objective:** Verify proper error handling if session expires while on reset page.

**Steps:**
1. Follow Test 1 steps 1-9 to get to the password reset form
2. Wait for session to timeout (Supabase default: 1 hour, check your Dashboard settings)
   - Note: For faster testing, you can manually clear the session from localStorage
3. Try to submit the new password
4. Verify you see an appropriate error message

**Expected Results:**
- ✅ Error message about expired session
- ✅ Guidance to request a new reset link

---

### Test 7: Direct Navigation Without Token
**Objective:** Verify page handles direct navigation correctly.

**Steps:**
1. Navigate directly to `/reset-password` (no URL parameters)
2. Verify you see an invalid link error

**Expected Results:**
- ✅ "Lien invalide" message displayed
- ✅ Link to return to login page
- ✅ No crash or infinite loading

---

### Test 8: Multiple Environments
**Objective:** Verify the flow works in different environments.

**Environments to Test:**
1. Local development (localhost:5173)
2. Production (topaffaireimmo.com)
3. Vercel preview deployment (if applicable)

**For Each Environment:**
1. Run Test 1 (Happy Path)
2. Verify redirect URLs are configured for that environment
3. Verify emails contain correct redirect URLs

---

## Common Issues and Solutions

### Issue: "otp_expired" error immediately after clicking link
**Possible Causes:**
1. Redirect URL not configured in Supabase Dashboard
2. Mismatch between Site URL and actual domain
3. Using HTTP instead of HTTPS in production

**Solutions:**
1. Verify ALL redirect URLs are added to Supabase Dashboard
2. Ensure Site URL matches your production domain exactly
3. Check browser console for specific error details

---

### Issue: Email not received
**Possible Causes:**
1. SMTP not configured in Supabase
2. Email in spam folder
3. Invalid email address

**Solutions:**
1. Check Supabase Dashboard → Settings → Auth → SMTP Settings
2. Check spam/junk folder
3. Try different email address

---

### Issue: Redirect to wrong URL
**Possible Causes:**
1. VITE_SITE_URL not set correctly
2. getSiteUrl() returning wrong value
3. Email template using wrong variable

**Solutions:**
1. Check .env file for correct VITE_SITE_URL
2. Check browser console for "Redirect URL" log
3. Verify email template uses {{ .ConfirmationURL }}

---

## Debugging Checklist

When testing fails, check these in order:

1. **Browser Console**
   - Look for 🔐, ✅, and ❌ prefixed log messages
   - Check for full error objects logged as JSON
   - Verify URL parameters are detected correctly

2. **Supabase Dashboard**
   - Go to Authentication → Logs
   - Check for auth errors
   - Verify redirect URL configuration

3. **Network Tab**
   - Check API calls to Supabase
   - Look for 400/401/403 errors
   - Verify request/response bodies

4. **Email Content**
   - Verify the link contains correct domain
   - Check for `code=` parameter (PKCE) or hash tokens
   - Ensure link goes to /reset-password

---

## Test Results Template

Use this template to document test results:

```
Date: ___________
Tester: ___________
Environment: [ ] Local [ ] Production [ ] Preview

Test 1 - Happy Path:           [ ] Pass [ ] Fail
Test 2 - Link Already Used:    [ ] Pass [ ] Fail
Test 3 - Expired Link:         [ ] Pass [ ] Fail
Test 4 - Invalid Link:         [ ] Pass [ ] Fail
Test 5 - Password Validation:  [ ] Pass [ ] Fail
Test 6 - Session Timeout:      [ ] Pass [ ] Fail
Test 7 - Direct Navigation:    [ ] Pass [ ] Fail
Test 8 - Multiple Environments:[ ] Pass [ ] Fail

Notes:
___________________________________________
___________________________________________
___________________________________________
```

---

## Automated Testing Considerations

While this is a manual testing guide, consider automating these tests in the future:

1. **E2E Tests with Playwright/Cypress:**
   - Test the complete flow from login to password reset
   - Mock email service for automated testing
   - Test different error scenarios

2. **Unit Tests:**
   - Test URL parameter parsing
   - Test error message generation
   - Test form validation

3. **Integration Tests:**
   - Test Supabase API interactions
   - Test session establishment
   - Test token exchange

---

## Support

If you encounter issues not covered in this guide:

1. Check the browser console for detailed error logs
2. Review `/docs/SUPABASE_AUTH_REDIRECT_URLS.md`
3. Check Supabase Dashboard → Authentication → Logs
4. Review the password reset page code comments in `src/pages/ResetPassword.tsx`
