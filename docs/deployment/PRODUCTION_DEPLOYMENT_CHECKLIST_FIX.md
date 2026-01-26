# Production Deployment Checklist - Fix Profile & Upload Issues

## 🎯 Objective
Fix production issues:
- ✅ "Erreur de chargement du profil" (Profile loading error)
- ✅ HTTP 500 errors during image upload
- ✅ Password reset emails not working
- ✅ Emails not branded with TopAffaireImmo

---

## 📋 Pre-Deployment Checklist

### 1. Database Migration
- [ ] Run migration `042_production_fixes_comprehensive.sql` in Supabase SQL Editor
- [ ] Verify all storage buckets exist
- [ ] Verify storage RLS policies are updated (no profile check required)
- [ ] Verify profile RLS policies allow INSERT for new users
- [ ] Verify `handle_new_user()` trigger exists and is active

**How to verify:**
```sql
-- Check storage buckets
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
ORDER BY id;

-- Check storage policies (should allow INSERT without profile check)
SELECT policyname, cmd, with_check::text 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%insert%'
ORDER BY policyname;

-- Check profile policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
ORDER BY policyname;

-- Check trigger exists
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

---

### 2. Environment Variables (Vercel)

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Verify these are set for **Production**:

- [ ] `VITE_SUPABASE_URL` - Your Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- [ ] `VITE_PRODUCTION_DOMAIN` - Set to `https://topaffaireimmo.com`

**CRITICAL:** After adding/changing env vars, you MUST redeploy!

**How to redeploy:**
1. Go to Vercel Dashboard → Deployments
2. Click "..." menu on latest deployment
3. Click "Redeploy"
4. OR: Push a new commit to trigger automatic deployment

---

### 3. Supabase Auth Configuration

Go to: **Supabase Dashboard → Authentication → URL Configuration**

#### Site URL
- [ ] Set to: `https://topaffaireimmo.com`

#### Redirect URLs
- [ ] Add these patterns (one per line):
```
https://topaffaireimmo.com/**
https://*.vercel.app/**
http://localhost:3000/**
```

---

### 4. Email Branding Configuration

Go to: **Supabase Dashboard → Authentication → Email Templates**

For each template (Confirm signup, Reset password, Magic Link):

- [ ] Update **Subject** to include "TopAffaireImmo"
- [ ] Update **Body** with branded HTML template
- [ ] Set **Sender Name** to "TopAffaireImmo"

**See detailed templates in:** `docs/SUPABASE_DASHBOARD_EMAIL_CONFIG.md`

**Quick Check:**
- Subject example: "Réinitialiser votre mot de passe – TopAffaireImmo"
- Sender name: TopAffaireImmo
- Email body should have TopAffaireImmo branding and logo

---

### 5. (Optional) Custom SMTP Configuration

For better email deliverability:

Go to: **Supabase Dashboard → Project Settings → Authentication → SMTP Settings**

Recommended providers:
- **Resend** (modern, easy) - https://resend.com
- **SendGrid** (reliable) - https://sendgrid.com

Example config (Resend):
- [ ] SMTP Host: `smtp.resend.com`
- [ ] SMTP Port: `587`
- [ ] Username: `resend`
- [ ] Password: `[Your Resend API Key]`
- [ ] Sender Email: `no-reply@topaffaireimmo.com`
- [ ] Sender Name: `TopAffaireImmo`
- [ ] Enable TLS: `Yes`

**Note:** You must verify your domain with the SMTP provider first!

---

## 🚀 Deployment Steps

### Step 1: Apply Database Migration
```bash
# Option A: Using Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Open file: supabase/migrations/042_production_fixes_comprehensive.sql
3. Copy contents
4. Paste into SQL Editor
5. Click "Run"

# Option B: Using Supabase CLI (if you have it locally)
supabase db push
```

### Step 2: Update Code (if not already deployed)
```bash
# Ensure these files have the latest changes:
# - src/pages/Login.tsx (password reset with VITE_PRODUCTION_DOMAIN)
# - .env.example (updated with VITE_PRODUCTION_DOMAIN docs)
git pull origin main
```

### Step 3: Configure Vercel Environment Variables
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add or update:
   - `VITE_PRODUCTION_DOMAIN` = `https://topaffaireimmo.com`
3. Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
4. Click "Save"

### Step 4: Redeploy to Vercel
```bash
# Option A: Automatic (push code)
git add .
git commit -m "Apply production fixes for profile and upload issues"
git push origin main

# Option B: Manual redeploy in Vercel Dashboard
# Go to Deployments → Click "..." → Redeploy
```

### Step 5: Configure Supabase Auth Settings
1. Set Site URL to `https://topaffaireimmo.com`
2. Add redirect URLs (see checklist above)
3. Update email templates with TopAffaireImmo branding

---

## ✅ Post-Deployment Verification

### Test 1: New User Signup
- [ ] Create a new account with a test email
- [ ] Verify confirmation email arrives
- [ ] Check sender shows "TopAffaireImmo"
- [ ] Click confirmation link
- [ ] Verify redirect to production domain
- [ ] Log in successfully
- [ ] **NO "Erreur de chargement du profil" error**
- [ ] Check profile exists in Supabase: `profiles` table

### Test 2: Existing User Login
- [ ] Log in with an existing account
- [ ] Profile loads without errors
- [ ] Dashboard loads correctly
- [ ] **NO HTTP 500 errors in console**

### Test 3: Image Upload
- [ ] Log in as real estate advertiser
- [ ] Go to "Add Listing" or "Upload Photos"
- [ ] Select one or more images
- [ ] Click upload
- [ ] **NO HTTP 500 errors**
- [ ] **Images upload successfully**
- [ ] Verify images appear in Supabase Storage: `property-images` bucket

### Test 4: Password Reset
- [ ] Go to login page
- [ ] Click "Mot de passe oublié?" (Forgot password)
- [ ] Enter email address
- [ ] **Email arrives** (check spam if needed)
- [ ] **Sender shows "TopAffaireImmo"**
- [ ] Click reset link in email
- [ ] **Redirects to** `https://topaffaireimmo.com/reset-password`
- [ ] Enter new password
- [ ] Successfully log in with new password

### Test 5: Check Logs
- [ ] Open browser DevTools → Console
- [ ] **NO errors** related to:
  - Profile loading
  - Storage/upload
  - Authentication
- [ ] Check Supabase Dashboard → Logs
- [ ] **NO 500 errors** in API logs

---

## 🔍 Troubleshooting

### Issue: Still getting "Erreur de chargement du profil"

**Possible causes:**
1. Migration not applied
2. RLS policies not updated
3. Profile trigger not working

**Fix:**
```sql
-- Check if migration was applied
SELECT * FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname = 'Enable insert for users to create their own profile';

-- If policy missing, re-run migration 042
```

---

### Issue: Image upload still fails with 500 error

**Possible causes:**
1. Storage buckets don't exist
2. RLS policies still require profile check
3. User not authenticated

**Fix:**
```sql
-- Check storage buckets
SELECT * FROM storage.buckets WHERE id = 'property-images';

-- Check storage policies (should NOT have profile check)
SELECT policyname, with_check::text 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname = 'property_images_auth_insert';

-- Expected: with_check should be:
-- (bucket_id = 'property-images') AND (auth.uid() IS NOT NULL) 
-- AND ((foldername(name))[1] = (auth.uid())::text)
-- 
-- Should NOT contain: EXISTS (SELECT 1 FROM profiles...)
```

---

### Issue: Password reset email not received

**Possible causes:**
1. SMTP not configured correctly
2. Email in spam
3. Site URL not configured
4. Redirect URL not whitelisted

**Fix:**
1. Check Supabase Dashboard → Logs → Auth Logs
2. Verify Site URL is set to production domain
3. Check spam folder
4. Verify `VITE_PRODUCTION_DOMAIN` env var in Vercel
5. Try with a different email provider (Gmail, Outlook)

---

### Issue: Email shows wrong sender name

**Possible causes:**
1. Sender name not configured in Supabase
2. SMTP not configured
3. Changes not saved

**Fix:**
1. Go to Supabase Dashboard → Project Settings → Authentication
2. Look for "Sender name" field
3. Set to "TopAffaireImmo"
4. Save and wait a few minutes
5. Send test email

---

## 📊 Expected Results

After completing this deployment:

✅ **Profile Loading**
- New users auto-create profile via trigger
- If trigger fails, frontend creates fallback profile
- Old users load existing profiles
- No "Erreur de chargement du profil" errors
- No HTTP 500 errors

✅ **Image Upload**
- Users can upload images immediately after signup
- No profile check blocking uploads
- Upload works for new and existing users
- Images stored in correct user folder
- No HTTP 500 errors during upload

✅ **Password Reset**
- Reset emails are sent successfully
- Emails show "TopAffaireImmo" as sender
- Reset link redirects to production domain
- Users can successfully reset password

✅ **Email Branding**
- All auth emails show TopAffaireImmo branding
- Professional email templates
- Consistent sender name across all emails

---

## 📚 Related Documentation

- [Email Configuration Guide](./SUPABASE_DASHBOARD_EMAIL_CONFIG.md)
- [Environment Variables Setup](../VERCEL_ENV_VARS_CHECKLIST.md)
- [Migration 042 Details](../supabase/migrations/042_production_fixes_comprehensive.sql)

---

## 🆘 Need Help?

If you encounter issues:

1. **Check browser console** for error messages
2. **Check Supabase logs:** Dashboard → Logs → API/Auth Logs
3. **Check Vercel logs:** Dashboard → Deployments → View Function Logs
4. **Verify all checklist items** are completed
5. **Re-run migration** if in doubt

---

**Last Updated:** January 2024  
**Version:** 1.0  
**Status:** Production Ready ✅
