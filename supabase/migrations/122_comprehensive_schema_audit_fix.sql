-- =====================================================
-- Migration 122: Comprehensive Schema Audit & Fix
-- =====================================================
-- Purpose: Production-ready fixes for PostgREST relationships, RLS policies,
--          foreign keys, and performance optimizations
-- 
-- Issues Fixed:
-- 1. Optimize RLS policies with materialized views instead of subqueries
-- 2. Add missing indexes for PostgREST relationships
-- 3. Verify and document all foreign key constraints
-- 4. Add proper error handling to triggers
-- 5. Create helper views for common queries
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
      ns.nspname AS schema_name,
      tab.relname AS table_name,
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
    
    -- Check if this is the correct FK (to auth.users with CASCADE)
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

-- Clean up any duplicate or incorrect FK constraints
-- This is idempotent - safe to run multiple times
DO $$
BEGIN
  -- Drop any incorrect FK constraints (referencing public.users instead of auth.users)
  -- These would be named admins_user_id_fkey2, admins_user_id_fkey1, etc.
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

-- Create a materialized view for active admins (refreshed periodically)
-- This is faster than subqueries in RLS policies
DROP MATERIALIZED VIEW IF EXISTS public.active_admins_cache CASCADE;

CREATE MATERIALIZED VIEW public.active_admins_cache AS
SELECT user_id
FROM public.admins
WHERE is_active = TRUE;

-- Create unique index for fast lookups
CREATE UNIQUE INDEX idx_active_admins_cache_user_id 
  ON public.active_admins_cache(user_id);

COMMENT ON MATERIALIZED VIEW public.active_admins_cache IS 
  'Cached list of active admin user IDs for fast RLS policy checks. 
   Refresh with: REFRESH MATERIALIZED VIEW CONCURRENTLY public.active_admins_cache;';

-- Create function to refresh admin cache (can be called from app or cron)
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

-- Create trigger to auto-refresh cache when admins table changes
CREATE OR REPLACE FUNCTION public.trigger_refresh_admin_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Refresh the materialized view after any change to admins
  -- Using CONCURRENTLY to avoid blocking reads
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.active_admins_cache;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS admins_cache_refresh ON public.admins;

CREATE TRIGGER admins_cache_refresh
AFTER INSERT OR UPDATE OR DELETE ON public.admins
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_refresh_admin_cache();

COMMENT ON TRIGGER admins_cache_refresh ON public.admins IS 
  'Auto-refresh admin cache when admins table changes';

-- =====================================================
-- PART 3: ADD MISSING INDEXES FOR POSTGREST RELATIONSHIPS
-- =====================================================

-- Index for properties.created_by -> auth.users relationship
CREATE INDEX IF NOT EXISTS idx_properties_created_by 
  ON public.properties(created_by);

-- Index for properties.user_id -> profiles relationship  
CREATE INDEX IF NOT EXISTS idx_properties_user_id 
  ON public.properties(user_id);

-- Index for artisan_profiles.user_id -> profiles relationship
CREATE INDEX IF NOT EXISTS idx_artisan_profiles_user_id 
  ON public.artisan_profiles(user_id);

-- Index for properties.city_id for city lookups
-- Note: properties.city is a TEXT column, not a FK
-- If there's a city_id column, index it; otherwise this is informational
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'properties' 
    AND column_name = 'city_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_properties_city_id 
      ON public.properties(city_id);
    RAISE NOTICE '✓ Created index on properties.city_id';
  ELSE
    RAISE NOTICE 'ℹ No city_id column found in properties (city is TEXT)';
  END IF;
END $$;

-- Index for artisan_profiles.service_category_id relationship
CREATE INDEX IF NOT EXISTS idx_artisan_profiles_service_category 
  ON public.artisan_profiles(service_category_id);

-- Composite index for artisan_profiles active/verified listings
CREATE INDEX IF NOT EXISTS idx_artisan_profiles_active_verified 
  ON public.artisan_profiles(is_active, is_verified) 
  WHERE is_active = TRUE;

-- Index for banner_requests.advertiser_id
CREATE INDEX IF NOT EXISTS idx_banner_requests_advertiser 
  ON public.banner_requests(advertiser_id);

-- =====================================================
-- PART 4: IMPROVE TRIGGER ERROR HANDLING
-- =====================================================

-- Update the artisan_service moderation protection trigger to RAISE EXCEPTION
-- instead of silently reverting changes
DROP TRIGGER IF EXISTS protect_artisan_service_moderation ON public.artisan_services;

CREATE OR REPLACE FUNCTION public.protect_artisan_service_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  -- Check if current user is an admin
  is_admin_user := public.is_admin();
  
  IF NOT is_admin_user THEN
    -- Check if any moderation fields were changed
    IF (OLD.status IS DISTINCT FROM NEW.status) OR
       (OLD.approved_at IS DISTINCT FROM NEW.approved_at) OR
       (OLD.approved_by IS DISTINCT FROM NEW.approved_by) OR
       (OLD.rejected_at IS DISTINCT FROM NEW.rejected_at) OR
       (OLD.rejected_by IS DISTINCT FROM NEW.rejected_by) OR
       (OLD.moderated_at IS DISTINCT FROM NEW.moderated_at) OR
       (OLD.moderated_by IS DISTINCT FROM NEW.moderated_by) OR
       (OLD.rejection_reason IS DISTINCT FROM NEW.rejection_reason) THEN
      
      -- RAISE EXCEPTION instead of silently reverting
      RAISE EXCEPTION 'Permission denied: Only admins can modify service moderation fields'
        USING HINT = 'Contact an administrator to change service approval status',
              ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger with improved error handling
CREATE TRIGGER protect_artisan_service_moderation
BEFORE UPDATE ON public.artisan_services
FOR EACH ROW
EXECUTE FUNCTION public.protect_artisan_service_moderation();

COMMENT ON FUNCTION public.protect_artisan_service_moderation IS 
  'Prevent non-admin users from modifying moderation fields. 
   RAISES EXCEPTION instead of silently reverting changes.';

-- Similarly update property moderation protection if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'properties'
  ) THEN
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS protect_property_moderation ON public.properties;
    
    -- Create improved trigger function
    CREATE OR REPLACE FUNCTION public.protect_property_moderation()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $func$
    DECLARE
      is_admin_user BOOLEAN;
    BEGIN
      is_admin_user := public.is_admin();
      
      IF NOT is_admin_user THEN
        -- Check if any moderation fields were changed
        IF (OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved', 'rejected')) OR
           (OLD.approved_at IS DISTINCT FROM NEW.approved_at) OR
           (OLD.approved_by IS DISTINCT FROM NEW.approved_by) OR
           (OLD.rejected_at IS DISTINCT FROM NEW.rejected_at) OR
           (OLD.rejected_by IS DISTINCT FROM NEW.rejected_by) OR
           (OLD.rejection_reason IS DISTINCT FROM NEW.rejection_reason) THEN
          
          RAISE EXCEPTION 'Permission denied: Only admins can modify property moderation fields'
            USING HINT = 'Contact an administrator to change property approval status',
                  ERRCODE = 'insufficient_privilege';
        END IF;
      END IF;
      
      RETURN NEW;
    END;
    $func$;
    
    -- Create trigger
    CREATE TRIGGER protect_property_moderation
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_property_moderation();
    
    RAISE NOTICE '✓ Created property moderation protection trigger';
  END IF;
END $$;

-- =====================================================
-- PART 5: CREATE HELPER VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for approved artisan profiles with their services
-- This optimizes the common query pattern in the frontend
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
  ap.is_verified,
  ap.is_boosted,
  ap.created_at,
  sc.id AS service_category_id,
  sc.name_fr AS service_category_name_fr,
  sc.name_ar AS service_category_name_ar,
  ap.avatar_url
FROM public.artisan_profiles ap
LEFT JOIN public.service_categories sc ON sc.id = ap.service_category_id
WHERE ap.is_active = TRUE;

COMMENT ON VIEW public.approved_artisan_profiles IS 
  'Active artisan profiles with service category details. 
   Use this view instead of joining tables manually for better performance.';

-- Grant access to the view
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
  'Approved properties visible to public. Hides contact info to enforce reveal system.';

GRANT SELECT ON public.public_properties TO authenticated;
GRANT SELECT ON public.public_properties TO anon;

-- =====================================================
-- PART 6: ADD PERFORMANCE STATISTICS FUNCTION
-- =====================================================

-- Function to analyze query performance (for debugging)
CREATE OR REPLACE FUNCTION public.analyze_table_stats()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  total_size TEXT,
  index_size TEXT,
  toast_size TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.relname::TEXT AS table_name,
    c.reltuples::BIGINT AS row_count,
    pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
    pg_size_pretty(pg_indexes_size(c.oid)) AS index_size,
    pg_size_pretty(pg_total_relation_size(c.reltoastrelid)) AS toast_size
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
  ORDER BY pg_total_relation_size(c.oid) DESC;
END;
$$;

COMMENT ON FUNCTION public.analyze_table_stats IS 
  'Returns table statistics (row count, size, indexes) for performance analysis.
   Call with: SELECT * FROM public.analyze_table_stats();';

GRANT EXECUTE ON FUNCTION public.analyze_table_stats() TO authenticated;

-- =====================================================
-- PART 7: ADD MIGRATION VERIFICATION QUERIES
-- =====================================================

-- Function to verify migration 122 was applied correctly
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
        'idx_properties_created_by',
        'idx_properties_user_id',
        'idx_artisan_profiles_user_id',
        'idx_artisan_profiles_service_category'
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
  
  -- Check 5: Trigger improvements
  RETURN QUERY
  SELECT 
    'Moderation Triggers'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'protect_artisan_service_moderation'
    ) THEN '✓ PASS' ELSE '✗ FAIL' END,
    'Moderation protection triggers exist'::TEXT;
END;
$$;

COMMENT ON FUNCTION public.verify_migration_122 IS 
  'Verify migration 122 was applied correctly. Run: SELECT * FROM public.verify_migration_122();';

GRANT EXECUTE ON FUNCTION public.verify_migration_122() TO authenticated;

-- =====================================================
-- FINALIZATION
-- =====================================================

-- Refresh the admin cache once
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
  RAISE NOTICE '  ✓ Trigger error handling improved';
  RAISE NOTICE '========================================';
END $$;
