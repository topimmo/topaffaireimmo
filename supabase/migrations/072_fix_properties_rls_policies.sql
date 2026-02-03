-- =====================================================
-- Migration 072: Fix RLS policies for properties table
-- =====================================================
--
-- OBJECTIVE:
-- Update RLS policies to check both created_by and owner_id
-- This ensures users can always see/update/delete their own listings
-- regardless of advertiser_type changes
--
-- REQUIREMENTS:
-- - SELECT allowed when (created_by = auth.uid() OR owner_id = auth.uid())
-- - UPDATE allowed when (created_by = auth.uid() OR owner_id = auth.uid())
-- - DELETE allowed when (created_by = auth.uid() OR owner_id = auth.uid())
-- - INSERT allowed when (created_by = auth.uid())
-- - Admins have full access
--
-- =====================================================

-- =====================================================
-- STEP 1: Drop all existing user-related policies
-- =====================================================

-- Drop all existing properties policies that might conflict
DROP POLICY IF EXISTS "properties_select_own" ON public.properties;
DROP POLICY IF EXISTS "properties_select_public" ON public.properties;
DROP POLICY IF EXISTS "properties_select_admin" ON public.properties;
DROP POLICY IF EXISTS "properties_insert_own" ON public.properties;
DROP POLICY IF EXISTS "properties_insert_authenticated" ON public.properties;
DROP POLICY IF EXISTS "properties_insert_real_estate" ON public.properties;
DROP POLICY IF EXISTS "properties_update_own" ON public.properties;
DROP POLICY IF EXISTS "properties_update_admin" ON public.properties;
DROP POLICY IF EXISTS "properties_delete_own" ON public.properties;
DROP POLICY IF EXISTS "properties_delete_admin" ON public.properties;

-- =====================================================
-- STEP 2: Create new SELECT policies
-- =====================================================

-- 1. Public can view published (and not archived) listings
CREATE POLICY "properties_select_public" ON public.properties
  FOR SELECT USING (
    status = 'published' AND (is_archived = FALSE OR is_archived IS NULL)
  );

-- 2. Users can view their own listings (created_by OR owner_id)
CREATE POLICY "properties_select_own" ON public.properties
  FOR SELECT USING (
    created_by = auth.uid() OR owner_id = auth.uid()
  );

-- 3. Admins can view ALL listings
CREATE POLICY "properties_select_admin" ON public.properties
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =====================================================
-- STEP 3: Create new INSERT policy
-- =====================================================

-- Users can insert listings with created_by = auth.uid()
-- The created_by will default to auth.uid() and owner_id must match
CREATE POLICY "properties_insert_own" ON public.properties
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    created_by = auth.uid() AND
    owner_id = auth.uid()
  );

-- =====================================================
-- STEP 4: Create new UPDATE policies
-- =====================================================

-- 1. Users can update their own listings (created_by OR owner_id)
--    Status restrictions from workflow migration still apply via trigger
CREATE POLICY "properties_update_own" ON public.properties
  FOR UPDATE 
  USING (
    created_by = auth.uid() OR owner_id = auth.uid()
  )
  WITH CHECK (
    created_by = auth.uid() OR owner_id = auth.uid()
  );

-- 2. Admins can update ANY listing
CREATE POLICY "properties_update_admin" ON public.properties
  FOR UPDATE 
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =====================================================
-- STEP 5: Create new DELETE policies
-- =====================================================

-- 1. Users can delete their own listings (created_by OR owner_id)
CREATE POLICY "properties_delete_own" ON public.properties
  FOR DELETE USING (
    created_by = auth.uid() OR owner_id = auth.uid()
  );

-- 2. Admins can delete ANY listing
CREATE POLICY "properties_delete_admin" ON public.properties
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify policies were created:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'properties'
-- ORDER BY cmd, policyname;

-- Test as user (replace USER_UUID with actual user ID):
-- SET LOCAL role postgres;
-- SET LOCAL request.jwt.claim.sub = 'USER_UUID';
-- SELECT id, title_fr, status, created_by, owner_id 
-- FROM public.properties 
-- WHERE created_by = 'USER_UUID' OR owner_id = 'USER_UUID';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
