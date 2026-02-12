# Production Crash Fix - Deployment and Verification Guide

## Problem Summary

**Issue**: Production site showing "Something went wrong" page due to invalid/expired refresh tokens.

**Symptoms**:
- Console: `AuthApiError: Invalid Refresh Token: Refresh Token Not Found`
- Network: `POST /auth/v1/token?grant_type=refresh_token` → 400
- Storage warnings: `property-images`, `banner-images`, `payment-receipts`, `agency-logos` not found
- App completely crashes, even for public pages

**Root Cause**: Unhandled promise rejections in async auth callbacks (`onAuthStateChange`) that React ErrorBoundary cannot catch.

## What Was Fixed

### 1. Global Unhandled Rejection Handler ✅ **NEW**
**File**: `src/lib/globalErrorHandlers.ts`

- Catches unhandled promise rejections (ErrorBoundary can't catch these)
- Detects auth-related errors specifically
- Clears auth storage automatically
- Redirects to login instead of crashing
- Prevents default behavior to avoid "Something went wrong"

### 2. Stale Token Detection ✅ **NEW**
**File**: `src/lib/globalErrorHandlers.ts`

- Checks for expired tokens on app startup
- Clears stale tokens before they cause errors
- Helps with cache-related issues after deployments

### 3. Enhanced AuthProvider Error Handling ✅ **PREVIOUS**
**File**: `src/core/auth/AuthProvider.tsx`

- All auth methods wrapped in try-catch
- Refresh token failures trigger storage cleanup
- Graceful degradation to logged-out state
- No crashes on token failures

### 4. Storage Bucket Warnings Fixed ✅ **PREVIOUS**
**File**: `src/lib/storage.ts`

- Non-blocking bucket existence checks
- Helpful error messages
- Migration available: `supabase/migrations/065_verify_storage_buckets.sql`

### 5. Reproduction Script ✅ **NEW**
**File**: `public/reproduce-auth-crash.html`

- Browser-based tool to simulate token corruption
- Step-by-step testing guide
- Verification checklist

## Deployment Steps

### Pre-Deployment Checklist

#### 1. Verify Build
```bash
# Check TypeScript
npm run typecheck

# Build for production
npm run build

# Expected: Build succeeds, no new TypeScript errors
```

#### 2. Run Verification Script
```bash
npm run verify:auth-fix

# Expected: All 15 checks pass
```

#### 3. Test Locally
1. Start dev server: `npm run dev`
2. Open browser to `http://localhost:5173`
3. Navigate to `http://localhost:5173/reproduce-auth-crash.html`
4. Follow the reproduction steps
5. Verify app handles corrupted tokens gracefully

#### 4. Create Storage Buckets
Run in Supabase SQL Editor:
```sql
-- See: supabase/migrations/065_verify_storage_buckets.sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('property-images', 'property-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('banner-images', 'banner-images', false, 1048576, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('payment-receipts', 'payment-receipts', false, 2097152, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
  ('agency-logos', 'agency-logos', true, 524288, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
```

Verify in Supabase Dashboard → Storage → Buckets

### Deployment

#### Option A: Vercel (Recommended)
```bash
# Push to main branch
git push origin main

# Vercel auto-deploys
# Monitor: https://vercel.com/dashboard
```

#### Option B: Manual Build
```bash
# Build
npm run build

# Deploy dist/ folder to your hosting
# Ensure vercel.json cache headers are applied
```

### Post-Deployment Verification

#### 1. Check Cache-Busting
```bash
# Open production site
# Check DevTools → Network → index.html
# Expected: Cache-Control: no-cache, no-store, must-revalidate
```

#### 2. Verify Deployment Metadata
```bash
# Open browser console
# Look for: 🚀 Application Deployment Info
# Expected: Build Timestamp and Deployment Version visible
```

#### 3. Test Public Pages (Not Logged In)
- [ ] Homepage loads: `https://www.topaffaireimmo.com/`
- [ ] Search works: `https://www.topaffaireimmo.com/search`
- [ ] About page: `https://www.topaffaireimmo.com/about`
- [ ] Contact page: `https://www.topaffaireimmo.com/contact`

#### 4. Test Protected Pages Redirect
- [ ] `/dashboard` → redirects to `/login`
- [ ] `/add-listing` → redirects to `/login`
- [ ] `/admin` → redirects to `/login`

#### 5. Test Login Flow
- [ ] Login page loads
- [ ] Can log in successfully
- [ ] After login, redirected to intended page
- [ ] Dashboard loads with user data

#### 6. Test Refresh Token Failure (Critical!)
**Using Reproduction Script**:
1. Navigate to: `https://www.topaffaireimmo.com/reproduce-auth-crash.html`
2. Log in first (to get a valid token)
3. Click "Corrupt Refresh Token"
4. Click "Reload Page"
5. **Expected**: App loads, user logged out, homepage accessible
6. **NOT Expected**: "Something went wrong" crash

**Manual Method**:
```javascript
// In production browser console:
const authData = JSON.parse(localStorage.getItem('topaffaireimmo-auth-token'));
authData.refresh_token = 'invalid_token_' + Math.random();
localStorage.setItem('topaffaireimmo-auth-token', JSON.stringify(authData));
location.reload();

// Expected: App loads, logs show auth cleared, user logged out
// NOT Expected: Crash with "Something went wrong"
```

## Monitoring

### Console Logs to Watch

#### Normal Operation
```
✅ [GlobalErrorHandlers] Setting up global error handlers
✅ [GlobalErrorHandlers] Global error handlers ready
✅ [GlobalErrorHandlers] Auth token is valid, expires at: 2024-...
✅ [AuthContext] Initializing authentication
✅ [AuthContext] getSession result: { hasSession: true }
✅ [AuthContext] Profile loaded successfully
```

#### Refresh Token Failure (Expected Behavior)
```
⚠️ [AuthContext] Session error: { code: ..., message: "Invalid Refresh Token..." }
⚠️ [AuthContext] Refresh token invalid - clearing auth state
✅ [AuthContext] Auth storage cleared
ℹ️ User treated as logged out, app continues normally
```

#### Unhandled Rejection (Caught by Global Handler)
```
❌ [GlobalErrorHandlers] Unhandled auth promise rejection: { message: ..., isAuthError: true }
⚠️ [GlobalErrorHandlers] Auth storage cleared due to unhandled auth error
⚠️ [GlobalErrorHandlers] Reloading to clear auth state...
```

### Error Indicators (Problems)

🚨 **If you see these, something is wrong**:
```
❌ "Something went wrong" page appears
❌ ErrorBoundary catches error but app is stuck
❌ Refresh loop (page reloads continuously)
❌ Auth tokens visible in console logs (security issue)
❌ Storage bucket errors blocking UI
```

## Cache-Busting Considerations

### Vercel CDN Cache
The `vercel.json` configuration ensures:
- `index.html`: No cache (`no-cache, no-store, must-revalidate`)
- JS/CSS bundles: 1 year cache (`max-age=31536000, immutable`)
- Admin routes: No store (`no-store`)

### Service Workers
**Note**: This app doesn't use service workers (PWA removed).
If you add service workers in the future, implement cache invalidation on new deployments.

### Testing Cache Issues
1. Open production site
2. Note deployment version in console
3. Deploy new version
4. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
5. Verify new deployment version appears
6. **Expected**: Old JS bundles NOT loaded (Vite uses hashed filenames)

## Rollback Plan

If issues occur after deployment:

### Quick Rollback (Vercel)
```bash
# Via Vercel Dashboard
# Deployments → Previous Deployment → Promote to Production
```

### Git Rollback
```bash
git revert <commit-hash>
git push origin main
```

### Emergency Fix
If users are completely locked out:
1. Direct users to clear localStorage: `localStorage.clear()`
2. Or provide direct link: `/login?clear=true` (if implemented)

## Success Criteria

✅ **Fix is successful if**:

1. **No Crashes on Token Failure**
   - Refresh token failures don't show "Something went wrong"
   - App treats user as logged out
   - Homepage remains accessible

2. **Graceful Error Handling**
   - Console shows helpful error messages
   - No sensitive data in logs
   - Auth storage automatically cleared

3. **Public Pages Work**
   - Homepage, search, property details accessible
   - No authentication required for browsing

4. **Protected Routes Work**
   - Redirect to login when not authenticated
   - Redirect back to original page after login

5. **Storage Warnings Non-Blocking**
   - Warnings logged but don't crash app
   - Uploads still attempted

6. **Cache-Busting Works**
   - New deployments load new code
   - Old JS bundles not cached
   - Build timestamp updates

## Troubleshooting

### Issue: Users still seeing "Something went wrong"

**Possible Causes**:
1. Browser has cached old JS bundle
2. Service worker serving old files (if added)
3. CDN not respecting cache headers

**Fix**:
```javascript
// In browser console:
localStorage.clear();
location.reload(true);

// Or hard refresh:
// Windows/Linux: Ctrl+Shift+R
// Mac: Cmd+Shift+R
```

### Issue: Infinite redirect loop

**Possible Causes**:
1. Auth state not being cleared properly
2. Route guard logic issue

**Fix**:
```javascript
// Clear all storage
localStorage.clear();
sessionStorage.clear();

// Navigate to homepage
location.href = '/';
```

### Issue: Storage bucket warnings persist

**Cause**: Buckets not created in Supabase

**Fix**:
1. Go to Supabase Dashboard → Storage → Buckets
2. Run migration: `supabase/migrations/065_verify_storage_buckets.sql`
3. Or create manually via UI

## Files Changed

### New Files
- `src/lib/globalErrorHandlers.ts` - Global unhandled rejection handler
- `public/reproduce-auth-crash.html` - Testing tool
- `PRODUCTION_DEPLOYMENT_GUIDE.md` - This file

### Modified Files
- `src/main.tsx` - Added global error handler setup
- `src/core/auth/AuthProvider.tsx` - Enhanced error handling (previous fix)
- `src/lib/storage.ts` - Enhanced bucket warnings (previous fix)

### Existing Files (Referenced)
- `vercel.json` - Cache headers configuration
- `vite.config.ts` - Build metadata injection
- `supabase/migrations/065_verify_storage_buckets.sql` - Storage bucket setup

## Additional Resources

- **Testing Guide**: `AUTH_REFRESH_FIX_TESTING.md`
- **Previous Fix Summary**: `AUTH_REFRESH_FIX_SUMMARY.md`
- **Verification Script**: `scripts/verify-auth-fix.js`
- **Reproduction Tool**: `/reproduce-auth-crash.html` (in production)

## Support

For issues or questions:
1. Check console for `[GlobalErrorHandlers]` and `[AuthContext]` logs
2. Run reproduction script to test token failure handling
3. Verify deployment metadata in console
4. Check Supabase Dashboard for storage bucket status

---

**Last Updated**: 2024-02-12  
**Version**: 2.0 (Added global error handlers)
