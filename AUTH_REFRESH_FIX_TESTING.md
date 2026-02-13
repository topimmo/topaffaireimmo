# Auth Refresh Token Fix - Testing Guide

## Overview
This document explains how to test the fixes for the auth refresh token error that was causing "Something went wrong" crashes in production.

## What Was Fixed

### 1. Auth Refresh Token Crashes (CRITICAL)
**Problem**: When refresh tokens expired or became invalid, the app would crash with "AuthApiError: Invalid Refresh Token: Refresh Token Not Found"

**Root Cause**:
- `AuthProvider.tsx` `onAuthStateChange` callback had no error handling (line 157-182)
- `initializeAuth` method didn't handle refresh token errors gracefully
- `refreshSession` method didn't catch exceptions
- No mechanism to clear stale auth storage

**Fix Applied**:
- ✅ Added `clearAuthStorage()` utility function to safely clear only Supabase auth keys
- ✅ Wrapped `onAuthStateChange` callback in try-catch to prevent uncaught errors
- ✅ Enhanced `initializeAuth` to detect refresh token errors and clear auth state
- ✅ Enhanced `refreshSession` to handle errors gracefully and treat failures as logged-out
- ✅ Added non-sensitive logging (error code, message, path) without exposing tokens
- ✅ On refresh failure: clear storage, call signOut(), treat as logged-out state

### 2. Storage Bucket Warnings
**Problem**: Console warnings about missing buckets: "property-images, banner-images, agency-logos, receipts"

**Fix Applied**:
- ✅ Enhanced `storage.ts` bucket existence check with better logging
- ✅ Made bucket checks non-blocking (uploads attempted even if check fails)
- ✅ Added helpful messages pointing to migration 065 and manual creation
- ✅ Bucket names are correct: `payment-receipts` (not `receipts`)

## Testing Scenarios

### Test 1: Refresh Token Failure (Critical)
**Simulating the Production Issue**

1. **Setup**:
   - Open the app in browser
   - Log in with valid credentials
   - Note the auth token in localStorage (`topaffaireimmo-auth-token`)

2. **Simulate Token Failure**:
   ```javascript
   // In browser console:
   // Corrupt the refresh token to simulate failure
   const authData = JSON.parse(localStorage.getItem('topaffaireimmo-auth-token'));
   authData.refresh_token = 'invalid_token_' + Math.random();
   localStorage.setItem('topaffaireimmo-auth-token', JSON.stringify(authData));
   
   // Reload the page
   location.reload();
   ```

3. **Expected Behavior** (AFTER FIX):
   - ✅ App loads without crash
   - ✅ Console shows: `[AuthContext] Refresh token invalid - clearing auth state`
   - ✅ User is treated as logged out
   - ✅ Auth storage is cleared
   - ✅ No "Something went wrong" error
   - ✅ Homepage remains accessible
   - ✅ Accessing protected route (e.g., /dashboard) redirects to /login

4. **Expected Behavior** (BEFORE FIX):
   - ❌ App crashes with "Something went wrong"
   - ❌ Error boundary catches uncaught exception
   - ❌ User cannot use the app

### Test 2: Homepage Works Without Auth
**Verifying Public Routes Still Work**

1. **Clear All Auth**:
   ```javascript
   // In browser console:
   localStorage.removeItem('topaffaireimmo-auth-token');
   location.reload();
   ```

2. **Expected Behavior**:
   - ✅ Homepage (/) loads successfully
   - ✅ Search functionality works
   - ✅ Property listings visible
   - ✅ No login required for browsing
   - ✅ Login/Register buttons visible in header

### Test 3: Protected Routes Require Auth
**Verifying Guards Still Work**

1. **While Logged Out**, try to access:
   - `/dashboard`
   - `/add-listing`
   - `/admin`

2. **Expected Behavior**:
   - ✅ Redirects to `/login?next=<original-path>`
   - ✅ After login, redirects back to original path
   - ✅ No crashes or errors

### Test 4: Storage Bucket Warnings
**Verifying Non-Blocking Warnings**

1. **Check Console on Startup**:
   - Look for storage validation logs
   - Should see: `[Storage]` prefix on warnings

2. **Expected Behavior**:
   - ⚠️ If buckets missing: Warning logged but app continues
   - ✅ Warning includes migration path: `065_verify_storage_buckets.sql`
   - ✅ Warning states upload will be attempted anyway
   - ✅ App does not crash or block

3. **Fix Missing Buckets** (if needed):
   ```sql
   -- Run in Supabase SQL Editor:
   -- See: supabase/migrations/065_verify_storage_buckets.sql
   
   INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
   VALUES 
     ('property-images', 'property-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
     ('banner-images', 'banner-images', false, 1048576, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
     ('payment-receipts', 'payment-receipts', false, 2097152, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
     ('agency-logos', 'agency-logos', true, 524288, ARRAY['image/jpeg', 'image/png', 'image/webp'])
   ON CONFLICT (id) DO NOTHING;
   ```

### Test 5: Logging Verification
**Ensuring No Sensitive Data Leaked**

1. **Check All Console Logs**:
   - Search for any tokens in console: `refresh_token`, `access_token`
   - Verify only error codes and messages are logged

2. **Expected Behavior**:
   - ✅ Logs show: error code, message, path
   - ✅ Logs DO NOT show: tokens, passwords, secrets
   - ✅ User IDs are truncated (first 8 chars only)

### Test 6: Build Success
**Verify No TypeScript Errors**

```bash
npm run typecheck
npm run build
```

**Expected**:
- ✅ Build completes successfully
- ℹ️ Pre-existing errors (unrelated to auth) may still appear
- ✅ No new TypeScript errors introduced

## Key Files Changed

1. **`src/core/auth/AuthProvider.tsx`**:
   - Added `clearAuthStorage()` function (line 18-41)
   - Enhanced `initializeAuth()` error handling (line 102-183)
   - Wrapped `onAuthStateChange` in try-catch (line 212-254)
   - Enhanced `signOut()` with storage clearing (line 318-334)
   - Enhanced `refreshSession()` with comprehensive error handling (line 336-392)

2. **`src/lib/storage.ts`**:
   - Enhanced `checkBucketExists()` with better logging (line 27-59)
   - Made warnings more actionable and non-blocking

## Production Deployment Checklist

Before deploying to production:

- [ ] Test all scenarios above in staging environment
- [ ] Create missing storage buckets in Supabase Dashboard
- [ ] Verify error boundaries are working
- [ ] Monitor Sentry/logs for auth errors
- [ ] Ensure .env variables are set correctly
- [ ] Verify CORS settings for Supabase

After deployment:

- [ ] Monitor console for refresh token errors
- [ ] Verify users can still log in
- [ ] Check that logged-out users can access homepage
- [ ] Verify protected routes redirect correctly
- [ ] Monitor error rates for any spikes

## Rollback Plan

If issues occur after deployment:

1. Revert to previous commit: `git revert <commit-hash>`
2. Redeploy previous version
3. Investigate root cause with enhanced logging

## Success Criteria

✅ **Fix is successful if**:
- No more "Something went wrong" crashes on refresh token failure
- App gracefully handles expired tokens by treating user as logged out
- Homepage and public routes remain accessible
- Protected routes properly redirect to /login
- Storage warnings are informative but non-blocking
- No sensitive data appears in logs
- Build completes without errors

## Additional Notes

- **Auth Flow**: Now resilient to token failures at every step
- **Storage**: Buckets checked once and cached to avoid repeated API calls
- **Logging**: All auth errors logged with context but no sensitive data
- **User Experience**: Seamless - users just need to log in again if token expired
