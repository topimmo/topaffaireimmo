-- =====================================================
-- Migration 108: Fix Property Images Security
-- =====================================================
--
-- OBJECTIVE:
-- Enforce strict security on property-images storage bucket.
-- Only allow access to images for approved properties.
--
-- PROBLEM:
-- Migration 052 has a TRUE clause in the storage policy that allows
-- public access to ALL property images regardless of approval status.
-- This is a critical security vulnerability.
--
-- SOLUTION:
-- 1. Remove the TRUE clause from the storage policy
-- 2. Enforce property.status = 'approved' check via property_images table
-- 3. Populate property_images table from existing properties.images data
-- =====================================================

-- =====================================================
-- STEP 1: Drop insecure storage policy
-- =====================================================

DROP POLICY IF EXISTS "property_images_read_approved_owners_only" ON storage.objects;

-- =====================================================
-- STEP 2: Create secure storage policy
-- =====================================================
-- Images are accessible only when:
-- - User is admin, OR
-- - User owns the image, OR  
-- - Image belongs to an approved property

CREATE POLICY "property_images_select_secure" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'property-images' AND (
      -- Admin can see all
      auth.uid() IN (SELECT user_id FROM public.admins) OR
      -- Owner can see their own
      (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text) OR
      -- Public can see only if image belongs to approved property
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
-- STEP 3: Migrate existing data to property_images table
-- =====================================================
-- Populate property_images table from properties.images array
-- This ensures existing images are tracked properly

INSERT INTO public.property_images (property_id, image_path, image_order, created_at)
SELECT 
  p.id as property_id,
  unnest(p.images) as image_path,
  generate_series(0, array_length(p.images, 1) - 1) as image_order,
  p.created_at
FROM public.properties p
WHERE p.images IS NOT NULL 
  AND array_length(p.images, 1) > 0
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 4: Create trigger to auto-populate property_images
-- =====================================================
-- When properties.images is updated, sync to property_images table

CREATE OR REPLACE FUNCTION sync_property_images()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete old entries for this property
  DELETE FROM public.property_images WHERE property_id = NEW.id;
  
  -- Insert new entries from images array
  IF NEW.images IS NOT NULL AND array_length(NEW.images, 1) > 0 THEN
    INSERT INTO public.property_images (property_id, image_path, image_order)
    SELECT 
      NEW.id,
      unnest(NEW.images),
      generate_series(0, array_length(NEW.images, 1) - 1);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS sync_property_images_trigger ON public.properties;
CREATE TRIGGER sync_property_images_trigger
  AFTER INSERT OR UPDATE OF images ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION sync_property_images();

-- =====================================================
-- STEP 5: Add helper function for signed URLs
-- =====================================================
-- Function to check if current user can access a property image
-- This can be used by frontend to determine if signed URL is needed

CREATE OR REPLACE FUNCTION public.get_image_access_status(
  image_path TEXT
)
RETURNS TABLE (
  can_access BOOLEAN,
  requires_signed_url BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  owner_id_from_path UUID;
  requesting_user_id UUID;
  is_user_admin BOOLEAN;
  property_status TEXT;
BEGIN
  -- Get requesting user ID
  requesting_user_id := auth.uid();
  
  -- Extract owner_id from path (format: owner_id/filename.jpg or owner_id/folder/filename.jpg)
  BEGIN
    owner_id_from_path := (regexp_split_to_array(image_path, '/'))[1]::UUID;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, FALSE, 'Invalid image path format'::TEXT;
    RETURN;
  END;
  
  -- Check if user is admin
  is_user_admin := EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = requesting_user_id
  );
  
  -- Admin can access all images
  IF is_user_admin THEN
    RETURN QUERY SELECT TRUE, FALSE, 'Admin access'::TEXT;
    RETURN;
  END IF;
  
  -- Owner can access their own images
  IF requesting_user_id = owner_id_from_path THEN
    RETURN QUERY SELECT TRUE, FALSE, 'Owner access'::TEXT;
    RETURN;
  END IF;
  
  -- For public access, check property status
  SELECT p.status INTO property_status
  FROM public.property_images pi
  JOIN public.properties p ON pi.property_id = p.id
  WHERE pi.image_path = get_image_access_status.image_path
  LIMIT 1;
  
  IF property_status = 'approved' THEN
    RETURN QUERY SELECT TRUE, FALSE, 'Public access - approved property'::TEXT;
    RETURN;
  ELSIF property_status IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, TRUE, 'Property not approved - signed URL required'::TEXT;
    RETURN;
  ELSE
    -- Image not in property_images table
    RETURN QUERY SELECT FALSE, FALSE, 'Image not found in database'::TEXT;
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check active storage policy
-- SELECT policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename = 'objects'
--   AND policyname LIKE '%property_images%select%'
-- ORDER BY policyname;

-- Verify property_images table is populated
-- SELECT 
--   COUNT(*) as total_images,
--   COUNT(DISTINCT property_id) as properties_with_images
-- FROM public.property_images;

-- Test access for a specific image
-- SELECT * FROM public.get_image_access_status('some-user-id/some-image.jpg');

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- To rollback:
-- DROP POLICY IF EXISTS "property_images_select_secure" ON storage.objects;
-- DROP TRIGGER IF EXISTS sync_property_images_trigger ON public.properties;
-- DROP FUNCTION IF EXISTS sync_property_images();
-- DROP FUNCTION IF EXISTS public.get_image_access_status(TEXT);
-- -- Restore old policy with TRUE clause (insecure)
-- CREATE POLICY "property_images_read_approved_owners_only" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'property-images' AND (
--       auth.uid() IN (SELECT user_id FROM public.admins) OR
--       (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text) OR
--       TRUE
--     )
--   );

-- =====================================================
-- END OF MIGRATION
-- =====================================================
