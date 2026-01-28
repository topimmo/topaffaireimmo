-- =====================================================
-- Migration 049: Remove Profile Dependency from RLS
-- =====================================================
--
-- OBJECTIVE:
-- Update RLS policies to work without profiles table dependency.
-- Allow authenticated users to create and manage their own properties.
-- Remove role-based checks that rely on profiles table.
--
-- CHANGES:
-- 1. Update properties RLS policies to use auth.uid() only
-- 2. Remove profile-dependent helper functions from property policies
-- 3. Ensure owner_id column can default to auth.uid()
-- 4. Update storage bucket policies if needed
--
-- =====================================================

-- =====================================================
-- STEP 1: Update Properties Table - Make owner_id default to auth.uid()
-- =====================================================

-- Ensure owner_id can use auth.uid() as default
-- This allows properties to be created without profile dependency
ALTER TABLE public.properties 
  ALTER COLUMN owner_id SET DEFAULT auth.uid();

-- Update foreign key to reference auth.users instead of profiles
-- First drop the old constraint
ALTER TABLE public.properties 
  DROP CONSTRAINT IF EXISTS properties_owner_id_fkey;

-- Add new constraint referencing auth.users
-- This allows properties to exist without a profile row
ALTER TABLE public.properties 
  ADD CONSTRAINT properties_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- =====================================================
-- STEP 2: Update RLS Policies for Properties
-- =====================================================

-- Drop old policies that depend on profiles
DROP POLICY IF EXISTS "properties_insert_real_estate" ON public.properties;
DROP POLICY IF EXISTS "properties_select_public" ON public.properties;
DROP POLICY IF EXISTS "properties_update_own" ON public.properties;
DROP POLICY IF EXISTS "properties_delete_own" ON public.properties;

-- New policy: Any authenticated user can insert properties
CREATE POLICY "properties_insert_authenticated" ON public.properties
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    owner_id = auth.uid()
  );

-- New policy: Select public approved properties or own properties
CREATE POLICY "properties_select_public" ON public.properties
  FOR SELECT USING (
    status = 'approved' OR 
    owner_id = auth.uid()
  );

-- New policy: Update own properties
CREATE POLICY "properties_update_own" ON public.properties
  FOR UPDATE USING (
    owner_id = auth.uid()
  );

-- New policy: Delete own properties
CREATE POLICY "properties_delete_own" ON public.properties
  FOR DELETE USING (
    owner_id = auth.uid()
  );

-- =====================================================
-- STEP 3: Ensure advertiser_type column exists
-- =====================================================

-- The column already exists from migration 020, but let's ensure it's correct
-- Add column if it doesn't exist (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'properties' 
    AND column_name = 'advertiser_type'
  ) THEN
    ALTER TABLE public.properties 
      ADD COLUMN advertiser_type TEXT DEFAULT 'owner' 
      CHECK (advertiser_type IN ('owner', 'broker', 'agency'));
  END IF;
END $$;

-- =====================================================
-- STEP 4: Update Storage Bucket Policies
-- =====================================================

-- Update property-images bucket policy to allow authenticated users
-- Drop old policies
DROP POLICY IF EXISTS "property_images_upload" ON storage.objects;
DROP POLICY IF EXISTS "property_images_select" ON storage.objects;
DROP POLICY IF EXISTS "property_images_delete" ON storage.objects;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "property_images_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow anyone to view property images (public bucket)
CREATE POLICY "property_images_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'property-images'
  );

-- Allow users to delete their own images
CREATE POLICY "property_images_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================
-- STEP 5: Update moderated_by to allow null or reference auth.users
-- =====================================================

-- Update moderated_by foreign key to reference auth.users
ALTER TABLE public.properties 
  DROP CONSTRAINT IF EXISTS properties_moderated_by_fkey;

ALTER TABLE public.properties 
  ADD CONSTRAINT properties_moderated_by_fkey 
  FOREIGN KEY (moderated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify policies are updated:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies 
-- WHERE tablename = 'properties';

-- Verify owner_id constraint references auth.users:
-- SELECT conname, conrelid::regclass, confrelid::regclass
-- FROM pg_constraint
-- WHERE conname = 'properties_owner_id_fkey';

-- =====================================================
-- ROLLBACK NOTES
-- =====================================================

-- To rollback this migration:
-- 1. Restore original RLS policies from migration 020
-- 2. Restore foreign key constraints to reference profiles
-- 3. This may break properties that don't have profile rows

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================

-- After this migration:
-- - Properties can be created by any authenticated user
-- - No profile row is required
-- - owner_id references auth.users, not profiles
-- - advertiser_type is stored per property, not per user
-- - Storage upload works based on auth.uid() only

-- =====================================================
-- END OF MIGRATION
-- =====================================================
