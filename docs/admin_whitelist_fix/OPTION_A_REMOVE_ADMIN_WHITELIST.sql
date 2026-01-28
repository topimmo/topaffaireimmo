-- =====================================================
-- OPTION A: Remove Admin Whitelist Mechanism Completely
-- =====================================================
--
-- PURPOSE:
-- Safely remove all admin whitelist functionality from the database.
-- This is the recommended option if the whitelist feature is not needed.
--
-- WHAT THIS DOES:
-- 1. Drops all triggers on public.profiles related to admin promotion
-- 2. Drops all triggers on auth.users related to profile creation
-- 3. Drops all functions related to admin whitelist/promotion
-- 4. Drops the admin_whitelist table if it exists
-- 5. Ensures the database is in a clean, consistent state
--
-- SAFETY:
-- - Uses IF EXISTS to make script idempotent (safe to run multiple times)
-- - Does not affect other triggers or tables
-- - Preserves existing user data in profiles table
-- - Does not modify RLS policies (they remain functional)
--
-- WHEN TO USE:
-- - When you don't need automatic admin promotion based on email
-- - When you want to simplify the authentication flow
-- - When encountering errors about missing admin_whitelist table
-- - As recommended in Migration 048
--
-- =====================================================

-- =====================================================
-- STEP 1: Drop triggers on public.profiles
-- =====================================================

-- Drop trigger for admin whitelist check (from migration 045)
DROP TRIGGER IF EXISTS on_profile_check_admin_whitelist ON public.profiles;

-- Drop any other admin-related triggers that might exist
-- (add more if discovered during diagnosis)
DROP TRIGGER IF EXISTS check_admin_whitelist ON public.profiles;
DROP TRIGGER IF EXISTS promote_admin_trigger ON public.profiles;
DROP TRIGGER IF EXISTS auto_promote_admin ON public.profiles;

-- =====================================================
-- STEP 2: Drop triggers on auth.users
-- =====================================================

-- Drop trigger for automatic profile creation (from migration 045/047)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop any other profile creation triggers
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;

-- =====================================================
-- STEP 3: Drop functions (with CASCADE to drop dependent triggers)
-- =====================================================

-- Drop the function mentioned in the error
DROP FUNCTION IF EXISTS public.promote_admin_if_whitelisted() CASCADE;

-- Drop the function created in migration 045
DROP FUNCTION IF EXISTS public.check_and_promote_admin() CASCADE;

-- Drop the profile creation function from migration 045/047
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Drop any other related functions that might exist
DROP FUNCTION IF EXISTS public.auto_promote_admin() CASCADE;
DROP FUNCTION IF EXISTS public.check_whitelist() CASCADE;
DROP FUNCTION IF EXISTS public.promote_whitelisted_admin() CASCADE;

-- =====================================================
-- STEP 4: Drop admin_whitelist table
-- =====================================================

-- Drop the table (CASCADE will drop any dependent objects)
DROP TABLE IF EXISTS public.admin_whitelist CASCADE;

-- =====================================================
-- STEP 5: Verification queries
-- =====================================================

-- These queries verify that the cleanup was successful
-- Run them after executing this script

-- Check for remaining triggers on public.profiles
DO $$
BEGIN
  RAISE NOTICE '=== Checking for triggers on public.profiles ===';
END $$;

SELECT 
  tgname AS trigger_name,
  tgfoid::regproc AS function_name,
  CASE tgtype & 66
    WHEN 2 THEN 'BEFORE'
    WHEN 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END AS timing
FROM pg_trigger
WHERE tgrelid = 'public.profiles'::regclass
  AND NOT tgisinternal;
-- Expected: 0 rows (or only unrelated triggers)

-- Check for remaining triggers on auth.users
DO $$
BEGIN
  RAISE NOTICE '=== Checking for triggers on auth.users ===';
END $$;

SELECT 
  tgname AS trigger_name,
  tgfoid::regproc AS function_name
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND NOT tgisinternal;
-- Expected: 0 rows (or only unrelated triggers)

-- Check for remaining admin/whitelist functions
DO $$
BEGIN
  RAISE NOTICE '=== Checking for admin/whitelist functions ===';
END $$;

SELECT 
  p.proname AS function_name,
  n.nspname AS schema_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname LIKE '%admin%whitelist%'
    OR p.proname LIKE '%promote%admin%'
    OR p.proname LIKE '%check_and_promote%'
    OR p.proname = 'promote_admin_if_whitelisted'
    OR p.proname = 'check_and_promote_admin'
    OR p.proname = 'handle_new_user'
  )
ORDER BY p.proname;
-- Expected: 0 rows

-- Check if admin_whitelist table exists
DO $$
BEGIN
  RAISE NOTICE '=== Checking for admin_whitelist table ===';
END $$;

SELECT 
  tablename,
  schemaname
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'admin_whitelist';
-- Expected: 0 rows

-- =====================================================
-- STEP 6: Success message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Admin whitelist cleanup completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'What was removed:';
  RAISE NOTICE '  - All triggers on public.profiles for admin promotion';
  RAISE NOTICE '  - All triggers on auth.users for profile creation';
  RAISE NOTICE '  - All functions related to admin whitelist';
  RAISE NOTICE '  - The admin_whitelist table';
  RAISE NOTICE '';
  RAISE NOTICE 'What remains:';
  RAISE NOTICE '  - public.profiles table (with all existing data)';
  RAISE NOTICE '  - auth.users table (with all existing data)';
  RAISE NOTICE '  - All RLS policies (functioning normally)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Review the verification queries above';
  RAISE NOTICE '  2. Test inserting into public.profiles manually';
  RAISE NOTICE '  3. Test signup flow if using Supabase Auth';
  RAISE NOTICE '  4. Consider creating profiles manually or via frontend logic';
END $$;

-- =====================================================
-- TEST: Insert into profiles
-- =====================================================

-- Test that inserting into profiles now works without errors
-- (Requires a valid UUID from auth.users)

-- Example test (commented out - uncomment and modify to test):
/*
-- Get a user ID from auth.users to test with
DO $$
DECLARE
  test_user_id UUID;
  test_email TEXT;
BEGIN
  -- Get the first user from auth.users for testing
  SELECT id, email INTO test_user_id, test_email
  FROM auth.users
  LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Try to insert/update a profile
    INSERT INTO public.profiles (id, email, user_role, is_active, is_verified)
    VALUES (test_user_id, test_email, 'user', true, false)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = NOW();
    
    RAISE NOTICE '✅ Test insert successful for user %', test_email;
  ELSE
    RAISE NOTICE '⚠️  No users in auth.users to test with';
  END IF;
END $$;
*/

-- =====================================================
-- EXPECTED RESULTS AFTER RUNNING THIS SCRIPT
-- =====================================================

-- 1. No errors when inserting into public.profiles
-- 2. No triggers firing on profile insert/update
-- 3. No references to admin_whitelist anywhere
-- 4. Signup flow (if any) works without database errors
-- 5. Existing profiles and users are preserved

-- =====================================================
-- ROLLBACK (if you need to restore whitelist functionality)
-- =====================================================

-- If you need to restore the admin whitelist functionality:
-- 1. Run OPTION_B_IMPLEMENT_ADMIN_WHITELIST.sql
-- 2. Add admin emails to the whitelist table
-- 3. Test the promotion logic

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================

-- After running this script:
-- 
-- 1. PROFILES ARE NOT AUTO-CREATED
--    - New users will only be created in auth.users
--    - You must create profiles manually or via frontend logic
--    - Consider creating a profile management interface
--
-- 2. NO AUTOMATIC ROLE ASSIGNMENT
--    - user_role must be set manually
--    - Consider default values in the profiles table definition
--    - Or set via application logic after signup
--
-- 3. SIGNUP FLOW SIMPLIFIED
--    - Supabase Auth handles only authentication (email + password)
--    - No metadata is processed by database triggers
--    - Frontend is responsible for any profile creation
--
-- 4. ADMIN PROMOTION IS MANUAL
--    - Admins must be promoted manually via SQL or admin interface
--    - Example: UPDATE public.profiles SET user_role = 'admin', is_admin = true WHERE email = 'admin@example.com';
--
-- 5. RLS POLICIES STILL APPLY
--    - Row Level Security is independent of triggers
--    - Ensure your RLS policies allow necessary operations
--    - Test with different user roles to verify access

-- =====================================================
-- ADDITIONAL CLEANUP (Optional)
-- =====================================================

-- If you want to remove related RLS policies (only if they reference admin_whitelist):
-- 
-- WARNING: Only run these if the policies explicitly reference admin_whitelist table
-- and you've verified they're not needed for other functionality

/*
-- Example: Drop policies that check admin_whitelist
DROP POLICY IF EXISTS "check_admin_whitelist_policy" ON public.profiles;
*/

-- =====================================================
-- END OF SCRIPT
-- =====================================================
