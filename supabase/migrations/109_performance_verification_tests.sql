-- =====================================================
-- Performance Indexes Verification Test Suite
-- =====================================================
-- Purpose: Verify that performance indexes are created and working
-- Run this after applying migration 109
-- =====================================================

-- =====================================================
-- 1. VERIFY ALL INDEXES EXIST
-- =====================================================

-- Check requests table indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'requests'
  AND indexname IN (
    'idx_requests_client_status',
    'idx_requests_city_status', 
    'idx_requests_client_status_created'
  )
ORDER BY indexname;

-- Expected: 3 rows showing the new indexes

-- Check reviews table indexes  
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'reviews'
  AND indexname = 'idx_reviews_artisan_simple'
ORDER BY indexname;

-- Expected: 1 row showing the new index

-- =====================================================
-- 2. TEST INDEX PERFORMANCE WITH EXPLAIN
-- =====================================================

-- Test 1: User requests by status (should use idx_requests_client_status_created)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, title, status, created_at
FROM public.requests
WHERE client_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND status = 'pending'
ORDER BY created_at DESC
LIMIT 20;

-- Expected: Index Scan using idx_requests_client_status_created

-- Test 2: Reviews by artisan (should use idx_reviews_artisan_simple for COUNT)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT COUNT(*)
FROM public.reviews
WHERE artisan_profile_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND is_hidden = FALSE;

-- Expected: Index Scan using idx_reviews_artisan_simple

-- Test 3: Requests by city and status (should use idx_requests_city_status)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, title, city_id, status, created_at
FROM public.requests
WHERE city_id = 1
  AND status = 'pending'
ORDER BY created_at DESC
LIMIT 50;

-- Expected: Index Scan using idx_requests_city_status

-- =====================================================
-- 3. CHECK INDEX SIZES
-- =====================================================

SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('requests', 'reviews')
  AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Expected: All new indexes should show reasonable sizes

-- =====================================================
-- 4. SIMULATE COMMON QUERY PATTERNS
-- =====================================================

-- Pattern 1: Admin dashboard - Recent pending requests
SELECT 
  r.id,
  r.title,
  r.status,
  r.created_at,
  c.name_fr as city_name
FROM public.requests r
LEFT JOIN public.cities c ON r.city_id = c.id
WHERE r.status = 'pending'
ORDER BY r.created_at DESC
LIMIT 20;

-- Pattern 2: User's request history with status filter
SELECT
  id,
  title,
  status,
  artisan_profile_id,
  created_at
FROM public.requests
WHERE client_id = auth.uid()
  AND status IN ('pending', 'viewed', 'contacted')
ORDER BY created_at DESC
LIMIT 10;

-- Pattern 3: Artisan review count and average
SELECT
  artisan_profile_id,
  COUNT(*) as review_count,
  AVG(rating) as avg_rating
FROM public.reviews
WHERE artisan_profile_id IN (
  SELECT id FROM public.artisan_profiles WHERE is_verified = TRUE
)
  AND is_hidden = FALSE
GROUP BY artisan_profile_id
HAVING COUNT(*) >= 5
ORDER BY avg_rating DESC, review_count DESC
LIMIT 20;

-- Pattern 4: City-based request filtering
SELECT
  COUNT(*) as total_requests,
  status,
  city_id
FROM public.requests
WHERE city_id IN (1, 2, 3, 4, 5)
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY city_id, status
ORDER BY city_id, status;

-- =====================================================
-- 5. PERFORMANCE COMPARISON (Before/After)
-- =====================================================

-- Run these queries and compare execution times:

-- Query A: User requests with status filter
\timing on
SELECT COUNT(*) FROM public.requests 
WHERE client_id = '00000000-0000-0000-0000-000000000001'::uuid 
  AND status = 'pending';
\timing off

-- Query B: Reviews count by artisan
\timing on
SELECT COUNT(*) FROM public.reviews 
WHERE artisan_profile_id = '00000000-0000-0000-0000-000000000001'::uuid 
  AND is_hidden = FALSE;
\timing off

-- Query C: City requests with ordering
\timing on
SELECT * FROM public.requests 
WHERE city_id = 1 
  AND status = 'pending' 
ORDER BY created_at DESC 
LIMIT 20;
\timing off

-- =====================================================
-- EXPECTED RESULTS
-- =====================================================

-- All indexes should exist
-- EXPLAIN ANALYZE should show index scans (not sequential scans)
-- Query times should be < 10ms for indexed queries
-- Index sizes should be reasonable (< 10% of table size for most cases)

-- =====================================================
-- NOTES
-- =====================================================

-- 1. These tests use dummy UUIDs. Replace with actual IDs from your data.
-- 2. Run ANALYZE on tables after migration to update statistics:
--    ANALYZE public.requests;
--    ANALYZE public.reviews;
-- 3. Monitor index usage in production with pg_stat_user_indexes
-- 4. Consider REINDEX if index becomes bloated over time
