-- =====================================================
-- MINIMUM WORKING RLS POLICIES FOR TOPAFFAIREIMMO
-- =====================================================
-- This script provides safe, minimum RLS policies for all tables
-- Run this ONLY if you need to add missing policies
-- 
-- IMPORTANT: Review existing policies before running this!
-- Use RLS_INSPECTION.sql first to check what policies exist
--
-- These policies follow the principle of least privilege:
-- - Public read only for published/approved content
-- - Authenticated users can manage their own data
-- - Admins have full access via is_admin() function
-- =====================================================

-- =====================================================
-- HELPER FUNCTION: is_admin()
-- =====================================================
-- Verify this function exists (should be created by migration 110+)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
  ) THEN
    -- Create the function if it doesn't exist
    CREATE OR REPLACE FUNCTION public.is_admin()
    RETURNS BOOLEAN AS $func$
    BEGIN
      RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND user_role = 'admin'
      );
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
    
    RAISE NOTICE 'Created is_admin() function';
  ELSE
    RAISE NOTICE 'is_admin() function already exists';
  END IF;
END $$;

-- =====================================================
-- PROFILES TABLE
-- =====================================================
-- Users can read all profiles (for public listings/artisans)
-- Users can update only their own profile
-- Admins have full access

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Authenticated users can read all profiles
CREATE POLICY IF NOT EXISTS "profiles_select_authenticated" 
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- SELECT: Anon can read basic profile info (needed for listings)
CREATE POLICY IF NOT EXISTS "profiles_select_anon" 
ON public.profiles FOR SELECT
TO anon
USING (true);

-- INSERT: Users can insert their own profile (signup)
CREATE POLICY IF NOT EXISTS "profiles_insert_own" 
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own profile
CREATE POLICY IF NOT EXISTS "profiles_update_own" 
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- UPDATE: Admins can update any profile
CREATE POLICY IF NOT EXISTS "profiles_update_admin" 
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- DELETE: Admins only
CREATE POLICY IF NOT EXISTS "profiles_delete_admin" 
ON public.profiles FOR DELETE
TO authenticated
USING (public.is_admin());

-- =====================================================
-- PROPERTIES TABLE
-- =====================================================
-- Public can read published properties
-- Authenticated users can create properties
-- Users can update/delete their own properties
-- Admins have full access

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- SELECT: Anon can read published properties
CREATE POLICY IF NOT EXISTS "properties_select_published_anon" 
ON public.properties FOR SELECT
TO anon
USING (status = 'published');

-- SELECT: Authenticated can read all properties
CREATE POLICY IF NOT EXISTS "properties_select_authenticated" 
ON public.properties FOR SELECT
TO authenticated
USING (true);

-- INSERT: Authenticated users can create properties
CREATE POLICY IF NOT EXISTS "properties_insert_authenticated" 
ON public.properties FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own properties
CREATE POLICY IF NOT EXISTS "properties_update_own" 
ON public.properties FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Admins can update any property
CREATE POLICY IF NOT EXISTS "properties_update_admin" 
ON public.properties FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- DELETE: Users can delete their own properties
CREATE POLICY IF NOT EXISTS "properties_delete_own" 
ON public.properties FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- DELETE: Admins can delete any property
CREATE POLICY IF NOT EXISTS "properties_delete_admin" 
ON public.properties FOR DELETE
TO authenticated
USING (public.is_admin());

-- =====================================================
-- SITE_SETTINGS TABLE
-- =====================================================
-- Public read for all settings
-- Only admins can modify

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- SELECT: Anyone can read site settings
CREATE POLICY IF NOT EXISTS "site_settings_select_all" 
ON public.site_settings FOR SELECT
TO anon, authenticated
USING (true);

-- INSERT/UPDATE/DELETE: Admins only
CREATE POLICY IF NOT EXISTS "site_settings_insert_admin" 
ON public.site_settings FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY IF NOT EXISTS "site_settings_update_admin" 
ON public.site_settings FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY IF NOT EXISTS "site_settings_delete_admin" 
ON public.site_settings FOR DELETE
TO authenticated
USING (public.is_admin());

-- =====================================================
-- PLATFORM_SETTINGS TABLE
-- =====================================================

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- SELECT: Anyone can read platform settings
CREATE POLICY IF NOT EXISTS "platform_settings_select_all" 
ON public.platform_settings FOR SELECT
TO anon, authenticated
USING (true);

-- INSERT/UPDATE/DELETE: Admins only
CREATE POLICY IF NOT EXISTS "platform_settings_modify_admin" 
ON public.platform_settings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =====================================================
-- SERVICE_CATEGORIES TABLE
-- =====================================================

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- SELECT: Public read
CREATE POLICY IF NOT EXISTS "service_categories_select_all" 
ON public.service_categories FOR SELECT
TO anon, authenticated
USING (true);

-- INSERT/UPDATE/DELETE: Admins only
CREATE POLICY IF NOT EXISTS "service_categories_modify_admin" 
ON public.service_categories FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =====================================================
-- SERVICE_SUBCATEGORIES TABLE
-- =====================================================

ALTER TABLE public.service_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "service_subcategories_select_all" 
ON public.service_subcategories FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY IF NOT EXISTS "service_subcategories_modify_admin" 
ON public.service_subcategories FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =====================================================
-- ARTISAN_PROFILES TABLE
-- =====================================================

ALTER TABLE public.artisan_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Public can read approved artisan profiles
CREATE POLICY IF NOT EXISTS "artisan_profiles_select_approved" 
ON public.artisan_profiles FOR SELECT
TO anon
USING (is_approved = true);

-- SELECT: Authenticated can see all
CREATE POLICY IF NOT EXISTS "artisan_profiles_select_authenticated" 
ON public.artisan_profiles FOR SELECT
TO authenticated
USING (true);

-- INSERT: Authenticated users can create
CREATE POLICY IF NOT EXISTS "artisan_profiles_insert_authenticated" 
ON public.artisan_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users update their own
CREATE POLICY IF NOT EXISTS "artisan_profiles_update_own" 
ON public.artisan_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Admins can update any (for approval)
CREATE POLICY IF NOT EXISTS "artisan_profiles_update_admin" 
ON public.artisan_profiles FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- DELETE: Own or admin
CREATE POLICY IF NOT EXISTS "artisan_profiles_delete_own_or_admin" 
ON public.artisan_profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- =====================================================
-- ARTISAN_SERVICES TABLE
-- =====================================================

ALTER TABLE public.artisan_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "artisan_services_select_all" 
ON public.artisan_services FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY IF NOT EXISTS "artisan_services_modify_authenticated" 
ON public.artisan_services FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- PROPERTY_IMAGES TABLE
-- =====================================================

ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

-- SELECT: Public can view images of published properties
CREATE POLICY IF NOT EXISTS "property_images_select_public" 
ON public.property_images FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_images.property_id
      AND properties.status = 'published'
  )
);

-- INSERT: Property owner can add images
CREATE POLICY IF NOT EXISTS "property_images_insert_owner" 
ON public.property_images FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_images.property_id
      AND properties.user_id = auth.uid()
  )
);

-- UPDATE: Property owner can update images
CREATE POLICY IF NOT EXISTS "property_images_update_owner" 
ON public.property_images FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_images.property_id
      AND properties.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_images.property_id
      AND properties.user_id = auth.uid()
  )
);

-- DELETE: Property owner or admin
CREATE POLICY IF NOT EXISTS "property_images_delete_owner_or_admin" 
ON public.property_images FOR DELETE
TO authenticated
USING (
  public.is_admin() OR
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_images.property_id
      AND properties.user_id = auth.uid()
  )
);

-- =====================================================
-- REQUESTS TABLE (Service Requests)
-- =====================================================

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- SELECT: Users see their own requests
CREATE POLICY IF NOT EXISTS "requests_select_own" 
ON public.requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Authenticated users can create
CREATE POLICY IF NOT EXISTS "requests_insert_authenticated" 
ON public.requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users update their own
CREATE POLICY IF NOT EXISTS "requests_update_own" 
ON public.requests FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins have full access
CREATE POLICY IF NOT EXISTS "requests_all_admin" 
ON public.requests FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =====================================================
-- REVIEWS TABLE
-- =====================================================

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- SELECT: Public can read approved reviews
CREATE POLICY IF NOT EXISTS "reviews_select_approved" 
ON public.reviews FOR SELECT
TO anon, authenticated
USING (is_approved = true);

-- INSERT: Authenticated users can create
CREATE POLICY IF NOT EXISTS "reviews_insert_authenticated" 
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users update their own
CREATE POLICY IF NOT EXISTS "reviews_update_own" 
ON public.reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can approve/modify
CREATE POLICY IF NOT EXISTS "reviews_all_admin" 
ON public.reviews FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =====================================================
-- REFERENCE TABLES (Public Read, Admin Write)
-- =====================================================

-- CITIES
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "cities_select_all" ON public.cities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY IF NOT EXISTS "cities_modify_admin" ON public.cities FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- NEIGHBORHOODS
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "neighborhoods_select_all" ON public.neighborhoods FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY IF NOT EXISTS "neighborhoods_modify_admin" ON public.neighborhoods FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PROPERTY_TYPES
ALTER TABLE public.property_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "property_types_select_all" ON public.property_types FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY IF NOT EXISTS "property_types_modify_admin" ON public.property_types FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =====================================================
-- ANALYTICS TABLES (Authenticated Write, Admin Read)
-- =====================================================

-- PROPERTY_VIEWS
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "property_views_insert_all" ON public.property_views FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "property_views_select_admin" ON public.property_views FOR SELECT TO authenticated USING (public.is_admin());

-- PROPERTY_LEADS
ALTER TABLE public.property_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "property_leads_insert_authenticated" ON public.property_leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "property_leads_select_owner_or_admin" ON public.property_leads FOR SELECT TO authenticated USING (
  public.is_admin() OR
  EXISTS (SELECT 1 FROM public.properties WHERE properties.id = property_leads.property_id AND properties.user_id = auth.uid())
);

-- PROPERTY_CONTACT_CLICKS
ALTER TABLE public.property_contact_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "property_contact_clicks_insert_all" ON public.property_contact_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "property_contact_clicks_select_admin" ON public.property_contact_clicks FOR SELECT TO authenticated USING (public.is_admin());

-- =====================================================
-- ADMIN TABLES (Admin Only)
-- =====================================================

-- ADMIN_NOTIFICATIONS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "admin_notifications_all_admin" ON public.admin_notifications FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ADMIN_AUDIT_LOGS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "admin_audit_logs_select_admin" ON public.admin_audit_logs FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY IF NOT EXISTS "admin_audit_logs_insert_admin" ON public.admin_audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- =====================================================
-- BANNER SYSTEM
-- =====================================================

-- BANNER_SLOTS
ALTER TABLE public.banner_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "banner_slots_select_all" ON public.banner_slots FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY IF NOT EXISTS "banner_slots_modify_admin" ON public.banner_slots FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- BANNER_REQUESTS
ALTER TABLE public.banner_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "banner_requests_select_own_or_admin" ON public.banner_requests FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR public.is_admin()
);
CREATE POLICY IF NOT EXISTS "banner_requests_insert_authenticated" ON public.banner_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "banner_requests_update_own" ON public.banner_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "banner_requests_all_admin" ON public.banner_requests FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =====================================================
-- STORAGE POLICIES
-- =====================================================
-- Note: Storage policies are on storage.objects table

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Property Images Bucket: Public read, owner write
CREATE POLICY IF NOT EXISTS "property_images_select_public"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'property-images');

CREATE POLICY IF NOT EXISTS "property_images_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "property_images_update_owner"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'property-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "property_images_delete_owner_or_admin"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

-- Avatars Bucket: Public read, own folder write
CREATE POLICY IF NOT EXISTS "avatars_select_public"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars');

CREATE POLICY IF NOT EXISTS "avatars_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "avatars_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "avatars_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Artisan Avatars: Same as avatars
CREATE POLICY IF NOT EXISTS "artisan_avatars_select_public"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'artisan-avatars');

CREATE POLICY IF NOT EXISTS "artisan_avatars_modify_own"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'artisan-avatars' AND
  ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
)
WITH CHECK (
  bucket_id = 'artisan-avatars' AND
  ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

-- Agency Logos: Public read, own folder write
CREATE POLICY IF NOT EXISTS "agency_logos_select_public"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'agency-logos');

CREATE POLICY IF NOT EXISTS "agency_logos_modify_own"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'agency-logos' AND
  ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
)
WITH CHECK (
  bucket_id = 'agency-logos' AND
  ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

-- Banner Images: Admin only
CREATE POLICY IF NOT EXISTS "banner_images_select_public"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'banner-images');

CREATE POLICY IF NOT EXISTS "banner_images_modify_admin"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'banner-images' AND public.is_admin())
WITH CHECK (bucket_id = 'banner-images' AND public.is_admin());

-- =====================================================
-- GRANT BASIC PERMISSIONS TO ROLES
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant SELECT on all tables to anon (RLS will filter)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant CRUD on all tables to authenticated (RLS will filter)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant USAGE on all sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Count policies per table
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Show RLS status
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✓ ENABLED' ELSE '✗ DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- COMPLETE
-- =====================================================
-- Minimum RLS policies have been created
-- Test with: npm run diagnose:frontend
-- Review with: npm run diagnose:supabase
-- =====================================================
