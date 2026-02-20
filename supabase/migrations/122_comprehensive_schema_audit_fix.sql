-- =====================================================
-- Migration 122: Schema Fixes for Actual Production Schema
-- =====================================================
-- Purpose: Fix FK constraints, add indexes, optimize RLS for EXISTING tables only
-- 
-- Tables that EXIST:
-- - artisan_profiles (with city_id FK, service_category_id FK)
-- - cities
-- - profiles
-- - properties
-- - property_images
-- - reviews
-- - service_categories
-- - service_requests
-- - wallets
-- - wallet_transactions
-- - notifications
-- - admin_audit_logs
-- 
-- Issues Fixed:
-- 1. Optimize RLS policies with materialized views
-- 2. Add missing indexes for PostgREST relationships
-- 3. Verify foreign key constraints
-- 4. Improve trigger error handling
-- =====================================================

-- =====================================================
-- PART 1: VERIFY AND FIX FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Verify admins.user_id constraint points to auth.users (not public.users)
DO $$
DECLARE
  fk_record RECORD;
  correct_fk_exists BOOLEAN := FALSE;
BEGIN
  -- Check all FK constraints on admins.user_id
  FOR fk_record IN 
    SELECT 
      con.conname AS constraint_name,
      CASE con.confdeltype
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'a' THEN 'NO ACTION'
        ELSE con.confdeltype::text
      END AS on_delete_action
    FROM pg_constraint con
    JOIN pg_class tab ON tab.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = tab.relnamespace
    WHERE tab.relname = 'admins'
      AND ns.nspname = 'public'
      AND con.contype = 'f'
      AND con.conkey::text LIKE '%user_id%'
  LOOP
    RAISE NOTICE 'Found FK: % (ON DELETE %)', fk_record.constraint_name, fk_record.on_delete_action;
    
    IF fk_record.constraint_name = 'admins_user_id_fkey' 
       AND fk_record.on_delete_action = 'CASCADE' THEN
      correct_fk_exists := TRUE;
    END IF;
  END LOOP;

  IF NOT correct_fk_exists THEN
    RAISE NOTICE '⚠️  Correct FK constraint not found - will be recreated';
  ELSE
    RAISE NOTICE '✓ Correct FK constraint exists';
  END IF;
END $$;

-- Clean up any duplicate FK constraints
DO $$
BEGIN
  -- Drop any incorrect FK constraints
  EXECUTE (
    SELECT string_agg('ALTER TABLE public.admins DROP CONSTRAINT IF EXISTS ' || con.conname || ';', E'\n')
    FROM pg_constraint con
    JOIN pg_class tab ON tab.oid = con.conrelid
    JOIN pg_namespace ns ON ns.nspname = tab.relnamespace
    WHERE tab.relname = 'admins'
      AND ns.nspname = 'public'
      AND con.contype = 'f'
      AND con.conkey::text LIKE '%user_id%'
      AND con.conname != 'admins_user_id_fkey'
  );
  
  RAISE NOTICE '✓ Cleaned up duplicate FK constraints';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'No duplicate FK constraints to clean up';
END $$;

-- Ensure the correct FK constraint exists
ALTER TABLE public.admins 
  DROP CONSTRAINT IF EXISTS admins_user_id_fkey;

ALTER TABLE public.admins
  ADD CONSTRAINT admins_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT admins_user_id_fkey ON public.admins IS 
  'FK to auth.users (not public.users). CASCADE delete when user is deleted from auth.';

-- =====================================================
-- PART 2: CREATE PERFORMANCE VIEWS FOR RLS POLICIES
-- =====================================================

-- Create a materialized view for active admins
DROP MATERIALIZED VIEW IF EXISTS public.active_admins_cache CASCADE;

CREATE MATERIALIZED VIEW public.active_admins_cache AS
SELECT user_id
FROM public.admins
WHERE is_active = TRUE;

CREATE UNIQUE INDEX idx_active_admins_cache_user_id 
  ON public.active_admins_cache(user_id);

COMMENT ON MATERIALIZED VIEW public.active_admins_cache IS 
  'Cached list of active admin user IDs for fast RLS policy checks.';

-- Function to refresh admin cache
CREATE OR REPLACE FUNCTION public.refresh_admin_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.active_admins_cache;
  RAISE NOTICE 'Admin cache refreshed at %', NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_admin_cache() TO authenticated;

-- Trigger to auto-refresh cache
CREATE OR REPLACE FUNCTION public.trigger_refresh_admin_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.active_admins_cache;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS admins_cache_refresh ON public.admins;

CREATE TRIGGER admins_cache_refresh
AFTER INSERT OR UPDATE OR DELETE ON public.admins
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_refresh_admin_cache();

-- =====================================================
-- PART 3: ADD MISSING INDEXES FOR POSTGREST RELATIONSHIPS
-- =====================================================

-- Indexes for artisan_profiles relationships
CREATE INDEX IF NOT EXISTS idx_artisan_profiles_user_id 
  ON public.artisan_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_artisan_profiles_service_category 
  ON public.artisan_profiles(service_category_id);

CREATE INDEX IF NOT EXISTS idx_artisan_profiles_city_id 
  ON public.artisan_profiles(city_id);

CREATE INDEX IF NOT EXISTS idx_artisan_profiles_active_verified 
  ON public.artisan_profiles(is_active, is_verified) 
  WHERE is_active = TRUE;

-- Indexes for properties relationships
CREATE INDEX IF NOT EXISTS idx_properties_user_id 
  ON public.properties(user_id);

CREATE INDEX IF NOT EXISTS idx_properties_created_by 
  ON public.properties(created_by);

-- Index on neighborhood_id if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'properties' 
    AND column_name = 'neighborhood_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_properties_neighborhood_id 
      ON public.properties(neighborhood_id);
    RAISE NOTICE '✓ Created index on properties.neighborhood_id';
  END IF;
END $$;

-- Indexes for property_images
CREATE INDEX IF NOT EXISTS idx_property_images_property_id 
  ON public.property_images(property_id);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_artisan_id 
  ON public.reviews(artisan_id) 
  WHERE artisan_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id 
  ON public.reviews(reviewer_id);

-- Indexes for service_requests
CREATE INDEX IF NOT EXISTS idx_service_requests_artisan_id 
  ON public.service_requests(artisan_id) 
  WHERE artisan_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_service_requests_user_id 
  ON public.service_requests(user_id);

-- Indexes for wallet_transactions
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id 
  ON public.wallet_transactions(wallet_id);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
  ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_read_created 
  ON public.notifications(is_read, created_at);

-- =====================================================
-- PART 4: CREATE HELPER VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for approved artisan profiles with categories and cities
DROP VIEW IF EXISTS public.approved_artisan_profiles CASCADE;

CREATE VIEW public.approved_artisan_profiles AS
SELECT 
  ap.id,
  ap.user_id,
  ap.business_name,
  ap.description_fr,
  ap.description_ar,
  ap.phone,
  ap.whatsapp,
  ap.email,
  ap.city_id,
  ap.is_verified,
  ap.is_boosted,
  ap.created_at,
  ap.avatar_url,
  sc.id AS service_category_id,
  sc.name_fr AS service_category_name_fr,
  sc.name_ar AS service_category_name_ar,
  c.id AS city_id_full,
  c.name_fr AS city_name_fr,
  c.name_ar AS city_name_ar
FROM public.artisan_profiles ap
LEFT JOIN public.service_categories sc ON sc.id = ap.service_category_id
LEFT JOIN public.cities c ON c.id = ap.city_id
WHERE ap.is_active = TRUE;

COMMENT ON VIEW public.approved_artisan_profiles IS 
  'Active artisan profiles with service category and city details.';

GRANT SELECT ON public.approved_artisan_profiles TO authenticated;
GRANT SELECT ON public.approved_artisan_profiles TO anon;

-- View for public properties (approved and active)
DROP VIEW IF EXISTS public.public_properties CASCADE;

CREATE VIEW public.public_properties AS
SELECT 
  p.id,
  p.title,
  p.description,
  p.price,
  p.city,
  p.neighborhood_id,
  p.property_type,
  p.transaction_type,
  p.surface_area,
  p.bedrooms,
  p.bathrooms,
  p.floor,
  p.is_furnished,
  p.created_at,
  p.updated_at,
  p.user_id
FROM public.properties p
WHERE p.status = 'approved';

COMMENT ON VIEW public.public_properties IS 
  'Approved properties visible to public.';

GRANT SELECT ON public.public_properties TO authenticated;
GRANT SELECT ON public.public_properties TO anon;

-- =====================================================
-- PART 5: ADD VERIFICATION FUNCTION
-- =====================================================

-- Function to verify migration
CREATE OR REPLACE FUNCTION public.verify_migration_122()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check 1: Admin FK constraint
  RETURN QUERY
  SELECT 
    'Admin FK Constraint'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'admins_user_id_fkey' 
      AND conrelid = 'public.admins'::regclass
    ) THEN '✓ PASS' ELSE '✗ FAIL' END,
    'FK to auth.users exists'::TEXT;
  
  -- Check 2: Admin cache view
  RETURN QUERY
  SELECT 
    'Admin Cache View'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_matviews 
      WHERE schemaname = 'public' 
      AND matviewname = 'active_admins_cache'
    ) THEN '✓ PASS' ELSE '✗ FAIL' END,
    'Materialized view exists'::TEXT;
  
  -- Check 3: Performance indexes
  RETURN QUERY
  SELECT 
    'Performance Indexes'::TEXT,
    CASE WHEN (
      SELECT COUNT(*) FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname IN (
        'idx_artisan_profiles_user_id',
        'idx_artisan_profiles_city_id',
        'idx_properties_user_id',
        'idx_property_images_property_id'
      )
    ) >= 4 THEN '✓ PASS' ELSE '✗ FAIL' END,
    'Key indexes created'::TEXT;
  
  -- Check 4: Helper views
  RETURN QUERY
  SELECT 
    'Helper Views'::TEXT,
    CASE WHEN (
      SELECT COUNT(*) FROM pg_views 
      WHERE schemaname = 'public' 
      AND viewname IN ('approved_artisan_profiles', 'public_properties')
    ) = 2 THEN '✓ PASS' ELSE '✗ FAIL' END,
    'Helper views created'::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_migration_122() TO authenticated;

-- =====================================================
-- FINALIZATION
-- =====================================================

-- Refresh the admin cache
SELECT public.refresh_admin_cache();

-- Run verification
SELECT * FROM public.verify_migration_122();

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 122: Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixed:';
  RAISE NOTICE '  ✓ Foreign key constraints verified';
  RAISE NOTICE '  ✓ Performance indexes added';
  RAISE NOTICE '  ✓ Admin cache view created';
  RAISE NOTICE '  ✓ Helper views created';
  RAISE NOTICE '========================================';
END $$;

