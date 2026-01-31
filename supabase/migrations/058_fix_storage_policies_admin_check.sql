-- =====================================================
-- Migration: Update storage policies to use admins table
-- File: 058_fix_storage_policies_admin_check.sql
-- Created: 2026-01-31
-- =====================================================
--
-- OBJECTIVE:
-- Update storage bucket policies for banner-images, payment-receipts,
-- and agency-logos to use the admins table instead of checking
-- profiles.user_role = 'admin' for admin authorization.
--
-- AFFECTED BUCKETS:
-- 1. banner-images - Commercial advertisers and admins
-- 2. payment-receipts - Private bucket, owner and admins
-- 3. agency-logos - Real estate agencies and admins
--
-- CHANGES:
-- Replace: EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
-- With:    auth.uid() IN (SELECT user_id FROM public.admins)
--
-- IMPACT:
-- - Consistent admin checks across all storage policies
-- - Aligns with property-images bucket (already updated in migration 050)
-- - Future-proof if user_role field changes
--
-- =====================================================

-- =====================================================
-- 1. BANNER-IMAGES BUCKET
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS "banner_images_commercial_insert" ON storage.objects;
DROP POLICY IF EXISTS "banner_images_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "banner_images_owner_delete" ON storage.objects;

-- INSERT Policy: Commercial users OR admins can upload
CREATE POLICY "banner_images_commercial_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'banner-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND user_role = 'commercial_advertiser'
      )
      OR
      auth.uid() IN (SELECT user_id FROM public.admins)
    )
  );

-- UPDATE Policy: Owner OR admin can update
CREATE POLICY "banner_images_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'banner-images' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text 
      OR 
      auth.uid() IN (SELECT user_id FROM public.admins)
    )
  );

-- DELETE Policy: Owner OR admin can delete
CREATE POLICY "banner_images_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'banner-images' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text 
      OR 
      auth.uid() IN (SELECT user_id FROM public.admins)
    )
  );

-- =====================================================
-- 2. PAYMENT-RECEIPTS BUCKET
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS "payment_receipts_owner_read" ON storage.objects;
DROP POLICY IF EXISTS "payment_receipts_owner_delete" ON storage.objects;

-- SELECT Policy: Owner OR admin can read
CREATE POLICY "payment_receipts_owner_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-receipts' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text 
      OR 
      auth.uid() IN (SELECT user_id FROM public.admins)
    )
  );

-- DELETE Policy: Owner OR admin can delete
CREATE POLICY "payment_receipts_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'payment-receipts' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text 
      OR 
      auth.uid() IN (SELECT user_id FROM public.admins)
    )
  );

-- =====================================================
-- 3. AGENCY-LOGOS BUCKET
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS "agency_logos_agency_insert" ON storage.objects;
DROP POLICY IF EXISTS "agency_logos_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "agency_logos_owner_delete" ON storage.objects;

-- INSERT Policy: Real estate agencies OR admins can upload
CREATE POLICY "agency_logos_agency_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'agency-logos' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND user_role = 'real_estate_advertiser'
        AND advertiser_type = 'agency'
      )
      OR
      auth.uid() IN (SELECT user_id FROM public.admins)
    )
  );

-- UPDATE Policy: Owner OR admin can update
CREATE POLICY "agency_logos_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'agency-logos' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text 
      OR 
      auth.uid() IN (SELECT user_id FROM public.admins)
    )
  );

-- DELETE Policy: Owner OR admin can delete
CREATE POLICY "agency_logos_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'agency-logos' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text 
      OR 
      auth.uid() IN (SELECT user_id FROM public.admins)
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify storage policies are updated:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies 
-- WHERE tablename = 'objects' 
--   AND policyname LIKE '%banner_images%'
--    OR policyname LIKE '%payment_receipts%'
--    OR policyname LIKE '%agency_logos%'
-- ORDER BY policyname;

-- Test admin access to each bucket:
-- SELECT name FROM storage.objects WHERE bucket_id = 'banner-images' LIMIT 5;
-- SELECT name FROM storage.objects WHERE bucket_id = 'payment-receipts' LIMIT 5;
-- SELECT name FROM storage.objects WHERE bucket_id = 'agency-logos' LIMIT 5;

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================

-- After this migration:
-- 1. All storage buckets use admins table for admin checks
-- 2. Consistent with property-images bucket (migration 050)
-- 3. Role-based checks still use profiles.user_role (correct)
-- 4. Admin checks now use admins table (consistent)

-- =====================================================
-- END OF MIGRATION
-- =====================================================
