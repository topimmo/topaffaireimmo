# Verification and Testing Guide

This document provides a complete checklist for verifying the admin whitelist fix and testing the implementation.

## Pre-Implementation Diagnosis

Run these queries **BEFORE** applying either fix option to understand the current state.

### 1. Check for Triggers on public.profiles

```sql
-- List ALL triggers on public.profiles table
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgfoid::regproc AS function_name,
  tgenabled AS enabled,
  CASE tgtype & 1 WHEN 1 THEN 'ROW' ELSE 'STATEMENT' END AS level,
  CASE 
    WHEN tgtype & 2 = 2 THEN 'BEFORE'
    WHEN tgtype & 64 = 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END AS timing,
  CASE 
    WHEN tgtype & 4 = 4 THEN 'INSERT '
    ELSE ''
  END ||
  CASE 
    WHEN tgtype & 8 = 8 THEN 'UPDATE '
    ELSE ''
  END ||
  CASE 
    WHEN tgtype & 16 = 16 THEN 'DELETE '
    ELSE ''
  END AS events
FROM pg_trigger
WHERE tgrelid = 'public.profiles'::regclass
  AND NOT tgisinternal
ORDER BY tgname;
```

**Expected if issue exists:** You should see triggers like `on_profile_check_admin_whitelist` or similar.

**Expected after Option A:** No admin-related triggers (or only unrelated triggers).

**Expected after Option B:** Trigger `on_profile_check_admin_whitelist` present and enabled.

### 2. Check for Admin/Whitelist Functions

```sql
-- Find all functions related to admin promotion or whitelist
SELECT 
  n.nspname AS schema_name,
  p.proname AS function_name,
  p.prosecdef AS security_definer,
  pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname LIKE '%admin%'
    OR p.proname LIKE '%whitelist%'
    OR p.proname LIKE '%promote%'
  )
ORDER BY p.proname;
```

**Expected if issue exists:** Functions with names like `promote_admin_if_whitelisted` or `check_and_promote_admin`.

**Expected after Option A:** No admin/whitelist functions.

**Expected after Option B:** Function `promote_admin_if_whitelisted` exists with `security_definer = true`.

### 3. View Function Source Code

```sql
-- Get the full source code of the problematic function
-- Replace 'promote_admin_if_whitelisted' with the actual function name from error
SELECT pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'promote_admin_if_whitelisted'
  AND pronamespace = 'public'::regnamespace;
```

**What to look for:**
- Does it reference `public.admin_whitelist` table?
- Is it using `SECURITY DEFINER`?
- Does it have proper error handling?
- What event does it run on (INSERT/UPDATE)?

### 4. Check if admin_whitelist Table Exists

```sql
-- Check for admin_whitelist table
SELECT 
  schemaname,
  tablename,
  tableowner,
  rowsecurity AS rls_enabled,
  hastriggers
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'admin_whitelist';
```

**Expected if issue exists:** Either no rows (table doesn't exist) OR 1 row (table exists but trigger is broken).

**Expected after Option A:** No rows (table removed).

**Expected after Option B:** 1 row with `rls_enabled = true`.

### 5. Check Triggers on auth.users

```sql
-- List triggers on auth.users (if any)
SELECT 
  tgname AS trigger_name,
  tgfoid::regproc AS function_name,
  tgenabled AS enabled,
  CASE 
    WHEN tgtype & 4 = 4 THEN 'INSERT '
    ELSE ''
  END AS events
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND NOT tgisinternal
ORDER BY tgname;
```

**Note:** After Migration 048, there should be no triggers on `auth.users`.

### 6. Check profiles Table Structure

```sql
-- List all columns in profiles table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;
```

**What to verify:**
- `email` column exists (TEXT or VARCHAR)
- `user_role` column exists (TEXT with values like 'user', 'admin', 'agent', 'merchant')
- `is_admin` column exists (BOOLEAN)
- `announcer_type` column may exist (TEXT, nullable)

### 7. Check RLS Policies on profiles

```sql
-- List all RLS policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;
```

**Note:** RLS policies are independent of the admin whitelist fix.

---

## Post-Implementation Verification

Run these queries **AFTER** applying your chosen fix option.

### Option A Verification (Remove Admin Whitelist)

#### A1. Verify Cleanup Completed

```sql
-- Should return 0 rows for each query

-- No admin_whitelist table
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'admin_whitelist';

-- No admin/whitelist functions
SELECT proname FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('promote_admin_if_whitelisted', 'check_and_promote_admin', 'handle_new_user');

-- No admin whitelist triggers on profiles
SELECT tgname FROM pg_trigger 
WHERE tgrelid = 'public.profiles'::regclass
  AND tgname IN ('on_profile_check_admin_whitelist', 'check_admin_whitelist');

-- No triggers on auth.users
SELECT tgname FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass
  AND tgname = 'on_auth_user_created';
```

**Expected:** All queries return 0 rows.

#### A2. Test Profile Insert

```sql
-- Test inserting a profile manually (requires a valid auth.users ID)
-- This should succeed WITHOUT triggering any admin whitelist logic

DO $$
DECLARE
  test_user_id UUID;
  test_email TEXT := 'test.manual.insert@example.com';
BEGIN
  -- Generate a test UUID
  test_user_id := gen_random_uuid();
  
  -- Try inserting a profile
  -- Note: In production, the user_id should exist in auth.users
  INSERT INTO public.profiles (id, email, user_role, is_active, is_verified)
  VALUES (test_user_id, test_email, 'user', true, false)
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE 'Successfully inserted profile for %', test_email;
  
  -- Cleanup
  DELETE FROM public.profiles WHERE id = test_user_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Insert failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;
```

**Expected:** SUCCESS message, no errors about admin_whitelist.

### Option B Verification (Implement Admin Whitelist)

#### B1. Verify Table Created

```sql
-- Check admin_whitelist table exists with correct structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admin_whitelist'
ORDER BY ordinal_position;
```

**Expected columns:**
- `email` (TEXT, NOT NULL, PRIMARY KEY)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `created_by` (UUID, nullable)
- `notes` (TEXT, nullable)

#### B2. Verify RLS Policies

```sql
-- Check RLS is enabled and policies exist
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'admin_whitelist'
ORDER BY policyname;
```

**Expected:** 4 policies (SELECT, INSERT, UPDATE, DELETE) all for authenticated role.

#### B3. Verify Function

```sql
-- Check function exists with correct configuration
SELECT 
  p.proname AS function_name,
  p.prosecdef AS is_security_definer,
  p.provolatile AS volatility,
  p.proconfig AS config_settings
FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace
  AND p.proname = 'promote_admin_if_whitelisted';
```

**Expected:** 
- `is_security_definer = true`
- `config_settings` includes `search_path`

#### B4. Verify Trigger

```sql
-- Check trigger exists and is enabled
SELECT 
  tgname AS trigger_name,
  tgfoid::regproc AS function_name,
  tgenabled AS enabled,
  CASE 
    WHEN tgtype & 2 = 2 THEN 'BEFORE'
    WHEN tgtype & 64 = 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END AS timing,
  CASE 
    WHEN tgtype & 4 = 4 THEN 'INSERT '
    ELSE ''
  END ||
  CASE 
    WHEN tgtype & 8 = 8 THEN 'UPDATE '
    ELSE ''
  END AS events
FROM pg_trigger
WHERE tgrelid = 'public.profiles'::regclass
  AND tgname = 'on_profile_check_admin_whitelist';
```

**Expected:** 
- 1 row
- `enabled = 'O'` (origin/enabled)
- `timing = 'BEFORE'`
- `events = 'INSERT UPDATE'`

#### B5. Test Admin Promotion

```sql
-- Test the admin whitelist promotion mechanism
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'whitelist.test@example.com';
  final_role TEXT;
  final_is_admin BOOLEAN;
BEGIN
  -- Step 1: Add email to whitelist (requires admin role or service_role)
  INSERT INTO public.admin_whitelist (email, notes)
  VALUES (LOWER(test_email), 'Automated test - will be deleted')
  ON CONFLICT (email) DO NOTHING;
  
  RAISE NOTICE 'Added % to whitelist', test_email;
  
  -- Step 2: Insert a profile with that email (user_role = 'user')
  INSERT INTO public.profiles (id, email, user_role, is_active, is_verified)
  VALUES (test_user_id, test_email, 'user', true, false);
  
  -- Step 3: Check if it was promoted to admin
  SELECT user_role, is_admin INTO final_role, final_is_admin
  FROM public.profiles
  WHERE id = test_user_id;
  
  IF final_role = 'admin' AND final_is_admin = true THEN
    RAISE NOTICE '✅ SUCCESS: Profile was automatically promoted to admin!';
    RAISE NOTICE '   Email: %, Role: %, is_admin: %', test_email, final_role, final_is_admin;
  ELSE
    RAISE WARNING '❌ FAILURE: Profile was NOT promoted to admin';
    RAISE WARNING '   Email: %, Role: %, is_admin: %', test_email, final_role, final_is_admin;
  END IF;
  
  -- Step 4: Cleanup
  DELETE FROM public.profiles WHERE id = test_user_id;
  DELETE FROM public.admin_whitelist WHERE email = LOWER(test_email);
  
  RAISE NOTICE 'Test cleanup complete';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Test failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    -- Attempt cleanup even on failure
    BEGIN
      DELETE FROM public.profiles WHERE id = test_user_id;
      DELETE FROM public.admin_whitelist WHERE email = LOWER(test_email);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;
```

**Expected:** SUCCESS message indicating profile was promoted to admin.

---

## Testing with Actual Users

### Test 1: Add Real Admin Email to Whitelist

```sql
-- Add a real admin email (requires admin role)
INSERT INTO public.admin_whitelist (email, notes)
VALUES ('admin@yourdomain.com', 'Primary administrator')
ON CONFLICT (email) DO NOTHING;

-- Verify it was added
SELECT * FROM public.admin_whitelist 
WHERE email = 'admin@yourdomain.com';
```

### Test 2: Create Profile with Whitelisted Email

**Via Supabase Auth (if auth flow is enabled):**
1. Sign up a new user with the whitelisted email
2. Check if the profile was created with admin role

**Via SQL (manual testing):**
```sql
-- Requires a real user ID from auth.users
-- Get a user ID first:
SELECT id, email FROM auth.users WHERE email = 'admin@yourdomain.com';

-- Then insert/update profile
INSERT INTO public.profiles (id, email, user_role, is_active)
VALUES ('<user-id-from-above>', 'admin@yourdomain.com', 'user', true)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    updated_at = NOW();

-- Check if promoted
SELECT id, email, user_role, is_admin 
FROM public.profiles 
WHERE email = 'admin@yourdomain.com';
```

**Expected:** `user_role = 'admin'` and `is_admin = true`.

### Test 3: Update Email to Whitelisted Email

```sql
-- Test updating an existing profile's email to a whitelisted email
-- First add email to whitelist
INSERT INTO public.admin_whitelist (email, notes)
VALUES ('newemail@yourdomain.com', 'Test - email change')
ON CONFLICT (email) DO NOTHING;

-- Then update an existing profile
UPDATE public.profiles
SET email = 'newemail@yourdomain.com'
WHERE id = '<some-existing-user-id>';

-- Check if promoted
SELECT id, email, user_role, is_admin
FROM public.profiles
WHERE id = '<some-existing-user-id>';
```

**Expected:** `user_role = 'admin'` and `is_admin = true`.

### Test 4: Non-Whitelisted Email Should Not Be Promoted

```sql
-- Insert profile with non-whitelisted email
INSERT INTO public.profiles (id, email, user_role, is_active)
VALUES (gen_random_uuid(), 'regular.user@example.com', 'user', true)
ON CONFLICT (id) DO NOTHING
RETURNING id, email, user_role, is_admin;

-- Clean up
DELETE FROM public.profiles WHERE email = 'regular.user@example.com';
```

**Expected:** `user_role = 'user'` and `is_admin = false` (no promotion).

---

## Common Issues and Troubleshooting

### Issue: "relation public.admin_whitelist does not exist"

**Diagnosis:**
```sql
-- Check if table exists
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'admin_whitelist';
```

**Solutions:**
- If table doesn't exist and you want whitelist → Run Option B
- If table doesn't exist and you don't want whitelist → Run Option A
- If table exists but you still get error → Check function definition

### Issue: "function promote_admin_if_whitelisted does not exist"

**Diagnosis:**
```sql
-- Check if function exists
SELECT proname FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'promote_admin_if_whitelisted';
```

**Solution:**
- If function doesn't exist but trigger does → Drop the trigger (Option A) or create function (Option B)
- Run the appropriate option script

### Issue: Trigger exists but doesn't fire

**Diagnosis:**
```sql
-- Check trigger status
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'public.profiles'::regclass
  AND tgname = 'on_profile_check_admin_whitelist';
```

**Solution:**
```sql
-- Enable trigger if disabled
ALTER TABLE public.profiles ENABLE TRIGGER on_profile_check_admin_whitelist;
```

### Issue: Permission denied when accessing admin_whitelist

**Diagnosis:**
Check your current role and RLS policies.

**Solution:**
- Access as admin user (has admin role in profiles)
- Or use service_role key
- Or grant temporary access via RLS policy

### Issue: Infinite recursion / stack overflow

**Diagnosis:**
The trigger may be calling itself repeatedly.

**Solution:**
- Ensure function uses BEFORE trigger (not AFTER)
- Add conditions to prevent re-triggering when already admin
- See the recursion prevention logic in Option B

---

## Final Checklist

### After Option A (Remove Whitelist)

- [ ] No admin_whitelist table exists
- [ ] No promote_admin_if_whitelisted function
- [ ] No on_profile_check_admin_whitelist trigger
- [ ] Can insert into profiles without errors
- [ ] No references to admin_whitelist in error logs

### After Option B (Implement Whitelist)

- [ ] admin_whitelist table exists with RLS enabled
- [ ] 4 RLS policies exist (SELECT, INSERT, UPDATE, DELETE)
- [ ] promote_admin_if_whitelisted function exists with SECURITY DEFINER
- [ ] on_profile_check_admin_whitelist trigger exists and is enabled
- [ ] Test promotion works (whitelisted email → admin role)
- [ ] Test non-promotion works (non-whitelisted email → user role)
- [ ] Admin emails added to whitelist
- [ ] No errors in function execution logs

---

## Additional Resources

### Useful Queries

**List all functions in public schema:**
```sql
SELECT proname, prosecdef 
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
ORDER BY proname;
```

**List all triggers in database:**
```sql
SELECT tgrelid::regclass AS table_name, tgname AS trigger_name, tgfoid::regproc AS function_name
FROM pg_trigger
WHERE NOT tgisinternal
ORDER BY tgrelid::regclass::text, tgname;
```

**Check function execution logs:**
```sql
-- In Supabase dashboard, check Logs > Postgres Logs
-- Look for NOTICE, WARNING, or ERROR messages from the functions
```

### Rollback Procedures

**Rollback Option A (restore whitelist):**
- Run OPTION_B_IMPLEMENT_ADMIN_WHITELIST.sql

**Rollback Option B (remove whitelist):**
- Run OPTION_A_REMOVE_ADMIN_WHITELIST.sql

---

## Expected Outcomes Summary

### Option A: Clean Database State
- Simple authentication flow
- No automatic role assignment
- Manual admin promotion required
- No trigger overhead on profile operations
- Fewer moving parts = more reliable

### Option B: Automated Admin Management
- Centralized admin whitelist
- Automatic promotion on signup/update
- Easy to add/remove admin access
- Secure (RLS + SECURITY DEFINER)
- Convenient for multi-admin setups

Choose the option that best fits your application's requirements!
