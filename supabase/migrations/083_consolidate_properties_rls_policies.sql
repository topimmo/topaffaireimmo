-- =====================================================
-- Migration 083: Consolidate Properties RLS Policies
-- =====================================================
--
-- OBJECTIVE:
-- Clean up redundant and conflicting RLS policies on properties table
-- Establish clear role separation: anon / authenticated / admin
-- Remove duplicate policies from previous migrations
--
-- CURRENT STATE ISSUES:
-- - Migration 067 created policies using only owner_id
-- - Migration 072 modified to use created_by OR owner_id
-- - Migration 081 dropped public SELECT policy
-- - Multiple conflicting policy definitions across migrations
-- - Inconsistent admin role checks
--
-- FINAL POLICY SET:
-- Role: anon
--   - No direct access to properties table
--   - Must use properties_public view (created in migration 080)
--
-- Role: authenticated (property owners)
--   - SELECT: Own properties (created_by = uid OR owner_id = uid)
--   - INSERT: New properties with created_by = uid AND owner_id = uid
--   - UPDATE: Own properties (with status workflow restrictions via trigger)
--   - DELETE: Own properties (with status restrictions)
--
-- Role: authenticated (admins - in admins table)
--   - SELECT: All properties
--   - UPDATE: All properties (bypass status restrictions)
--   - DELETE: All properties
--
-- =====================================================

-- =====================================================
-- STEP 1: Drop ALL existing RLS policies on properties
-- =====================================================

-- This ensures we start with a clean slate and avoid duplicates
-- Drop policies from migration 067
DROP POLICY IF EXISTS "properties_insert_authenticated" ON public.properties;
DROP POLICY IF EXISTS "properties_select_own" ON public.properties;
DROP POLICY IF EXISTS "properties_select_admin" ON public.properties;
DROP POLICY IF EXISTS "properties_select_public" ON public.properties;
DROP POLICY IF EXISTS "properties_update_own" ON public.properties;
DROP POLICY IF EXISTS "properties_update_admin" ON public.properties;
DROP POLICY IF EXISTS "properties_delete_own" ON public.properties;
DROP POLICY IF EXISTS "properties_delete_admin" ON public.properties;

-- Drop policies from migration 072 (different naming)
DROP POLICY IF EXISTS "properties_insert_own" ON public.properties;

-- Drop policies from migration 031 (legacy naming)
DROP POLICY IF EXISTS "public_view_approved" ON public.properties;
DROP POLICY IF EXISTS "owner_view_own" ON public.properties;
DROP POLICY IF EXISTS "admin_view_all" ON public.properties;
DROP POLICY IF EXISTS "realtor_insert" ON public.properties;
DROP POLICY IF EXISTS "owner_update" ON public.properties;
DROP POLICY IF EXISTS "admin_update" ON public.properties;
DROP POLICY IF EXISTS "owner_delete" ON public.properties;
DROP POLICY IF EXISTS "admin_delete" ON public.properties;

-- Drop policies from migration 030 (legacy naming)
DROP POLICY IF EXISTS "Anyone can view approved properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view own properties" ON public.properties;
DROP POLICY IF EXISTS "Real estate advertisers can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON public.properties;
DROP POLICY IF EXISTS "Admins full access to properties" ON public.properties;

-- Drop policies from migration 029 (admin-specific)
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can update all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can delete all properties" ON public.properties;

-- Drop policies from migration 028 (legacy naming)
DROP POLICY IF EXISTS "Properties can be inserted by authenticated users" ON public.properties;
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON public.properties;
DROP POLICY IF EXISTS "Properties can be updated by owner" ON public.properties;
DROP POLICY IF EXISTS "Properties can be deleted by owner" ON public.properties;

-- Drop policies from migration 027 (legacy naming)
DROP POLICY IF EXISTS "Anyone can view approved properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON public.properties;

-- Drop policies from migration 020 (legacy naming)
DROP POLICY IF EXISTS "properties_insert_real_estate" ON public.properties;

-- Drop policies from migration 010 (initial)
DROP POLICY IF EXISTS "properties_select_approved" ON public.properties;
DROP POLICY IF EXISTS "properties_insert_own" ON public.properties;

-- =====================================================
-- STEP 2: Ensure RLS is enabled on properties table
-- =====================================================

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: Create consolidated SELECT policies
-- =====================================================

-- Policy 1: Authenticated users can SELECT their own properties
-- Uses created_by OR owner_id to handle legacy data
CREATE POLICY "properties_select_own" ON public.properties
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR owner_id = auth.uid()
  );

-- Policy 2: Admins can SELECT all properties
-- Only checks admins table (single source of truth)
CREATE POLICY "properties_select_admin" ON public.properties
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Note: No SELECT policy for anon role
-- Anonymous users must use properties_public view (created in migration 080)

-- =====================================================
-- STEP 4: Create consolidated INSERT policy
-- =====================================================

-- Policy 3: Authenticated users can INSERT new properties
-- Requires created_by = uid AND owner_id = uid
-- Status defaults to 'draft' (set in column default)
CREATE POLICY "properties_insert_own" ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    created_by = auth.uid() AND
    owner_id = auth.uid() AND
    -- Allow insert only as draft or pending
    (status IN ('draft', 'pending') OR status IS NULL)
  );

-- =====================================================
-- STEP 5: Create consolidated UPDATE policies
-- =====================================================

-- Policy 4: Authenticated users can UPDATE their own properties
-- Restricted by status workflow (enforced by trigger from migration 067)
CREATE POLICY "properties_update_own" ON public.properties
  FOR UPDATE
  TO authenticated
  USING (
    -- User owns the property
    (created_by = auth.uid() OR owner_id = auth.uid()) AND
    -- Only allow updates when status is draft or rejected
    -- (enforced by protect_property_status trigger)
    status IN ('draft', 'rejected')
  )
  WITH CHECK (
    -- User still owns the property after update
    (created_by = auth.uid() OR owner_id = auth.uid()) AND
    -- Cannot escalate to approved/published/archived
    (status IN ('draft', 'pending', 'rejected') OR status IS NULL)
  );

-- Policy 5: Admins can UPDATE any property
-- No status restrictions (bypass trigger restrictions via admin check)
CREATE POLICY "properties_update_admin" ON public.properties
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =====================================================
-- STEP 6: Create consolidated DELETE policies
-- =====================================================

-- Policy 6: Authenticated users can DELETE their own properties
-- Only when status is draft or rejected
CREATE POLICY "properties_delete_own" ON public.properties
  FOR DELETE
  TO authenticated
  USING (
    (created_by = auth.uid() OR owner_id = auth.uid()) AND
    status IN ('draft', 'rejected')
  );

-- Policy 7: Admins can DELETE any property
CREATE POLICY "properties_delete_admin" ON public.properties
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =====================================================
-- STEP 7: Add documentation comments
-- =====================================================

COMMENT ON TABLE public.properties IS 
  'Property listings table with RLS policies for anon/authenticated/admin roles.
   - anon: No direct access (use properties_public view)
   - authenticated: CRUD on own properties (created_by OR owner_id)
   - admin: Full CRUD on all properties';

-- =====================================================
-- STEP 8: Verification queries
-- =====================================================

-- Run these queries after migration to verify:

-- 1. List all policies on properties table
-- SELECT 
--   schemaname, 
--   tablename, 
--   policyname, 
--   permissive, 
--   roles, 
--   cmd, 
--   qual,
--   with_check
-- FROM pg_policies 
-- WHERE tablename = 'properties'
-- ORDER BY cmd, policyname;
--
-- Expected output: 7 policies total
--   - 2 SELECT policies (own, admin)
--   - 1 INSERT policy (own)
--   - 2 UPDATE policies (own, admin)
--   - 2 DELETE policies (own, admin)

-- 2. Verify no duplicate policy names
-- SELECT policyname, COUNT(*) 
-- FROM pg_policies 
-- WHERE tablename = 'properties'
-- GROUP BY policyname
-- HAVING COUNT(*) > 1;
--
-- Expected output: 0 rows (no duplicates)

-- 3. Test anonymous user access (should fail)
-- SET ROLE anon;
-- SELECT COUNT(*) FROM public.properties;
-- Expected: 0 rows or permission denied
--
-- SET ROLE anon;
-- SELECT COUNT(*) FROM public.properties_public;
-- Expected: Success with published properties count

-- 4. Test authenticated user access (replace USER_UUID)
-- SET LOCAL role authenticated;
-- SET LOCAL request.jwt.claim.sub = 'USER_UUID';
-- SELECT id, status, created_by, owner_id 
-- FROM public.properties 
-- WHERE created_by = 'USER_UUID' OR owner_id = 'USER_UUID';
-- Expected: All properties owned by user

-- 5. Test admin access (replace ADMIN_UUID)
-- SET LOCAL role authenticated;
-- SET LOCAL request.jwt.claim.sub = 'ADMIN_UUID';
-- SELECT COUNT(*) FROM public.properties;
-- Expected: All properties count (if ADMIN_UUID is in admins table)

-- =====================================================
-- SECURITY CONSIDERATIONS
-- =====================================================

-- 1. Anonymous users CANNOT directly query properties table
--    - Protects contact information and unpublished listings
--    - Forces use of properties_public view with visibility controls
--
-- 2. Authenticated users can only see/modify their own properties
--    - Uses created_by OR owner_id for backward compatibility
--    - Status workflow enforced by protect_property_status trigger
--
-- 3. Admins have full access to all properties
--    - Single source of truth: admins table
--    - Can bypass status workflow restrictions
--
-- 4. No redundant or conflicting policies
--    - All legacy policies from migrations 010-081 are dropped
--    - Clean minimal set of 7 policies with clear role separation
--
-- =====================================================
-- END OF MIGRATION
-- =====================================================
