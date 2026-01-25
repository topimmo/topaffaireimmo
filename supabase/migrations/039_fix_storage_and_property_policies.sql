-- =====================================================
-- FIX STORAGE POLICIES: Allow uploads even if profile sync is delayed
-- =====================================================
-- 
-- ISSUE: Storage policies check for profile existence before allowing uploads
--        If profile creation is delayed or fails, authenticated users can't upload
--
-- SOLUTION: Relax storage policies to allow authenticated users to upload
--           while still maintaining security via folder structure (user_id folder)
-- =====================================================

-- =====================================================
-- 1. PROPERTY IMAGES - Allow real estate advertisers
-- =====================================================

DROP POLICY IF EXISTS "property_images_auth_insert" ON storage.objects;

-- New policy: Allow authenticated users to upload to their own folder
-- Security: Files must be in user's folder (checked via folder structure)
-- Note: We rely on frontend validation for user_role, and admin can clean up if needed
CREATE POLICY "property_images_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

COMMENT ON POLICY "property_images_auth_insert" ON storage.objects IS
  'Allows authenticated users to upload property images to their own folder.
   Removed profile check to handle cases where profile creation is delayed.
   Security maintained via folder structure - users can only upload to their own folder.';

-- =====================================================
-- 2. BANNER IMAGES - Allow commercial advertisers
-- =====================================================

DROP POLICY IF EXISTS "banner_images_commercial_insert" ON storage.objects;

-- Allow authenticated users to upload banner images
-- Frontend still restricts this to commercial advertisers
CREATE POLICY "banner_images_commercial_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'banner-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

COMMENT ON POLICY "banner_images_commercial_insert" ON storage.objects IS
  'Allows authenticated users to upload banner images to their own folder.
   Frontend restricts access to commercial advertisers only.';

-- =====================================================
-- 3. AGENCY LOGOS - More restrictive with time constraint
-- =====================================================

-- For agency logos, keep profile check but be more permissive for new users
-- Add a time constraint to prevent abuse if profile creation is delayed
DROP POLICY IF EXISTS "agency_logos_agency_insert" ON storage.objects;

CREATE POLICY "agency_logos_agency_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'agency-logos' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (
      -- Allow if profile exists and is correct type
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND user_role = 'real_estate_advertiser'
        AND advertiser_type = 'agency'
      )
      OR
      -- Also allow if no profile exists yet BUT auth user was created recently (< 5 minutes ago)
      -- This prevents abuse if trigger fails for old users
      (
        NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
        AND EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid()
          AND created_at > NOW() - INTERVAL '5 minutes'
        )
      )
    )
  );

COMMENT ON POLICY "agency_logos_agency_insert" ON storage.objects IS
  'Allows real estate advertisers (agencies) to upload logos.
   Also allows if profile does not exist yet AND user was created within last 5 minutes.
   Time constraint prevents abuse if profile creation is delayed.';

-- =====================================================
-- 4. PROPERTIES TABLE - Improve INSERT policy
-- =====================================================

-- Check current properties INSERT policy from migration 034
-- The can_insert_property function already handles missing profiles well
-- But let's verify and improve it if needed

CREATE OR REPLACE FUNCTION public.can_insert_property(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Allow if user is authenticated AND one of:
  --   1. No profile exists yet (trigger will create it)
  --   2. Profile exists with correct role (real_estate_advertiser or admin)
  RETURN user_id IS NOT NULL AND (
    NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = user_id 
      AND (user_role IN ('real_estate_advertiser', 'admin') OR is_admin = true)
    )
  );
END;
$$;

COMMENT ON FUNCTION public.can_insert_property(UUID) IS
  'Checks if a user can insert a property listing.
   Returns true if: (1) no profile exists yet, OR (2) profile exists with correct role.
   This handles the case where profile creation may be delayed after signup.';

-- Recreate the INSERT policy for properties (from migration 034)
DROP POLICY IF EXISTS "properties_insert_authenticated" ON public.properties;

CREATE POLICY "properties_insert_authenticated" ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    public.can_insert_property(auth.uid())
  );

COMMENT ON POLICY "properties_insert_authenticated" ON public.properties IS
  'Allows authenticated users to insert properties if they have correct role or no profile yet.
   Uses can_insert_property() function for role checking with missing profile handling.';

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================

-- To verify these policies are working, run:
-- 
-- 1. Check storage policies:
--    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
--    FROM pg_policies 
--    WHERE tablename = 'objects' AND policyname LIKE '%insert%';
--
-- 2. Check properties policies:
--    SELECT * FROM pg_policies WHERE tablename = 'properties' AND policyname LIKE '%insert%';
--
-- 3. Test as authenticated user (replace <user_id> with actual ID):
--    SELECT public.can_insert_property('<user_id>'::UUID);
