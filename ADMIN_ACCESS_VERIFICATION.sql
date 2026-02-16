-- =====================================================
-- ADMIN ACCESS VERIFICATION SCRIPT
-- =====================================================
-- Purpose: Test and verify unified authorization system
-- for properties and artisan_services moderation
-- Run these queries in Supabase SQL Editor to verify
-- the authorization system is working correctly.
-- =====================================================

-- =====================================================
-- TEST 1: VERIFY ADMIN STATUS CHECKING
-- =====================================================

-- List all admins
SELECT 
  '=== ALL ADMINS ===' as test_section,
  a.user_id,
  u.email,
  a.is_active,
  a.role,
  a.created_at
FROM public.admins a
LEFT JOIN auth.users u ON a.user_id = u.id
ORDER BY a.is_active DESC, a.created_at;

-- Test permission functions (run while logged in as different users)
SELECT 
  '=== PERMISSION CHECKS ===' as test_section,
  public.is_admin() as is_admin,
  public.can_approve_properties() as can_approve_properties,
  public.can_approve_services() as can_approve_services,
  auth.uid() as current_user_id;

-- =====================================================
-- TEST 2: VERIFY PROPERTIES MODERATION
-- =====================================================

-- Count properties by status
SELECT 
  '=== PROPERTIES BY STATUS ===' as test_section,
  status,
  COUNT(*) as count
FROM public.properties
GROUP BY status
ORDER BY count DESC;

-- =====================================================
-- TEST 3: VERIFY ARTISAN SERVICES MODERATION
-- =====================================================

-- Count services by status
SELECT 
  '=== ARTISAN SERVICES BY STATUS ===' as test_section,
  status,
  COUNT(*) as count
FROM public.artisan_services
GROUP BY status
ORDER BY count DESC;

-- =====================================================
-- TEST 4: VERIFY RLS POLICIES
-- =====================================================

-- Properties RLS policies
SELECT 
  '=== PROPERTIES RLS POLICIES ===' as test_section,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY cmd, policyname;

-- Artisan Services RLS policies
SELECT 
  '=== ARTISAN SERVICES RLS POLICIES ===' as test_section,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'artisan_services'
ORDER BY cmd, policyname;

-- =====================================================
-- TEST 5: VERIFY RPC FUNCTIONS
-- =====================================================

-- List moderation RPC functions
SELECT 
  '=== MODERATION RPC FUNCTIONS ===' as test_section,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname LIKE '%approve%'
    OR p.proname LIKE '%reject%'
    OR p.proname LIKE '%permission%'
  )
ORDER BY p.proname;

-- =====================================================
-- SUMMARY
-- =====================================================

SELECT 
  '=== SUMMARY ===' as section,
  (SELECT COUNT(*) FROM public.admins WHERE is_active = TRUE) as active_admins,
  (SELECT COUNT(*) FROM public.properties WHERE status = 'pending') as pending_properties,
  (SELECT COUNT(*) FROM public.artisan_services WHERE status = 'pending') as pending_services;
