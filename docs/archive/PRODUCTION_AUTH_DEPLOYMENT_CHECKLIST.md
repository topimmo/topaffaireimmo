# Production Authentication & Email Deployment Checklist

## Critical Issue: Signup/Email Confirmation Not Working

This checklist addresses the production issue where users cannot sign up successfully, confirmation emails are not delivered, and the error message "Une erreur inattendue s'est produite. Veuillez réessayer." appears.

---

## Part 1: Supabase Dashboard Configuration Audit

### 1.1 Authentication Settings (CRITICAL)

Navigate to: **Supabase Dashboard → Authentication → Settings**

#### Email Provider Configuration
- [ ] **SMTP Settings Configured**
  - [ ] Provider: Hostinger (or other custom SMTP)
  - [ ] SMTP Host: Set (e.g., `smtp.hostinger.com`)
  - [ ] SMTP Port: Set (typically `465` for SSL or `587` for TLS)
  - [ ] SMTP Username: Set (your email address)
  - [ ] SMTP Password: Set (app password if using 2FA)
  - [ ] Sender Name: Set (e.g., "TopAffaireImmo")
  - [ ] Sender Email: Set and verified
  
  **Test SMTP:** Send test email from Supabase dashboard to verify settings work

#### Email Templates
- [ ] **Confirmation Email Template**
  - [ ] Navigate to: Authentication → Email Templates → Confirm signup
  - [ ] Verify template is enabled
  - [ ] Check that `{{ .ConfirmationURL }}` variable is present
  - [ ] Verify redirect URL in template is correct
  - [ ] Subject line is professional and clear

#### User Signup Settings
- [ ] **Enable email signups** is ON
- [ ] **Confirm email** setting:
  - Current status: _________________ (Enabled/Disabled)
  - Recommendation: Start with **DISABLED** for testing, enable after SMTP verified
  - [ ] If enabled, users MUST click email link before they can login
  - [ ] If disabled, users can login immediately without email confirmation

#### Site URL Configuration (CRITICAL)
- [ ] **Site URL** is set to production domain
  - Should be: `https://topaffaireimmo.com` (or your production URL)
  - NOT: `http://localhost:3000`
  - NOT: Preview URLs like `https://topaffaireimmo-xxx.vercel.app`

#### Redirect URLs (CRITICAL)
- [ ] **Redirect URLs** list includes:
  - [ ] `https://topaffaireimmo.com/login`
  - [ ] `https://topaffaireimmo.com/**` (wildcard for all pages)
  - [ ] `https://www.topaffaireimmo.com/**` (if using www subdomain)
  - [ ] Your Vercel production URL if different

**Why this matters:** If the redirect URL sent by the frontend is not in this list, you'll get `redirect_not_allowed` error.

---

## Part 2: Vercel Environment Variables (CRITICAL)

Navigate to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

### 2.1 Required Variables

#### Production Environment
- [ ] **VITE_SUPABASE_URL**
  - Value: `https://[your-project-id].supabase.co`
  - Environment: Production ✓
  - Get from: Supabase Dashboard → Settings → API → Project URL

- [ ] **VITE_SUPABASE_ANON_KEY**
  - Value: `eyJ...` (long JWT token)
  - Environment: Production ✓
  - Get from: Supabase Dashboard → Settings → API → Project API keys → anon public

- [ ] **VITE_PRODUCTION_DOMAIN** (NEW - CRITICAL for email redirects)
  - Value: `https://topaffaireimmo.com` (your production domain)
  - Environment: Production ✓
  - Purpose: Used for email confirmation redirects

### 2.2 Verification Steps

After setting/updating environment variables:

1. [ ] **Trigger a clean redeploy**
   - Go to Vercel → Deployments
   - Click "Redeploy" on latest deployment
   - Select "Use existing build cache: NO"
   - Reason: Environment variables only take effect on new builds

2. [ ] **Wait for deployment to complete**
   - Status should be "Ready"
   - No build errors

3. [ ] **Check deployment logs**
   - Go to deployment → "View Function Logs" or "Runtime Logs"
   - Look for startup logs from `src/lib/supabase.ts`:
   ```
   🔧 Supabase Client Initialization
     - Environment: production
     - URL configured: true (https://xxxxx.supabase.co...)
     - Anon Key configured: true (eyJhbGciOiJIUzI1...)
     - Is Configured: true
   ```
   - **If `Is Configured: false`**, environment variables are NOT loaded correctly

---

## Part 3: Database Migration Verification

Navigate to: **Supabase Dashboard → SQL Editor**

### 3.1 Check Profile Trigger Exists

Run this query:
```sql
-- Verify the trigger that creates profiles exists
SELECT 
  tgname AS trigger_name,
  tgtype,
  tgenabled AS enabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

Expected result: 1 row with `enabled = 'O'` (Origin)

If no result: Apply migration `supabase/migrations/035_fix_signup_rls_policy.sql`

### 3.2 Check RLS Policies

Run this query:
```sql
-- Verify RLS policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual IS NOT NULL AS has_using,
  with_check IS NOT NULL AS has_with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY policyname;
```

Expected policies:
- `Enable read access for users to their own profile` (SELECT)
- `Enable insert for users to create their own profile` (INSERT)
- `Enable update for users to their own profile` (UPDATE)
- `Enable delete for users to their own profile` (DELETE)

If missing: Apply migration `supabase/migrations/041_supabase_compatible_profile_fix.sql`

### 3.3 Check for Orphaned Users (No Profile)

Run this query:
```sql
-- Find auth users without profiles
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  p.id IS NULL AS missing_profile
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC
LIMIT 10;
```

Expected result: 0 rows (no missing profiles)

If users are missing profiles:
1. The trigger is not working
2. Apply/re-apply migrations 035 and 041
3. Manually create missing profiles:
```sql
INSERT INTO public.profiles (id, email, full_name, user_role, is_active)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  COALESCE(u.raw_user_meta_data->>'user_role', 'real_estate_advertiser'),
  true
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
```

---

## Part 4: Frontend Code Verification

### 4.1 Check Current Domain

Open your production site in browser:
1. [ ] Open browser DevTools (F12)
2. [ ] Go to Console tab
3. [ ] Look for Supabase initialization logs:
```
🔧 Supabase Client Initialization
  - Environment: production
  - URL configured: true
  - Anon Key configured: true
  - Is Configured: true
  - Current Domain: https://topaffaireimmo.com
```

If `Current Domain` shows a Vercel preview URL (e.g., `topaffaireimmo-git-branch.vercel.app`):
- [ ] You're on a preview deployment, not production
- [ ] Go to your actual production URL

### 4.2 Test Signup Flow

Use a **NEW email address** that has never been used before:

1. [ ] Navigate to `/register` page
2. [ ] Open browser DevTools Console (F12)
3. [ ] Fill in form with test data:
   - Email: `test-[timestamp]@example.com`
   - Password: `TestPass123!`
   - Full Name: `Test User`
   - Phone: `+212600000000`
   - Company: `Test Company`

4. [ ] Click "S'inscrire" button
5. [ ] **DO NOT CLOSE CONSOLE** - watch the logs

### 4.3 Expected Console Logs (Success)

You should see in this order:

```
📋 REGISTER FORM SUBMITTED
✅ Form validation passed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 SIGNUP PROCESS STARTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 1: Checking Supabase configuration...
  ✅ Supabase is configured
Step 2: Signup attempt details
  - Email: test-xxx@example.com
  - Full Name: Test User
  ...
Step 3: User metadata prepared
Step 4: Email redirect URL configuration
  - Production domain (env): https://topaffaireimmo.com
  - Final emailRedirectTo: https://topaffaireimmo.com/login
Step 5: Calling supabase.auth.signUp()...
Step 6: Signup API call completed in XXXms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SIGNUP API CALL SUCCESSFUL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response data:
  - user_id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  - user_email: test-xxx@example.com
  - email_confirmed_at: null (or timestamp)
  - session: "No session (email confirmation required)" OR "Session created"
✅ User created in Supabase Auth
✅ REGISTER PAGE: Signup completed successfully
```

### 4.4 Error Scenarios & Diagnosis

#### Scenario A: Error "Une erreur inattendue s'est produite"

Look for earlier error logs:
```
❌ SIGNUP FAILED
Error message: [ACTUAL ERROR MESSAGE HERE]
```

Common errors and fixes:

| Error Message | Cause | Fix |
|--------------|-------|-----|
| `redirect_not_allowed` | emailRedirectTo URL not in Supabase allowed list | Add to Supabase → Auth → Redirect URLs |
| `Email rate limit exceeded` | Too many signup attempts | Wait 60 minutes or use different email |
| `User already registered` | Email already exists | Use different email or try login |
| `Database error` | RLS policy or trigger failure | Check migrations applied |
| `SMTP error` / `Email provider error` | Email sending failed | Check SMTP settings in Supabase |

#### Scenario B: No Error but No Email Received

Checklist:
- [ ] Check spam/junk folder
- [ ] Verify SMTP settings in Supabase dashboard
- [ ] Send test email from Supabase dashboard
- [ ] Try different email provider (Gmail, Outlook, etc.)
- [ ] Check Supabase Logs → Postgres Logs for email errors

#### Scenario C: User Created but Can't Login

1. [ ] Check if email confirmation is required:
   - Supabase → Authentication → Settings → Confirm email
   
2. [ ] If enabled:
   - User must click email confirmation link first
   - Check `email_confirmed_at` in auth.users table
   
3. [ ] If disabled:
   - User should be able to login immediately
   - Try password reset if login fails

---

## Part 5: Supabase Auth Logs Analysis

Navigate to: **Supabase Dashboard → Logs → Auth Logs**

### 5.1 Filter for Recent Signups

1. [ ] Set time range: Last 1 hour
2. [ ] Filter by event type: `user.created` or `signup`
3. [ ] Look for the test email you used

### 5.2 Check for Errors

Look for events with `error` or `failed` status:

Common error codes:
- **22P02**: Invalid input syntax (data type mismatch)
- **23505**: Duplicate key (user already exists)
- **42501**: Permission denied (RLS policy issue)
- **PGRST116**: Not found (profile not created)

### 5.3 Email Delivery Logs

Navigate to: **Logs → Postgres Logs** or **Logs → API Logs**

Search for:
- `email` or `smtp` keywords
- Your test email address
- Error messages related to email sending

---

## Part 6: Production Deployment Verification

### 6.1 Clean Deployment Checklist

Perform these steps in order:

1. [ ] **Update Environment Variables** (if needed)
   - Vercel → Settings → Environment Variables
   - Add/update VITE_PRODUCTION_DOMAIN

2. [ ] **Trigger Clean Redeploy**
   - Vercel → Deployments → Latest → Redeploy
   - Uncheck "Use existing build cache"

3. [ ] **Wait for Build Complete**
   - Status: Ready ✓
   - No errors in build logs

4. [ ] **Verify on Production URL**
   - Open production domain (not preview URL)
   - Check console for Supabase initialization logs
   - Verify `VITE_PRODUCTION_DOMAIN` is set correctly

5. [ ] **Test Signup with Real Email**
   - Use your own email address
   - Complete signup flow
   - Check for confirmation email
   - Click confirmation link (if enabled)
   - Try to login

### 6.2 Rollback Plan

If signup still fails after all fixes:

**Option 1: Temporarily Disable Email Confirmation**
- Supabase → Auth → Settings → Confirm email → OFF
- This allows testing signup without email dependency
- Re-enable after SMTP is verified working

**Option 2: Check Supabase Service Status**
- Visit: https://status.supabase.com
- Check for ongoing incidents affecting Auth or Email services

**Option 3: Re-apply Migrations**
- Go to SQL Editor
- Run migrations 035 and 041 again (they're idempotent)

**Option 4: Manual SMTP Test**
- Supabase → Auth → Settings → SMTP
- Click "Send test email"
- If this fails, SMTP credentials are wrong

---

## Part 7: Root Cause Identification Matrix

Use this matrix to identify the exact issue:

| Symptom | Likely Cause | Where to Look | Fix |
|---------|-------------|---------------|-----|
| "Supabase not configured" error | Missing env vars | Vercel env vars | Add VITE_SUPABASE_URL and KEY |
| "redirect_not_allowed" error | URL not whitelisted | Supabase → Auth → Redirect URLs | Add production URL |
| User created but no email | SMTP not configured | Supabase → Auth → SMTP Settings | Configure Hostinger SMTP |
| User can't login | Email not confirmed | Supabase → Auth → Confirm email | Check setting or send new confirmation |
| Profile loading error | RLS policy or trigger issue | SQL: Check policies and trigger | Apply migrations 035, 041 |
| Generic "unexpected error" | Check console for real error | Browser DevTools console | See error translation logs |
| Email in spam | SPF/DKIM not configured | Email DNS settings | Configure SPF/DKIM for domain |

---

## Part 8: Success Criteria

All must be ✓ for production readiness:

- [ ] Environment variables loaded correctly (`Is Configured: true`)
- [ ] Production domain set in env vars and Supabase Site URL
- [ ] Redirect URLs include production domain
- [ ] SMTP configured and test email sends successfully
- [ ] Database migrations applied (trigger and RLS policies exist)
- [ ] New user signup creates user in auth.users
- [ ] Profile automatically created in profiles table
- [ ] Confirmation email delivered (if enabled)
- [ ] User can login after confirmation (or immediately if confirmation disabled)
- [ ] Session persists across page refreshes
- [ ] No errors in browser console during signup
- [ ] No errors in Supabase Auth logs

---

## Part 9: Monitoring & Ongoing Maintenance

### Daily Checks (First Week)
- [ ] Monitor signup success rate
- [ ] Check Supabase Auth logs for errors
- [ ] Verify email delivery rate
- [ ] Check for orphaned users (no profile)

### Weekly Checks
- [ ] Review Vercel error logs
- [ ] Check SMTP quota (if using paid plan)
- [ ] Monitor user feedback on signup issues

### Monthly Checks
- [ ] Review and update SMTP credentials if needed
- [ ] Verify SSL certificates for email domain
- [ ] Check Supabase project usage limits

---

## Support Resources

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Supabase Email Config**: https://supabase.com/docs/guides/auth/auth-smtp
- **Vercel Env Vars**: https://vercel.com/docs/concepts/projects/environment-variables
- **This Repository Docs**:
  - `/SUPABASE_SIGNUP_FIX.md` - Previous signup fix documentation
  - `/PRODUCTION_SIGNUP_VERIFICATION.md` - Testing checklist
  - `/SUPABASE_CONFIGURATION.md` - General Supabase setup

---

**Last Updated**: 2026-01-26  
**Version**: 1.0  
**Purpose**: Production signup/email issue resolution
