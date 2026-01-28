-- =====================================================
-- Migration 048: Remove Profile Trigger Logic
-- =====================================================
--
-- OBJECTIVE:
-- Simplify signup to plain Supabase Auth (email + password only).
-- Remove all automatic profile creation, role logic, and admin whitelist.
--
-- CHANGES:
-- 1. Drop trigger on auth.users that creates profiles
-- 2. Drop handle_new_user() function
-- 3. Drop admin whitelist promotion trigger
-- 4. Drop check_and_promote_admin() function
-- 5. Drop admin_whitelist table
-- 6. Ensure auth.users signup works independently
--
-- WHY:
-- Current setup fails with "Database error saving new user" due to
-- complex trigger logic. Moving to simple auth-only flow.
--
-- =====================================================

-- =====================================================
-- STEP 1: Drop triggers
-- =====================================================

-- Drop trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop trigger on profiles
DROP TRIGGER IF EXISTS on_profile_check_admin_whitelist ON public.profiles;

-- =====================================================
-- STEP 2: Drop functions
-- =====================================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.check_and_promote_admin() CASCADE;

-- =====================================================
-- STEP 3: Drop admin whitelist table
-- =====================================================

DROP TABLE IF EXISTS public.admin_whitelist CASCADE;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify triggers are removed:
-- SELECT tgname, tgrelid::regclass
-- FROM pg_trigger
-- WHERE tgname IN ('on_auth_user_created', 'on_profile_check_admin_whitelist');
-- Expected: 0 rows

-- Verify functions are removed:
-- SELECT proname FROM pg_proc 
-- WHERE proname IN ('handle_new_user', 'check_and_promote_admin');
-- Expected: 0 rows

-- Verify admin_whitelist table is removed:
-- SELECT tablename FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename = 'admin_whitelist';
-- Expected: 0 rows

-- =====================================================
-- ROLLBACK NOTES
-- =====================================================

-- To rollback this migration:
-- 1. Re-run migration 047_fix_profile_trigger_not_null_defensive.sql
-- 2. Re-run migration 045_add_admin_whitelist_and_fix_signup.sql
-- 3. This will restore all trigger logic

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================

-- After this migration:
-- - New users will only be created in auth.users
-- - No automatic profile creation in public.profiles
-- - Frontend is responsible for profile creation if needed
-- - Signup only requires email + password
-- - No role/announcer_type logic on signup

-- =====================================================
-- END OF MIGRATION
-- =====================================================
