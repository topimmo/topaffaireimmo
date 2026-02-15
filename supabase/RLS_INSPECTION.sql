-- =====================================================
-- SUPABASE RLS INSPECTION AND DIAGNOSTIC SCRIPT
-- =====================================================
-- Run this in Supabase SQL Editor to inspect current RLS policies
-- This script helps identify missing or incorrect RLS policies
--
-- Usage: Copy this entire file and paste into Supabase SQL Editor
--        Review the output to identify RLS issues
-- =====================================================

-- =====================================================
-- PART 1: RLS STATUS ON ALL TABLES
-- =====================================================
-- Check which tables have RLS enabled
-- Expected: All tables used by frontend should have RLS enabled

SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✓ ENABLED'
    ELSE '✗ DISABLED'
  END as rls_status,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- PART 2: LIST ALL RLS POLICIES BY TABLE
-- =====================================================
-- Shows all policies on public schema tables

SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK'
    ELSE 'No WITH CHECK'
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- PART 3: DETAILED POLICY INSPECTION FOR KEY TABLES
-- =====================================================

-- 3.1 PROFILES table policies
SELECT 
  '=== PROFILES TABLE ===' as section,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY cmd, policyname;

-- 3.2 PROPERTIES table policies
SELECT 
  '=== PROPERTIES TABLE ===' as section,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'properties'
ORDER BY cmd, policyname;

-- 3.3 SITE_SETTINGS table policies
SELECT 
  '=== SITE_SETTINGS TABLE ===' as section,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'site_settings'
ORDER BY cmd, policyname;

-- 3.4 ARTISAN_PROFILES table policies
SELECT 
  '=== ARTISAN_PROFILES TABLE ===' as section,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'artisan_profiles'
ORDER BY cmd, policyname;

-- =====================================================
-- PART 4: STORAGE POLICIES
-- =====================================================

-- 4.1 List storage buckets
SELECT 
  '=== STORAGE BUCKETS ===' as section,
  id,
  name,
  CASE WHEN public THEN '✓ PUBLIC' ELSE '✗ PRIVATE' END as access,
  created_at
FROM storage.buckets
ORDER BY name;

-- 4.2 Storage objects policies
SELECT 
  '=== STORAGE POLICIES ===' as section,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as using_expression
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- =====================================================
-- PART 5: ROLE GRANTS AND PERMISSIONS
-- =====================================================

-- 5.1 Check table permissions for anon role
SELECT 
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee = 'anon'
ORDER BY table_name, privilege_type;

-- 5.2 Check table permissions for authenticated role
SELECT 
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee = 'authenticated'
ORDER BY table_name, privilege_type;

-- =====================================================
-- PART 6: ADMIN ROLE VERIFICATION
-- =====================================================

-- 6.1 Check if is_admin() function exists
SELECT 
  '=== ADMIN FUNCTION CHECK ===' as section,
  proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND proname = 'is_admin';

-- 6.2 Count users by role
SELECT 
  '=== USER ROLE DISTRIBUTION ===' as section,
  user_role,
  COUNT(*) as user_count
FROM public.profiles
GROUP BY user_role
ORDER BY user_count DESC;

-- 6.3 List admin users (first 10)
SELECT 
  '=== ADMIN USERS ===' as section,
  id,
  full_name,
  email,
  user_role,
  created_at
FROM public.profiles
WHERE user_role = 'admin'
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- PART 7: SECURITY DEFINER FUNCTIONS
-- =====================================================
-- Functions that run with elevated privileges
-- These can bypass RLS if not carefully designed

SELECT 
  '=== SECURITY DEFINER FUNCTIONS ===' as section,
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE 
    WHEN p.prosecdef THEN '⚠️ SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security_type,
  pg_get_userbyid(p.proowner) as owner
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY function_name;

-- =====================================================
-- PART 8: MISSING POLICIES CHECK
-- =====================================================
-- Identify tables with RLS enabled but no policies

SELECT 
  '=== TABLES WITH RLS BUT NO POLICIES ===' as section,
  t.tablename,
  'RLS enabled but no policies found' as issue,
  'Add appropriate SELECT/INSERT/UPDATE/DELETE policies' as suggestion
FROM pg_tables t
LEFT JOIN (
  SELECT DISTINCT tablename
  FROM pg_policies
  WHERE schemaname = 'public'
) p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND p.tablename IS NULL
ORDER BY t.tablename;

-- =====================================================
-- PART 9: COMMON RLS ISSUES DETECTION
-- =====================================================

-- 9.1 Tables with SELECT but no INSERT policies (might block writes)
SELECT 
  '=== TABLES WITH SELECT BUT NO INSERT ===' as section,
  DISTINCT tablename
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'SELECT'
  AND tablename NOT IN (
    SELECT tablename FROM pg_policies 
    WHERE schemaname = 'public' AND cmd = 'INSERT'
  )
ORDER BY tablename;

-- 9.2 Public read tables (accessible without auth)
SELECT 
  '=== PUBLIC READABLE TABLES ===' as section,
  tablename,
  policyname,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'SELECT'
  AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
ORDER BY tablename;

-- =====================================================
-- PART 10: RECOMMENDATIONS
-- =====================================================

SELECT 
  '=== RECOMMENDATIONS ===' as section,
  '1. All tables with RLS enabled should have policies' as recommendation
UNION ALL
SELECT 
  '',
  '2. Anon role should only have SELECT on public tables'
UNION ALL
SELECT 
  '',
  '3. Authenticated role needs SELECT/INSERT/UPDATE on user tables'
UNION ALL
SELECT 
  '',
  '4. Admin operations should use is_admin() function'
UNION ALL
SELECT 
  '',
  '5. Storage buckets should have appropriate policies'
UNION ALL
SELECT 
  '',
  '6. Review SECURITY DEFINER functions carefully';

-- =====================================================
-- END OF INSPECTION SCRIPT
-- =====================================================
-- Next steps:
-- 1. Review the output above
-- 2. Identify missing or incorrect policies
-- 3. Use RLS_MINIMUM_POLICIES.sql to add missing policies
-- 4. Test with diagnose-frontend.ts script
-- =====================================================
