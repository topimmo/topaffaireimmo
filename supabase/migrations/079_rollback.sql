-- =====================================================
-- SECTION D: ROLLBACK SCRIPT
-- =====================================================
-- Purpose: Revert changes from migration 079 if needed
-- Use only if issues are discovered after deployment
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=== STARTING ROLLBACK OF MIGRATION 079 ===';
  RAISE NOTICE 'This will restore previous RLS policies and drop new indexes';
  RAISE NOTICE '';
END $$;

-- -----------------------------------------------------
-- D.1: Drop New Indexes (CONCURRENTLY for safety)
-- -----------------------------------------------------
-- Note: These must be run outside of a transaction block
-- Run each DROP INDEX CONCURRENTLY statement separately

-- Drop advertising_inquiries indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_advertising_inquiries_status_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_advertising_inquiries_advertiser_type;

-- Drop property_views indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_property_views_property_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_property_views_session_created;

-- Drop property_contact_clicks indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_contact_clicks_property_type_created;

-- Drop property_leads indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_property_leads_status_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_property_leads_advertiser_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_property_leads_property_created;

-- -----------------------------------------------------
-- D.2: Restore Previous advertising_inquiries Policies
-- -----------------------------------------------------

-- Drop migration 079 policies
DROP POLICY IF EXISTS "Public can submit advertising inquiries" ON advertising_inquiries;
DROP POLICY IF EXISTS "Authenticated can submit advertising inquiries" ON advertising_inquiries;
DROP POLICY IF EXISTS "Admins can view advertising inquiries" ON advertising_inquiries;
DROP POLICY IF EXISTS "Admins can update advertising inquiries" ON advertising_inquiries;

-- Restore previous policies from migration 057
CREATE POLICY "Anyone can submit advertising inquiries"
  ON advertising_inquiries
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can view advertising inquiries"
  ON advertising_inquiries
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

CREATE POLICY "Admins can update advertising inquiries"
  ON advertising_inquiries
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Restore table comment
COMMENT ON TABLE advertising_inquiries IS 'Advertising contact form submissions - RLS updated to use admins table (Migration 057)';

-- -----------------------------------------------------
-- D.3: Restore Previous property_views Policies
-- -----------------------------------------------------

-- Drop migration 079 policies
DROP POLICY IF EXISTS "Public can track property views" ON property_views;
DROP POLICY IF EXISTS "Authenticated can track property views" ON property_views;
DROP POLICY IF EXISTS "Property owners can view their property analytics" ON property_views;
DROP POLICY IF EXISTS "Admins can view all property analytics" ON property_views;

-- Restore previous policies from migration 078
CREATE POLICY "Anyone can track property views"
  ON property_views 
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Property owners can view their property analytics"
  ON property_views 
  FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all analytics"
  ON property_views 
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true)
  );

-- Restore table comment
COMMENT ON TABLE property_views IS 'Tracks property page views for analytics';

-- -----------------------------------------------------
-- D.4: Restore Previous property_contact_clicks Policies
-- -----------------------------------------------------

-- Drop migration 079 policies
DROP POLICY IF EXISTS "Public can track contact clicks" ON property_contact_clicks;
DROP POLICY IF EXISTS "Authenticated can track contact clicks" ON property_contact_clicks;
DROP POLICY IF EXISTS "Property owners can view their contact clicks" ON property_contact_clicks;
DROP POLICY IF EXISTS "Admins can view all contact clicks" ON property_contact_clicks;

-- Restore previous policies from migration 078
CREATE POLICY "Anyone can track contact clicks"
  ON property_contact_clicks 
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Property owners can view their contact clicks"
  ON property_contact_clicks 
  FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all contact clicks"
  ON property_contact_clicks 
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true)
  );

-- Restore table comment
COMMENT ON TABLE property_contact_clicks IS 'Tracks contact button clicks (phone, whatsapp, email)';

-- -----------------------------------------------------
-- D.5: Verification After Rollback
-- -----------------------------------------------------

-- Verify RLS is still enabled (should not change during rollback)
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

-- List policies to confirm rollback
SELECT 
  tablename,
  policyname,
  roles,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('advertising_inquiries', 'property_views', 'property_contact_clicks')
ORDER BY tablename, policyname;

-- Verify indexes were dropped
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('advertising_inquiries', 'property_views', 'property_contact_clicks', 'property_leads')
  AND indexname LIKE 'idx_%'
  AND indexname IN (
    'idx_advertising_inquiries_status_created',
    'idx_advertising_inquiries_advertiser_type',
    'idx_property_views_property_created',
    'idx_property_views_session_created',
    'idx_contact_clicks_property_type_created',
    'idx_property_leads_status_created',
    'idx_property_leads_advertiser_created',
    'idx_property_leads_property_created'
  )
ORDER BY tablename, indexname;

-- Expected: Should return 0 rows (all new indexes dropped)

-- -----------------------------------------------------
-- D.6: Rollback Summary
-- -----------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '=== ROLLBACK COMPLETE ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Reverted changes:';
  RAISE NOTICE '✓ Dropped 8 new performance indexes';
  RAISE NOTICE '✓ Restored previous RLS policies for advertising_inquiries';
  RAISE NOTICE '✓ Restored previous RLS policies for property_views';
  RAISE NOTICE '✓ Restored previous RLS policies for property_contact_clicks';
  RAISE NOTICE '';
  RAISE NOTICE 'State after rollback:';
  RAISE NOTICE '- RLS remains enabled on all tables';
  RAISE NOTICE '- Previous policies from migrations 057 and 078 are active';
  RAISE NOTICE '- Original indexes from migration 078 remain';
  RAISE NOTICE '- Security Advisor warnings will reappear';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Investigate why rollback was necessary';
  RAISE NOTICE '2. Fix issues in migration 079';
  RAISE NOTICE '3. Re-apply corrected migration';
END $$;
