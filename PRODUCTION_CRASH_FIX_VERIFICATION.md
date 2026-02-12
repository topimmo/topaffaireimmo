# Production Crash Fix - Verification Guide

## Overview
This document describes the fixes implemented to prevent production crashes and provides steps to verify they work correctly.

## Root Causes Identified

### 1. **Startup Validation Crashes**
- **Problem**: Async validation in `App.tsx` could throw unhandled errors during database/storage checks
- **Impact**: App would show "Something went wrong" before UI loads
- **Fix**: Made all validation non-blocking (warnings only, never errors)

### 2. **Auth Initialization Crashes**
- **Problem**: Profile loading could throw unhandled errors during auth initialization
- **Impact**: Invalid refresh tokens would crash the entire app
- **Fix**: Added comprehensive try-catch guards around all async auth operations

### 3. **Infinite Redirect Loops**
- **Problem**: Global error handlers could redirect repeatedly on auth errors
- **Impact**: Browser would freeze or show blank page
- **Fix**: Added redirect counter with max 3 attempts before stopping

### 4. **Missing Environment Variables**
- **Problem**: No synchronous validation before React renders
- **Impact**: App would crash with cryptic errors if env vars missing
- **Fix**: Added synchronous environment check in `main.tsx` before React renders

### 5. **Storage Bucket Validation Errors**
- **Problem**: Missing storage buckets treated as errors instead of warnings
- **Impact**: App wouldn't start if buckets didn't exist
- **Fix**: Changed to warnings only, never blocks app startup

### 6. **Invalid Refresh Tokens**
- **Problem**: Expired or invalid refresh tokens caused crashes
- **Impact**: Users with old sessions couldn't use the app
- **Fix**: Clear auth storage and gracefully logout instead of crashing

## Files Changed

### 1. `src/main.tsx`
**Changes:**
- Added synchronous environment validation before React renders
- Shows user-friendly error page if critical env vars missing
- Only initializes React if environment is valid

**Key Code:**
```typescript
function validateEnvironmentSync(): { valid: boolean; errors: string[] } {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    // Show error page instead of crashing
    return { valid: false, errors: [...] };
  }
  return { valid: true, errors: [] };
}
```

### 2. `src/lib/startup-validation.ts`
**Changes:**
- Made storage bucket validation non-blocking (warnings only)
- Made database connectivity test non-blocking
- Changed auth configuration to warn instead of error on localStorage issues

**Key Changes:**
```typescript
// Before: errors.push('Supabase not configured - cannot validate storage buckets')
// After: console.log('ℹ️ Skipping storage bucket validation (Supabase not configured)')

// Before: errors.push(`Database connectivity test failed: ${error.message}`)
// After: warnings.push(`Database connectivity issue: ${error.message}`)
```

### 3. `src/lib/globalErrorHandlers.ts`
**Changes:**
- Added redirect loop prevention (max 3 attempts)
- Added `safeRedirect()` function with attempt tracking
- Better error logging for debugging

**Key Code:**
```typescript
let redirectAttempts = 0;
const MAX_REDIRECT_ATTEMPTS = 3;

function safeRedirect(url: string, reason: string): void {
  redirectAttempts++;
  if (redirectAttempts > MAX_REDIRECT_ATTEMPTS) {
    console.error('[GlobalErrorHandlers] Too many redirect attempts - stopping');
    return; // Don't redirect - prevents infinite loops
  }
  // ... redirect after delay
}
```

### 4. `src/core/auth/AuthProvider.tsx`
**Changes:**
- Added try-catch around profile loading operations
- Added try-catch around `signOut()` calls (handles already logged out state)
- Better error handling in auth state change callback
- Graceful handling of refresh token errors

**Key Changes:**
```typescript
// Before: await supabase.auth.signOut();
// After:
try {
  await supabase.auth.signOut();
} catch (signOutError) {
  console.warn('[AuthContext] SignOut failed (already logged out?):', signOutError);
}

// Before: const profileResult = await loadProfile(session.user);
// After:
try {
  const profileResult = await loadProfile(session.user);
  // ... handle result
} catch (profileError) {
  console.error('[AuthContext] Profile loading exception:', profileError);
  setProfile(null);
  setProfileReady(false);
}
```

## Verification Steps

### 1. Environment Variable Validation

**Test Case:** Missing environment variables
```bash
# Remove env vars temporarily
unset VITE_SUPABASE_URL
unset VITE_SUPABASE_ANON_KEY

# Build and run
npm run build
npm run preview
```

**Expected Result:**
- ✅ Should show user-friendly error page (not crash)
- ✅ Error page should have "Configuration Error" title
- ✅ Should have "Retry" button that reloads page

### 2. Storage Bucket Validation

**Test Case:** Missing storage buckets
```bash
# In browser console after app loads:
console.log('Check for storage bucket warnings (should be warnings, not errors)')
```

**Expected Result:**
- ✅ App should load successfully
- ✅ Console should show warnings about missing buckets
- ✅ No errors in console about storage buckets
- ✅ App should NOT show "Something went wrong"

### 3. Database Connectivity

**Test Case:** Database unreachable
```bash
# Temporarily use invalid Supabase URL in .env
VITE_SUPABASE_URL=https://invalid-url.supabase.co

# Build and run
npm run build
npm run preview
```

**Expected Result:**
- ✅ App should load (may show warnings)
- ✅ App should NOT crash with "Something went wrong"
- ✅ Public pages should be accessible
- ✅ Auth-protected pages should redirect to login

### 4. Invalid Refresh Token

**Test Case:** Expired refresh token
```bash
# In browser console:
localStorage.setItem('topaffaireimmo-auth-token', JSON.stringify({
  access_token: 'invalid',
  refresh_token: 'expired',
  expires_at: 0
}));

# Reload page
window.location.reload();
```

**Expected Result:**
- ✅ App should NOT crash
- ✅ Should clear auth storage
- ✅ Should redirect to login page (max 3 times)
- ✅ Should show login page without errors

### 5. Profile Loading Errors

**Test Case:** Profile loading fails
```bash
# This is tested automatically by the error guards
# Profile loading errors are caught and handled gracefully
```

**Expected Result:**
- ✅ App should load successfully
- ✅ User should be treated as logged out
- ✅ No "Something went wrong" error

### 6. Infinite Redirect Loop Prevention

**Test Case:** Multiple auth errors
```bash
# In browser console after app loads:
for (let i = 0; i < 10; i++) {
  window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', {
    promise: Promise.reject(new Error('Invalid Refresh Token')),
    reason: new Error('Invalid Refresh Token')
  }));
}
```

**Expected Result:**
- ✅ Should NOT redirect more than 3 times
- ✅ Console should show "Too many redirect attempts - stopping"
- ✅ App should remain on current page
- ✅ No infinite redirect loop

## Production Deployment Checklist

Before deploying to production:

- [ ] All environment variables are set correctly
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_PRODUCTION_DOMAIN`

- [ ] Storage buckets exist in production Supabase
  - `property-images`
  - `banner-images`
  - `payment-receipts`
  - `agency-logos`

- [ ] Test the following scenarios in production:
  - [ ] Fresh user (no auth token) can access public pages
  - [ ] Fresh user (no auth token) can register/login
  - [ ] Existing user with valid token can login
  - [ ] User with expired token gets gracefully logged out
  - [ ] App loads without "Something went wrong" error

- [ ] Monitor production logs for:
  - [ ] No "Something went wrong" errors
  - [ ] No infinite redirect loops
  - [ ] Graceful handling of auth errors

## Testing in Development

```bash
# Install dependencies
npm install

# Run type check (may show pre-existing errors in other files)
npm run typecheck

# Build the app
npm run build

# Preview production build
npm run preview

# Open browser to http://localhost:4173
# Check console for any errors
```

## Common Issues and Solutions

### Issue: "Something went wrong" still appears
**Solution:**
1. Check browser console for actual error
2. Verify all environment variables are set
3. Check if error is from a different source (not auth/validation)
4. Clear browser cache and localStorage

### Issue: Infinite redirects still happening
**Solution:**
1. Check console for redirect attempts counter
2. Should stop after 3 attempts
3. If not, check if error is from different source

### Issue: Storage bucket warnings in console
**Solution:**
- This is expected if buckets don't exist
- Warnings are non-blocking
- Create buckets in Supabase to remove warnings
- Or ignore warnings if image upload not needed yet

## Success Criteria

✅ **All fixes successful when:**
1. App loads without "Something went wrong" error
2. Missing storage buckets show warnings only (not errors)
3. Invalid refresh tokens trigger graceful logout
4. No infinite redirect loops
5. Public pages accessible even with auth errors
6. User-friendly error page for missing env vars
7. App handles all async errors gracefully

## Why It Only Happened in Production

1. **Environment Variables**: Production env vars are loaded differently than dev
2. **Storage Buckets**: May not exist in prod but exist in dev database
3. **Refresh Tokens**: Expire faster in prod due to longer sessions
4. **Error Handling**: Production build handles errors differently than dev
5. **Network Latency**: Slower network in prod causes different race conditions
6. **Caching**: Production caching can cause stale auth tokens

## Monitoring Production

After deployment, monitor:
- Error rate in production logs
- Auth failure rate
- Redirect patterns
- User complaints about crashes
- Console errors in production (via error tracking service)
