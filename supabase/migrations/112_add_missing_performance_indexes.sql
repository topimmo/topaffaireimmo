-- =====================================================
-- Migration 112: Add Missing Performance Indexes (Issue #2)
-- =====================================================
-- Purpose: Improve database performance by adding missing indexes
-- Addresses: Slow filtering, aggregation, and pagination queries
-- =====================================================

-- =====================================================
-- 1. REQUESTS TABLE - USER/STATUS INDEX
-- =====================================================
-- Dashboard filtering: Fast lookup of user's requests by status
-- Issue requires: idx_requests_user_status on requests(user_id, status)
-- Schema uses: client_id instead of user_id

CREATE INDEX IF NOT EXISTS idx_requests_user_status
  ON public.requests(client_id, status);

COMMENT ON INDEX idx_requests_user_status IS 
  'Performance: Dashboard filtering - fast lookup of client requests by status';

-- =====================================================
-- 2. REVIEWS TABLE - ARTISAN INDEX
-- =====================================================
-- Artisan profile aggregation: Fast COUNT and AVG queries
-- Issue requires: idx_reviews_artisan on reviews(artisan_id)
-- Schema uses: artisan_profile_id instead of artisan_id
-- Note: A complex index with created_at already exists, but this simple
-- index is better for pure aggregation queries (COUNT, AVG, SUM)

CREATE INDEX IF NOT EXISTS idx_reviews_artisan
  ON public.reviews(artisan_profile_id);

COMMENT ON INDEX idx_reviews_artisan IS 
  'Performance: Artisan profile aggregation - optimized for COUNT/AVG rating queries';

-- =====================================================
-- 3. SERVICE REQUESTS TABLE - CITY FILTERING
-- =====================================================
-- City filtering: Fast lookup of requests by city
-- Issue requires: idx_service_requests_city on service_requests(city_id)
-- Schema: service_requests is the requests table
-- Note: idx_requests_city_status exists with (city_id, status, created_at)
-- but a simple city_id index is useful for basic city filters without status

CREATE INDEX IF NOT EXISTS idx_service_requests_city
  ON public.requests(city_id);

COMMENT ON INDEX idx_service_requests_city IS 
  'Performance: City filtering - fast lookup of requests by city';

-- =====================================================
-- 4. ORDERS TABLE - PAGINATION INDEX
-- =====================================================
-- Pagination: Fast ordering by creation date
-- Issue requires: idx_orders_created_desc on orders(created_at DESC)
-- Schema: No orders table exists, but wallet_transactions serves similar purpose
-- Note: idx_wallet_transactions_created_at already exists with DESC ordering

-- Check if wallet_transactions index exists (should already exist from migration 089)
-- If not, create it
CREATE INDEX IF NOT EXISTS idx_orders_created_desc
  ON public.wallet_transactions(created_at DESC);

COMMENT ON INDEX idx_orders_created_desc IS 
  'Performance: Transaction pagination - fast ordering by creation date';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all new indexes were created
-- SELECT 
--   indexname, 
--   indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND indexname IN (
--     'idx_requests_user_status',
--     'idx_reviews_artisan', 
--     'idx_service_requests_city',
--     'idx_orders_created_desc'
--   )
-- ORDER BY indexname;

-- Check index sizes
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   pg_size_pretty(pg_relation_size(indexrelid)) as index_size
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
--   AND indexname IN (
--     'idx_requests_user_status',
--     'idx_reviews_artisan',
--     'idx_service_requests_city', 
--     'idx_orders_created_desc'
--   )
-- ORDER BY indexname;

-- =====================================================
-- EXPECTED RESULTS
-- =====================================================
-- ✅ Faster artisan dashboards (requests filtered by user and status)
-- ✅ Faster review aggregation (COUNT, AVG rating calculations)
-- ✅ Optimized city-based filtering (requests by city)
-- ✅ Optimized pagination (transactions ordered by date)
-- ✅ Reduced overall query time for common operations
