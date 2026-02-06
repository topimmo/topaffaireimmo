# Auth/PWA Fix - Deployment Checklist

## Pre-Deployment (CRITICAL - Must be completed BEFORE deploying)

### 1. Supabase Configuration ⚠️ REQUIRED

Go to [Supabase Dashboard](https://app.supabase.com/) → Your Project → Authentication → URL Configuration

**Set Site URL:**
```
https://www.topaffaireimmo.com
```

**Add ALL these Redirect URLs (copy-paste, one per line):**

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

**Why this is critical:** Without these URLs configured, ALL password reset and email confirmation links will fail with "Lien invalide / Expiré" errors.

### 2. Environment Variables

Verify these are set in your deployment environment (Vercel, etc.):

```bash
VITE_SITE_URL=https://www.topaffaireimmo.com
VITE_PRODUCTION_DOMAIN=https://www.topaffaireimmo.com
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Code Review

- [x] Service Worker v1.2.0 updates committed
- [x] Auth routes bypass SW completely
- [x] Early offline detection added to auth pages
- [x] Error messages improved
- [x] Documentation created
- [x] Tests added (optional but recommended)

## Deployment Steps

### 1. Merge PR

```bash
# Review the PR
git checkout copilot/fix-auth-reset-magic-link-issues
git log --oneline -5

# If approved, merge to main
git checkout main
git merge copilot/fix-auth-reset-magic-link-issues
git push origin main
```

### 2. Monitor Build

- Watch the CI/CD pipeline
- Verify build completes successfully
- Check for any errors in the build logs

### 3. Verify Deployment

Once deployed, immediately check:

**A. Service Worker Updated:**
1. Open https://www.topaffaireimmo.com
2. Open DevTools → Application → Service Workers
3. Verify version shows 1.2.0+ in the code
4. Check status is "activated and running"

**B. Auth Routes Bypass SW:**
1. Open DevTools → Network tab
2. Navigate to `/auth/callback`
3. Verify request shows "Type: document" (not "from Service Worker")
4. Navigate to `/reset-password`
5. Same check - should NOT show service worker intercept

**C. Offline Detection:**
1. Open `/reset-password` or `/auth/callback`
2. Open DevTools → Network → Throttling → Offline
3. Refresh page
4. Should see clear "No internet" message (not generic error)

## Post-Deployment Testing

### Test 1: Password Reset in Browser

1. **Request Reset:**
   - Go to https://www.topaffaireimmo.com/login
   - Click "Forgot password"
   - Enter email address
   - Click "Send reset link"
   - ✅ Verify: "Email sent" message appears

2. **Check Email:**
   - Open email inbox
   - Find password reset email
   - ✅ Verify: Link is `https://www.topaffaireimmo.com/reset-password?code=...`

3. **Click Link:**
   - Click the link from email
   - ✅ Verify: Opens to `/reset-password` page
   - ✅ Verify: Shows password reset form (no errors)
   - ✅ Verify: Console shows "Session established via PKCE"

4. **Reset Password:**
   - Enter new password (min 8 chars)
   - Confirm password
   - Click "Reset Password"
   - ✅ Verify: Success message
   - ✅ Verify: Redirects to login page

5. **Login with New Password:**
   - Enter email and new password
   - Click "Login"
   - ✅ Verify: Successful login

### Test 2: Password Reset in PWA (Android)

1. **Install PWA:**
   - Open https://www.topaffaireimmo.com in Chrome (Android)
   - Click "Add to Home Screen"
   - ✅ Verify: Icon added to home screen

2. **Open PWA:**
   - Tap PWA icon from home screen
   - ✅ Verify: Opens in standalone mode (no browser UI)

3. **Request Reset:**
   - Navigate to Login
   - Click "Forgot password"
   - Enter email
   - ✅ Verify: "Email sent" message

4. **Click Link from Email:**
   - Open Gmail app
   - Find reset email
   - Tap the reset link
   - ✅ **CRITICAL**: Should open in PWA (not external browser)
   - ✅ Verify: Shows password form (NOT "Internet not available")
   - ✅ Verify: Shows password form (NOT blank page)
   - ✅ Verify: Console shows "Session established via PKCE"

5. **Complete Reset:**
   - Enter new password
   - Submit
   - ✅ Verify: Success message
   - ✅ Verify: Can login with new password

### Test 3: Password Reset in PWA (iOS)

1. **Install PWA:**
   - Open https://www.topaffaireimmo.com in Safari (iOS)
   - Tap Share → Add to Home Screen
   - ✅ Verify: Icon added to home screen

2. **Request Reset:**
   - Open PWA from home screen
   - Request password reset
   - ✅ Verify: Email sent

3. **Click Link from Mail:**
   - Open Mail app
   - Find reset email
   - Tap link
   - ✅ **CRITICAL**: May open in Safari (iOS behavior)
   - ✅ Verify: Shows password form (no errors)
   - ✅ Verify: Can complete reset

4. **Alternative (Copy Link):**
   - Long-press link in Mail
   - Copy link
   - Open PWA
   - Paste link in address bar (if available)
   - ✅ Verify: Works correctly

### Test 4: Offline Behavior

1. **Go Offline Before Clicking Link:**
   - Request password reset
   - Enable airplane mode
   - Click reset link from email
   - ✅ Verify: Shows "No internet connection" message
   - ✅ Verify: Does NOT show "Link expired" error
   - ✅ Verify: Clear instructions to connect to internet

2. **Go Online and Retry:**
   - Disable airplane mode
   - Wait for connection
   - Refresh page or click link again
   - ✅ Verify: Now shows password form correctly

### Test 5: Slow Network

1. **Request reset**
2. **Throttle Network:**
   - Open DevTools → Network → Slow 3G
3. **Click reset link**
   - ✅ Verify: Page loads (may be slow)
   - ✅ Verify: Eventually shows password form
   - ✅ Verify: No premature "expired" errors

## Monitoring

### First 24 Hours After Deployment

**Monitor in Sentry/logs:**
- [ ] Auth callback errors
- [ ] Password reset errors
- [ ] Service Worker errors
- [ ] "otp_expired" errors (should decrease significantly)

**Check metrics:**
- [ ] Password reset success rate (should improve)
- [ ] Email confirmation success rate (should improve)
- [ ] PWA auth errors (should decrease to near zero)

### Key Metrics to Track

**Before Fix (Baseline):**
- "Lien invalide / Expiré" errors: ??? per day
- PWA "Internet not available" errors: ??? per day
- Password reset success rate: ???%

**After Fix (Target):**
- "Lien invalide / Expiré" errors: < 5% of requests (only truly expired)
- PWA "Internet not available" errors: 0 (when actually online)
- Password reset success rate: > 95%

## Rollback Plan

### If Critical Issues Arise:

**Option 1: Fix Supabase Config (Preferred)**
- Double-check redirect URLs in Supabase Dashboard
- Ensure Site URL is correct
- This fixes 90% of issues without code changes

**Option 2: Revert Code**
```bash
git revert d0e4d93  # Revert docs commit
git revert fb92347  # Revert Service Worker changes
git push origin main
```

**Option 3: Emergency Hotfix**
- Create new branch from previous working commit
- Deploy emergency fix
- Service Worker will auto-update on next page load

## Success Criteria

Deployment is considered successful when:

- [x] Build completes without errors
- [x] Service Worker v1.2.0 deploys
- [ ] No "Internet not available" errors in PWA when online
- [ ] No premature "Link expired" errors for fresh links
- [ ] Clear offline messages when truly offline
- [ ] Password reset works in browser (3 successful tests)
- [ ] Password reset works in PWA Android (3 successful tests)
- [ ] Password reset works in PWA iOS (3 successful tests)
- [ ] No increase in auth-related errors in Sentry
- [ ] User complaints about auth links decrease

## Common Issues & Solutions

### Issue: Still seeing "Link expired" immediately

**Solution:**
- Check Supabase redirect URLs configuration
- Verify VITE_SITE_URL matches Supabase Site URL
- Clear browser cache and Service Worker
- Request new reset link

### Issue: PWA still shows "Internet not available"

**Solution:**
- Verify Service Worker updated to v1.2.0
- Clear PWA data: Settings → Apps → TopAffaireImmo → Clear Data
- Uninstall and reinstall PWA
- Check browser console for errors

### Issue: Links open in browser instead of PWA

**Solution:**
- This is normal iOS behavior
- User can copy/paste link into PWA
- Future enhancement: Configure Universal Links

## Documentation Links

- **Troubleshooting**: `docs/AUTH_PWA_TROUBLESHOOTING.md`
- **Implementation**: `docs/AUTH_FIX_SUMMARY.md`
- **Supabase Config**: `docs/SUPABASE_AUTH_REDIRECT_URLS.md`
- **Main README**: `README.md` → Auth & PWA Troubleshooting section

## Support Contacts

If issues persist after following this checklist:
1. Check all documentation above
2. Review browser console logs
3. Verify Supabase configuration
4. Contact development team with:
   - Console logs (redact auth tokens)
   - Network tab screenshots
   - Service Worker state
   - Steps to reproduce

---

**Checklist completed by:** _______________  
**Date:** _______________  
**Deployment successful:** [ ] Yes [ ] No  
**Notes:**

