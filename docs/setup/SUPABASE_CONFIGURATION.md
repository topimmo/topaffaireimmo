# Supabase Dashboard Configuration Guide

## 🔴 CRITICAL: Required Configuration After Domain Change

This guide explains the **essential Supabase Dashboard settings** required for TopAffaireImmo to work correctly on the production domain `www.topaffaireimmo.com`.

---

## Problem Summary

After changing from `topaffaireimmo.vercel.app` to `www.topaffaireimmo.com`, users experience:
- ✅ Can create accounts successfully
- ❌ Cannot upload images ("Veuillez vous connecter d'abord")
- ❌ Don't appear in Admin Dashboard
- ❌ Session appears to be lost on page refresh

**Root Cause:** Supabase Site URL and Redirect URLs not updated for the new domain.

---

## Required Configuration Steps

### 1. Update Site URL

**Location:** Supabase Dashboard → Authentication → URL Configuration

**Setting:** Site URL

**Value:** 
```
https://www.topaffaireimmo.com
```

**What it does:**
- Defines the primary domain for your application
- Used as the base URL for email confirmation links
- Required for session cookies to work correctly

---

### 2. Add Redirect URLs (Allow List)

**Location:** Supabase Dashboard → Authentication → URL Configuration

**Setting:** Redirect URLs

**Add ALL of these URLs:**

```
https://www.topaffaireimmo.com/**
https://topaffaireimmo.com/**
https://topaffaireimmo.vercel.app/**
http://localhost:5173/**
http://localhost:3000/**
```

**Explanation:**
- `https://www.topaffaireimmo.com/**` - Primary production domain (with www)
- `https://topaffaireimmo.com/**` - Production domain (without www, for redirects)
- `https://topaffaireimmo.vercel.app/**` - Keep old Vercel domain for backward compatibility
- `http://localhost:5173/**` - Local development (Vite default port)
- `http://localhost:3000/**` - Alternative local development port

**Why wildcards (`**`):**
- Allows redirects to any page: `/login`, `/reset-password`, `/dashboard`, etc.
- Without wildcards, only exact URLs are allowed

---

### 3. Verify Email Confirmation Settings

**Location:** Supabase Dashboard → Authentication → Email Templates

**Check these templates:**

#### Confirm Signup Template
Should contain:
```
{{ .ConfirmationURL }}
```

This will automatically use the Site URL configured above.

#### Reset Password Template
Should contain:
```
{{ .ConfirmationURL }}
```

#### Magic Link Template (if enabled)
Should contain:
```
{{ .ConfirmationURL }}
```

**Important:** Do NOT hardcode any URLs in email templates. Use the template variables.

---

### 4. Check SMTP Settings (Email Delivery)

**Location:** Supabase Dashboard → Settings → Auth → SMTP Settings

**Required for production:**

```
SMTP Host: smtp.hostinger.com
SMTP Port: 465
SMTP Username: noreply@topaffaireimmo.com (or your configured email)
SMTP Password: [your password]
Sender Email: noreply@topaffaireimmo.com
Sender Name: TopAffaireImmo
```

**Test email delivery:**
1. Create a test account with your personal email
2. Check if confirmation email arrives
3. Click the link and verify it redirects to `www.topaffaireimmo.com`

---

### 5. Verify Session Settings

**Location:** Supabase Dashboard → Authentication → Settings

**Check these settings:**

| Setting | Recommended Value | Why |
|---------|------------------|-----|
| JWT Expiry | 3600 (1 hour) | Default is good, refresh happens automatically |
| Refresh Token Rotation | ✅ Enabled | Security best practice |
| Session Duration | 604800 (7 days) | User stays logged in for 7 days |
| Email Confirmation | ✅ Enabled | Verify user emails |
| Auto Confirm Users | ❌ Disabled | Prevent spam accounts |

---

### 6. Environment Variables in Vercel

**Location:** Vercel Dashboard → Project Settings → Environment Variables

**Verify these are set correctly:**

| Variable | Production Value | Why |
|----------|-----------------|-----|
| `VITE_SUPABASE_URL` | `https://[your-project].supabase.co` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Supabase anonymous key |
| `VITE_PRODUCTION_DOMAIN` | `https://www.topaffaireimmo.com` | Used for SEO and sharing |

**How to update:**
1. Go to Vercel Dashboard
2. Select `topaffaireimmo` project
3. Settings → Environment Variables
4. Update `VITE_PRODUCTION_DOMAIN` to `https://www.topaffaireimmo.com`
5. Redeploy the application

---

### 7. DNS Configuration (Hostinger)

**Required DNS records:**

**Important:** Vercel IP addresses can change. Always verify current IPs in the Vercel documentation at: https://vercel.com/docs/projects/domains/working-with-domains

For most users, we recommend using **CNAME records** instead of A records:

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Note:** Some DNS providers don't support CNAME on the root domain (@). In that case, use Vercel's nameservers or A records:

```
Type: A
Name: @
Value: 76.76.21.21 (Check Vercel docs for current IP)

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Vercel Domain Settings:**
1. Go to Vercel → Project → Settings → Domains
2. Add both domains:
   - `topaffaireimmo.com`
   - `www.topaffaireimmo.com`
3. Set `www.topaffaireimmo.com` as primary (recommended)
4. Redirect `topaffaireimmo.com` → `www.topaffaireimmo.com`

---

## Testing & Verification

### Test 1: New User Signup
1. Open incognito browser window
2. Navigate to `https://www.topaffaireimmo.com`
3. Click "S'inscrire" (Sign Up)
4. Fill out registration form with a test email
5. Submit

**Expected Results:**
- ✅ No errors during signup
- ✅ Confirmation email received
- ✅ Email link points to `www.topaffaireimmo.com/login`
- ✅ After clicking link, user is confirmed and can log in

---

### Test 2: Profile Creation
1. After signing up, log in
2. Open browser console (F12)
3. Check for these logs:
   ```
   ✅ Profile loaded successfully
   ```

**If you see this instead:**
```
❌ Error fetching profile: PGRST116
⚠️ Profile not found for authenticated user
```

**Solution:** Run this SQL query in Supabase SQL Editor:
```sql
SELECT * FROM public.check_profile_sync_status();
```

If `missing_profiles > 0`, run the backfill:
```sql
-- Already included in migration 038, but can be run manually:
SELECT public.handle_new_user() FROM auth.users WHERE id NOT IN (SELECT id FROM public.profiles);
```

---

### Test 3: Session Persistence
1. Log in to `www.topaffaireimmo.com`
2. Refresh the page (F5)
3. Check you're still logged in (no redirect to login page)
4. Close browser completely
5. Open browser again and navigate to `www.topaffaireimmo.com`
6. Check you're still logged in (if within 7 days)

**Expected Result:** ✅ Session persists across page reloads and browser restarts

**If session is lost:**
- Check browser console for errors
- Verify `localStorage` contains `topaffaireimmo-auth-token`
- Check Supabase Dashboard → Logs for authentication errors

---

### Test 4: Image Upload
1. Log in as a real estate advertiser
2. Navigate to "Poster une Annonce" (Add Listing)
3. Fill out property details
4. Click "Ajouter des Images" (Add Images)
5. Select an image file

**Expected Result:** ✅ Image uploads successfully, no "Veuillez vous connecter" error

**If you see "Veuillez vous connecter d'abord":**
- Check browser console for profile loading errors
- Verify user appears in `public.profiles` table:
  ```sql
  SELECT id, email, user_role FROM public.profiles WHERE email = 'test@example.com';
  ```
- Check storage policies allow uploads

---

### Test 5: Admin Dashboard
1. Log in as an admin user
2. Navigate to `/admin/users` or Admin Dashboard
3. Check that all users appear in the list

**Expected Result:** ✅ All users visible (counts match between `auth.users` and `public.profiles`)

**If users are missing:**
- Run diagnostic:
  ```sql
  SELECT * FROM public.check_profile_sync_status();
  ```
- Expected result: `missing_profiles = 0`

---

## Troubleshooting

### Problem: "Veuillez vous connecter d'abord" when already logged in

**Symptoms:**
- User can log in successfully
- Redirect to dashboard works
- But trying to upload images shows "Please log in first"

**Diagnosis:**
1. Open browser console (F12)
2. Look for these errors:
   - `❌ Error fetching profile: PGRST116`
   - `Profile not loaded`
   - `user: [object Object], profile: null`

**Root Cause:** Profile doesn't exist in `public.profiles` table

**Solutions:**

**Option A: Wait for fallback creation**
- Code includes automatic fallback profile creation
- Wait 2-3 seconds and refresh the page
- Profile should be created automatically

**Option B: Manually create profile**
```sql
-- Replace with actual user ID from auth.users
INSERT INTO public.profiles (id, email, user_role, is_active)
VALUES (
  '[user-id-from-auth]',
  'user@example.com',
  'real_estate_advertiser',
  true
);
```

**Option C: Check and fix trigger**
```sql
-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Re-run profile creation for existing users
SELECT public.handle_new_user() FROM auth.users WHERE id NOT IN (SELECT id FROM public.profiles);
```

---

### Problem: Session lost after page refresh

**Symptoms:**
- User logs in successfully
- Refreshing page logs them out
- Or redirects to login page

**Diagnosis:**
1. Check browser `localStorage`:
   - Open DevTools → Application → Local Storage
   - Look for `topaffaireimmo-auth-token`
   - Should contain JSON with `access_token` and `refresh_token`

2. Check browser console for errors:
   - `Session not found`
   - `Invalid JWT`

**Root Cause:** Session storage not working correctly

**Solutions:**

**Option A: Clear localStorage and re-login**
```javascript
// Run in browser console:
localStorage.clear();
// Then log in again
```

**Option B: Check Supabase Site URL**
- Verify Site URL in Supabase Dashboard matches your domain
- Should be: `https://www.topaffaireimmo.com`

**Option C: Verify redirect URLs**
- Ensure `https://www.topaffaireimmo.com/**` is in redirect allow list

---

### Problem: Users not appearing in Admin Dashboard

**Symptoms:**
- User count is 0 or less than expected
- Specific users missing from list

**Diagnosis:**
```sql
-- Count users in auth vs profiles
SELECT 
  (SELECT COUNT(*) FROM auth.users) AS auth_users,
  (SELECT COUNT(*) FROM public.profiles) AS profile_users,
  (SELECT COUNT(*) FROM auth.users au 
   LEFT JOIN public.profiles p ON au.id = p.id 
   WHERE p.id IS NULL) AS missing_profiles;
```

**If `missing_profiles > 0`:**
```sql
-- List missing profiles
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Create missing profiles
DO $$
DECLARE
  v_user RECORD;
BEGIN
  FOR v_user IN 
    SELECT id, email, created_at, raw_user_meta_data
    FROM auth.users
    WHERE id NOT IN (SELECT id FROM public.profiles)
  LOOP
    INSERT INTO public.profiles (id, email, user_role, is_active)
    VALUES (
      v_user.id,
      v_user.email,
      COALESCE(v_user.raw_user_meta_data->>'user_role', 'real_estate_advertiser'),
      true
    );
  END LOOP;
END $$;
```

---

## Quick Checklist

Before deploying or testing, verify:

- [ ] Supabase Site URL = `https://www.topaffaireimmo.com`
- [ ] All redirect URLs added to allow list
- [ ] Environment variable `VITE_PRODUCTION_DOMAIN` updated in Vercel
- [ ] DNS records point to Vercel
- [ ] Vercel domain settings configured
- [ ] SMTP settings configured for email delivery
- [ ] Profile trigger exists and is active
- [ ] No missing profiles (run diagnostic query)
- [ ] Test account can sign up successfully
- [ ] Test account can upload images
- [ ] Test account appears in Admin Dashboard

---

## Support

If issues persist after following this guide:

1. **Check Supabase Logs:**
   - Dashboard → Logs → Postgres Logs
   - Look for trigger execution logs: `handle_new_user triggered`

2. **Check Browser Console:**
   - Open DevTools (F12) → Console
   - Look for authentication errors

3. **Run Diagnostics:**
   ```sql
   -- Profile sync status
   SELECT * FROM public.check_profile_sync_status();
   
   -- Recent user signups
   SELECT id, email, created_at, email_confirmed_at 
   FROM auth.users 
   ORDER BY created_at DESC 
   LIMIT 10;
   
   -- Recent profiles
   SELECT id, email, user_role, created_at 
   FROM public.profiles 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

4. **Test with curl:**
   ```bash
   # Test Supabase connection
   curl https://[your-project].supabase.co/rest/v1/profiles \
     -H "apikey: [your-anon-key]"
   ```

---

## Summary

The key to fixing the authentication issues after domain change:

1. ✅ **Updated Supabase client** to use `localStorage` (not cookies) - [DONE in code]
2. ⚠️ **Update Supabase Site URL** - [REQUIRED in Supabase Dashboard]
3. ⚠️ **Add redirect URLs** - [REQUIRED in Supabase Dashboard]
4. ⚠️ **Update Vercel environment variables** - [REQUIRED in Vercel]
5. ✅ **Profile creation trigger** - [Already implemented in database]

**This guide must be followed by the platform administrator to complete the fix.**
