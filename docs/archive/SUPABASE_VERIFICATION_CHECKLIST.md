# Supabase Configuration Verification Checklist

**Project:** TopAffaireImmo  
**Purpose:** Comprehensive verification of Supabase configuration  
**Date:** 2026-01-25

---

## ⚠️ IMPORTANT: Manual Verification Required

This checklist contains items that **MUST** be verified in the Supabase Dashboard by the repository owner. These settings cannot be verified programmatically from the frontend code.

---

## 1. Authentication & Sessions

### 1.1 Site URL Configuration
**Location:** Supabase Dashboard → Authentication → URL Configuration

- [ ] **Site URL** is set to production domain
  - ✅ Recommended: `https://topaffaireimmo.vercel.app` or custom domain
  - ❌ Not: `http://localhost:5173`
  
- [ ] **Redirect URLs** include all valid domains:
  - [ ] `https://topaffaireimmo.vercel.app/**`
  - [ ] `https://*.vercel.app/**` (for preview deployments)
  - [ ] `http://localhost:5173/**` (for local development)
  - [ ] Add custom domain if configured: `https://topaffaireimmo.ma/**`

### 1.2 Email Confirmation Settings
**Location:** Supabase Dashboard → Authentication → Settings

- [ ] Email confirmation is enabled (or disabled for testing - document which)
- [ ] Double email confirmation: Verify setting matches requirements
- [ ] Secure password change: Should be enabled

### 1.3 Session Configuration
**Location:** Supabase Dashboard → Authentication → Settings

- [ ] JWT expiry time: Check value (default: 3600 seconds = 1 hour)
- [ ] Refresh token rotation: Verify setting
- [ ] Session timeout: Document current value

### 1.4 Email Templates
**Location:** Supabase Dashboard → Authentication → Email Templates

- [ ] Confirmation email template: Contains correct redirect URL
- [ ] Password recovery template: Contains correct redirect URL  
- [ ] Magic link template: Contains correct redirect URL
- [ ] All templates use production domain, not localhost

---

## 2. Row Level Security (RLS) Policies

### 2.1 Verify RLS is Enabled
**Location:** Supabase Dashboard → Database → Tables

Run this query in SQL Editor:
```sql
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Expected result: **ALL tables should have `rowsecurity = true`**

- [ ] `profiles` table: RLS enabled
- [ ] `properties` table: RLS enabled  
- [ ] `cities` table: RLS enabled
- [ ] `neighborhoods` table: RLS enabled
- [ ] `banner_ads` table: RLS enabled
- [ ] All other public tables: RLS enabled

### 2.2 Profiles Table Policies
**Location:** Supabase Dashboard → Database → Profiles table → Policies

- [ ] **SELECT policy** (`profiles_select_own`): Users can view own profile, admins can view all
- [ ] **INSERT policy** (`profiles_insert_authenticated` or `profiles_insert_system_or_own`): Allows profile creation
- [ ] **UPDATE policy** (`profiles_update_own`): Users can update own profile
- [ ] **DELETE policy**: Verify if exists and is appropriate

### 2.3 Properties Table Policies
**Location:** Supabase Dashboard → Database → Properties table → Policies

- [ ] **SELECT policy**: Anyone can view approved properties
- [ ] **INSERT policy** (`properties_insert_authenticated`): Uses `can_insert_property()` function
- [ ] **UPDATE policy**: Only owner or admin can update
- [ ] **DELETE policy**: Only owner or admin can delete

---

## 3. Storage Configuration

### 3.1 Verify Buckets Exist
**Location:** Supabase Dashboard → Storage

- [ ] `property-images` bucket exists
  - [ ] Public bucket: YES
  - [ ] File size limit: 50MB or appropriate
  - [ ] Allowed MIME types: image/jpeg, image/png, image/webp
  
- [ ] `banner-images` bucket exists
  - [ ] Public bucket: YES
  - [ ] File size limit: 50MB or appropriate
  
- [ ] `agency-logos` bucket exists
  - [ ] Public bucket: YES
  - [ ] File size limit: 5MB or appropriate

### 3.2 Storage RLS Policies
**Location:** Supabase Dashboard → Storage → [bucket] → Policies

For each bucket, verify policies exist for:
- [ ] **SELECT/Download**: Public can view uploaded images
- [ ] **INSERT/Upload**: Authenticated users can upload to own folder
  - [ ] Policy checks: `(storage.foldername(name))[1] = auth.uid()::text`
- [ ] **UPDATE**: Owner can update their files
- [ ] **DELETE**: Owner can delete their files

---

## 4. Database Functions & Triggers

### 4.1 Profile Creation Trigger
**Location:** Supabase Dashboard → Database → Functions

Verify function exists and is properly configured:
```sql
-- Check if function exists
SELECT 
  proname, 
  prosecdef 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

Expected:
- [ ] Function `handle_new_user` exists
- [ ] `prosecdef = true` (SECURITY DEFINER is set)

Verify trigger exists:
```sql
-- Check if trigger exists
SELECT 
  tgname,
  tgtype,
  tgenabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

Expected:
- [ ] Trigger `on_auth_user_created` exists
- [ ] `tgenabled = 'O'` (trigger is enabled)

### 4.2 Test Profile Creation
**Location:** Supabase Dashboard → Database → SQL Editor

Run diagnostic query:
```sql
SELECT * FROM public.check_profile_sync_status();
```

Expected result:
- [ ] `missing_profiles = 0` (all auth users have profiles)
- [ ] `orphaned_profiles` = small number or 0

### 4.3 Other Functions
**Location:** Supabase Dashboard → Database → Functions

- [ ] `can_insert_property()` function exists
- [ ] `send_facebook_webhook()` function exists (if using Facebook posting)

---

## 5. Email Configuration (SMTP)

### 5.1 SMTP Settings
**Location:** Supabase Dashboard → Settings → Auth → SMTP Settings

- [ ] SMTP is enabled (or disabled - document which)
- [ ] SMTP Host: `smtp.hostinger.com` (if using Hostinger)
- [ ] SMTP Port: `465` (SSL) or `587` (TLS)
- [ ] SMTP Encryption: SSL or TLS
- [ ] Sender Email: `noreply@topaffaireimmo.com` or appropriate
- [ ] Sender Name: `TopAffaireImmo`
- [ ] SMTP Username: Should be the email address
- [ ] SMTP Password: **✅ SET** (you can't view it, but verify it's configured)

**Test:**
- [ ] Send a test email from Supabase Dashboard
- [ ] Verify email is received and looks correct

---

## 6. Edge Functions (Optional)

### 6.1 Facebook Webhook Function
**Location:** Supabase Dashboard → Edge Functions

If using Facebook auto-posting:
- [ ] Function `send-facebook-webhook` is deployed
- [ ] Function has correct environment variable: `MAKE_WEBHOOK_URL`
- [ ] Test function execution from dashboard

---

## 7. Logs & Monitoring

### 7.1 Check Recent Logs
**Location:** Supabase Dashboard → Logs

- [ ] **Postgres Logs**: Check for any ERROR messages
  - Look for trigger execution logs: "handle_new_user triggered"
  - Look for RLS policy errors
  
- [ ] **Auth Logs**: Check for failed signup/login attempts
  - Verify successful signups create profiles
  
- [ ] **API Logs**: Check for 400/500 errors
  - Review error patterns

### 7.2 Performance Advisor
**Location:** Supabase Dashboard → Database → Advisors → Performance

- [ ] Run performance advisor
- [ ] Review recommendations
- [ ] Document any issues found

### 7.3 Security Advisor  
**Location:** Supabase Dashboard → Database → Advisors → Security

- [ ] Run security advisor
- [ ] **CRITICAL**: Address all HIGH severity issues
- [ ] Document MEDIUM/LOW issues for future improvement

---

## 8. API & Project Settings

### 8.1 API Keys
**Location:** Supabase Dashboard → Settings → API

- [ ] `anon` (public) key is set
- [ ] `service_role` key exists but is **NEVER used in frontend**
- [ ] Project URL matches: `https://ghzdehknuzrtmfrimzdw.supabase.co`

**⚠️ IMPORTANT:** After security incident, consider rotating the `anon` key:
- [ ] Old key rotation completed (if needed - see SECURITY_NOTICE_CREDENTIALS.md)

### 8.2 Project Settings
**Location:** Supabase Dashboard → Settings → General

- [ ] Project name: TopAffaireImmo or appropriate
- [ ] Organization: Verify correct organization
- [ ] Region: Document region (e.g., eu-west-1)
- [ ] Pause project: Should be DISABLED for production

---

## 9. Database Backups

### 9.1 Verify Backups
**Location:** Supabase Dashboard → Database → Backups

- [ ] Daily backups are enabled (if on paid plan)
- [ ] Point-in-time recovery is enabled (if on paid plan)
- [ ] Document backup retention period

**Note:** Free tier has limited backup options. Consider upgrading for production.

---

## 10. Webhooks (Optional)

### 10.1 Database Webhooks
**Location:** Supabase Dashboard → Database → Webhooks

If using webhooks:
- [ ] Webhook for new properties triggers Facebook posting
- [ ] Webhook URL is correct and responding
- [ ] Webhook events are properly configured

---

## Verification Summary

**Date Verified:** _______________  
**Verified By:** _______________  
**Issues Found:** _______________  
**Issues Resolved:** _______________  

### Critical Issues ❌
_List any critical issues that block production deployment_

### High Priority Issues ⚠️
_List issues that should be fixed soon_

### Medium/Low Priority Issues ℹ️
_List issues for future improvement_

---

## Next Steps

After completing this checklist:

1. ✅ Document all settings in a secure location
2. ✅ Fix any critical or high-priority issues
3. ✅ Re-test the complete user journey (signup, login, create listing, upload image)
4. ✅ Update Vercel environment variables with correct values
5. ✅ Deploy and verify in production

---

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Configuration](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- Project documentation: See `/DEPLOYMENT_GUIDE.md`
