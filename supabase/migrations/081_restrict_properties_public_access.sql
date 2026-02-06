-- =====================================================
-- Migration 081: Restrict Direct Public Access to Properties Table
-- =====================================================
--
-- OBJECTIVE:
-- Ensure anonymous users cannot directly access the properties table
-- They must use properties_public view which respects contact visibility flags
--
-- REQUIREMENTS:
-- - Remove public SELECT policy from properties table
-- - Public users can only read from properties_public view
-- - Authenticated users who are owners can still see their own properties
-- - Admins retain full access
--
-- =====================================================

-- =====================================================
-- STEP 1: Drop the public select policy
-- =====================================================

DROP POLICY IF EXISTS "properties_select_public" ON public.properties;

-- =====================================================
-- STEP 2: Ensure RLS is enabled on properties table
-- =====================================================

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- After this migration:
-- 1. Anonymous users CANNOT SELECT from public.properties
-- 2. Anonymous users CAN SELECT from public.properties_public (granted in migration 080)
-- 3. Authenticated users can SELECT their own properties (properties_select_own policy)
-- 4. Admins can SELECT all properties (properties_select_admin policy)

-- Test as anonymous:
-- SET ROLE anon;
-- SELECT * FROM public.properties LIMIT 1; -- Should return 0 rows or permission denied
-- SELECT * FROM public.properties_public LIMIT 1; -- Should work

-- =====================================================
-- END OF MIGRATION
-- =====================================================
