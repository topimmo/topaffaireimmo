-- =====================================================
-- Migration 109: Performance Hardening - Missing Indexes
-- =====================================================
-- Purpose: Add missing performance indexes for common query patterns
-- Addresses: Slow queries on requests, reviews, and service_requests
-- =====================================================

-- =====================================================
-- 1. REQUESTS TABLE INDEXES
-- =====================================================

-- Index for user's requests filtered by status
-- Common query: SELECT * FROM requests WHERE client_id = ? AND status = ?
CREATE INDEX IF NOT EXISTS idx_requests_client_status 
  ON public.requests(client_id, status);

COMMENT ON INDEX idx_requests_client_status IS 
  'Performance: Fast lookup of user requests filtered by status';

-- =====================================================
-- 2. REVIEWS TABLE INDEXES  
-- =====================================================

-- Simple index on artisan_id for basic queries
-- Note: idx_reviews_artisan already exists with (artisan_profile_id, created_at DESC)
-- but we need a simpler one for COUNT and aggregate queries without ordering
CREATE INDEX IF NOT EXISTS idx_reviews_artisan_simple 
  ON public.reviews(artisan_profile_id)
  WHERE is_hidden = FALSE;

COMMENT ON INDEX idx_reviews_artisan_simple IS 
  'Performance: Fast COUNT and aggregate queries on artisan reviews';

-- =====================================================
-- 3. REQUESTS TABLE - CITY FILTER INDEX
-- =====================================================

-- Index for filtering requests by city (for admin or city-based views)
-- Note: idx_requests_service_city already covers (service_category_id, city_id, status)
-- This is a simpler index for city-only filters
CREATE INDEX IF NOT EXISTS idx_requests_city_status 
  ON public.requests(city_id, status, created_at DESC);

COMMENT ON INDEX idx_requests_city_status IS 
  'Performance: Fast lookup of requests by city and status with ordering';

-- =====================================================
-- 4. REQUESTS TABLE - COMPOSITE USER STATUS INDEX
-- =====================================================

-- Composite index for user status queries with ordering
-- This is an enhanced version of idx_requests_client_status with ordering
CREATE INDEX IF NOT EXISTS idx_requests_client_status_created 
  ON public.requests(client_id, status, created_at DESC);

COMMENT ON INDEX idx_requests_client_status_created IS 
  'Performance: Optimized for paginated user requests filtered by status';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- List all indexes on requests table
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' AND tablename = 'requests'
-- ORDER BY indexname;

-- List all indexes on reviews table  
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public' AND tablename = 'reviews'
-- ORDER BY indexname;

-- Check index usage (after running in production for a while)
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
--   AND tablename IN ('requests', 'reviews')
-- ORDER BY idx_scan DESC;
