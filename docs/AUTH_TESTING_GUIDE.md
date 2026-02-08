# Testing Guide: Email Confirmation & Password Reset

## Overview
This guide provides step-by-step instructions for testing the email confirmation and password reset flows.

## Prerequisites
- Supabase project configured with redirect URLs (see `SUPABASE_EMAIL_AUTH_SETUP.md`)
- Application deployed or running locally
- Test email account accessible

---

## Test 1: Email Confirmation (Signup Flow)

### Objective
Verify that new users can sign up and confirm their email successfully.

### Steps

#### 1. Sign Up
```
URL: https://www.topaffaireimmo.com/register
OR: http://localhost:5173/register

Email: test+signup@example.com
Password: Test1234!
Full Name: Test User
Phone: +212612345678
Role: Particulier (user)
```

Click "S'inscrire" (Register)

#### 2. Check Email
- Open your email inbox
- Look for email from Supabase (or your configured SMTP)
- Subject should be: "Confirm Your Signup" or similar
- Email should contain a confirmation link

#### 3. Click Confirmation Link
The link should look like:
```
https://www.topaffaireimmo.com/auth/callback?code=xxx...
```

**Expected Behavior:**
1. Browser opens and navigates to `/auth/callback`
2. Shows loading spinner: "Confirmation en cours..."
3. Shows success message: "Email confirmed successfully! Redirecting..."
4. Redirects to home page `/` (for regular users) or `/admin` (for admins)
5. User is logged in automatically

#### 4. Verify Success
- Check browser DevTools Console for logs:
  ```
  🔐 Auth callback triggered
  🔑 PKCE flow detected - exchanging code for session
  ✅ Session created via PKCE code exchange
  ```
- Navigate to `/dashboard` - should work without login
- Check that user appears in Supabase Auth → Users

### Common Issues

**❌ "Email link is invalid or has expired"**
- **Cause:** Redirect URLs not configured in Supabase
- **Fix:** Add `https://www.topaffaireimmo.com/auth/callback` to Supabase redirect URLs
- **Docs:** See `SUPABASE_EMAIL_AUTH_SETUP.md` Section 1

**❌ "No authentication data found"**
- **Cause:** Link opened in incognito/different browser than signup
- **Fix:** Open link in same browser where you signed up

**❌ Blank page or infinite loading**
- **Cause:** JavaScript error or network issue
- **Fix:** Check browser console for errors
- **Debug:** Open DevTools → Console → look for error messages

**❌ "Access denied" or "otp_expired"**
- **Cause:** Link clicked multiple times or expired (links valid for 24 hours)
- **Fix:** Request a new confirmation email from login page

---

## Test 2: Password Reset Flow

### Objective
Verify that users can reset their password using the email link.

### Steps

#### 1. Request Password Reset
```
URL: https://www.topaffaireimmo.com/login
OR: http://localhost:5173/login
```

1. Click "Mot de passe oublié?" (Forgot password?)
2. Enter email: `test@example.com` (use an existing account)
3. Click "Envoyer le lien" (Send link)
4. Should show success message: "Check your email for reset link"

#### 2. Check Email
- Open your email inbox
- Look for password reset email from Supabase
- Subject: "Reset Your Password" or similar
- Email contains a reset link

#### 3. Click Reset Link
The link should look like:
```
https://www.topaffaireimmo.com/reset-password?code=xxx...
OR
https://www.topaffaireimmo.com/auth/reset?code=xxx...
```

**Expected Behavior:**
1. Browser opens and navigates to `/reset-password` or `/auth/reset`
2. Shows loading spinner briefly
3. Shows "Set New Password" form

#### 4. Enter New Password
```
New Password: NewTest1234!
Confirm Password: NewTest1234!
```

Click "Changer le mot de passe" (Change password)

**Expected Behavior:**
1. Shows success message: "Password changed successfully!"
2. Redirects to `/login` after 2 seconds
3. User is logged out (for security)

#### 5. Verify New Password Works
1. At login page, enter:
   ```
   Email: test@example.com
   Password: NewTest1234!
   ```
2. Click "Se connecter" (Login)
3. Should successfully log in and redirect to dashboard

### Common Issues

**❌ "Reset link has expired"**
- **Cause:** Link is older than 1 hour
- **Fix:** Request a new reset link
- **Note:** Reset links expire quickly for security

**❌ "Invalid link"**
- **Cause:** Redirect URLs not configured
- **Fix:** Add `/reset-password` and `/auth/reset` to Supabase redirect URLs
- **Docs:** See `SUPABASE_EMAIL_AUTH_SETUP.md` Section 1

**❌ "Session has expired" when setting password**
- **Cause:** Link was clicked multiple times
- **Fix:** Request a new reset link (each link is single-use)

**❌ Link opens but shows "Invalid session"**
- **Cause:** In-app browser (Gmail, Facebook) stripping URL parameters
- **Fix:** App shows warning to open in default browser
- **Action:** Copy link and paste in Chrome/Safari

**❌ Password update fails silently**
- **Cause:** Network issue or password validation failed
- **Check:** Browser console for error messages
- **Verify:** Password meets requirements (8+ chars, letters + numbers)

---

## Test 3: In-App Browser Detection

### Objective
Verify that the app detects in-app browsers and shows appropriate warnings.

### Steps

#### 1. Open Email in Gmail App (Android/iOS)
1. Request a password reset
2. Open Gmail app
3. Find the reset email
4. Click the reset link **within Gmail app** (don't open in browser)

**Expected Behavior:**
1. Link opens in Gmail in-app browser
2. App detects in-app browser
3. Shows warning screen:
   ```
   ⚠️ Detected in Gmail App
   
   Password reset links may not work correctly in this browser.
   Please open the link in your default browser.
   
   Steps:
   1. Tap the three dots (⋮) in the top right
   2. Select "Open in Chrome" or "Open in Safari"
   3. The link will open in your default browser
   ```
4. Shows "Copy Link" button
5. User can copy link and paste in external browser

#### 2. Test Copy Link Functionality
1. Click "Copy Link" button
2. Should show toast: "Lien copié" (Link copied)
3. Open Chrome/Safari
4. Paste link in address bar
5. Should work correctly now

### Supported In-App Browser Detection
- ✅ Gmail app (Android/iOS)
- ✅ Facebook app
- ✅ Instagram app
- ✅ LinkedIn app
- ✅ Twitter/X app

---

## Test 4: Multiple Device/Browser Testing

### Objective
Verify that auth links work across different devices and browsers.

### Test Matrix

| Device Type | Browser | Expected Result |
|------------|---------|-----------------|
| Desktop | Chrome | ✅ Works |
| Desktop | Firefox | ✅ Works |
| Desktop | Safari | ✅ Works |
| Desktop | Edge | ✅ Works |
| Mobile (Android) | Chrome | ✅ Works |
| Mobile (Android) | Firefox | ✅ Works |
| Mobile (Android) | Gmail App | ⚠️ Warning shown, copy link |
| Mobile (iOS) | Safari | ✅ Works |
| Mobile (iOS) | Chrome | ✅ Works |
| Mobile (iOS) | Mail App | ⚠️ Warning shown, copy link |
| Tablet | Chrome | ✅ Works |
| Tablet | Safari | ✅ Works |

### How to Test Cross-Device
1. Sign up on Device A (e.g., Desktop Chrome)
2. Check email on Device B (e.g., Mobile Safari)
3. Click confirmation link on Device B
4. Should work - session is created on Device B
5. Both devices now logged in (if using same browser)

**Note:** Sessions are stored in localStorage, so:
- Same browser on same device = session persists
- Different browser/device = separate sessions
- Logging out on one device doesn't affect others

---

## Test 5: Error Recovery Flow

### Objective
Verify that users can recover from common error scenarios.

### Scenario 1: Expired Link
1. Request password reset
2. Wait >1 hour
3. Click reset link
4. Should show: "Reset link has expired"
5. Should show button: "Demander un nouveau lien" (Request new link)
6. Clicking button redirects to `/login`
7. User can request new link from forgot password flow

### Scenario 2: Link Clicked Twice
1. Request password reset
2. Click reset link → works
3. Set new password → success
4. Click same link again
5. Should show: "Link has already been used"
6. Should redirect to `/login`
7. User can log in with new password

### Scenario 3: Network Failure
1. Disconnect internet
2. Click email confirmation link
3. Should show: "No internet connection. Please connect to continue."
4. Reconnect internet
5. Refresh page
6. Should work normally

### Scenario 4: Wrong Email Provider
1. Sign up with test@example.com
2. Check inbox for different email (test2@example.com)
3. No email received
4. Check correct inbox
5. Email should be there

---

## Test 6: Security Checks

### Objective
Ensure security best practices are followed.

### Check 1: Link Expiration
1. Request password reset
2. Wait >1 hour
3. Link should be expired
4. ✅ Prevents stale links from being exploited

### Check 2: Single-Use Links
1. Request password reset
2. Use link to change password
3. Try using same link again
4. ✅ Link should be invalid (already used)

### Check 3: Session Cleanup After Password Change
1. Reset password
2. After success, check browser
3. ✅ User should be logged out
4. ✅ Must log in with new password

### Check 4: HTTPS Only (Production)
1. Check all email links
2. ✅ Should start with `https://`
3. ❌ Should NOT be `http://` in production

### Check 5: No Sensitive Data in URL
1. Inspect email links
2. ✅ Should contain only `code=xxx` or `token=xxx`
3. ❌ Should NOT contain passwords, user IDs, or other sensitive data

---

## Debugging Checklist

When auth links don't work, check these in order:

### 1. Supabase Configuration
- [ ] Site URL matches your domain
- [ ] Redirect URLs include `/auth/callback`
- [ ] Redirect URLs include `/reset-password` and `/auth/reset`
- [ ] Both `www` and non-`www` variants included

### 2. Environment Variables
- [ ] `VITE_SITE_URL` is set correctly
- [ ] `VITE_PRODUCTION_DOMAIN` matches Supabase Site URL
- [ ] `VITE_SUPABASE_URL` is correct
- [ ] `VITE_SUPABASE_ANON_KEY` is correct

### 3. Browser Console
- [ ] No JavaScript errors
- [ ] Network requests succeed (check Network tab)
- [ ] Auth logs show expected flow
- [ ] No CORS errors

### 4. Email Template
- [ ] Uses `{{ .ConfirmationURL }}` syntax
- [ ] Link points to correct domain
- [ ] Link includes `?code=` or `?token=` parameter

### 5. Network
- [ ] Internet connection is stable
- [ ] No VPN blocking requests
- [ ] Firewall allows Supabase domain

---

## Automated Testing (Optional)

### E2E Tests with Playwright (Future)
```typescript
test('email confirmation flow', async ({ page }) => {
  // Sign up
  await page.goto('/register');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'Test1234!');
  await page.click('button[type="submit"]');
  
  // Get confirmation link from email (requires email API)
  const confirmationLink = await getEmailConfirmationLink('test@example.com');
  
  // Click confirmation link
  await page.goto(confirmationLink);
  
  // Verify success
  await expect(page).toHaveURL('/');
  await expect(page.locator('text=Email confirmed')).toBeVisible();
});
```

---

## Success Criteria

All tests pass when:
- ✅ Email confirmation works on desktop and mobile
- ✅ Password reset works on desktop and mobile
- ✅ In-app browser warnings appear correctly
- ✅ Error messages are user-friendly and actionable
- ✅ Links expire after expected time
- ✅ Links are single-use only
- ✅ Security best practices followed
- ✅ Works in all major browsers
- ✅ Works with and without `www` subdomain

---

## Quick Test Script

For rapid testing during development:

```bash
# 1. Start local dev server
npm run dev

# 2. Sign up with test email
# URL: http://localhost:5173/register
# Email: test+$(date +%s)@example.com  # Unique email
# Password: Test1234!

# 3. Check Supabase Dashboard → Auth → Users
# Verify user exists with unconfirmed email

# 4. Get confirmation link from Supabase Dashboard → Auth → Users
# Click on user → Copy confirmation URL

# 5. Open link in browser
# Should redirect to http://localhost:5173/auth/callback?code=...

# 6. Verify success
# Should show "Email confirmed successfully!"
# Should redirect to home page

# 7. Test password reset
# URL: http://localhost:5173/login
# Click "Forgot password"
# Enter test email
# Get reset link from Supabase Dashboard
# Open link → Set new password
# Verify can login with new password
```

---

**Last Updated:** February 2026
**Version:** 1.0
