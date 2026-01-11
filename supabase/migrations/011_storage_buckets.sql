-- Storage Buckets Configuration for TopAffaireImmo
-- Creates and secures all required storage buckets

-- =====================================================
-- 1. CREATE STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('property-images', 'property-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('banner-images', 'banner-images', false, 1048576, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('payment-receipts', 'payment-receipts', false, 2097152, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
  ('agency-logos', 'agency-logos', true, 524288, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- 2. PROPERTY IMAGES BUCKET POLICIES
-- =====================================================

DROP POLICY IF EXISTS "property_images_select" ON storage.objects;
CREATE POLICY "property_images_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'property-images' AND (
      EXISTS (
        SELECT 1 FROM properties p 
        WHERE p.images::jsonb @> to_jsonb(name)
        AND (p.status = 'approved' OR p.owner_id = auth.uid())
      ) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
    )
  );

DROP POLICY IF EXISTS "property_images_insert" ON storage.objects;
CREATE POLICY "property_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "property_images_update" ON storage.objects;
CREATE POLICY "property_images_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'property-images' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
    )
  );

DROP POLICY IF EXISTS "property_images_delete" ON storage.objects;
CREATE POLICY "property_images_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-images' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
    )
  );

-- =====================================================
-- 3. BANNER IMAGES BUCKET POLICIES
-- =====================================================

DROP POLICY IF EXISTS "banner_images_select" ON storage.objects;
CREATE POLICY "banner_images_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'banner-images' AND (
      EXISTS (
        SELECT 1 FROM banner_requests br 
        WHERE br.banner_image_url LIKE '%' || name || '%'
        AND br.status = 'active'
      ) OR
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
    )
  );

DROP POLICY IF EXISTS "banner_images_insert" ON storage.objects;
CREATE POLICY "banner_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'banner-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('commercial_advertiser', 'admin')
    )
  );

DROP POLICY IF EXISTS "banner_images_delete" ON storage.objects;
CREATE POLICY "banner_images_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'banner-images' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
    )
  );

-- =====================================================
-- 4. PAYMENT RECEIPTS BUCKET POLICIES
-- =====================================================

DROP POLICY IF EXISTS "payment_receipts_select" ON storage.objects;
CREATE POLICY "payment_receipts_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-receipts' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
    )
  );

DROP POLICY IF EXISTS "payment_receipts_insert" ON storage.objects;
CREATE POLICY "payment_receipts_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-receipts' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "payment_receipts_delete" ON storage.objects;
CREATE POLICY "payment_receipts_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'payment-receipts' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
  );

-- =====================================================
-- 5. AGENCY LOGOS BUCKET POLICIES (Public Read)
-- =====================================================

DROP POLICY IF EXISTS "agency_logos_select" ON storage.objects;
CREATE POLICY "agency_logos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'agency-logos');

DROP POLICY IF EXISTS "agency_logos_insert" ON storage.objects;
CREATE POLICY "agency_logos_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'agency-logos' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_role = 'real_estate_advertiser'
      AND advertiser_type = 'agency'
    )
  );

DROP POLICY IF EXISTS "agency_logos_delete" ON storage.objects;
CREATE POLICY "agency_logos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'agency-logos' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
    )
  );
