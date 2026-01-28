# Admin Whitelist Issue - Complete Diagnosis

## Problem Statement

Inserting into `public.profiles` fails with:
```
ERROR: 42P01: relation "public.admin_whitelist" does not exist
CONTEXT: PL/pgSQL function promote_admin_if_whitelisted() line 3 at SQL statement
```

## Root Cause Analysis

Based on migration history analysis:

1. **Migration 045** (`045_add_admin_whitelist_and_fix_signup.sql`):
   - Created `public.admin_whitelist` table
   - Created function `check_and_promote_admin()` (NOT `promote_admin_if_whitelisted()`)
   - Created trigger `on_profile_check_admin_whitelist` on `public.profiles`
   - Purpose: Auto-promote whitelisted emails to admin role

2. **Migration 048** (`048_remove_profile_trigger_logic.sql`):
   - Dropped `on_auth_user_created` trigger on `auth.users`
   - Dropped `handle_new_user()` function
   - Dropped `on_profile_check_admin_whitelist` trigger on `public.profiles`
   - Dropped `check_and_promote_admin()` function
   - Dropped `admin_whitelist` table
   - Purpose: Simplify signup to plain Supabase Auth (email + password only)

## The Problem

**Possible scenarios:**

### Scenario A: Incomplete migration cleanup
Migration 048 may not have fully executed, leaving behind:
- A trigger that still references the dropped function
- A function that wasn't properly dropped
- Direct database modifications that bypassed migrations

### Scenario B: Function name mismatch
The error mentions `promote_admin_if_whitelisted()` but migration 045 created `check_and_promote_admin()`. This suggests:
- Either a manual function was created with a different name
- Or the function was renamed at some point
- Or there's another migration we haven't seen

### Scenario C: Manual database changes
Someone may have created triggers/functions directly in the database without migrations.

## Current State Investigation

Use these SQL queries to diagnose the current database state:

### 1. Find ALL triggers on public.profiles
```sql
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
  AND NOT tgisinternal  -- Exclude internal triggers
ORDER BY tgname;
```

### 2. Find ALL functions that might reference admin_whitelist
```sql
SELECT 
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname LIKE '%admin%'
    OR p.proname LIKE '%whitelist%'
    OR p.proname LIKE '%promote%'
    OR pg_get_functiondef(p.oid) LIKE '%admin_whitelist%'
  )
ORDER BY p.proname;
```

### 3. Check if admin_whitelist table exists
```sql
SELECT 
  schemaname,
  tablename,
  tableowner,
  tablespace,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'admin_whitelist';
```

### 4. Find the specific function mentioned in error
```sql
-- Try to find promote_admin_if_whitelisted function
SELECT 
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'promote_admin_if_whitelisted';
```

### 5. Check triggers on auth.users
```sql
SELECT 
  tgname AS trigger_name,
  tgfoid::regproc AS function_name,
  tgenabled AS enabled
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND NOT tgisinternal
ORDER BY tgname;
```

### 6. List all profiles table columns
```sql
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

### 7. Check RLS policies on profiles
```sql
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

## Expected Findings

After running the diagnostic queries, you should find:

**If migration 048 completed successfully:**
- ❌ No `admin_whitelist` table
- ❌ No triggers on `public.profiles` related to admin promotion
- ❌ No functions with names like `promote_admin_if_whitelisted` or `check_and_promote_admin`
- ❌ No triggers on `auth.users` (like `on_auth_user_created`)

**If migration 048 failed or was incomplete:**
- ✅ Potentially the `admin_whitelist` table still exists
- ✅ Triggers or functions may still be present
- ⚠️ Mixed state requiring cleanup

**If manual changes were made:**
- ✅ Functions/triggers with unexpected names
- ✅ Resources not documented in migrations

## Next Steps

Based on the diagnostic results:

1. **If cleanup is needed** → Use Option A (Remove admin whitelist mechanism)
2. **If whitelist functionality is desired** → Use Option B (Implement whitelist properly)

## Dependencies Check

The admin whitelist mechanism depends on:

1. **Tables:**
   - `public.admin_whitelist` (email TEXT PRIMARY KEY, created_at TIMESTAMPTZ, ...)
   - `public.profiles` (must have: email, user_role, is_admin columns)

2. **Functions:**
   - Function to check whitelist and promote users (various names possible)
   - Must run with SECURITY DEFINER to bypass RLS

3. **Triggers:**
   - On `public.profiles` (INSERT/UPDATE) to check email against whitelist
   - Optionally on `auth.users` (INSERT) for initial profile creation

4. **Permissions:**
   - Functions need EXECUTE permission for postgres/service_role
   - RLS policies on admin_whitelist for admin-only access
   - Proper search_path set to prevent SQL injection

## Common Issues

### Issue 1: Function exists but table doesn't
**Symptom:** Error "relation public.admin_whitelist does not exist"  
**Cause:** Function was not dropped when table was dropped  
**Fix:** Use Option A to clean up completely

### Issue 2: Trigger calls wrong function
**Symptom:** Error referencing non-existent function  
**Cause:** Trigger definition references old function name  
**Fix:** Drop and recreate trigger with correct function

### Issue 3: Infinite recursion
**Symptom:** Stack overflow or transaction timeout  
**Cause:** Trigger on profiles table modifies profiles, causing re-trigger  
**Fix:** Use BEFORE trigger instead of AFTER, or add conditions to prevent recursion

### Issue 4: RLS blocking trigger
**Symptom:** Permission denied errors during trigger execution  
**Cause:** SECURITY DEFINER not set or search_path not locked  
**Fix:** Add SECURITY DEFINER and SET search_path to function

## Test Scenario

To reproduce the error and test fixes:

```sql
-- Attempt to insert a test profile (requires auth.users entry)
-- This should trigger the error if the issue exists

-- First, you need a user ID from auth.users
-- Example: INSERT INTO public.profiles (id, email, user_role)
-- VALUES ('some-uuid-from-auth-users', 'test@example.com', 'user');
```

**Expected error if issue exists:**
```
ERROR: 42P01: relation "public.admin_whitelist" does not exist
```

**Expected success after fix:**
```
INSERT 0 1
```
