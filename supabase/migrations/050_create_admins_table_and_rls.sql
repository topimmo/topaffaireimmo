-- =====================================================
-- Migration 050: Create Admins Table and Update RLS
-- =====================================================
--
-- OBJECTIVE:
-- Implement clean Admin/User listing management system
-- - Create admins table for admin identification
-- - Update properties table structure
-- - Implement comprehensive RLS policies
-- - Add status change protection trigger
-- - Update storage bucket policies
--
-- =====================================================

-- =====================================================
-- STEP 1: Create Admins Table
-- =====================================================

-- Create admins table to identify admin users
CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Only admins can view the admins table
CREATE POLICY "admins_select_admin_only" ON public.admins
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Only admins can insert new admins
CREATE POLICY "admins_insert_admin_only" ON public.admins
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Only admins can delete admins
CREATE POLICY "admins_delete_admin_only" ON public.admins
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =====================================================
-- STEP 2: Ensure Properties Table Structure
-- =====================================================

-- Ensure owner_id defaults to auth.uid()
ALTER TABLE public.properties 
  ALTER COLUMN owner_id SET DEFAULT auth.uid();

-- Ensure status column exists with correct type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'properties' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.properties 
      ADD COLUMN status TEXT DEFAULT 'pending' 
      CHECK (status IN ('pending', 'approved', 'rejected', 'inactive'));
  END IF;
END $$;

-- Ensure announcer_type column exists (NOT from user profile)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'properties' 
    AND column_name = 'announcer_type'
  ) THEN
    ALTER TABLE public.properties 
      ADD COLUMN announcer_type TEXT 
      CHECK (announcer_type IN ('proprietaire', 'courtier', 'agence'));
  END IF;
END $$;

-- =====================================================
-- STEP 3: Update Properties RLS Policies
-- =====================================================

-- Drop all existing policies to recreate them cleanly
DROP POLICY IF EXISTS "properties_insert_authenticated" ON public.properties;
DROP POLICY IF EXISTS "properties_insert_real_estate" ON public.properties;
DROP POLICY IF EXISTS "properties_select_public" ON public.properties;
DROP POLICY IF EXISTS "properties_select_own" ON public.properties;
DROP POLICY IF EXISTS "properties_update_own" ON public.properties;
DROP POLICY IF EXISTS "properties_delete_own" ON public.properties;
DROP POLICY IF EXISTS "properties_select_admin" ON public.properties;
DROP POLICY IF EXISTS "properties_update_admin" ON public.properties;
DROP POLICY IF EXISTS "properties_delete_admin" ON public.properties;

-- INSERT Policy: Any authenticated user can create listings
CREATE POLICY "properties_insert_authenticated" ON public.properties
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    owner_id = auth.uid()
  );

-- SELECT Policies: 
-- 1. Users can read their own listings
CREATE POLICY "properties_select_own" ON public.properties
  FOR SELECT USING (
    owner_id = auth.uid()
  );

-- 2. Admin can read ALL listings
CREATE POLICY "properties_select_admin" ON public.properties
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- 3. Public can read approved listings (for property details page)
CREATE POLICY "properties_select_public" ON public.properties
  FOR SELECT USING (
    status = 'approved'
  );

-- UPDATE Policies:
-- 1. Users can update their own listings
CREATE POLICY "properties_update_own" ON public.properties
  FOR UPDATE USING (
    owner_id = auth.uid()
  );

-- 2. Admin can update ALL listings
CREATE POLICY "properties_update_admin" ON public.properties
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- DELETE Policies:
-- 1. Users can delete their own listings
CREATE POLICY "properties_delete_own" ON public.properties
  FOR DELETE USING (
    owner_id = auth.uid()
  );

-- 2. Admin can delete ALL listings
CREATE POLICY "properties_delete_admin" ON public.properties
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =====================================================
-- STEP 4: Status Security Trigger
-- =====================================================

-- Create function to protect status changes
CREATE OR REPLACE FUNCTION public.protect_property_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is being changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Check if user is admin
    IF NOT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) THEN
      -- If not admin, prevent status change
      NEW.status := OLD.status;
      
      -- Optionally raise a notice (won't stop the update, just warns)
      RAISE NOTICE 'Status change prevented: Only admins can change property status';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on properties table
DROP TRIGGER IF EXISTS protect_property_status_trigger ON public.properties;
CREATE TRIGGER protect_property_status_trigger
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_property_status();

-- =====================================================
-- STEP 5: Update Storage Bucket Policies
-- =====================================================

-- Drop all existing property-images policies
DROP POLICY IF EXISTS "property_images_upload" ON storage.objects;
DROP POLICY IF EXISTS "property_images_select" ON storage.objects;
DROP POLICY IF EXISTS "property_images_delete" ON storage.objects;
DROP POLICY IF EXISTS "property_images_read" ON storage.objects;
DROP POLICY IF EXISTS "property_images_insert" ON storage.objects;

-- INSERT/UPLOAD Policy: Users can upload to their own folder
CREATE POLICY "property_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT/READ Policy: 
-- 1. Users can read their own images
CREATE POLICY "property_images_read_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2. Admin can read all images
CREATE POLICY "property_images_read_admin" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'property-images' AND
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- 3. Public can read all images (for approved property display)
CREATE POLICY "property_images_read_public" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'property-images'
  );

-- DELETE Policy:
-- 1. Users can delete their own images
CREATE POLICY "property_images_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2. Admin can delete all images
CREATE POLICY "property_images_delete_admin" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-images' AND
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =====================================================
-- STEP 6: Create Helper Function to Check Admin Status
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins WHERE admins.user_id = is_admin.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify admins table exists:
-- SELECT * FROM public.admins;

-- Verify properties policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies 
-- WHERE tablename = 'properties'
-- ORDER BY policyname;

-- Verify storage policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies 
-- WHERE tablename = 'objects' AND policyname LIKE '%property_images%'
-- ORDER BY policyname;

-- Verify trigger exists:
-- SELECT tgname, tgrelid::regclass
-- FROM pg_trigger
-- WHERE tgname = 'protect_property_status_trigger';

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================

-- After this migration:
-- 1. Create your first admin user by running:
--    INSERT INTO public.admins (user_id) VALUES ('your-user-uuid-here');
-- 
-- 2. Any authenticated user can create listings
-- 3. Users see only their own listings (unless approved)
-- 4. Admin sees ALL listings
-- 5. Only admins can change status (enforced by trigger)
-- 6. Image upload works based on auth.uid() only
-- 7. No profile table dependency

-- =====================================================
-- END OF MIGRATION
-- =====================================================
