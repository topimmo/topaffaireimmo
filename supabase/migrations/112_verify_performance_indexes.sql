-- =====================================================
-- Migration 112 Verification: Performance Indexes Test
-- =====================================================
-- Purpose: Verify all required performance indexes exist
-- Run this after migration 112 to confirm successful deployment
-- =====================================================

-- =====================================================
-- 1. VERIFY INDEX EXISTENCE
-- =====================================================

DO $$
DECLARE
  v_missing_indexes TEXT[] := '{}';
  v_index_exists BOOLEAN;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Migration 112: Index Verification';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  
  -- Check idx_requests_user_status
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'requests' 
      AND indexname = 'idx_requests_user_status'
  ) INTO v_index_exists;
  
  IF v_index_exists THEN
    RAISE NOTICE '✅ idx_requests_user_status: EXISTS';
  ELSE
    RAISE WARNING '❌ idx_requests_user_status: MISSING';
    v_missing_indexes := array_append(v_missing_indexes, 'idx_requests_user_status');
  END IF;
  
  -- Check idx_reviews_artisan
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'reviews' 
      AND indexname = 'idx_reviews_artisan'
  ) INTO v_index_exists;
  
  IF v_index_exists THEN
    RAISE NOTICE '✅ idx_reviews_artisan: EXISTS';
  ELSE
    RAISE WARNING '❌ idx_reviews_artisan: MISSING';
    v_missing_indexes := array_append(v_missing_indexes, 'idx_reviews_artisan');
  END IF;
  
  -- Check idx_service_requests_city
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'requests' 
      AND indexname = 'idx_service_requests_city'
  ) INTO v_index_exists;
  
  IF v_index_exists THEN
    RAISE NOTICE '✅ idx_service_requests_city: EXISTS';
  ELSE
    RAISE WARNING '❌ idx_service_requests_city: MISSING';
    v_missing_indexes := array_append(v_missing_indexes, 'idx_service_requests_city');
  END IF;
  
  -- Check idx_orders_created_desc
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'wallet_transactions' 
      AND indexname = 'idx_orders_created_desc'
  ) INTO v_index_exists;
  
  IF v_index_exists THEN
    RAISE NOTICE '✅ idx_orders_created_desc: EXISTS';
  ELSE
    RAISE WARNING '❌ idx_orders_created_desc: MISSING';
    v_missing_indexes := array_append(v_missing_indexes, 'idx_orders_created_desc');
  END IF;
  
  RAISE NOTICE '';
  
  -- Summary
  IF array_length(v_missing_indexes, 1) IS NULL THEN
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ All 4 indexes verified successfully!';
    RAISE NOTICE '====================================';
  ELSE
    RAISE WARNING '====================================';
    RAISE WARNING '❌ Missing % index(es)', array_length(v_missing_indexes, 1);
    RAISE WARNING 'Missing indexes: %', array_to_string(v_missing_indexes, ', ');
    RAISE WARNING '====================================';
  END IF;
END $$;

-- =====================================================
-- 2. DISPLAY INDEX DETAILS
-- =====================================================

SELECT 
  indexname AS "Index Name",
  tablename AS "Table",
  pg_size_pretty(pg_relation_size(indexrelid)) AS "Size",
  indexdef AS "Definition"
FROM pg_indexes 
JOIN pg_stat_user_indexes USING (schemaname, tablename, indexname)
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_requests_user_status',
    'idx_reviews_artisan',
    'idx_service_requests_city',
    'idx_orders_created_desc'
  )
ORDER BY indexname;

-- =====================================================
-- 3. TEST INDEX USAGE (EXPLAIN PLANS)
-- =====================================================

-- Test 1: Dashboard filtering (should use idx_requests_user_status)
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT * FROM public.requests 
-- WHERE client_id = '00000000-0000-0000-0000-000000000000'::uuid
--   AND status = 'pending'
-- LIMIT 10;
-- Expected: Index Scan using idx_requests_user_status

-- Test 2: Review aggregation (should use idx_reviews_artisan)
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT 
--   COUNT(*) as total_reviews,
--   AVG(rating) as avg_rating
-- FROM public.reviews 
-- WHERE artisan_profile_id = '00000000-0000-0000-0000-000000000000'::uuid;
-- Expected: Index Scan using idx_reviews_artisan

-- Test 3: City filtering (should use idx_service_requests_city)
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT * FROM public.requests 
-- WHERE city_id = 1
-- LIMIT 10;
-- Expected: Index Scan using idx_service_requests_city

-- Test 4: Transaction pagination (should use idx_orders_created_desc)
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT * FROM public.wallet_transactions 
-- ORDER BY created_at DESC
-- LIMIT 20;
-- Expected: Index Scan using idx_orders_created_desc

-- =====================================================
-- 4. PERFORMANCE METRICS (after production use)
-- =====================================================

-- Check index usage statistics (run after some production traffic)
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as "Times Scanned",
--   idx_tup_read as "Tuples Read",
--   idx_tup_fetch as "Tuples Fetched",
--   pg_size_pretty(pg_relation_size(indexrelid)) as "Index Size"
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
--   AND indexname IN (
--     'idx_requests_user_status',
--     'idx_reviews_artisan',
--     'idx_service_requests_city',
--     'idx_orders_created_desc'
--   )
-- ORDER BY idx_scan DESC;
