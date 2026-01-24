# Production Signup Verification Checklist

## Overview
This document provides a step-by-step checklist to verify that Supabase signup is working correctly in production after deploying the enhanced logging and fixes.

## Pre-Deployment Checklist

### 1. Verify Environment Variables in Vercel
- [ ] Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- [ ] Verify `VITE_SUPABASE_URL` is set
  - Should look like: `https://xxxxx.supabase.co`
  - **IMPORTANT**: Variable name must be exactly `VITE_SUPABASE_URL` (not `SUPABASE_URL`)
- [ ] Verify `VITE_SUPABASE_ANON_KEY` is set
  - Should be a long JWT token starting with `eyJ...`
  - **IMPORTANT**: Variable name must be exactly `VITE_SUPABASE_ANON_KEY` (not `SUPABASE_ANON_KEY`)
- [ ] Ensure both variables are set for **Production** environment
- [ ] After any env var changes, **redeploy** the application for changes to take effect

### 2. Verify Supabase Database Migration Applied
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Run this query to check if the signup fix policy exists:
  ```sql
  SELECT * FROM pg_policies 
  WHERE tablename = 'profiles' 
  AND policyname = 'profiles_insert_system_or_own';
  ```
- [ ] Should return 1 row with the policy details
- [ ] If no results, apply migration `035_fix_signup_rls_policy.sql` from the SQL Editor

### 3. Verify Supabase Auth Settings
- [ ] Go to Supabase Dashboard → Authentication → Settings
- [ ] Under "User Signups":
  - [ ] Verify "Enable email signups" is **ON** (enabled)
- [ ] Under "Email Auth":
  - [ ] Check if "Confirm email" is enabled or disabled
  - [ ] **Note**: If enabled, users must click email confirmation link before they appear as confirmed
- [ ] Under "Site URL":
  - [ ] Should be set to your production URL (e.g., `https://yourapp.vercel.app`)
- [ ] Under "Redirect URLs":
  - [ ] Add `https://yourapp.vercel.app/login` (or your actual URL)
  - [ ] Add `https://yourapp.vercel.app/**` for wildcard matching

## Post-Deployment Verification

### Step 1: Check Application Startup Logs
After deploying, immediately check Vercel logs to verify env vars are loaded:

- [ ] Go to Vercel Dashboard → Your Project → Deployments → Latest Deployment → View Function Logs
- [ ] Look for the startup log from `supabase.ts`:
  ```
  🔧 Supabase Client Initialization
    - Environment: production
    - URL configured: true (https://xxxxx.supabase.co...)
    - Anon Key configured: true (eyJhbGciOiJIUzI1NiI...)
    - Is Configured: true
  ```
- [ ] **If you see `Is Configured: false`**, env vars are not loaded correctly - fix before proceeding

### Step 2: Test Signup Flow

#### 2.1 Attempt Signup
- [ ] Navigate to: `https://yourapp.vercel.app/register`
- [ ] Fill in the registration form with **NEW** email (not previously used):
  - Email: `test-signup-[timestamp]@example.com` (use unique email)
  - Password: `TestPassword123!`
  - Full Name: `Test User`
  - Phone: `+212600000000` (optional)
  - Company Name: `Test Company` (optional)
- [ ] Open browser console (F12 → Console tab)
- [ ] Click "S'inscrire" (Register) button
- [ ] **Do NOT close the browser** - keep console open to view logs

#### 2.2 Verify Console Logs
Watch for these logs in browser console:

- [ ] Should see: `🔐 SIGNUP PROCESS STARTED`
- [ ] Should see: `Step 1: Checking Supabase configuration...`
- [ ] Should see: `✅ Supabase is configured`
- [ ] Should see: `Step 2: Signup attempt details` with your email
- [ ] Should see: `Step 4: Calling supabase.auth.signUp()...`
- [ ] Should see: `Step 5: Signup API call completed in XXXms`
- [ ] Should see: `✅ SIGNUP API CALL SUCCESSFUL`
- [ ] Should see user details: `User ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

**If you see error logs:**
- [ ] Copy the entire error message
- [ ] Note the error status code
- [ ] Check if it's an env var issue, RLS policy issue, or other

#### 2.3 Verify Success Screen
- [ ] Browser should show success message: "Compte créé avec succès!"
- [ ] Should display: "Vérifiez votre email pour le lien de confirmation"
- [ ] Button should say: "Aller à la connexion"

### Step 3: Verify User in Supabase Dashboard

#### 3.1 Check Auth Users Table
- [ ] Go to Supabase Dashboard → Authentication → Users
- [ ] Look for the email you just registered
- [ ] **User should appear in the list** (this is the critical check!)
- [ ] Note the user's:
  - Email: Should match what you entered
  - Confirmed At: May be empty if email confirmation is required
  - Created At: Should be just now
  - User ID: Should be a UUID

**If user does NOT appear:**
- [ ] Check Supabase logs (Dashboard → Logs → Postgres Logs)
- [ ] Look for errors related to `handle_new_user` trigger
- [ ] Check if migration was applied correctly

#### 3.2 Check Profiles Table
- [ ] Go to Supabase Dashboard → Database → Table Editor → profiles
- [ ] Search for your test email
- [ ] **Profile should exist** with:
  - `id`: Matches user ID from auth.users
  - `email`: Your test email
  - `full_name`: "Test User"
  - `phone`: "+212600000000" (if you provided it)
  - `user_role`: "real_estate_advertiser"
  - `company_name`: "Test Company" (if you provided it)
  - `is_active`: `true`

**If profile does NOT exist:**
- [ ] The database trigger is not working
- [ ] Check migration `035_fix_signup_rls_policy.sql` was applied
- [ ] Run this query to check trigger exists:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  ```

### Step 4: Test Email Confirmation (if enabled)

**Only if email confirmation is enabled in Supabase Auth settings:**

- [ ] Check the email inbox for the test email address
- [ ] Look for email from Supabase
- [ ] Subject should be about email confirmation
- [ ] Click the confirmation link in the email
- [ ] Should redirect to your app (login page)
- [ ] Go back to Supabase Dashboard → Authentication → Users
- [ ] User's "Confirmed At" should now have a timestamp

### Step 5: Test Login

- [ ] Navigate to: `https://yourapp.vercel.app/login`
- [ ] Enter the email and password you used for signup
- [ ] Open browser console (F12)
- [ ] Click "Se connecter" (Login) button
- [ ] Should see console logs:
  - `🔐 SIGNIN PROCESS STARTED`
  - `✅ SIGNIN SUCCESSFUL`
- [ ] Should be redirected to dashboard or home page
- [ ] Should see user's name or profile info in the header

**If login fails:**
- [ ] Check error message in console
- [ ] Common issues:
  - Email not confirmed (if confirmation is required)
  - Wrong password
  - User doesn't exist (check auth.users table)

### Step 6: Verify Session Persistence

- [ ] After successful login, refresh the page
- [ ] Should remain logged in (not redirected to login page)
- [ ] User's profile should still be loaded
- [ ] Open another tab and navigate to the app
- [ ] Should be logged in there too

### Step 7: Verify Profile Data

- [ ] Navigate to your profile/account page (if exists)
- [ ] Verify all profile data is displayed correctly:
  - Full name
  - Email
  - Phone (if provided)
  - Company name (if provided)
  - User role

## Common Issues and Solutions

### Issue 1: User not appearing in Supabase Auth
**Symptoms:** Signup appears successful but user doesn't show in Dashboard → Authentication → Users

**Solutions:**
1. Check browser console for actual signup errors
2. Check if env vars are correctly set in Vercel
3. Check Supabase logs for API errors
4. Verify Supabase project is not paused/suspended
5. Try signup with a different email address

### Issue 2: Profile not created
**Symptoms:** User exists in auth.users but not in profiles table

**Solutions:**
1. Verify migration `035_fix_signup_rls_policy.sql` was applied
2. Check RLS policy with:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```
3. Check trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
4. Manually test trigger by creating a test user via Supabase Dashboard

### Issue 3: "Supabase not configured" error
**Symptoms:** Console shows `❌ SIGNUP BLOCKED: Supabase not configured`

**Solutions:**
1. Verify env vars in Vercel:
   - Go to Settings → Environment Variables
   - Check `VITE_SUPABASE_URL` exists and is correct
   - Check `VITE_SUPABASE_ANON_KEY` exists and is correct
2. After fixing env vars, redeploy the application
3. Check startup logs show `Is Configured: true`

### Issue 4: Email not sent
**Symptoms:** Signup successful but no confirmation email received

**Solutions:**
1. Check Supabase Dashboard → Authentication → Settings → Email Templates
2. Verify SMTP is configured correctly
3. Check spam/junk folder
4. Try with a different email provider (Gmail, Outlook, etc.)
5. Check Supabase logs for email sending errors

### Issue 5: Login fails after signup
**Symptoms:** User created but cannot login

**Solutions:**
1. If email confirmation is enabled:
   - Check email for confirmation link
   - Click link to confirm email
   - Then try login again
2. Verify password is correct (6+ characters)
3. Check user status in Supabase Dashboard (not banned/disabled)
4. Try password reset if needed

## Production Monitoring (Ongoing)

### Daily Checks (First Week)
- [ ] Check Supabase Dashboard → Authentication → Users
  - Verify new signups are appearing
  - Monitor signup rate
- [ ] Check Supabase Logs → Postgres Logs
  - Look for any trigger errors
  - Look for RLS policy errors
- [ ] Check Vercel Analytics/Logs
  - Monitor signup page traffic
  - Check for JavaScript errors on register page

### Weekly Checks (After First Week)
- [ ] Verify user count growth
- [ ] Run this query to check user/profile sync:
  ```sql
  SELECT 
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT p.id) as total_profiles,
    COUNT(DISTINCT u.id) - COUNT(DISTINCT p.id) as missing_profiles
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id;
  ```
  - `missing_profiles` should be 0
  - If > 0, some profiles failed to create - investigate

## Success Criteria

✅ **All checks must pass for signup to be considered fully working:**

1. [ ] Env vars correctly loaded (startup logs show `Is Configured: true`)
2. [ ] Migration applied (RLS policy and trigger exist)
3. [ ] Signup form submission works without errors
4. [ ] Browser console shows successful signup logs
5. [ ] User appears in Supabase → Authentication → Users
6. [ ] Profile created in profiles table with correct data
7. [ ] Email confirmation works (if enabled)
8. [ ] User can login successfully
9. [ ] Session persists across page refreshes
10. [ ] Profile data displayed correctly in UI

## Rollback Plan

If signup is still not working after all fixes:

### Option 1: Disable Email Confirmation Temporarily
- [ ] Go to Supabase → Authentication → Settings
- [ ] Disable "Confirm email"
- [ ] Test signup again
- [ ] This helps identify if the issue is email-related

### Option 2: Check for Supabase Service Issues
- [ ] Visit Supabase Status Page: https://status.supabase.com
- [ ] Check if there are any ongoing incidents

### Option 3: Re-run Migration
- [ ] Go to Supabase → SQL Editor
- [ ] Copy content of `035_fix_signup_rls_policy.sql`
- [ ] Run it again (it's idempotent, safe to re-run)

### Option 4: Contact Support
- [ ] Gather all logs (Vercel + Supabase + Browser console)
- [ ] Document exact steps to reproduce
- [ ] Contact Supabase support or post in Discord

## Additional Resources

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Supabase RLS Docs**: https://supabase.com/docs/guides/auth/row-level-security
- **Vercel Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables
- **GitHub Issue Template**: Document any issues found during verification

---

**Last Updated**: 2026-01-24
**Version**: 1.0
**Maintained by**: Development Team
