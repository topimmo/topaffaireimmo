-- =====================================================
-- Migration 093: Create Artisan Profile Neighborhoods Join Table
-- =====================================================
-- Purpose: Replace neighborhood_ids INTEGER[] with proper N:M join table
-- This provides better data integrity, referential constraints, and standard SQL joins
-- =====================================================

-- =====================================================
-- 1. CREATE JUNCTION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.artisan_profile_neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_profile_id UUID NOT NULL REFERENCES public.artisan_profiles(id) ON DELETE CASCADE,
  neighborhood_id INTEGER NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate entries
  CONSTRAINT unique_artisan_neighborhood UNIQUE (artisan_profile_id, neighborhood_id)
);

COMMENT ON TABLE public.artisan_profile_neighborhoods IS 
  'Junction table for N:M relationship between artisan_profiles and neighborhoods. Replaces neighborhood_ids array column.';

COMMENT ON COLUMN public.artisan_profile_neighborhoods.artisan_profile_id IS 
  'Reference to artisan profile (UUID)';

COMMENT ON COLUMN public.artisan_profile_neighborhoods.neighborhood_id IS 
  'Reference to neighborhood (INTEGER) - note type difference from artisan_profile_id';

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for finding neighborhoods by artisan (most common query)
CREATE INDEX IF NOT EXISTS idx_apn_artisan_id 
  ON public.artisan_profile_neighborhoods(artisan_profile_id);

-- Index for finding artisans by neighborhood (reverse lookup)
CREATE INDEX IF NOT EXISTS idx_apn_neighborhood_id 
  ON public.artisan_profile_neighborhoods(neighborhood_id);

-- Composite index for existence checks and filtering
CREATE INDEX IF NOT EXISTS idx_apn_composite 
  ON public.artisan_profile_neighborhoods(neighborhood_id, artisan_profile_id);

-- =====================================================
-- 3. MIGRATE EXISTING DATA FROM ARRAY COLUMN
-- =====================================================

-- Migrate data from neighborhood_ids array to junction table
-- Only if neighborhood_ids column exists and has data
DO $$
BEGIN
  -- Check if neighborhood_ids column exists in artisan_profiles
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'artisan_profiles' 
      AND column_name = 'neighborhood_ids'
  ) THEN
    
    -- Insert into junction table from array column
    -- Use UNNEST to expand array into rows
    INSERT INTO public.artisan_profile_neighborhoods (artisan_profile_id, neighborhood_id)
    SELECT 
      ap.id as artisan_profile_id,
      unnest(ap.neighborhood_ids) as neighborhood_id
    FROM public.artisan_profiles ap
    WHERE ap.neighborhood_ids IS NOT NULL 
      AND array_length(ap.neighborhood_ids, 1) > 0
    ON CONFLICT (artisan_profile_id, neighborhood_id) DO NOTHING;
    
    RAISE NOTICE 'Migrated neighborhood data from array column to junction table';
  ELSE
    RAISE NOTICE 'No neighborhood_ids column found - skipping migration';
  END IF;
END $$;

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.artisan_profile_neighborhoods ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE RLS POLICIES
-- =====================================================

-- Public can read all neighborhood associations (needed for search/filtering)
DROP POLICY IF EXISTS "Public can view artisan neighborhoods" ON public.artisan_profile_neighborhoods;
CREATE POLICY "Public can view artisan neighborhoods"
  ON public.artisan_profile_neighborhoods
  FOR SELECT
  USING (TRUE);

-- Artisans can insert their own neighborhood associations
DROP POLICY IF EXISTS "Artisans can add own neighborhoods" ON public.artisan_profile_neighborhoods;
CREATE POLICY "Artisans can add own neighborhoods"
  ON public.artisan_profile_neighborhoods
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles
      WHERE id = artisan_profile_id
        AND user_id = auth.uid()
    )
  );

-- Artisans can delete their own neighborhood associations
DROP POLICY IF EXISTS "Artisans can remove own neighborhoods" ON public.artisan_profile_neighborhoods;
CREATE POLICY "Artisans can remove own neighborhoods"
  ON public.artisan_profile_neighborhoods
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles
      WHERE id = artisan_profile_id
        AND user_id = auth.uid()
    )
  );

-- Admins can do everything
DROP POLICY IF EXISTS "Admins can manage all neighborhoods" ON public.artisan_profile_neighborhoods;
CREATE POLICY "Admins can manage all neighborhoods"
  ON public.artisan_profile_neighborhoods
  FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON public.artisan_profile_neighborhoods TO anon, authenticated;
GRANT INSERT, DELETE ON public.artisan_profile_neighborhoods TO authenticated;
GRANT ALL ON public.artisan_profile_neighborhoods TO postgres, service_role;

-- =====================================================
-- 7. CREATE HELPER FUNCTION TO VALIDATE NEIGHBORHOOD-CITY CONSISTENCY
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_artisan_neighborhoods()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_artisan_city_id INTEGER;
  v_neighborhood_city_id INTEGER;
BEGIN
  -- Get the artisan's city
  SELECT city_id INTO v_artisan_city_id
  FROM public.artisan_profiles
  WHERE id = NEW.artisan_profile_id;
  
  -- Get the neighborhood's city
  SELECT city_id INTO v_neighborhood_city_id
  FROM public.neighborhoods
  WHERE id = NEW.neighborhood_id;
  
  -- Ensure neighborhood belongs to artisan's city
  IF v_artisan_city_id != v_neighborhood_city_id THEN
    RAISE EXCEPTION 'Neighborhood (ID: %) does not belong to artisan''s city (ID: %)', 
      NEW.neighborhood_id, v_artisan_city_id;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_artisan_neighborhoods IS 
  'Trigger function to ensure neighborhoods belong to artisan''s city (prevents data integrity issues)';

-- Create trigger to enforce city-neighborhood consistency
DROP TRIGGER IF EXISTS validate_artisan_neighborhoods_trigger ON public.artisan_profile_neighborhoods;
CREATE TRIGGER validate_artisan_neighborhoods_trigger
  BEFORE INSERT OR UPDATE ON public.artisan_profile_neighborhoods
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_artisan_neighborhoods();

-- =====================================================
-- 8. DEPRECATION NOTICE FOR OLD COLUMN
-- =====================================================

-- Add comment to old neighborhood_ids column (if it exists)
-- DO NOT DROP yet for safety and rollback capability
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'artisan_profiles' 
      AND column_name = 'neighborhood_ids'
  ) THEN
    COMMENT ON COLUMN public.artisan_profiles.neighborhood_ids IS 
      'DEPRECATED: Use artisan_profile_neighborhoods junction table instead. This column will be removed in a future migration.';
    
    RAISE NOTICE 'Marked neighborhood_ids column as deprecated. It will be dropped in a future migration after verification.';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERIES (Run manually after migration)
-- =====================================================

-- Count records migrated
-- SELECT COUNT(*) as total_associations FROM public.artisan_profile_neighborhoods;

-- Check for orphaned records (should be 0)
-- SELECT * FROM public.artisan_profile_neighborhoods apn
-- WHERE NOT EXISTS (SELECT 1 FROM public.artisan_profiles WHERE id = apn.artisan_profile_id)
--    OR NOT EXISTS (SELECT 1 FROM public.neighborhoods WHERE id = apn.neighborhood_id);

-- Compare old and new (should match)
-- SELECT 
--   ap.id,
--   ap.business_name,
--   array_length(ap.neighborhood_ids, 1) as old_count,
--   COUNT(apn.neighborhood_id) as new_count
-- FROM public.artisan_profiles ap
-- LEFT JOIN public.artisan_profile_neighborhoods apn ON apn.artisan_profile_id = ap.id
-- WHERE ap.neighborhood_ids IS NOT NULL
-- GROUP BY ap.id, ap.business_name, ap.neighborhood_ids
-- HAVING array_length(ap.neighborhood_ids, 1) != COUNT(apn.neighborhood_id);
