-- =====================================================
-- Migration 097: Create Media Table for Artisan Profiles
-- =====================================================
-- Purpose: Store profile images, work samples, and certifications
-- Supports multiple media types with categorization
-- =====================================================

-- =====================================================
-- 1. CREATE MEDIA TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Which artisan profile owns this media
  artisan_profile_id UUID NOT NULL REFERENCES public.artisan_profiles(id) ON DELETE CASCADE,
  
  -- Media type and category
  media_type TEXT NOT NULL DEFAULT 'image' 
    CHECK (media_type IN ('image', 'video', 'document', 'certificate')),
  category TEXT DEFAULT 'work_sample' 
    CHECK (category IN ('profile_photo', 'cover_photo', 'work_sample', 'certificate', 'license', 'insurance', 'other')),
  
  -- Storage information
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER, -- in bytes
  mime_type TEXT,
  
  -- Image-specific metadata
  width INTEGER,
  height INTEGER,
  thumbnail_path TEXT,
  
  -- Display information
  title TEXT,
  description TEXT,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  
  -- Visibility
  is_public BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE, -- Admin verified (for certificates)
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.media IS 
  'Media files (images, videos, documents) for artisan profiles. Supports work samples, certificates, and profile photos.';

COMMENT ON COLUMN public.media.media_type IS 
  'Type of media: image, video, document, certificate';

COMMENT ON COLUMN public.media.category IS 
  'Category: profile_photo, cover_photo, work_sample, certificate, license, insurance, other';

COMMENT ON COLUMN public.media.storage_path IS 
  'Path in Supabase Storage (e.g., artisans/{user_id}/{filename})';

COMMENT ON COLUMN public.media.is_verified IS 
  'Admin verified - important for certificates and licenses';

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Get all media for an artisan
CREATE INDEX IF NOT EXISTS idx_media_artisan 
  ON public.media(artisan_profile_id, display_order ASC);

-- Get public media for display
CREATE INDEX IF NOT EXISTS idx_media_public 
  ON public.media(artisan_profile_id, is_public, category, display_order ASC)
  WHERE is_public = TRUE;

-- Get media by type
CREATE INDEX IF NOT EXISTS idx_media_type 
  ON public.media(artisan_profile_id, media_type, category);

-- Get profile photos specifically
CREATE INDEX IF NOT EXISTS idx_media_profile_photos 
  ON public.media(artisan_profile_id)
  WHERE category = 'profile_photo';

-- =====================================================
-- 3. CREATE TRIGGER FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_media_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_media_updated_at ON public.media;
CREATE TRIGGER set_media_updated_at
  BEFORE UPDATE ON public.media
  FOR EACH ROW
  EXECUTE FUNCTION public.update_media_updated_at();

-- =====================================================
-- 4. CREATE CONSTRAINT: ONE PROFILE PHOTO PER ARTISAN
-- =====================================================

-- Note: This is enforced in application logic, not DB constraint
-- because we want to allow updating to a new photo

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE RLS POLICIES
-- =====================================================

-- Public can view public media
DROP POLICY IF EXISTS "Public can view public media" ON public.media;
CREATE POLICY "Public can view public media"
  ON public.media
  FOR SELECT
  USING (is_public = TRUE);

-- Artisans can view all their own media
DROP POLICY IF EXISTS "Artisans can view own media" ON public.media;
CREATE POLICY "Artisans can view own media"
  ON public.media
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles
      WHERE id = artisan_profile_id
        AND user_id = auth.uid()
    )
  );

-- Artisans can insert their own media
DROP POLICY IF EXISTS "Artisans can upload own media" ON public.media;
CREATE POLICY "Artisans can upload own media"
  ON public.media
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles
      WHERE id = artisan_profile_id
        AND user_id = auth.uid()
    )
  );

-- Artisans can update their own media
DROP POLICY IF EXISTS "Artisans can update own media" ON public.media;
CREATE POLICY "Artisans can update own media"
  ON public.media
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles
      WHERE id = artisan_profile_id
        AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles
      WHERE id = artisan_profile_id
        AND user_id = auth.uid()
    )
  );

-- Artisans can delete their own media
DROP POLICY IF EXISTS "Artisans can delete own media" ON public.media;
CREATE POLICY "Artisans can delete own media"
  ON public.media
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles
      WHERE id = artisan_profile_id
        AND user_id = auth.uid()
    )
  );

-- Admins have full access
DROP POLICY IF EXISTS "Admins can manage all media" ON public.media;
CREATE POLICY "Admins can manage all media"
  ON public.media
  FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON public.media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.media TO authenticated;
GRANT ALL ON public.media TO postgres, service_role;

-- =====================================================
-- 8. CREATE HELPER FUNCTIONS
-- =====================================================

-- Get artisan media by category
CREATE OR REPLACE FUNCTION public.get_artisan_media(
  p_artisan_profile_id UUID,
  p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  media_type TEXT,
  category TEXT,
  storage_path TEXT,
  thumbnail_path TEXT,
  title TEXT,
  description TEXT,
  display_order INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.id,
    m.media_type,
    m.category,
    m.storage_path,
    m.thumbnail_path,
    m.title,
    m.description,
    m.display_order,
    m.created_at
  FROM public.media m
  WHERE m.artisan_profile_id = p_artisan_profile_id
    AND m.is_public = TRUE
    AND (p_category IS NULL OR m.category = p_category)
  ORDER BY m.display_order ASC, m.created_at DESC;
$$;

COMMENT ON FUNCTION public.get_artisan_media IS 
  'Get public media for an artisan profile, optionally filtered by category';

GRANT EXECUTE ON FUNCTION public.get_artisan_media TO anon, authenticated;

-- Set media display order
CREATE OR REPLACE FUNCTION public.reorder_media(
  p_media_id UUID,
  p_new_order INTEGER
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_artisan_profile_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated'::TEXT;
    RETURN;
  END IF;
  
  -- Get artisan profile ID and verify ownership
  SELECT artisan_profile_id INTO v_artisan_profile_id
  FROM public.media
  WHERE id = p_media_id;
  
  IF v_artisan_profile_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Media not found'::TEXT;
    RETURN;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM public.artisan_profiles
    WHERE id = v_artisan_profile_id
      AND user_id = v_user_id
  ) THEN
    RETURN QUERY SELECT FALSE, 'Not authorized'::TEXT;
    RETURN;
  END IF;
  
  -- Update display order
  UPDATE public.media
  SET display_order = p_new_order,
      updated_at = NOW()
  WHERE id = p_media_id;
  
  RETURN QUERY SELECT TRUE, 'Media order updated'::TEXT;
END;
$$;

COMMENT ON FUNCTION public.reorder_media IS 
  'Update display order of media item (for arranging work samples)';

GRANT EXECUTE ON FUNCTION public.reorder_media TO authenticated;

-- =====================================================
-- 9. CREATE STORAGE BUCKET (Run separately via Supabase dashboard or SQL)
-- =====================================================

-- Note: This should be created via Supabase dashboard or using:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('artisan-media', 'artisan-media', true);

-- Storage policies (example - customize as needed):
-- CREATE POLICY "Artisans can upload own media"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'artisan-media' AND
--   auth.uid()::TEXT = (storage.foldername(name))[1]
-- );

-- =====================================================
-- VERIFICATION QUERIES (Run manually after migration)
-- =====================================================

-- Check table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'media'
-- ORDER BY ordinal_position;

-- Count media by category
-- SELECT category, COUNT(*) 
-- FROM public.media 
-- GROUP BY category;
