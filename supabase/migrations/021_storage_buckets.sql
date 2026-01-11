-- =====================================================
-- TOPAFFAIREIMMO - STORAGE BUCKETS CONFIGURATION
-- Secure file storage for all user uploads
-- =====================================================

-- =====================================================
-- 1. CREATE STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'property-images', 
    'property-images', 
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'banner-images', 
    'banner-images', 
    true,
    2097152,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  ),
  (
    'payment-receipts', 
    'payment-receipts', 
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
  ),
  (
    'agency-logos', 
    'agency-logos', 
    true,
    1048576,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- 2. PROPERTY IMAGES BUCKET POLICIES
-- Real estate advertisers can upload their own property images
-- =====================================================

DROP POLICY IF EXISTS "property_images_public_read" ON storage.objects;
CREATE POLICY "property_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');

DROP POLICY IF EXISTS "property_images_auth_insert" ON storage.objects;
CREATE POLICY "property_images_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('real_estate_advertiser', 'admin')
    )
  );

DROP POLICY IF EXISTS "property_images_owner_update" ON storage.objects;
CREATE POLICY "property_images_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'property-images' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_role = 'admin')
    )
  );

DROP POLICY IF EXISTS "property_images_owner_delete" ON storage.objects;
CREATE POLICY "property_images_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-images' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_role = 'admin')
    )
  );

-- =====================================================
-- 3. BANNER IMAGES BUCKET POLICIES
-- Commercial advertisers only can upload banner images
-- =====================================================

DROP POLICY IF EXISTS "banner_images_public_read" ON storage.objects;
CREATE POLICY "banner_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'banner-images');

DROP POLICY IF EXISTS "banner_images_commercial_insert" ON storage.objects;
CREATE POLICY "banner_images_commercial_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'banner-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('commercial_advertiser', 'admin')
    )
  );

DROP POLICY IF EXISTS "banner_images_owner_update" ON storage.objects;
CREATE POLICY "banner_images_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'banner-images' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_role = 'admin')
    )
  );

DROP POLICY IF EXISTS "banner_images_owner_delete" ON storage.objects;
CREATE POLICY "banner_images_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'banner-images' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_role = 'admin')
    )
  );

-- =====================================================
-- 4. PAYMENT RECEIPTS BUCKET POLICIES
-- Private: only owner and admin can access
-- =====================================================

DROP POLICY IF EXISTS "payment_receipts_owner_read" ON storage.objects;
CREATE POLICY "payment_receipts_owner_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-receipts' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_role = 'admin')
    )
  );

DROP POLICY IF EXISTS "payment_receipts_auth_insert" ON storage.objects;
CREATE POLICY "payment_receipts_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-receipts' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "payment_receipts_owner_delete" ON storage.objects;
CREATE POLICY "payment_receipts_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'payment-receipts' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_role = 'admin')
    )
  );

-- =====================================================
-- 5. AGENCY LOGOS BUCKET POLICIES
-- Public read, only agencies can upload
-- =====================================================

DROP POLICY IF EXISTS "agency_logos_public_read" ON storage.objects;
CREATE POLICY "agency_logos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'agency-logos');

DROP POLICY IF EXISTS "agency_logos_agency_insert" ON storage.objects;
CREATE POLICY "agency_logos_agency_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'agency-logos' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_role = 'real_estate_advertiser'
      AND advertiser_type = 'agency'
    )
  );

DROP POLICY IF EXISTS "agency_logos_owner_update" ON storage.objects;
CREATE POLICY "agency_logos_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'agency-logos' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_role = 'admin')
    )
  );

DROP POLICY IF EXISTS "agency_logos_owner_delete" ON storage.objects;
CREATE POLICY "agency_logos_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'agency-logos' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_role = 'admin')
    )
  );

-- =====================================================
-- STORAGE CONFIGURATION COMPLETE
-- =====================================================
