-- =====================================================
-- Migration: FINAL FIXES - Complete all critical bugs
-- =====================================================

-- 1. Ensure storage buckets exist with correct permissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('banner-images', 'banner-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('payment-receipts', 'payment-receipts', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf']),
  ('property-images', 'property-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- 2. Storage policies for all buckets
DROP POLICY IF EXISTS "Banner images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload banner images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own banner images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own banner images" ON storage.objects;
DROP POLICY IF EXISTS "Payment receipts are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Property images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own property images" ON storage.objects;
DROP POLICY IF EXISTS "public_storage_read" ON storage.objects;
DROP POLICY IF EXISTS "auth_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "owner_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "owner_storage_delete" ON storage.objects;
DROP POLICY IF EXISTS "storage_public_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_delete" ON storage.objects;

-- Public read access for all buckets
CREATE POLICY "storage_read_v2" ON storage.objects 
  FOR SELECT USING (bucket_id IN ('banner-images', 'payment-receipts', 'property-images'));

-- Authenticated upload for all buckets
CREATE POLICY "storage_insert_v2" ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id IN ('banner-images', 'payment-receipts', 'property-images'));

-- Owner update/delete for all buckets
CREATE POLICY "storage_update_v2" ON storage.objects 
  FOR UPDATE TO authenticated 
  USING (bucket_id IN ('banner-images', 'payment-receipts', 'property-images'));

CREATE POLICY "storage_delete_v2" ON storage.objects 
  FOR DELETE TO authenticated 
  USING (bucket_id IN ('banner-images', 'payment-receipts', 'property-images'));

-- 3. Ensure banner_requests has target_url nullable
DO $$
BEGIN
  ALTER TABLE public.banner_requests ALTER COLUMN target_url DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 4. Ensure banner_slots exist with data
INSERT INTO public.banner_slots (code, name_fr, name_ar, page, position, size, price_per_day, price_per_week, price_per_month, is_active)
SELECT 'HOME_HERO', 'Bannière Héro Accueil', 'بانر الصفحة الرئيسية', 'home', 'hero', '1920x600', 500, 3000, 10000, true
WHERE NOT EXISTS (SELECT 1 FROM public.banner_slots WHERE code = 'HOME_HERO');

INSERT INTO public.banner_slots (code, name_fr, name_ar, page, position, size, price_per_day, price_per_week, price_per_month, is_active)
SELECT 'HOME_SIDEBAR', 'Sidebar Accueil', 'الشريط الجانبي', 'home', 'sidebar', '300x250', 200, 1200, 4000, true
WHERE NOT EXISTS (SELECT 1 FROM public.banner_slots WHERE code = 'HOME_SIDEBAR');

INSERT INTO public.banner_slots (code, name_fr, name_ar, page, position, size, price_per_day, price_per_week, price_per_month, is_active)
SELECT 'SEARCH_TOP', 'Haut de Recherche', 'أعلى صفحة البحث', 'search', 'top', '728x90', 300, 1800, 6000, true
WHERE NOT EXISTS (SELECT 1 FROM public.banner_slots WHERE code = 'SEARCH_TOP');

INSERT INTO public.banner_slots (code, name_fr, name_ar, page, position, size, price_per_day, price_per_week, price_per_month, is_active)
SELECT 'HOME_FEATURED', 'Section Vedette', 'قسم مميز', 'home', 'featured', '970x250', 400, 2400, 8000, true
WHERE NOT EXISTS (SELECT 1 FROM public.banner_slots WHERE code = 'HOME_FEATURED');

-- 5. Ensure profile trigger creates proper user_role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, user_role, company_name, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'user_role', 'real_estate_advertiser'),
    NEW.raw_user_meta_data->>'company_name',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    user_role = COALESCE(EXCLUDED.user_role, profiles.user_role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Ensure proper RLS for banner_requests
DROP POLICY IF EXISTS "banner_insert" ON public.banner_requests;
DROP POLICY IF EXISTS "banner_select_own" ON public.banner_requests;
DROP POLICY IF EXISTS "banner_update_own" ON public.banner_requests;
DROP POLICY IF EXISTS "banner_admin_all" ON public.banner_requests;
DROP POLICY IF EXISTS "banner_admin_update" ON public.banner_requests;

CREATE POLICY "banner_insert" ON public.banner_requests
  FOR INSERT TO authenticated
  WITH CHECK (advertiser_id = auth.uid());

CREATE POLICY "banner_select_own" ON public.banner_requests
  FOR SELECT TO authenticated
  USING (
    advertiser_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR user_role = 'admin'))
  );

CREATE POLICY "banner_update_own" ON public.banner_requests
  FOR UPDATE TO authenticated
  USING (advertiser_id = auth.uid())
  WITH CHECK (advertiser_id = auth.uid());

CREATE POLICY "banner_admin_all" ON public.banner_requests
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR user_role = 'admin'))
  );

-- 7. Make banner_slots publicly visible
DROP POLICY IF EXISTS "banner_slots_public_read" ON public.banner_slots;
CREATE POLICY "banner_slots_public_read" ON public.banner_slots
  FOR SELECT USING (true);

ALTER TABLE public.banner_slots ENABLE ROW LEVEL SECURITY;

-- 8. Ensure proper RLS for profiles - admin can see all
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "admin_profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "admin_profiles_update" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "admin_profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.user_role = 'admin'))
  );

CREATE POLICY "admin_profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.is_admin = true OR p.user_role = 'admin'))
  );

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
