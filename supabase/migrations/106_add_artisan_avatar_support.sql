-- =====================================================
-- Migration 106: Add Avatar Support for Artisan Profiles
-- =====================================================
-- Adds avatar_url column to artisan_profiles
-- Creates artisan-avatars storage bucket
-- Sets up RLS policies for avatar storage
-- =====================================================

-- =====================================================
-- 1. ADD AVATAR_URL COLUMN TO ARTISAN_PROFILES
-- =====================================================

ALTER TABLE public.artisan_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN public.artisan_profiles.avatar_url IS 
  'URL to artisan profile avatar image stored in Supabase Storage';

-- =====================================================
-- 2. CREATE ARTISAN-AVATARS STORAGE BUCKET
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('artisan-avatars', 'artisan-avatars', true)
ON CONFLICT (id) DO NOTHING;

COMMENT ON SCHEMA storage IS 'Storage bucket for artisan profile avatar images';

-- =====================================================
-- 3. ENABLE RLS ON ARTISAN-AVATARS BUCKET
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Artisans can upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view artisan avatars" ON storage.objects;
DROP POLICY IF EXISTS "Artisans can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Artisans can delete own avatars" ON storage.objects;

-- Public can view all avatars (public bucket)
CREATE POLICY "Anyone can view artisan avatars"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'artisan-avatars');

-- Artisans can upload their own avatars (path must start with their user_id)
CREATE POLICY "Artisans can upload own avatars"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'artisan-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Artisans can update their own avatars
CREATE POLICY "Artisans can update own avatars"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'artisan-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'artisan-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Artisans can delete their own avatars
CREATE POLICY "Artisans can delete own avatars"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'artisan-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can manage all avatars
CREATE POLICY "Admins can manage all artisan avatars"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'artisan-avatars' 
    AND auth.uid() IN (SELECT user_id FROM public.admins)
  )
  WITH CHECK (
    bucket_id = 'artisan-avatars' 
    AND auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =====================================================
-- 4. GRANT STORAGE PERMISSIONS
-- =====================================================

GRANT SELECT ON storage.objects TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO postgres, service_role;

GRANT SELECT ON storage.buckets TO authenticated, anon;
GRANT ALL ON storage.buckets TO postgres, service_role;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
