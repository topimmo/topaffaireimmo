-- =====================================================
-- FIX: Enforce proper role-based permissions for image uploads
-- =====================================================
--
-- ISSUE: Current storage policies allow ANY authenticated user to upload
--        We need to restrict uploads to users with specific roles
--
-- SOLUTION: Update RLS policies to check user_role in profiles table
--           - property-images: admin or real_estate_advertiser only
--           - banner-images: admin or commercial_advertiser only
--           - agency-logos: admin or real_estate_advertiser (agency type) only
--           - payment-receipts: any authenticated user
-- =====================================================

-- =====================================================
-- 1. PROPERTY IMAGES - Only admin or real_estate_advertiser
-- =====================================================

-- Drop existing policy
DROP POLICY IF EXISTS "property_images_auth_insert" ON storage.objects;

-- New policy with role check
CREATE POLICY "property_images_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images' 
    AND auth.uid() IS NOT NULL 
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (
      -- Check if user has admin role or is a real estate advertiser
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (is_admin = true OR user_role = 'real_estate_advertiser')
      )
    )
  );

COMMENT ON POLICY "property_images_auth_insert" ON storage.objects IS
  'Allows only admins and real estate advertisers to upload property images to their own folder.
   Enforces role-based access control via profiles.user_role check.
   Security: folder structure + role validation.';

-- =====================================================
-- 2. BANNER IMAGES - Only admin or commercial_advertiser
-- =====================================================

-- Drop existing policy
DROP POLICY IF EXISTS "banner_images_commercial_insert" ON storage.objects;

-- New policy with role check
CREATE POLICY "banner_images_commercial_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'banner-images' 
    AND auth.uid() IS NOT NULL 
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (
      -- Check if user has admin role or is a commercial advertiser
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (is_admin = true OR user_role = 'commercial_advertiser')
      )
    )
  );

COMMENT ON POLICY "banner_images_commercial_insert" ON storage.objects IS
  'Allows only admins and commercial advertisers to upload banner images to their own folder.
   Enforces role-based access control via profiles.user_role check.';

-- =====================================================
-- 3. AGENCY LOGOS - Only admin or real_estate_advertiser with agency type
-- =====================================================

-- Drop existing policy
DROP POLICY IF EXISTS "agency_logos_agency_insert" ON storage.objects;

-- New policy with role and type check
CREATE POLICY "agency_logos_agency_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'agency-logos' 
    AND auth.uid() IS NOT NULL 
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (
      -- Check if user is admin OR is a real estate advertiser with agency type
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (
          is_admin = true
          OR (user_role = 'real_estate_advertiser' AND advertiser_type = 'agency')
        )
      )
    )
  );

COMMENT ON POLICY "agency_logos_agency_insert" ON storage.objects IS
  'Allows admins and real estate advertisers (agency type) to upload agency logos.
   Enforces both role and advertiser_type validation.';

-- =====================================================
-- 4. PAYMENT RECEIPTS - Any authenticated user (no role restriction)
-- =====================================================

-- Keep the existing policy for payment receipts - no change needed
-- This is intentionally more permissive as any user might need to upload receipts

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
--
-- Run these to verify the policies are correct:
--
-- 1. Check storage insert policies:
--    SELECT schemaname, tablename, policyname, cmd, with_check::text
--    FROM pg_policies 
--    WHERE tablename = 'objects' 
--    AND policyname LIKE '%insert%'
--    ORDER BY policyname;
--
-- 2. Test permission check (replace with actual user ID):
--    SELECT EXISTS (
--      SELECT 1 FROM public.profiles
--      WHERE id = 'user-uuid-here'::uuid
--      AND (user_role IN ('admin', 'real_estate_advertiser') OR is_admin = true)
--    ) AS can_upload_property_images;
--
-- =====================================================
-- EXPECTED BEHAVIOR AFTER THIS MIGRATION
-- =====================================================
--
-- ✅ Admin users can upload any images
-- ✅ Real estate advertisers can upload property images
-- ✅ Commercial advertisers can upload banner images
-- ✅ Agencies can upload agency logos
-- ✅ Regular users / particuliers CANNOT upload property images
-- ❌ Commercial advertisers CANNOT upload property images
-- ❌ Real estate advertisers CANNOT upload banner images (unless admin)
--
-- =====================================================
