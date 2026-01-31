-- =====================================================
-- Migration: Fix advertising_inquiries RLS to use admins table
-- File: 057_fix_advertising_inquiries_admin_check.sql
-- Created: 2026-01-31
-- =====================================================
--
-- OBJECTIVE:
-- Update advertising_inquiries RLS policies to use the admins table
-- instead of checking profiles.is_admin field for consistency with
-- other tables (properties, site_pages, admin_audit_logs, etc.)
--
-- CHANGES:
-- - Drop old policies that check profiles.is_admin
-- - Create new policies that check admins table
--
-- IMPACT:
-- - No functional change (admins table already populated)
-- - Ensures consistency across all RLS policies
-- - Future-proof if is_admin field is removed from profiles
--
-- =====================================================

-- Drop old policies that check profiles.is_admin
DROP POLICY IF EXISTS "Admins can view advertising inquiries" ON advertising_inquiries;
DROP POLICY IF EXISTS "Admins can update advertising inquiries" ON advertising_inquiries;

-- Create new SELECT policy using admins table
CREATE POLICY "Admins can view advertising inquiries"
  ON advertising_inquiries
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Create new UPDATE policy using admins table
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

-- Update table comment
COMMENT ON TABLE advertising_inquiries IS 'Advertising contact form submissions - RLS updated to use admins table (Migration 057)';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify policies are updated:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies 
-- WHERE tablename = 'advertising_inquiries'
-- ORDER BY policyname;

-- Test admin access (as admin user):
-- SELECT * FROM advertising_inquiries LIMIT 5;

-- Test non-admin access (should return 0 rows):
-- SELECT * FROM advertising_inquiries LIMIT 5;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
