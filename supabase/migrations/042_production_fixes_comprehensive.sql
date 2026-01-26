-- =====================================================
-- PRODUCTION FIXES - COMPREHENSIVE
-- Fixes: Profile loading errors, Image upload failures, Auth emails
-- =====================================================
--
-- ISSUES BEING FIXED:
-- 1. Profile loading fails with "Erreur de chargement du profil" and HTTP 500
-- 2. Image upload fails when profile is missing or not yet synced
-- 3. Password reset emails not branded with site name (config needed in dashboard)
-- 4. Storage bucket policies too restrictive during signup/profile creation
--
-- SOLUTIONS:
-- 1. Ensure RLS policies allow profile creation for new users
-- 2. Relax storage bucket policies to allow uploads without profile check
-- 3. Create fallback mechanisms for profile loading
-- 4. Add better error logging and handling
-- =====================================================

-- =====================================================
-- PART 1: STORAGE BUCKETS - ENSURE THEY EXIST
-- =====================================================

-- Create storage buckets if they don't exist (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'property-images', 
    'property-images', 
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'banner-images', 
    'banner-images', 
    true,
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  ),
  (
    'payment-receipts', 
    'payment-receipts', 
    false,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
  ),
  (
    'agency-logos', 
    'agency-logos', 
    true,
    1048576, -- 1MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- PART 2: STORAGE RLS POLICIES - RELAXED FOR UPLOADS
-- =====================================================
-- 
-- CRITICAL FIX: Remove profile existence check from storage policies
-- This allows users to upload images even if profile creation is delayed
-- Security is maintained via folder structure (users can only upload to their own folder)
-- =====================================================

-- =====================================================
-- 2.1 PROPERTY IMAGES - Allow authenticated users
-- =====================================================

-- Public read access
DROP POLICY IF EXISTS "property_images_public_read" ON storage.objects;
CREATE POLICY "property_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');

-- Authenticated insert - NO PROFILE CHECK (this is the fix!)
DROP POLICY IF EXISTS "property_images_auth_insert" ON storage.objects;
CREATE POLICY "property_images_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images' 
    AND auth.uid() IS NOT NULL 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner can update/delete their own files
DROP POLICY IF EXISTS "property_images_owner_update" ON storage.objects;
CREATE POLICY "property_images_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'property-images' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text 
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR user_role = 'admin'))
    )
  );

DROP POLICY IF EXISTS "property_images_owner_delete" ON storage.objects;
CREATE POLICY "property_images_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-images' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text 
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR user_role = 'admin'))
    )
  );

-- =====================================================
-- 2.2 BANNER IMAGES - Allow authenticated users
-- =====================================================

DROP POLICY IF EXISTS "banner_images_public_read" ON storage.objects;
CREATE POLICY "banner_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'banner-images');

-- Authenticated insert - NO PROFILE CHECK
DROP POLICY IF EXISTS "banner_images_commercial_insert" ON storage.objects;
CREATE POLICY "banner_images_commercial_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'banner-images' 
    AND auth.uid() IS NOT NULL 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "banner_images_owner_update" ON storage.objects;
CREATE POLICY "banner_images_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'banner-images' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text 
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR user_role = 'admin'))
    )
  );

DROP POLICY IF EXISTS "banner_images_owner_delete" ON storage.objects;
CREATE POLICY "banner_images_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'banner-images' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text 
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR user_role = 'admin'))
    )
  );

-- =====================================================
-- 2.3 PAYMENT RECEIPTS - Private bucket
-- =====================================================

DROP POLICY IF EXISTS "payment_receipts_owner_read" ON storage.objects;
CREATE POLICY "payment_receipts_owner_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-receipts' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text 
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR user_role = 'admin'))
    )
  );

-- Authenticated insert - NO PROFILE CHECK
DROP POLICY IF EXISTS "payment_receipts_auth_insert" ON storage.objects;
CREATE POLICY "payment_receipts_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-receipts' 
    AND auth.uid() IS NOT NULL 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "payment_receipts_owner_delete" ON storage.objects;
CREATE POLICY "payment_receipts_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'payment-receipts' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text 
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR user_role = 'admin'))
    )
  );

-- =====================================================
-- 2.4 AGENCY LOGOS - Allow authenticated users
-- =====================================================

DROP POLICY IF EXISTS "agency_logos_public_read" ON storage.objects;
CREATE POLICY "agency_logos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'agency-logos');

-- Authenticated insert - NO PROFILE CHECK
DROP POLICY IF EXISTS "agency_logos_agency_insert" ON storage.objects;
CREATE POLICY "agency_logos_agency_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'agency-logos' 
    AND auth.uid() IS NOT NULL 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "agency_logos_owner_update" ON storage.objects;
CREATE POLICY "agency_logos_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'agency-logos' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text 
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR user_role = 'admin'))
    )
  );

DROP POLICY IF EXISTS "agency_logos_owner_delete" ON storage.objects;
CREATE POLICY "agency_logos_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'agency-logos' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text 
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR user_role = 'admin'))
    )
  );

-- =====================================================
-- PART 3: VERIFY PROFILE RLS POLICIES FROM MIGRATION 041
-- =====================================================
-- These should already exist from migration 041, but we verify them here
-- =====================================================

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Verify the key policies exist (idempotent - will fail silently if they exist)
DO $$ 
BEGIN
  -- Check if SELECT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Enable read access for users to their own profile'
  ) THEN
    CREATE POLICY "Enable read access for users to their own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
      id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND (is_admin = true OR user_role = 'admin')
      )
    );
  END IF;

  -- Check if INSERT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Enable insert for users to create their own profile'
  ) THEN
    CREATE POLICY "Enable insert for users to create their own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());
  END IF;

  -- Check if UPDATE policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Enable update for users to their own profile'
  ) THEN
    CREATE POLICY "Enable update for users to their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- =====================================================
-- PART 4: ENSURE PROFILE TRIGGER EXISTS
-- =====================================================
-- This trigger automatically creates profiles for new auth users
-- =====================================================

-- Create the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, user_role, company_name, is_active, is_verified, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'user_role', 'real_estate_advertiser'),
    COALESCE(NEW.raw_user_meta_data->>'company_name', NULL),
    true,
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger to ensure it's up to date
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- PART 5: ADD HELPFUL COMMENTS
-- =====================================================

COMMENT ON POLICY "property_images_auth_insert" ON storage.objects IS
  'PRODUCTION FIX: Allows any authenticated user to upload property images to their own folder.
   Removed profile existence check to fix upload failures when profile creation is delayed.
   Security maintained via folder structure - users can only upload to folder matching their user ID.
   Frontend validation ensures only real_estate_advertiser role can access upload UI.';

COMMENT ON POLICY "banner_images_commercial_insert" ON storage.objects IS
  'PRODUCTION FIX: Allows any authenticated user to upload banner images to their own folder.
   Removed profile existence check to fix upload failures.
   Frontend validation ensures only commercial_advertiser role can access upload UI.';

COMMENT ON POLICY "payment_receipts_auth_insert" ON storage.objects IS
  'PRODUCTION FIX: Allows any authenticated user to upload payment receipts to their own folder.
   Removed profile existence check to fix upload failures.';

COMMENT ON POLICY "agency_logos_agency_insert" ON storage.objects IS
  'PRODUCTION FIX: Allows any authenticated user to upload agency logos to their own folder.
   Removed profile existence check to fix upload failures.
   Frontend validation ensures only agencies can access logo upload UI.';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
--
-- Run these in Supabase SQL Editor to verify the fix:
--
-- 1. Check storage buckets exist:
--    SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets;
--
-- 2. Check storage policies (should NOT require profile to exist):
--    SELECT schemaname, tablename, policyname, cmd, qual, with_check
--    FROM pg_policies 
--    WHERE tablename = 'objects' 
--    AND policyname LIKE '%insert%'
--    ORDER BY policyname;
--
-- 3. Check profile policies:
--    SELECT policyname, cmd FROM pg_policies 
--    WHERE schemaname = 'public' AND tablename = 'profiles'
--    ORDER BY policyname;
--
-- 4. Verify trigger exists:
--    SELECT tgname, tgenabled FROM pg_trigger 
--    WHERE tgname = 'on_auth_user_created';
--
-- =====================================================
-- EXPECTED RESULTS AFTER THIS MIGRATION
-- =====================================================
--
-- ✅ New users can sign up and profile is auto-created by trigger
-- ✅ If trigger fails, AuthContext creates fallback profile
-- ✅ Users can upload images immediately after signup (no profile check)
-- ✅ Old users with existing profiles continue to work
-- ✅ No more "Erreur de chargement du profil" errors
-- ✅ No more 500 errors on image upload
--
-- 📧 EMAIL CONFIGURATION (Manual - Supabase Dashboard):
-- 1. Go to Supabase Dashboard → Auth → Email Templates
-- 2. Set Sender Name: TopAffaireImmo
-- 3. Update email subjects to include site name
-- 4. Customize email templates with branding
-- 5. Configure Site URL: https://topaffaireimmo.com
-- 6. Add Redirect URLs: https://topaffaireimmo.com/**, https://*.vercel.app/**
--
-- See documentation in docs/EMAIL_CONFIGURATION.md for details
-- =====================================================
