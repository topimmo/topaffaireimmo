-- =====================================================
-- FIX 002: Storage Security - Remove Public Access
-- =====================================================
-- 
-- PROBLEM: Migration 052 policy has TRUE clause
-- making ALL property images publicly accessible
-- regardless of approval status.
--
-- SECURITY RISK: HIGH - Unapproved/rejected images visible
--
-- SOLUTION: Two options provided
-- =====================================================

-- =====================================================
-- OPTION A: STRICT SECURITY (Recommended for Production)
-- =====================================================
-- Only owners, admins, and viewers of APPROVED properties can access images
-- Requires property_images table to be populated by frontend

-- Drop insecure policy
DROP POLICY IF EXISTS "property_images_read_approved_owners_only" ON storage.objects;
DROP POLICY IF EXISTS "property_images_read_public" ON storage.objects;

-- Create strict security policy
CREATE POLICY "property_images_select_strict" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'property-images' AND (
      -- Admin can see all
      auth.uid() IN (SELECT user_id FROM public.admins) OR
      -- Owner can see their own
      (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text) OR
      -- Public can see if image belongs to approved property
      EXISTS (
        SELECT 1 
        FROM public.property_images pi
        JOIN public.properties p ON pi.property_id = p.id
        WHERE pi.image_path = name 
          AND p.status = 'approved'
      )
    )
  );

-- =====================================================
-- OPTION B: KEEP PUBLIC ACCESS (Current State)
-- =====================================================
-- Use this if you're not ready to populate property_images table
-- Less secure but simpler migration

-- Uncomment below if you want to keep public access temporarily:

-- DROP POLICY IF EXISTS "property_images_read_approved_owners_only" ON storage.objects;
-- DROP POLICY IF EXISTS "property_images_select_strict" ON storage.objects;
-- 
-- CREATE POLICY "property_images_select_public" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'property-images'
--   );

-- =====================================================
-- FRONTEND CHANGES REQUIRED FOR OPTION A
-- =====================================================
-- When uploading images, populate property_images table:
-- 
-- // After successful upload
-- await supabase
--   .from('property_images')
--   .insert({
--     property_id: propertyId,
--     image_path: `${userId}/image.jpg`,
--     image_order: 0
--   });

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check which policy is active
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%property_images%select%'
ORDER BY policyname;

-- Test public access (should fail with Option A)
-- Try to access image URL in incognito window
-- https://[project].supabase.co/storage/v1/object/public/property-images/[user-id]/image.jpg

-- =====================================================
-- END OF FIX 002
-- =====================================================
