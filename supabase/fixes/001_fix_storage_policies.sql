-- =====================================================
-- FIX 001: Storage Policies - Remove Broken References
-- =====================================================
-- 
-- PROBLEM: Migration 021 storage policies reference 
-- profiles.user_role and profiles.advertiser_type
-- which were deleted in migration 048.
--
-- IMPACT: Image uploads FAIL with database errors
--
-- SOLUTION: Replace policies without these column checks
-- =====================================================

-- =====================================================
-- STEP 1: Fix Property Images Policies
-- =====================================================

-- Drop broken policy that checks user_role
DROP POLICY IF EXISTS "property_images_auth_insert" ON storage.objects;

-- Create new INSERT policy without user_role check
-- Any authenticated user can upload to their own folder
CREATE POLICY "property_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================
-- STEP 2: Fix Banner Images Policies
-- =====================================================

-- Drop broken policy that checks user_role
DROP POLICY IF EXISTS "banner_images_commercial_insert" ON storage.objects;

-- Create new INSERT policy without user_role check
-- Any authenticated user can upload to their own folder
CREATE POLICY "banner_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'banner-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================
-- STEP 3: Fix Agency Logos Policies
-- =====================================================

-- Drop broken policy that checks user_role and advertiser_type
DROP POLICY IF EXISTS "agency_logos_agency_insert" ON storage.objects;

-- Create new INSERT policy
-- Only users with user_type = 'agency' can upload
CREATE POLICY "agency_logos_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'agency-logos' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_type = 'agency'
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check all storage policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'objects'
  AND policyname LIKE '%_insert'
ORDER BY policyname;
