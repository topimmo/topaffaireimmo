# Production Deployment Checklist

This checklist ensures all configuration and fixes are properly applied before deploying to production.

## ✅ Pre-Deployment Checklist

### 1. Google OAuth Configuration

#### Google Cloud Console:
- [ ] Navigate to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Select your TopAffaireImmo project
- [ ] Go to **APIs & Services** > **OAuth consent screen**
- [ ] Verify/Set **App Name**: `TopAffaireImmo`
- [ ] Verify/Set **User support email**: `support@topaffaireimmo.com` (or similar)
- [ ] Verify/Set **Developer contact information**
- [ ] Add **Authorized domain**: `topaffaireimmo.com`
- [ ] Set **Application home page**: `https://www.topaffaireimmo.com`
- [ ] Set **Privacy policy link**: `https://www.topaffaireimmo.com/privacy`
- [ ] Set **Terms of service link**: `https://www.topaffaireimmo.com/terms`
- [ ] (Optional) Upload app logo (120x120px minimum)
- [ ] Click **Save and Continue**

#### OAuth 2.0 Client ID Configuration:
- [ ] Go to **APIs & Services** > **Credentials**
- [ ] Find your OAuth 2.0 Client ID
- [ ] Add **Authorized JavaScript origins**:
  ```
  https://topaffaireimmo.com
  https://www.topaffaireimmo.com
  https://ghzdehknuzrtmfrimzdw.supabase.co
  ```
- [ ] Add **Authorized redirect URIs**:
  ```
  https://ghzdehknuzrtmfrimzdw.supabase.co/auth/v1/callback
  https://www.topaffaireimmo.com/auth/callback
  https://topaffaireimmo.com/auth/callback
  ```
- [ ] Click **Save**

### 2. Supabase Configuration

#### Authentication Settings:
- [ ] Go to [Supabase Dashboard](https://app.supabase.com/)
- [ ] Select project: `ghzdehknuzrtmfrimzdw`
- [ ] Navigate to **Authentication** > **URL Configuration**
- [ ] Set **Site URL**: `https://www.topaffaireimmo.com`
- [ ] Add **Redirect URLs**:
  ```
  https://topaffaireimmo.com/*
  https://www.topaffaireimmo.com/*
  ```
- [ ] Click **Save**

#### Google OAuth Provider:
- [ ] Navigate to **Authentication** > **Providers** > **Google**
- [ ] Verify **Enabled**: ✅ Yes
- [ ] Verify **Client ID** matches Google Cloud Console
- [ ] Verify **Client Secret** matches Google Cloud Console
- [ ] Click **Save**

#### Email Provider:
- [ ] Navigate to **Authentication** > **Providers** > **Email**
- [ ] Verify **Enabled**: ✅ Yes
- [ ] Verify **Confirm email**: ✅ Yes
- [ ] Click **Save**

#### Email Templates:
- [ ] Go to **Authentication** > **Email Templates**
- [ ] Verify **Confirm Signup** template uses correct callback URL
- [ ] Verify **Reset Password** template uses correct callback URL

### 3. Environment Variables

#### In Vercel (or your hosting provider):
- [ ] `VITE_SUPABASE_URL` = `https://ghzdehknuzrtmfrimzdw.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` = [your anon key]
- [ ] Set for **Production**, **Preview**, and **Development**
- [ ] Redeploy after changing environment variables

### 4. DNS and Domain Configuration

- [ ] Verify domain points to Vercel/hosting provider
- [ ] Decide on primary domain: `www.topaffaireimmo.com` or `topaffaireimmo.com`
- [ ] Set up redirect from non-primary to primary domain
- [ ] Verify HTTPS is enabled and certificates are valid
- [ ] Test both www and non-www versions

### 5. Code Changes Verification

- [ ] Verify all changes from this PR are deployed
- [ ] Check that startup validation is non-blocking
- [ ] Verify auth hydration timeout is 2 seconds
- [ ] Confirm AuthCallback has 8-second timeout
- [ ] Verify useMyProperties has .limit(200)

## 🧪 Post-Deployment Testing

### Test Email Signup Flow:
1. [ ] Go to `https://www.topaffaireimmo.com/register`
2. [ ] Enter test email and password
3. [ ] Check email for confirmation link
4. [ ] Click confirmation link
5. [ ] Verify redirected to `/auth/callback` → then `/dashboard` or `/admin`
6. [ ] Verify no "Confirmation en cours..." freeze
7. [ ] Verify session persists on page refresh

### Test Google OAuth Flow:
1. [ ] Go to `https://www.topaffaireimmo.com/login`
2. [ ] Click "Sign in with Google"
3. [ ] Verify OAuth screen shows "Access to application **TopAffaireImmo**"
4. [ ] Verify it does NOT show Supabase project reference
5. [ ] Complete Google login
6. [ ] Verify redirected to `/auth/callback` → then `/dashboard` or `/admin`
7. [ ] Verify profile is created in Supabase
8. [ ] Verify session persists on page refresh

### Test Password Reset Flow:
1. [ ] Go to `https://www.topaffaireimmo.com/login`
2. [ ] Click "Forgot password"
3. [ ] Enter email address
4. [ ] Check email for reset link
5. [ ] Click reset link
6. [ ] Verify redirected to `/reset-password` (NOT `/auth/callback`)
7. [ ] Enter new password
8. [ ] Verify redirected to dashboard
9. [ ] Verify can log in with new password

### Test Performance:
1. [ ] Open Chrome DevTools → Network tab
2. [ ] Hard refresh homepage (Cmd+Shift+R or Ctrl+Shift+R)
3. [ ] Verify **no blocking API calls before first paint**
4. [ ] Check Time to First Byte (TTFB) < 1s
5. [ ] Check First Contentful Paint (FCP) < 2s
6. [ ] Verify no infinite loading spinners

### Test Public Routes (No Auth):
1. [ ] Visit `/` - should load immediately
2. [ ] Visit `/search` - should load immediately
3. [ ] Visit `/property/:id` - should load immediately
4. [ ] Visit `/about` - should load immediately
5. [ ] Verify no blocking auth checks
6. [ ] Verify no redirect to login

### Test Protected Routes:
1. [ ] Visit `/dashboard` while logged out
2. [ ] Verify redirected to `/login`
3. [ ] Log in
4. [ ] Verify redirected back to `/dashboard`
5. [ ] Visit `/admin` as non-admin user
6. [ ] Verify redirected to appropriate dashboard

### Test Mobile Performance:
1. [ ] Open Chrome DevTools → Toggle device toolbar
2. [ ] Select "Slow 3G" network throttling
3. [ ] Hard refresh homepage
4. [ ] Verify page loads within 3 seconds
5. [ ] Verify no infinite loading
6. [ ] Test OAuth flow on mobile

## 🔍 Monitoring

### First 24 Hours After Deployment:

#### Check Supabase Logs:
- [ ] Go to Supabase Dashboard → **Authentication** > **Logs**
- [ ] Monitor for failed auth attempts
- [ ] Check for OAuth errors
- [ ] Look for session creation failures

#### Check Vercel Logs (or your hosting):
- [ ] Monitor for 5xx errors
- [ ] Check for increased error rates
- [ ] Monitor response times
- [ ] Check for failed deployments

#### Check Browser Console:
- [ ] Test on production with DevTools open
- [ ] Look for JavaScript errors
- [ ] Check for failed API calls
- [ ] Monitor auth state changes

#### User Feedback:
- [ ] Set up support channel for urgent issues
- [ ] Monitor for reports of:
  - Slow loading
  - Cannot login
  - Confirmation emails not working
  - OAuth failures

## 🚨 Rollback Plan

If critical issues are detected:

1. **Immediate Rollback**:
   ```bash
   # In Vercel (or your hosting provider)
   # Go to Deployments → Find previous working deployment
   # Click "Promote to Production"
   ```

2. **Revert Supabase Configuration**:
   - Revert Site URL if changed
   - Revert Redirect URLs if changed
   - Revert Email Templates if changed

3. **Notify Users**:
   - Post status update if downtime occurred
   - Explain what happened
   - Provide timeline for fix

## ✅ Success Criteria

Deployment is successful when:

- [x] Homepage loads in < 2 seconds on mid-range mobile
- [x] No infinite loading spinners
- [x] Google OAuth shows "TopAffaireImmo" (not Supabase reference)
- [x] Email confirmation works without freezing
- [x] Password reset works correctly
- [x] Public routes are accessible without auth
- [x] Protected routes require authentication
- [x] No increase in error rates
- [x] Session persists after page refresh
- [x] Mobile performance is acceptable

## 📊 Metrics to Track

After 7 days, review:

- **Performance**:
  - Average page load time
  - First Contentful Paint
  - Time to Interactive
  - Bounce rate

- **Authentication**:
  - Signup success rate
  - Login success rate
  - OAuth success rate
  - Email confirmation rate

- **Errors**:
  - Total errors
  - Auth errors
  - API errors
  - Client-side errors

- **User Behavior**:
  - New user signups
  - Returning users
  - Session duration
  - Feature usage

## 📝 Documentation

After successful deployment:

- [ ] Update main README.md with new configuration
- [ ] Document any production-specific settings
- [ ] Create runbook for common issues
- [ ] Update team on changes

## 🎯 Next Steps

After verifying everything works:

1. [ ] Monitor for 1 week
2. [ ] Collect user feedback
3. [ ] Plan next optimizations based on metrics
4. [ ] Consider implementing recommended optimizations from PERFORMANCE_OPTIMIZATION.md

## 📞 Support Contacts

In case of emergency:

- **Hosting Provider**: [Vercel Support / Your Provider]
- **Database Provider**: [Supabase Support](https://supabase.com/support)
- **Domain Registrar**: [Your registrar support]
- **Development Team**: [Your team contact]

---

## Notes

- This PR focuses on performance and auth flow fixes
- Google OAuth branding requires Google Cloud Console access
- Some testing requires production environment
- Monitor closely in first 24 hours after deployment

**Last Updated**: 2026-02-13
