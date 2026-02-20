-- =====================================================
-- SCHEMA VERIFICATION SCRIPT
-- =====================================================
-- 
-- PURPOSE: Automated schema verification to prevent production errors
--          - Verifies required tables exist
--          - Verifies required columns exist
--          - Detects schema mismatches before deployment
-- 
-- USAGE:
--   1. Login to Supabase Dashboard (production/staging project)
--   2. Navigate to SQL Editor
--   3. Copy and paste this entire script
--   4. Click "Run" or press Ctrl+Enter
--   5. Review results - all checks should show ✅ PASS
-- 
-- ERRORS TO PREVENT:
--   - ERROR 42P01: relation "public.listings" does not exist
--   - ERROR 42703: column "city" does not exist in artisan_services
-- 
-- =====================================================

-- =====================================================
-- CHECK 1: Verify 'properties' table exists (NOT 'listings')
-- =====================================================
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
    ELSE '❌ FAIL: listings table EXISTS (WRONG DATABASE!)'
  END as result,
  COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'listings';

-- =====================================================
-- CHECK 3: Verify 'artisan_services' table exists
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'CHECK 3: artisan_services table';
  RAISE NOTICE '==========================================';
END $$;

SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASS: artisan_services table exists'
    ELSE '❌ FAIL: artisan_services table NOT FOUND'
  END as result,
  COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'artisan_services';

-- =====================================================
-- CHECK 4: Verify 'admins' table exists
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'CHECK 4: admins table';
  RAISE NOTICE '==========================================';
END $$;

SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASS: admins table exists'
    ELSE '❌ FAIL: admins table NOT FOUND'
  END as result,
  COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'admins';

-- =====================================================
-- CHECK 5: Verify artisan_services columns (NO 'city' column)
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'CHECK 5: artisan_services columns';
  RAISE NOTICE '==========================================';
END $$;

WITH required_columns AS (
  SELECT unnest(ARRAY[
    'id',
    'artisan_id',
    'category_id',
    'subcategory_id',
    'price_type',
    'price_from',
    'price_to',
    'description_fr',
    'description_ar',
    'is_active',
    'created_at',
    'updated_at',
    'artisan_profile_id',
    'service_subcategory_id'
  ]) as column_name
),
existing_columns AS (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'artisan_services'
),
missing_columns AS (
  SELECT rc.column_name
  FROM required_columns rc
  LEFT JOIN existing_columns ec ON rc.column_name = ec.column_name
  WHERE ec.column_name IS NULL
)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: All required columns exist in artisan_services'
    ELSE '❌ FAIL: Missing ' || COUNT(*) || ' required columns: ' || STRING_AGG(column_name, ', ')
  END as result,
  COUNT(*) as missing_count
FROM missing_columns;

-- =====================================================
-- CHECK 6: Verify 'city' column does NOT exist in artisan_services
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'CHECK 6: city column (should NOT exist)';
  RAISE NOTICE '==========================================';
END $$;

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: city column does NOT exist in artisan_services (correct)'
    ELSE '❌ FAIL: city column EXISTS in artisan_services (schema mismatch!)'
  END as result,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'artisan_services'
  AND column_name = 'city';

-- =====================================================
-- CHECK 7: Verify properties table essential columns
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'CHECK 7: properties table columns';
  RAISE NOTICE '==========================================';
END $$;

WITH required_columns AS (
  SELECT unnest(ARRAY[
    'id',
    'created_at',
    'updated_at',
    'title_fr',
    'status',
    'owner_id',
    'city_id',
    'property_type'
  ]) as column_name
),
existing_columns AS (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'properties'
),
missing_columns AS (
  SELECT rc.column_name
  FROM required_columns rc
  LEFT JOIN existing_columns ec ON rc.column_name = ec.column_name
  WHERE ec.column_name IS NULL
)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: All required columns exist in properties'
    ELSE '❌ FAIL: Missing ' || COUNT(*) || ' required columns: ' || STRING_AGG(column_name, ', ')
  END as result,
  COUNT(*) as missing_count
FROM missing_columns;

-- =====================================================
-- CHECK 8: Verify NO database functions reference 'listings' table
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'CHECK 8: RPC functions (no listings refs)';
  RAISE NOTICE '==========================================';
END $$;

WITH functions_with_listings AS (
  SELECT 
    p.proname as function_name,
    CASE 
      WHEN p.prosrc ILIKE '%FROM%listings%' 
        OR p.prosrc ILIKE '%JOIN%listings%'
        OR p.prosrc ILIKE '%public.listings%'
      THEN 'references listings table'
      ELSE 'clean'
    END as status
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND (
      p.prosrc ILIKE '%FROM%listings%'
      OR p.prosrc ILIKE '%JOIN%listings%'
      OR p.prosrc ILIKE '%public.listings%'
    )
)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: No RPC functions reference listings table'
    ELSE '❌ FAIL: ' || COUNT(*) || ' functions reference listings: ' || STRING_AGG(function_name, ', ')
  END as result,
  COUNT(*) as function_count
FROM functions_with_listings;

-- =====================================================
-- CHECK 9: Verify NO database views reference 'listings' table
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'CHECK 9: Views (no listings refs)';
  RAISE NOTICE '==========================================';
END $$;

WITH views_with_listings AS (
  SELECT 
    table_name as view_name,
    view_definition
  FROM information_schema.views
  WHERE table_schema = 'public'
    AND (
      view_definition ILIKE '%FROM%listings%'
      OR view_definition ILIKE '%JOIN%listings%'
      OR view_definition ILIKE '%public.listings%'
    )
)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: No views reference listings table'
    ELSE '❌ FAIL: ' || COUNT(*) || ' views reference listings: ' || STRING_AGG(view_name, ', ')
  END as result,
  COUNT(*) as view_count
FROM views_with_listings;

-- =====================================================
-- CHECK 10: Verify NO indexes reference 'city' column in artisan_services
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'CHECK 10: Indexes on artisan_services';
  RAISE NOTICE '==========================================';
END $$;

WITH invalid_indexes AS (
  SELECT 
    i.indexname
  FROM pg_indexes i
  WHERE i.schemaname = 'public'
    AND i.tablename = 'artisan_services'
    AND (
      i.indexdef ILIKE '%city%'
    )
)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: No invalid indexes on artisan_services (no city column refs)'
    ELSE '❌ FAIL: ' || COUNT(*) || ' invalid indexes: ' || STRING_AGG(indexname, ', ')
  END as result,
  COUNT(*) as invalid_index_count
FROM invalid_indexes;

-- =====================================================
-- CHECK 11: Verify properties sorting uses created_at
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'CHECK 11: Properties indexes for sorting';
  RAISE NOTICE '==========================================';
END $$;

SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS: Indexes exist for created_at sorting'
    ELSE '⚠️  WARNING: No indexes found for created_at sorting (may impact performance)'
  END as result,
  COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'properties'
  AND indexdef ILIKE '%created_at%';

-- =====================================================
-- CHECK 12: Verify migration version is up to date
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'CHECK 12: Migration status';
  RAISE NOTICE '==========================================';
END $$;

SELECT 
  version as latest_migration,
  name as migration_name,
  executed_at,
  CASE 
    WHEN CAST(SPLIT_PART(version, '_', 1) AS INTEGER) >= 121 THEN '✅ PASS: Migrations up to date (version ≥ 121)'
    WHEN CAST(SPLIT_PART(version, '_', 1) AS INTEGER) >= 100 THEN '⚠️  WARNING: Migrations may be outdated (version ' || SPLIT_PART(version, '_', 1) || ')'
    ELSE '❌ FAIL: Migrations severely outdated (version ' || SPLIT_PART(version, '_', 1) || ')'
  END as status
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 1;

-- =====================================================
-- FINAL SUMMARY
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'SCHEMA VERIFICATION COMPLETE';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Review all CHECK results above.';
  RAISE NOTICE 'All checks should show ✅ PASS.';
  RAISE NOTICE '';
  RAISE NOTICE 'If any checks FAIL:';
  RAISE NOTICE '  1. Verify you are connected to the correct Supabase project';
  RAISE NOTICE '  2. Apply missing migrations';
  RAISE NOTICE '  3. Fix schema mismatches before deploying code';
  RAISE NOTICE '';
  RAISE NOTICE 'Common issues:';
  RAISE NOTICE '  - ERROR 42P01: Wrong database (listings vs properties)';
  RAISE NOTICE '  - ERROR 42703: Missing/extra columns (e.g., city in artisan_services)';
  RAISE NOTICE '==========================================';
END $$;
