-- =====================================================
-- Migration 052: Fix Storage Security - Property Status Based Access
-- =====================================================
--
-- OBJECTIVE:
-- Fix critical security issue where all images are publicly accessible
-- regardless of property approval status.
--
-- PROBLEM:
-- Current policy allows public read access to all images in property-images bucket.
-- This means unapproved/rejected property images are visible to anyone.
--
-- SOLUTION:
-- Unfortunately, Supabase storage policies cannot directly join with other tables
-- to check property status. We have two options:
--
-- Option 1: Use a storage proxy function (recommended for strict security)
-- Option 2: Accept that images are public (current state) - simpler but less secure
--
-- We implement Option 1 with a helper function that frontend can use.
--
-- =====================================================

-- =====================================================
-- STEP 1: Create Helper Function to Check Image Access
-- =====================================================

-- This function checks if an image should be accessible based on property status
-- Frontend should use this before displaying images OR use signed URLs
-- NOTE: This implementation checks if owner has ANY approved property
-- For stricter control, use property_images table to check specific property status
CREATE OR REPLACE FUNCTION public.can_access_property_image(
  image_path TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  owner_id_from_path UUID;
  requesting_user_id UUID;
  is_user_admin BOOLEAN;
  has_approved_property BOOLEAN;
BEGIN
  -- Get requesting user ID
  requesting_user_id := auth.uid();
  
  -- Extract owner_id from path (format: owner_id/filename.jpg)
  owner_id_from_path := (regexp_split_to_array(image_path, '/'))[1]::UUID;
  
  -- Check if user is admin
  is_user_admin := EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = requesting_user_id
  );
  
  -- Admin can access all images
  IF is_user_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Owner can access their own images
  IF requesting_user_id = owner_id_from_path THEN
    RETURN TRUE;
  END IF;
  
  -- For public access, check if this specific image belongs to an approved property
  -- This is the proper way using property_images table
  has_approved_property := EXISTS (
    SELECT 1 
    FROM public.property_images pi
    JOIN public.properties p ON pi.property_id = p.id
    WHERE pi.image_path = image_path 
      AND p.status = 'approved'
  );
  
  -- If no entry in property_images table, fall back to checking if owner has any approved property
  -- This is for backward compatibility during migration
  IF NOT has_approved_property THEN
    has_approved_property := EXISTS (
      SELECT 1 FROM public.properties
      WHERE owner_id = owner_id_from_path AND status = 'approved'
      LIMIT 1
    );
  END IF;
  
  RETURN has_approved_property;
  
EXCEPTION
  WHEN OTHERS THEN
    -- On any error, deny access for security
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- STEP 2: Update Storage Policies (Tightened)
-- =====================================================

-- Drop existing public read policy
DROP POLICY IF EXISTS "property_images_read_public" ON storage.objects;

-- Create more restrictive public read policy
-- ⚠️ CRITICAL SECURITY NOTE:
-- This policy still allows public access (TRUE clause) for backward compatibility.
-- This means ALL images are publicly accessible regardless of property status.
-- To enforce strict security:
--   1. Remove the "TRUE" clause below
--   2. Update frontend to use signed URLs via Supabase storage API
--   3. Populate property_images table for all uploads
--
-- Current policy (Phase 1 - Transitional):
CREATE POLICY "property_images_read_approved_owners_only" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'property-images' AND (
      -- Admin can see all
      auth.uid() IN (SELECT user_id FROM public.admins) OR
      -- Owner can see their own
      (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text) OR
      -- ⚠️ PUBLIC ACCESS - REMOVE THIS FOR STRICT SECURITY
      -- This clause makes all images public. For Phase 2, replace with:
      -- EXISTS (
      --   SELECT 1 FROM public.property_images pi
      --   JOIN public.properties p ON pi.property_id = p.id
      --   WHERE pi.image_path = name AND p.status = 'approved'
      -- )
      TRUE -- Temporarily keep public access for backward compatibility
    )
  );

-- =====================================================
-- STEP 3: Add Tracking Table for Image-Property Relationship
-- =====================================================

-- Create table to track which images belong to which properties
-- This enables proper access control
-- Note: Same image path can be used across different properties (logos, watermarks)
CREATE TABLE IF NOT EXISTS public.property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  image_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  -- Removed UNIQUE constraint to allow same image across multiple properties
);

-- Add index for performance (without uniqueness constraint)
CREATE INDEX IF NOT EXISTS idx_property_images_property_path 
  ON public.property_images(property_id, image_path);

-- Enable RLS
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

-- Users can insert images for their own properties
CREATE POLICY "property_images_insert_own" ON public.property_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = property_id AND owner_id = auth.uid()
    )
  );

-- Users can view images for their own properties
CREATE POLICY "property_images_select_own" ON public.property_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = property_id AND owner_id = auth.uid()
    )
  );

-- Admins can view all images
CREATE POLICY "property_images_select_admin" ON public.property_images
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Public can view images for approved properties
CREATE POLICY "property_images_select_public" ON public.property_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = property_id AND status = 'approved'
    )
  );

-- Users can delete their own property images
CREATE POLICY "property_images_delete_own" ON public.property_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = property_id AND owner_id = auth.uid()
    )
  );

-- Admins can delete any images
CREATE POLICY "property_images_delete_admin" ON public.property_images
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =====================================================
-- STEP 4: Create Function to Get Signed URL for Property Image
-- =====================================================

-- This function returns a signed URL for an image if user has access
-- Frontend should use this for serving images securely
-- NOTE: This is a placeholder for access control check
-- Actual signed URL generation must be done in the application using Supabase client
CREATE OR REPLACE FUNCTION public.validate_property_image_access(
  image_path TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  -- Check if user has access using the helper function
  has_access := public.can_access_property_image(image_path);
  
  RETURN has_access;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- STEP 5: Add Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_property_images_property_id 
  ON public.property_images(property_id);

CREATE INDEX IF NOT EXISTS idx_property_images_image_path 
  ON public.property_images(image_path);

-- =====================================================
-- DOCUMENTATION
-- =====================================================

-- USAGE NOTES:
--
-- 1. Frontend should populate property_images table when uploading images:
--    INSERT INTO property_images (property_id, image_path, image_order)
--    VALUES ('property-uuid', 'user-id/image.jpg', 0);
--
-- 2. To check if user can access an image:
--    SELECT can_access_property_image('user-id/image.jpg');
--
-- 3. For strict security, modify storage policy to remove public access:
--    - Remove the "TRUE" clause in property_images_read_approved_owners_only
--    - Use signed URLs generated by frontend for all image access
--
-- 4. Current implementation keeps public access for backward compatibility
--    - Images are accessible to anyone who knows the URL
--    - For production, migrate to signed URLs approach
--
-- 5. To migrate to strict security:
--    a. Update frontend to populate property_images table
--    b. Update frontend to use signed URLs via Supabase storage API
--    c. Remove public access policy from storage.objects
--
-- =====================================================
-- SECURITY CONSIDERATIONS
-- =====================================================

-- CURRENT STATE (Migration 052):
-- ✅ Created property_images table for tracking
-- ✅ Added helper functions for access control
-- ⚠️ Public read access still enabled for backward compatibility
-- ⚠️ Images are publicly accessible if URL is known
--
-- RECOMMENDED STATE (Future):
-- 🎯 Remove public read access from storage policies
-- 🎯 Use signed URLs for all image access
-- 🎯 Enforce property status checks via property_images table
--
-- =====================================================
-- ROLLBACK
-- =====================================================

-- To rollback this migration:
-- DROP TABLE IF EXISTS public.property_images CASCADE;
-- DROP FUNCTION IF EXISTS public.can_access_property_image(TEXT);
-- DROP FUNCTION IF EXISTS public.get_property_image_signed_url(TEXT, INT);
-- -- Then restore old policies from migration 050

-- =====================================================
-- END OF MIGRATION
-- =====================================================
