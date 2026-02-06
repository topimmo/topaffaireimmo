-- =====================================================
-- RLS Policy Verification Script
-- =====================================================
-- Run this script AFTER applying migration 083 to verify
-- that all policies are correctly configured
-- =====================================================

-- =====================================================
-- TEST 1: Count Total Policies
-- =====================================================
-- Expected: 7 policies total
SELECT 
  '1. Total Policy Count' AS test,
  COUNT(*) AS actual,
  7 AS expected,
  CASE WHEN COUNT(*) = 7 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM pg_policies 
WHERE tablename = 'properties';

-- =====================================================
-- TEST 2: Check for Duplicate Policy Names
-- =====================================================
-- Expected: 0 duplicates
SELECT 
  '2. Duplicate Policy Names' AS test,
  COUNT(*) AS duplicate_count,
  0 AS expected,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM (
  SELECT policyname
  FROM pg_policies 
  WHERE tablename = 'properties'
  GROUP BY policyname
  HAVING COUNT(*) > 1
) duplicates;

-- =====================================================
-- TEST 3: List All Policies (Detailed)
-- =====================================================
SELECT 
  '3. Policy Inventory' AS test,
  policyname,
  cmd,
  roles::text,
  CASE 
    WHEN policyname LIKE '%admin%' THEN 'admin'
    WHEN policyname LIKE '%own%' THEN 'owner'
    ELSE 'other'
  END AS role_type
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY cmd, policyname;

-- =====================================================
-- TEST 4: Verify Policy Distribution
-- =====================================================
-- Expected: 2 SELECT, 1 INSERT, 2 UPDATE, 2 DELETE
SELECT 
  '4. Policy Distribution' AS test,
  cmd,
  COUNT(*) AS count,
  CASE cmd
    WHEN 'SELECT' THEN 2
    WHEN 'INSERT' THEN 1
    WHEN 'UPDATE' THEN 2
    WHEN 'DELETE' THEN 2
    ELSE 0
  END AS expected,
  CASE 
    WHEN cmd = 'SELECT' AND COUNT(*) = 2 THEN '✅ PASS'
    WHEN cmd = 'INSERT' AND COUNT(*) = 1 THEN '✅ PASS'
    WHEN cmd = 'UPDATE' AND COUNT(*) = 2 THEN '✅ PASS'
    WHEN cmd = 'DELETE' AND COUNT(*) = 2 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END AS status
FROM pg_policies 
WHERE tablename = 'properties'
GROUP BY cmd
ORDER BY cmd;

-- =====================================================
-- TEST 5: Verify RLS is Enabled
-- =====================================================
-- Expected: TRUE
SELECT 
  '5. RLS Enabled' AS test,
  relname AS table_name,
  relrowsecurity AS rls_enabled,
  TRUE AS expected,
  CASE WHEN relrowsecurity = TRUE THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM pg_class
WHERE relname = 'properties'
  AND relnamespace = 'public'::regnamespace;

-- =====================================================
-- TEST 6: Verify properties_public View Exists
-- =====================================================
-- Expected: View exists and grants to anon
SELECT 
  '6. Public View Exists' AS test,
  schemaname,
  viewname,
  viewowner,
  '✅ EXISTS' AS status
FROM pg_views
WHERE viewname = 'properties_public'
  AND schemaname = 'public';

-- =====================================================
-- TEST 7: Check View Permissions
-- =====================================================
-- Expected: anon and authenticated have SELECT on view
SELECT 
  '7. View Permissions' AS test,
  grantee,
  privilege_type,
  '✅ GRANTED' AS status
FROM information_schema.role_table_grants
WHERE table_name = 'properties_public'
  AND table_schema = 'public'
  AND privilege_type = 'SELECT'
  AND grantee IN ('anon', 'authenticated');

-- =====================================================
-- TEST 8: Verify No Legacy Policies Remain
-- =====================================================
-- Expected: 0 (all should be dropped)
SELECT 
  '8. Legacy Policies Removed' AS test,
  COUNT(*) AS legacy_count,
  0 AS expected,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM pg_policies 
WHERE tablename = 'properties'
  AND policyname IN (
    'public_view_approved',
    'owner_view_own',
    'admin_view_all',
    'realtor_insert',
    'owner_update',
    'admin_update',
    'owner_delete',
    'admin_delete',
    'Anyone can view approved properties',
    'Users can view own properties',
    'Real estate advertisers can insert properties',
    'Users can update own properties',
    'Users can delete own properties',
    'Admins full access to properties',
    'Admins can view all properties',
    'Admins can update all properties',
    'Admins can delete all properties',
    'Properties can be inserted by authenticated users',
    'Properties are viewable by everyone',
    'Properties can be updated by owner',
    'Properties can be deleted by owner',
    'Users can view their own properties',
    'Users can insert their own properties',
    'Users can update their own properties',
    'Users can delete their own properties',
    'properties_insert_real_estate',
    'properties_select_approved',
    'properties_insert_authenticated' -- Only if from old migration
  );

-- =====================================================
-- TEST 9: Verify Policy Naming Convention
-- =====================================================
-- Expected: All policies follow properties_{action}_{role} pattern
SELECT 
  '9. Naming Convention' AS test,
  policyname,
  CASE 
    WHEN policyname ~ '^properties_(select|insert|update|delete)_(own|admin)$' THEN '✅ PASS'
    ELSE '❌ FAIL (invalid name)'
  END AS status
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY policyname;

-- =====================================================
-- TEST 10: Verify Admin Table Exists
-- =====================================================
-- Expected: admins table exists with user_id column
SELECT 
  '10. Admins Table Structure' AS test,
  table_name,
  column_name,
  data_type,
  '✅ EXISTS' AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admins'
  AND column_name = 'user_id';

-- =====================================================
-- TEST 11: Verify Trigger Exists
-- =====================================================
-- Expected: protect_property_status trigger exists
SELECT 
  '11. Status Protection Trigger' AS test,
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  CASE tgenabled
    WHEN 'O' THEN '✅ ENABLED'
    WHEN 'D' THEN '❌ DISABLED'
    ELSE '⚠️ UNKNOWN'
  END AS status
FROM pg_trigger
WHERE tgname = 'protect_property_status_trigger';

-- =====================================================
-- SUMMARY REPORT
-- =====================================================
SELECT 
  '============================================' AS divider
UNION ALL
SELECT 
  'SUMMARY: RLS Policy Verification Complete' AS divider
UNION ALL
SELECT 
  '============================================' AS divider;

-- Check overall pass/fail
WITH test_results AS (
  SELECT CASE WHEN COUNT(*) = 7 THEN 1 ELSE 0 END AS test1
  FROM pg_policies WHERE tablename = 'properties'
  
  UNION ALL
  
  SELECT CASE WHEN COUNT(*) = 0 THEN 1 ELSE 0 END AS test1
  FROM (
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'properties'
    GROUP BY policyname HAVING COUNT(*) > 1
  ) d
  
  UNION ALL
  
  SELECT CASE WHEN relrowsecurity = TRUE THEN 1 ELSE 0 END
  FROM pg_class
  WHERE relname = 'properties' AND relnamespace = 'public'::regnamespace
)
SELECT 
  'Total Tests Passed' AS metric,
  SUM(test1) AS count,
  'out of 3 core tests' AS note
FROM test_results;

-- =====================================================
-- MANUAL TESTING INSTRUCTIONS
-- =====================================================
/*
After running this script, perform these manual tests:

1. TEST ANONYMOUS USER (should fail on table, succeed on view)
   
   SET ROLE anon;
   SELECT COUNT(*) FROM public.properties; -- Should return 0 or permission denied
   SELECT COUNT(*) FROM public.properties_public; -- Should work
   RESET ROLE;

2. TEST AUTHENTICATED USER (replace USER_UUID)
   
   SET LOCAL role authenticated;
   SET LOCAL request.jwt.claim.sub = 'USER_UUID';
   SELECT COUNT(*) FROM public.properties WHERE created_by = 'USER_UUID' OR owner_id = 'USER_UUID';
   -- Should return user's properties
   RESET ROLE;

3. TEST ADMIN USER (replace ADMIN_UUID)
   
   SET LOCAL role authenticated;
   SET LOCAL request.jwt.claim.sub = 'ADMIN_UUID';
   SELECT COUNT(*) FROM public.properties;
   -- Should return all properties (if ADMIN_UUID in admins table)
   RESET ROLE;

4. TEST INSERT RESTRICTIONS
   
   SET LOCAL role authenticated;
   SET LOCAL request.jwt.claim.sub = 'USER_UUID';
   INSERT INTO public.properties (created_by, owner_id, title_fr, status)
   VALUES ('USER_UUID', 'USER_UUID', 'Test Property', 'draft');
   -- Should succeed
   RESET ROLE;

5. TEST UPDATE RESTRICTIONS (non-admin cannot update published)
   
   SET LOCAL role authenticated;
   SET LOCAL request.jwt.claim.sub = 'USER_UUID';
   UPDATE public.properties 
   SET title_fr = 'Updated Title'
   WHERE id = 'SOME_PUBLISHED_PROPERTY_ID';
   -- Should fail (trigger prevents updates to published)
   RESET ROLE;

6. TEST ADMIN BYPASS
   
   SET LOCAL role authenticated;
   SET LOCAL request.jwt.claim.sub = 'ADMIN_UUID';
   UPDATE public.properties 
   SET status = 'published'
   WHERE id = 'SOME_DRAFT_PROPERTY_ID';
   -- Should succeed (admin can change any status)
   RESET ROLE;
*/

-- =====================================================
-- END OF VERIFICATION SCRIPT
-- =====================================================
