# Deployment & Testing Guide

## Post-Deployment Steps for Auth, Profile & Mobile UI Fixes

This guide walks you through deploying and testing the fixes for:
1. Auth email confirmation redirects (502 Bad Gateway)
2. Profile/advertiser type sync issues
3. Storage upload permissions
4. Mobile UI layout issues
5. Security improvements

---

## 1. Deploy Database Migrations

### Prerequisites
- Supabase CLI installed (`npm install -g supabase`)
- Access to your Supabase project

### Steps

```bash
# 1. Login to Supabase (if not already)
supabase login

# 2. Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# 3. Check migration status
supabase db diff

# 4. Push new migrations
supabase db push

# Or apply migrations manually via Supabase Dashboard:
# - Go to Database → Migrations
# - Run migrations 042 and 043 in order
```

### Verify Migrations

```sql
-- 1. Check advertiser_type defaults
SELECT id, email, user_role, advertiser_type 
FROM public.profiles 
WHERE user_role = 'real_estate_advertiser'
LIMIT 10;
-- Expected: All should have advertiser_type = 'owner' (or 'broker'/'agency')

-- 2. Check SECURITY DEFINER functions have search_path
SELECT 
  p.proname as function_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM unnest(p.proconfig) AS config 
      WHERE config LIKE 'search_path=%'
    )
    THEN '✓ Has search_path' 
    ELSE '✗ Missing search_path' 
  END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef = true;
-- Expected: All functions show '✓ Has search_path'

-- 3. Test profile creation trigger
-- Create a test user and verify profile is created with advertiser_type
```

---

## 2. Configure Supabase Auth URLs

### Critical Configuration

Follow the complete guide in: [`docs/SUPABASE_AUTH_URL_CONFIG.md`](./SUPABASE_AUTH_URL_CONFIG.md)

**Quick Checklist:**
- [ ] Set Site URL to `https://topaffaireimmo.com`
- [ ] Add Redirect URLs:
  - `https://topaffaireimmo.com/*`
  - `https://www.topaffaireimmo.com/*`
  - `http://localhost:5173/*` (for development)
- [ ] Verify email templates use `{{ .SiteURL }}/auth/callback`
- [ ] Test email confirmation flow

### Verify Environment Variables

Ensure these are set in Vercel:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com
```

---

## 3. Deploy Frontend Changes

### Via Vercel

1. **Push to main branch** (or create PR and merge)
   ```bash
   git checkout main
   git merge copilot/fix-auth-confirmation-redirects
   git push origin main
   ```

2. **Vercel will auto-deploy**
   - Monitor deployment at https://vercel.com/your-project
   - Check build logs for errors
   - Verify deployment completes successfully

3. **Verify deployment**
   ```bash
   # Check that production domain serves the new code
   curl -I https://topaffaireimmo.com
   
   # Verify no build errors in console
   # Open browser DevTools → Console at https://topaffaireimmo.com
   ```

---

## 4. Testing Checklist

### Test 1: Email Confirmation Flow

**Objective:** Verify email confirmation works and redirects correctly

1. **Register a new user**
   - Go to: https://topaffaireimmo.com/register
   - Fill in all required fields
   - Submit registration form
   - ✅ Should see success message: "Compte créé avec succès!"

2. **Check email**
   - Open email inbox
   - Find confirmation email
   - ✅ Email link should contain: `https://topaffaireimmo.com/auth/callback?...`
   - ✅ Should NOT contain: `*.vercel.app`, `tempo.build`, or other preview domains

3. **Click confirmation link**
   - Click the link in email
   - ✅ Should redirect to: `https://topaffaireimmo.com/auth/callback`
   - ✅ Should show success UI: "Email confirmed successfully! Redirecting..."
   - ✅ Should redirect to dashboard after 2 seconds
   - ✅ No blank screens
   - ✅ No 502 Bad Gateway errors

4. **Check browser console** (F12 → Console)
   - ✅ Should see: `🔐 Auth callback triggered`
   - ✅ Should see: `✅ Session created successfully`
   - ✅ No error messages in red

5. **Verify profile created**
   ```sql
   -- In Supabase SQL Editor
   SELECT id, email, full_name, user_role, advertiser_type 
   FROM public.profiles 
   WHERE email = 'test-user-email@example.com';
   ```
   - ✅ Profile should exist
   - ✅ `advertiser_type` should be `'owner'` (default)
   - ✅ `user_role` should be `'real_estate_advertiser'`

### Test 2: Profile & Advertiser Type

**Objective:** Verify profile sync and advertiser_type handling

1. **Login as existing user**
   - Go to: https://topaffaireimmo.com/login
   - Enter credentials
   - Login
   - ✅ Should redirect to appropriate dashboard based on role

2. **Check profile loading** (Browser Console)
   - ✅ Should see: `✅ Profile loaded successfully`
   - ✅ Should NOT see: `❌ Error fetching profile`

3. **Verify advertiser_type in profile**
   - Check database:
   ```sql
   SELECT id, email, user_role, advertiser_type 
   FROM public.profiles 
   WHERE id = auth.uid();
   ```
   - ✅ `advertiser_type` should NOT be NULL for real_estate_advertisers

### Test 3: Image Upload

**Objective:** Verify storage upload works with advertiser_type

1. **Go to Add Listing page**
   - Navigate to: https://topaffaireimmo.com/add-listing
   - Or click the "+" FAB on mobile

2. **Try to upload images**
   - Click "Upload photos" or file input
   - Select 1-3 images
   - ✅ Upload should succeed
   - ✅ Should NOT see: "You don't have permission to upload images"
   - ✅ Should see upload progress: "Téléchargement des images... (1/3)"

3. **Check upload errors** (if any)
   - If upload fails, check browser console
   - Look for detailed error messages
   - Verify they provide actionable guidance

4. **Verify images in storage**
   ```sql
   -- In Supabase Storage → property-images bucket
   -- Should see uploaded files in: user_id/temp/timestamp-random.ext
   ```

### Test 4: Mobile UI

**Objective:** Verify mobile layout and safe area support

**Test on iOS Safari:**
1. Open on iPhone (real device or simulator)
2. Navigate to: https://topaffaireimmo.com
3. **Check FAB button**
   - ✅ Should see "+" button in bottom-right corner
   - ✅ Should NOT be cut off by notch/home indicator
   - ✅ Should have proper spacing from bottom
4. **Check page content**
   - ✅ Content should not be hidden behind notch
   - ✅ Buttons should be fully visible
5. **Open menu**
   - ✅ Menu overlay should not clip content

**Test on Android Chrome:**
1. Open on Android device
2. Navigate to: https://topaffaireimmo.com
3. Repeat same checks as iOS
4. ✅ All buttons visible and clickable

**Test viewport-fit:**
1. Check that viewport meta tag includes `viewport-fit=cover`
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
   ```
2. ✅ Safe area insets should be respected

### Test 5: Password Reset Flow

**Objective:** Verify password reset works end-to-end

1. **Request password reset**
   - Go to: https://topaffaireimmo.com/login
   - Click "Mot de passe oublié?"
   - Enter email
   - Submit
   - ✅ Should see success message

2. **Check email**
   - Find password reset email
   - ✅ Link should contain: `https://topaffaireimmo.com/reset-password?...`

3. **Click reset link**
   - Click the link
   - ✅ Should redirect to reset password page
   - ✅ No 502 errors
   - ✅ No blank screens

4. **Reset password**
   - Enter new password
   - Submit
   - ✅ Should see success message
   - ✅ Should be able to login with new password

### Test 6: Security Verification

**Objective:** Verify SECURITY DEFINER functions are secure

1. **Run security audit query**
   ```sql
   SELECT 
     p.proname as function_name,
     CASE 
       WHEN EXISTS (
         SELECT 1 FROM unnest(p.proconfig) AS config 
         WHERE config LIKE 'search_path=%'
       )
       THEN '✓ Has search_path' 
       ELSE '✗ Missing search_path' 
     END as search_path_status,
     CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END as security_type
   FROM pg_proc p
   JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.prosecdef = true;
   ```
   - ✅ All SECURITY DEFINER functions should have search_path

2. **Check Supabase Security Advisor**
   - Go to: Supabase Dashboard → Database → Security Advisor
   - ✅ Should see fewer or no warnings about SECURITY DEFINER
   - ✅ Mutable search_path warnings should be resolved

---

## 5. Monitoring & Logs

### Browser Console Logs

**Success Indicators:**
- `🔐 Auth callback triggered`
- `✅ Session created successfully`
- `✅ Profile loaded successfully`
- `[Storage] Upload successful`

**Error Indicators to Watch For:**
- `❌ Auth callback error`
- `❌ Error fetching profile`
- `❌ Error exchanging code for session`
- `[Storage] Permission denied`

### Supabase Logs

1. **Auth Logs**
   - Go to: Supabase Dashboard → Authentication → Logs
   - Watch for successful logins/signups
   - Check for any auth errors

2. **Database Logs**
   - Go to: Supabase Dashboard → Database → Logs
   - Watch for profile creation
   - Check for any RLS policy violations

3. **Storage Logs**
   - Go to: Supabase Dashboard → Storage → Logs
   - Watch for upload attempts
   - Check for permission errors

---

## 6. Rollback Plan (If Needed)

### If Issues Occur

1. **Frontend Rollback (Vercel)**
   - Go to Vercel Dashboard → Deployments
   - Find previous working deployment
   - Click "..." → "Promote to Production"

2. **Database Rollback**
   ```sql
   -- Rollback migration 043 (if needed)
   -- See rollback instructions in migration file
   
   -- Rollback migration 042 (if needed)
   -- See rollback instructions in migration file
   ```

3. **Revert Auth Configuration**
   - Restore previous Site URL if needed
   - Restore previous Redirect URLs if needed

---

## 7. Success Criteria

✅ **All tests pass:**
- Email confirmation works without 502 errors
- Profiles created with advertiser_type set
- Image uploads work for real_estate_advertisers
- Mobile UI displays correctly with no clipping
- SECURITY DEFINER functions have search_path set

✅ **No regressions:**
- Existing users can still login
- Existing functionality still works
- No new errors in console or logs

✅ **Performance:**
- Page load times unchanged or improved
- No slowdowns in auth flow
- Upload speeds acceptable

---

## 8. Known Limitations

1. **Mobile Testing:** Requires physical devices to fully test safe area support
2. **Email Delivery:** Depends on Supabase/Hostinger SMTP configuration
3. **Preview URLs:** Preview deployments may have different auth behavior (expected)

---

## 9. Support & Troubleshooting

### Common Issues

**Issue:** Email confirmation still shows 502
- **Check:** Supabase Site URL matches production domain
- **Check:** Email link contains correct domain
- **Fix:** Update Supabase URL configuration

**Issue:** Profile not created
- **Check:** Database trigger is active
- **Check:** RLS policies allow insert
- **Fix:** Run migration 042 again

**Issue:** Image upload fails
- **Check:** User has advertiser_type set
- **Check:** Storage policies allow upload
- **Check:** File size within limits

**Issue:** Mobile buttons cut off
- **Check:** viewport-fit=cover is set
- **Check:** Safe area CSS is loaded
- **Fix:** Hard refresh browser (Ctrl+Shift+R)

### Get Help

- Check logs in Supabase Dashboard
- Review browser console for errors
- Contact development team with:
  - Error message
  - User ID (if applicable)
  - Browser and device info
  - Steps to reproduce

---

**Last Updated:** 2026-01-26
