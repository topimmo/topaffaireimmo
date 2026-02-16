-- =====================================================
-- PRODUCTION SCHEMA VERIFICATION SCRIPT
-- =====================================================
-- 
-- PURPOSE: Verify production Supabase database schema
--          to diagnose "relation public.listings does not exist" error
-- 
-- USAGE:
--   1. Login to Supabase Dashboard (production project)
--   2. Navigate to SQL Editor
--   3. Copy and paste this entire script
--   4. Click "Run" or press Ctrl+Enter
--   5. Review results below
-- 
-- =====================================================

-- =====================================================
-- CHECK 1: Verify 'properties' table exists
-- =====================================================
-- Expected: Should return 1 row
-- If returns 0 rows: CRITICAL - Wrong database or missing table
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'CHECK 1: properties table';
  RAISE NOTICE '==========================================';
END $$;

SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASS: properties table exists'
    ELSE '❌ FAIL: properties table NOT FOUND'
  END as result,
  COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'properties';

-- =====================================================
-- CHECK 2: Verify 'listings' table does NOT exist
-- =====================================================
-- Expected: Should return 0 rows
-- If returns 1 row: CRITICAL - Wrong database (old schema)
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'CHECK 2: listings table (should NOT exist)';
  RAISE NOTICE '==========================================';
END $$;

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: listings table does NOT exist (correct)'
    ELSE '❌ FAIL: listings table EXISTS (wrong database!)'
  END as result,
  COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'listings';

-- =====================================================
-- CHECK 3: Verify 'properties_full' view exists
-- =====================================================
-- Expected: Should return 1 row
-- If returns 0 rows: View missing - run migration 034
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'CHECK 3: properties_full view';
  RAISE NOTICE '==========================================';
END $$;

SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASS: properties_full view exists'
    ELSE '⚠️  WARNING: properties_full view NOT FOUND (run migration 034)'
  END as result,
  COUNT(*) as view_count
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name = 'properties_full';

-- =====================================================
-- CHECK 4: Count columns in properties table
-- =====================================================
-- Expected: Should have 50+ columns
-- If fewer: Schema may be outdated
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'CHECK 4: properties table structure';
  RAISE NOTICE '==========================================';
END $$;

SELECT 
  CASE 
    WHEN COUNT(*) >= 50 THEN '✅ PASS: properties table has sufficient columns'
    WHEN COUNT(*) > 0 THEN '⚠️  WARNING: properties table has only ' || COUNT(*) || ' columns (may be outdated)'
    ELSE '❌ FAIL: properties table not found'
  END as result,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'properties';

-- =====================================================
-- CHECK 5: Verify migration status
-- =====================================================
-- Expected: Latest migration should be ≥ 121
-- If lower: Database needs migration updates
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'CHECK 5: Migration status';
  RAISE NOTICE '==========================================';
END $$;

SELECT 
  version as latest_migration_version,
  name as migration_name,
  executed_at,
  CASE 
    WHEN CAST(SPLIT_PART(version, '_', 1) AS INTEGER) >= 121 THEN '✅ PASS: Up to date (version ≥ 121)'
    WHEN CAST(SPLIT_PART(version, '_', 1) AS INTEGER) >= 100 THEN '⚠️  WARNING: Outdated (version ' || SPLIT_PART(version, '_', 1) || ', needs update to 121+)'
    ELSE '❌ FAIL: Severely outdated (version ' || SPLIT_PART(version, '_', 1) || ')'
  END as status
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 1;

-- =====================================================
-- CHECK 6: Verify RPC function 'get_listing_phone' exists
-- =====================================================
-- Expected: Should return 1 row
-- This function is used by reveal-phone edge function
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'CHECK 6: get_listing_phone RPC function';
  RAISE NOTICE '==========================================';
END $$;

SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASS: get_listing_phone function exists'
    ELSE '❌ FAIL: get_listing_phone function NOT FOUND (run migration 105)'
  END as result,
  COUNT(*) as function_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_listing_phone';

-- =====================================================
-- CHECK 7: Verify function queries correct table
-- =====================================================
-- This checks the function definition to ensure it queries 'properties', not 'listings'
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'CHECK 7: Function source code';
  RAISE NOTICE '==========================================';
END $$;

SELECT 
  proname as function_name,
  CASE 
    WHEN prosrc LIKE '%FROM public.properties%' THEN '✅ PASS: Function queries properties table (correct)'
    WHEN prosrc LIKE '%FROM public.listings%' THEN '❌ FAIL: Function queries listings table (WRONG!)'
    ELSE '⚠️  WARNING: Cannot determine source table'
  END as result,
  CASE 
    WHEN prosrc LIKE '%FROM public.properties%' THEN 'Queries: public.properties'
    WHEN prosrc LIKE '%FROM public.listings%' THEN 'Queries: public.listings (NEEDS FIX!)'
    ELSE 'Unknown'
  END as details
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_listing_phone';

-- =====================================================
-- CHECK 8: Sample data verification
-- =====================================================
-- Test if we can actually query the properties table
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'CHECK 8: Data access test';
  RAISE NOTICE '==========================================';
END $$;

SELECT 
  COUNT(*) as total_properties,
  COUNT(CASE WHEN status = 'published' THEN 1 END) as published_properties,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_properties,
  COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_properties,
  '✅ Successfully queried properties table' as result
FROM public.properties;

-- =====================================================
-- CHECK 9: Verify trigger exists
-- =====================================================
-- Check if the Facebook webhook trigger is present
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'CHECK 9: Facebook webhook trigger';
  RAISE NOTICE '==========================================';
END $$;

SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASS: on_property_approved trigger exists'
    ELSE '⚠️  WARNING: on_property_approved trigger NOT FOUND'
  END as result,
  COUNT(*) as trigger_count
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname = 'properties'
  AND t.tgname = 'on_property_approved';

-- =====================================================
-- CHECK 10: Verify trigger function
-- =====================================================
-- Ensure trigger function queries properties, not listings
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'CHECK 10: Trigger function source';
  RAISE NOTICE '==========================================';
END $$;

SELECT 
  proname as function_name,
  CASE 
    WHEN prosrc LIKE '%NEW%' AND prosrc LIKE '%status%' THEN '✅ PASS: Trigger function looks correct'
    ELSE '⚠️  WARNING: Trigger function may need review'
  END as result
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'trigger_facebook_webhook';

-- =====================================================
-- FINAL SUMMARY
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'VERIFICATION COMPLETE';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Review all CHECK results above.';
  RAISE NOTICE 'All checks should show ✅ PASS.';
  RAISE NOTICE '';
  RAISE NOTICE 'If any checks FAIL:';
  RAISE NOTICE '  1. You may be connected to the WRONG Supabase project';
  RAISE NOTICE '  2. Database may be missing migrations';
  RAISE NOTICE '  3. Schema may be from an old/different version';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  - Compare results with PRODUCTION_ENVIRONMENT_VERIFICATION_GUIDE.md';
  RAISE NOTICE '  - Verify VITE_SUPABASE_URL in Vercel matches this project';
  RAISE NOTICE '  - Apply missing migrations if needed';
  RAISE NOTICE '==========================================';
END $$;

-- =====================================================
-- OPTIONAL: List all tables for manual review
-- =====================================================
-- Uncomment to see all tables in public schema
/*
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
*/

-- =====================================================
-- OPTIONAL: List recent migrations
-- =====================================================
-- Uncomment to see last 20 migrations
/*
SELECT 
  version,
  name,
  executed_at
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 20;
*/
