-- =====================================================
-- SECTION C: VALIDATION QUERIES
-- =====================================================
-- Purpose: Verify that security remediation was successful
-- Run these queries after applying migration 079
-- =====================================================

-- -----------------------------------------------------
-- C.1: Verify RLS is Enabled on All Three Tables
-- -----------------------------------------------------

SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('advertising_inquiries', 'property_views', 'property_contact_clicks')
ORDER BY tablename;

-- Expected: All three tables should show "✅ RLS ENABLED"

-- -----------------------------------------------------
-- C.2: List All Policies for the Three Tables
-- -----------------------------------------------------

SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  CASE 
    WHEN qual::text LIKE '%true%' AND qual::text = 'true' THEN '⚠️  ALWAYS TRUE'
    WHEN qual IS NOT NULL THEN '✅ Has predicate'
    ELSE 'N/A (INSERT)'
  END as using_check,
  CASE 
    WHEN with_check::text LIKE '%true%' AND roles::text[] = '{anon}' THEN '⚠️  Anon INSERT (expected)'
    WHEN with_check::text LIKE '%true%' AND roles::text[] = '{authenticated}' THEN '⚠️  Auth INSERT (expected)'
    WHEN with_check IS NOT NULL THEN '✅ Has predicate'
    ELSE 'N/A'
  END as with_check_status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('advertising_inquiries', 'property_views', 'property_contact_clicks')
ORDER BY tablename, policyname;

-- Expected:
-- - INSERT policies for anon/authenticated should have WITH CHECK (true) - this is OK for tracking
-- - SELECT policies should be restricted to authenticated role with admin/owner checks
-- - No UPDATE/DELETE policies for anon role

-- -----------------------------------------------------
-- C.3: Verify No Public SELECT Access (Security Test)
-- -----------------------------------------------------
-- This simulates what an anonymous user would see

SET ROLE anon;

-- Test 1: Anonymous should NOT be able to SELECT from advertising_inquiries
SELECT COUNT(*) as anonymous_can_see_inquiries 
FROM advertising_inquiries;
-- Expected: ERROR (RLS policy violation) or 0 rows

-- Test 2: Anonymous should NOT be able to SELECT from property_views
SELECT COUNT(*) as anonymous_can_see_views 
FROM property_views;
-- Expected: ERROR (RLS policy violation) or 0 rows

-- Test 3: Anonymous should NOT be able to SELECT from property_contact_clicks  
SELECT COUNT(*) as anonymous_can_see_clicks 
FROM property_contact_clicks;
-- Expected: ERROR (RLS policy violation) or 0 rows

-- Reset role
RESET ROLE;

-- -----------------------------------------------------
-- C.4: Verify Public INSERT Still Works
-- -----------------------------------------------------
-- Verify that anonymous users can still submit forms/track analytics

SET ROLE anon;

-- Test 1: Verify INSERT into advertising_inquiries works
DO $$
BEGIN
  BEGIN
    INSERT INTO advertising_inquiries (full_name, email, message)
    VALUES ('Test User', 'test@example.com', 'Test inquiry');
    
    RAISE NOTICE '✅ Anonymous can INSERT into advertising_inquiries';
    
    -- Clean up test data
    DELETE FROM advertising_inquiries 
    WHERE email = 'test@example.com' AND full_name = 'Test User';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Anonymous CANNOT INSERT into advertising_inquiries: %', SQLERRM;
  END;
END $$;

-- Test 2: Verify INSERT into property_views works (requires valid property_id)
-- Note: This test assumes at least one property exists
DO $$
DECLARE
  test_property_id UUID;
BEGIN
  -- Get a property ID for testing
  SELECT id INTO test_property_id FROM properties LIMIT 1;
  
  IF test_property_id IS NOT NULL THEN
    BEGIN
      INSERT INTO property_views (property_id)
      VALUES (test_property_id);
      
      RAISE NOTICE '✅ Anonymous can INSERT into property_views';
      
      -- Clean up test data
      DELETE FROM property_views 
      WHERE property_id = test_property_id 
      AND created_at > NOW() - INTERVAL '1 minute';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Anonymous CANNOT INSERT into property_views: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '⚠️  No properties found for testing property_views INSERT';
  END IF;
END $$;

-- Test 3: Verify INSERT into property_contact_clicks works
DO $$
DECLARE
  test_property_id UUID;
BEGIN
  -- Get a property ID for testing
  SELECT id INTO test_property_id FROM properties LIMIT 1;
  
  IF test_property_id IS NOT NULL THEN
    BEGIN
      INSERT INTO property_contact_clicks (property_id, contact_type)
      VALUES (test_property_id, 'phone');
      
      RAISE NOTICE '✅ Anonymous can INSERT into property_contact_clicks';
      
      -- Clean up test data
      DELETE FROM property_contact_clicks 
      WHERE property_id = test_property_id 
      AND created_at > NOW() - INTERVAL '1 minute';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Anonymous CANNOT INSERT into property_contact_clicks: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '⚠️  No properties found for testing property_contact_clicks INSERT';
  END IF;
END $$;

-- Reset role
RESET ROLE;

-- -----------------------------------------------------
-- C.5: Verify Admin Access Works (Requires Admin User)
-- -----------------------------------------------------
-- This test must be run as an authenticated admin user
-- Skip if no admin user is available

-- Instructions: 
-- 1. Log in to Supabase as an admin user
-- 2. Run these queries to verify admin access

-- Test 1: Admins should be able to SELECT from advertising_inquiries
SELECT 
  COUNT(*) as admin_can_see_inquiries,
  'Expected: Count > 0 if data exists' as note
FROM advertising_inquiries;

-- Test 2: Admins should be able to SELECT from property_views
SELECT 
  COUNT(*) as admin_can_see_views,
  'Expected: Count > 0 if data exists' as note
FROM property_views;

-- Test 3: Admins should be able to SELECT from property_contact_clicks
SELECT 
  COUNT(*) as admin_can_see_clicks,
  'Expected: Count > 0 if data exists' as note
FROM property_contact_clicks;

-- Test 4: Admins should be able to UPDATE advertising_inquiries
DO $$
DECLARE
  test_inquiry_id UUID;
BEGIN
  -- Get an inquiry for testing
  SELECT id INTO test_inquiry_id FROM advertising_inquiries LIMIT 1;
  
  IF test_inquiry_id IS NOT NULL THEN
    BEGIN
      UPDATE advertising_inquiries 
      SET status = 'contacted' 
      WHERE id = test_inquiry_id;
      
      RAISE NOTICE '✅ Admin can UPDATE advertising_inquiries';
      
      -- Note: Don't revert the update as it's a valid admin action
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Admin CANNOT UPDATE advertising_inquiries: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '⚠️  No inquiries found for testing UPDATE';
  END IF;
END $$;

-- -----------------------------------------------------
-- C.6: Verify Indexes Were Created
-- -----------------------------------------------------

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('advertising_inquiries', 'property_views', 'property_contact_clicks', 'property_leads')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Expected: Should see the 8 new indexes created in migration 079:
-- 1. idx_advertising_inquiries_status_created
-- 2. idx_property_views_property_created
-- 3. idx_property_views_session_created
-- 4. idx_contact_clicks_property_type_created
-- 5. idx_property_leads_status_created
-- 6. idx_property_leads_advertiser_created
-- 7. idx_property_leads_property_created
-- Plus existing indexes from migration 078

-- -----------------------------------------------------
-- C.7: Performance Check - Index Usage Verification
-- -----------------------------------------------------
-- Check that indexes are being used (requires some data and queries)

SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('advertising_inquiries', 'property_views', 'property_contact_clicks', 'property_leads')
  AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;

-- Note: idx_scan will be 0 immediately after creation
-- Run application queries and check again later to verify index usage

-- -----------------------------------------------------
-- C.8: Summary Report
-- -----------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '=== VALIDATION SUMMARY ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Security Checks:';
  RAISE NOTICE '1. Verify all three tables show RLS ENABLED (C.1)';
  RAISE NOTICE '2. Verify policies are properly restricted (C.2)';
  RAISE NOTICE '3. Verify anonymous cannot SELECT sensitive data (C.3)';
  RAISE NOTICE '4. Verify anonymous can INSERT for tracking (C.4)';
  RAISE NOTICE '5. Verify admins can SELECT and UPDATE (C.5)';
  RAISE NOTICE '';
  RAISE NOTICE 'Performance Checks:';
  RAISE NOTICE '6. Verify 8 new indexes exist (C.6)';
  RAISE NOTICE '7. Monitor index usage over time (C.7)';
  RAISE NOTICE '';
  RAISE NOTICE 'Expected Outcomes:';
  RAISE NOTICE '✅ Security Advisor should no longer show "RLS Policy Always True" warnings';
  RAISE NOTICE '✅ Public cannot read sensitive data from the three tables';
  RAISE NOTICE '✅ Public can still submit forms and track analytics';
  RAISE NOTICE '✅ Admins can view and manage all data';
  RAISE NOTICE '✅ Performance should improve for common query patterns';
END $$;
