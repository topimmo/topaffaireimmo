# Manual Testing Checklist - Auth Refresh Token Fix

## Overview
This document provides a step-by-step manual testing guide to verify that the auth refresh token crash fix is working correctly in both development and production environments.

## Pre-Testing Setup

### 1. Environment Setup
```bash
# Ensure you have the latest code
git pull origin main

# Install dependencies
npm install

# Verify the fix is in place
npm run verify:auth-fix
# Expected: All 26 checks pass ✅
```

### 2. Setup Storage Buckets
```bash
# Get guidance on creating storage buckets
npm run setup:storage-buckets

# Follow one of the options to create:
# - property-images
# - banner-images  
# - payment-receipts
# - agency-logos
```

### 3. Start Development Server
```bash
npm run dev
# App should start on http://localhost:5173
```

## Test Scenarios

### ✅ Test 1: Normal Auth Flow (Baseline)

**Purpose**: Verify normal authentication still works

**Steps**:
1. Open `http://localhost:5173`
2. Click "Login" in header
3. Enter valid credentials
4. Submit login form

**Expected Results**:
- ✅ Login succeeds
- ✅ Redirected to dashboard or intended page
- ✅ Console shows: `[AuthContext] Profile loaded successfully`
- ✅ User data appears in dashboard
- ✅ No errors in console

---

### ✅ Test 2: Public Pages Without Auth

**Purpose**: Verify public pages work without authentication

**Steps**:
1. Open browser in **incognito/private mode**
2. Clear localStorage: `localStorage.clear()`
3. Navigate to each public page:
   - Homepage: `http://localhost:5173/`
   - Search: `http://localhost:5173/search`
   - About: `http://localhost:5173/about`
   - Contact: `http://localhost:5173/contact`

**Expected Results**:
- ✅ All pages load successfully
- ✅ No "Something went wrong" error
- ✅ Login/Register buttons visible
- ✅ Can browse listings without login
- ✅ Console shows no auth errors

---

### ✅ Test 3: Protected Routes Redirect

**Purpose**: Verify route guards redirect unauthenticated users

**Steps**:
1. **While logged out**, try accessing:
   - Dashboard: `http://localhost:5173/dashboard`
   - Add listing: `http://localhost:5173/add-listing`
   - Admin: `http://localhost:5173/admin`

**Expected Results**:
- ✅ Redirects to `/login?next=<original-path>`
- ✅ No crash or "Something went wrong"
- ✅ After login, redirects back to intended page

---

### 🔥 Test 4: Invalid Refresh Token (CRITICAL)

**Purpose**: Simulate production crash scenario - invalid/expired refresh token

**Method A: Using Reproduction Script** (Recommended)

**Steps**:
1. Log in to app first (to get a valid token)
2. Navigate to: `http://localhost:5173/reproduce-auth-crash.html`
3. Click "Check Current Auth State"
   - Should show your current token info
4. Click "Corrupt Refresh Token" (red button)
   - Should show confirmation
5. Click "Reload Page"

**Expected Results**:
- ✅ App loads successfully (no crash!)
- ✅ Homepage is accessible
- ✅ User is logged out
- ✅ Console shows:
  ```
  [GlobalErrorHandlers] Auth token is valid...
  [AuthContext] Session error: { code: ..., message: "Invalid Refresh Token..." }
  [AuthContext] Refresh token invalid - clearing auth state
  [AuthContext] Auth storage cleared
  ```
- ✅ **NO "Something went wrong" page**
- ✅ Can access public pages
- ✅ Protected pages redirect to `/login`

**Method B: Manual Console Script**

**Steps**:
1. Log in to app
2. Open browser console (F12)
3. Run this script:
   ```javascript
   // Check current auth
   console.log('Current auth:', localStorage.getItem('topaffaireimmo-auth-token'));
   
   // Corrupt the refresh token
   const authData = JSON.parse(localStorage.getItem('topaffaireimmo-auth-token'));
   authData.refresh_token = 'invalid_token_' + Math.random();
   localStorage.setItem('topaffaireimmo-auth-token', JSON.stringify(authData));
   console.log('Token corrupted, reloading...');
   
   // Reload page
   location.reload();
   ```

**Expected Results**: Same as Method A above

---

### ✅ Test 5: Expired Token on Startup

**Purpose**: Verify stale token detection clears expired tokens

**Steps**:
1. Log in to app
2. Open browser console
3. Manually set an expired token:
   ```javascript
   const authData = JSON.parse(localStorage.getItem('topaffaireimmo-auth-token'));
   authData.expires_at = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
   localStorage.setItem('topaffaireimmo-auth-token', JSON.stringify(authData));
   location.reload();
   ```

**Expected Results**:
- ✅ Console shows: `[GlobalErrorHandlers] Auth token is expired, clearing storage`
- ✅ Token automatically cleared
- ✅ App loads normally
- ✅ User treated as logged out

---

### ✅ Test 6: Logout Flow

**Purpose**: Verify clean logout clears all auth state

**Steps**:
1. Log in to app
2. Click "Logout" button
3. Check console and localStorage

**Expected Results**:
- ✅ User logged out successfully
- ✅ Redirected to homepage
- ✅ Console shows: `[AuthContext] Auth storage cleared`
- ✅ localStorage key `topaffaireimmo-auth-token` removed
- ✅ Can still access public pages
- ✅ Protected pages redirect to login

---

### ✅ Test 7: Storage Bucket Warnings

**Purpose**: Verify missing bucket warnings don't crash app

**Steps**:
1. Open app with dev server running
2. Check browser console for storage-related messages
3. Try uploading an image (if applicable)

**Expected Results**:
- ⚠️ If buckets missing: Console shows warnings
- ✅ Warnings have `[Storage]` prefix
- ✅ Warnings mention migration `065_verify_storage_buckets.sql`
- ✅ App continues to work (non-blocking)
- ✅ Upload may fail but doesn't crash app
- ✅ User sees friendly error message (not technical crash)

---

### ✅ Test 8: Build and Production Mode

**Purpose**: Verify build succeeds and production mode works

**Steps**:
```bash
# Build for production
npm run build

# Expected output:
# - Sitemaps generated
# - OG images generated  
# - Vite build completes
# - dist/ folder created

# Preview production build
npm run preview

# Open: http://localhost:4173
# Repeat Tests 1-7 in production mode
```

**Expected Results**:
- ✅ Build completes without errors
- ✅ No new TypeScript errors introduced
- ✅ Production bundle includes global error handlers
- ✅ All tests pass in production mode

---

## Production Testing (After Deployment)

### Post-Deployment Checklist

#### 1. Verify Deployment Metadata
1. Open production site
2. Open browser console
3. Look for deployment info:
   ```
   🚀 Application Deployment Info
   Build Timestamp: 2024-02-12T...
   Deployment Version: abc1234
   ```

**Expected**:
- ✅ Build timestamp is recent
- ✅ Version matches latest commit

#### 2. Cache Headers Verification
1. Open DevTools → Network tab
2. Load page
3. Find `index.html` request
4. Check Response Headers

**Expected**:
- ✅ `Cache-Control: no-cache, no-store, must-revalidate`
- ✅ JS/CSS files: `Cache-Control: public, max-age=31536000, immutable`

#### 3. Repeat Critical Tests in Production

Run Tests 2, 3, 4, and 6 in production:
- Test 2: Public pages without auth
- Test 3: Protected routes redirect
- Test 4: Invalid refresh token (CRITICAL)
- Test 6: Logout flow

Use reproduction script in production:
```
https://www.topaffaireimmo.com/reproduce-auth-crash.html
```

---

## Console Monitoring

### Normal Operation Logs

```javascript
// App startup
✅ [GlobalErrorHandlers] Setting up global error handlers
✅ [GlobalErrorHandlers] Global error handlers ready
✅ [GlobalErrorHandlers] Auth token is valid, expires at: 2024-...

// Auth initialization
✅ [AuthContext] Initializing authentication
✅ [AuthContext] getSession result: { hasSession: true }
✅ [AuthContext] Profile loaded successfully
```

### Expected Warnings (Non-Critical)

```javascript
// Storage buckets (if not created yet)
⚠️ [Storage] ⚠️ Bucket 'property-images' not found in Supabase Storage
⚠️ [Storage] Expected buckets: property-images, banner-images, payment-receipts, agency-logos
⚠️ [Storage] To fix: Run migration supabase/migrations/065_verify_storage_buckets.sql
⚠️ [Storage] Upload will be attempted anyway - it may fail if bucket does not exist
```

### Expected on Refresh Token Failure

```javascript
// Handled gracefully
❌ [AuthContext] Session error: { code: '...', message: 'Invalid Refresh Token: Refresh Token Not Found', path: '/' }
⚠️ [AuthContext] Refresh token invalid - clearing auth state
✅ [AuthContext] Auth storage cleared

// Or via global handler
❌ [GlobalErrorHandlers] Unhandled auth promise rejection: { message: '...', isAuthError: true }
⚠️ [GlobalErrorHandlers] Auth storage cleared due to unhandled auth error
```

### 🚨 Error Indicators (Problems!)

**If you see these, the fix is NOT working**:

```javascript
❌ "Something went wrong" page appears
❌ Uncaught (in promise) AuthApiError: Invalid Refresh Token
❌ ErrorBoundary caught an error (for auth errors)
❌ App is completely unresponsive
❌ Refresh loop (continuous reloading)
```

---

## Troubleshooting

### Issue: Still seeing "Something went wrong"

**Possible Causes**:
1. Old cached JavaScript bundle
2. Global error handlers not initialized
3. Different error source (not auth)

**Fix**:
```javascript
// Hard refresh
// Windows/Linux: Ctrl+Shift+R
// Mac: Cmd+Shift+R

// Or clear cache
localStorage.clear();
sessionStorage.clear();
location.reload(true);
```

### Issue: Infinite redirect loop

**Cause**: Auth state not clearing properly

**Fix**:
```javascript
// In console
localStorage.clear();
sessionStorage.clear();
location.href = '/';
```

### Issue: Can't reproduce crash

**Good News**: The fix is working!

**Verify**:
1. Check `npm run verify:auth-fix` passes
2. Verify global error handlers in main.tsx
3. Check console for `[GlobalErrorHandlers]` logs

---

## Success Criteria

✅ **Fix is successful if**:

### Critical Requirements
- ✅ No "Something went wrong" on refresh token failure
- ✅ App treats user as logged out gracefully
- ✅ Homepage accessible without auth
- ✅ Protected routes redirect to login
- ✅ All 26 automated checks pass

### User Experience
- ✅ Smooth experience for logged-out users
- ✅ Clear error messages (no crashes)
- ✅ Can recover by logging in again
- ✅ No data loss

### Technical Requirements
- ✅ Console logs helpful, non-sensitive data
- ✅ Auth storage cleared automatically
- ✅ Global error handlers catch async errors
- ✅ Build completes successfully
- ✅ Cache-busting works in production

---

## Automated Verification

Run the verification script:
```bash
npm run verify:auth-fix
```

**Expected**:
```
✅ All checks passed! Auth refresh token fix is properly implemented.
📊 Results: 26 passed, 0 failed
```

---

## Resources

- **Deployment Guide**: `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Previous Fix Summary**: `AUTH_REFRESH_FIX_SUMMARY.md`
- **Detailed Testing**: `AUTH_REFRESH_FIX_TESTING.md`
- **Verification Script**: `scripts/verify-auth-fix.js`
- **Storage Setup**: `scripts/setup-storage-buckets.js`
- **Reproduction Tool**: `/reproduce-auth-crash.html`

---

## Reporting Issues

If you find issues during testing:

1. **Note the exact steps to reproduce**
2. **Capture console logs** (with timestamps)
3. **Check network tab** for failed requests
4. **Verify deployment version** in console
5. **Run verification script**: `npm run verify:auth-fix`
6. **Include browser and OS info**

---

**Last Updated**: 2024-02-12  
**Version**: 2.0 (With global error handlers)
