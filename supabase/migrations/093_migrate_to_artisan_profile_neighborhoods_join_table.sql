-- =====================================================
-- Migration 093: Migrate to artisan_profile_neighborhoods join table
-- =====================================================
-- Changes from neighborhood_ids array to proper many-to-many join table
-- Adds artisan_profile_neighborhoods table
-- Migrates existing data from neighborhood_ids to join table
-- Updates RPC functions to work with new schema

-- =====================================================
-- 1. CREATE ARTISAN_PROFILE_NEIGHBORHOODS JOIN TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.artisan_profile_neighborhoods (
  artisan_profile_id UUID REFERENCES public.artisan_profiles(id) ON DELETE CASCADE,
  neighborhood_id INTEGER REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (artisan_profile_id, neighborhood_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_artisan_profile_neighborhoods_profile 
  ON public.artisan_profile_neighborhoods(artisan_profile_id);

CREATE INDEX IF NOT EXISTS idx_artisan_profile_neighborhoods_neighborhood 
  ON public.artisan_profile_neighborhoods(neighborhood_id);

COMMENT ON TABLE public.artisan_profile_neighborhoods IS 
  'Many-to-many join table linking artisan profiles to neighborhoods they serve';

COMMENT ON COLUMN public.artisan_profile_neighborhoods.artisan_profile_id IS 
  'UUID reference to artisan profile';

COMMENT ON COLUMN public.artisan_profile_neighborhoods.neighborhood_id IS 
  'Integer reference to neighborhood';

-- =====================================================
-- 2. MIGRATE EXISTING DATA
-- =====================================================

-- Migrate data from neighborhood_ids array to join table
INSERT INTO public.artisan_profile_neighborhoods (artisan_profile_id, neighborhood_id)
SELECT 
  ap.id as artisan_profile_id,
  unnest(ap.neighborhood_ids) as neighborhood_id
FROM public.artisan_profiles ap
WHERE ap.neighborhood_ids IS NOT NULL 
  AND array_length(ap.neighborhood_ids, 1) > 0
ON CONFLICT (artisan_profile_id, neighborhood_id) DO NOTHING;

-- =====================================================
-- 3. DROP OLD NEIGHBORHOOD_IDS COLUMN
-- =====================================================

-- Drop the GIN index on neighborhood_ids array
DROP INDEX IF EXISTS public.idx_artisan_profiles_neighborhoods;

-- Drop the old neighborhood_ids column
ALTER TABLE public.artisan_profiles 
  DROP COLUMN IF EXISTS neighborhood_ids;

-- =====================================================
-- 4. ADD RLS POLICIES FOR JOIN TABLE
-- =====================================================

-- Enable RLS on the join table
ALTER TABLE public.artisan_profile_neighborhoods ENABLE ROW LEVEL SECURITY;

-- Allow public to read neighborhood associations for active profiles
CREATE POLICY "Anyone can view active artisan neighborhoods"
  ON public.artisan_profile_neighborhoods
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles ap
      WHERE ap.id = artisan_profile_neighborhoods.artisan_profile_id
        AND ap.is_active = TRUE
        AND ap.is_verified = TRUE
    )
  );

-- Allow artisans to view their own neighborhood associations
CREATE POLICY "Artisans can view own neighborhoods"
  ON public.artisan_profile_neighborhoods
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles ap
      WHERE ap.id = artisan_profile_neighborhoods.artisan_profile_id
        AND ap.user_id = auth.uid()
    )
  );

-- Allow artisans to manage their own neighborhood associations
CREATE POLICY "Artisans can insert own neighborhoods"
  ON public.artisan_profile_neighborhoods
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles ap
      WHERE ap.id = artisan_profile_neighborhoods.artisan_profile_id
        AND ap.user_id = auth.uid()
    )
  );

CREATE POLICY "Artisans can delete own neighborhoods"
  ON public.artisan_profile_neighborhoods
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles ap
      WHERE ap.id = artisan_profile_neighborhoods.artisan_profile_id
        AND ap.user_id = auth.uid()
    )
  );

-- =====================================================
-- 5. UPDATE create_my_artisan_profile RPC FUNCTION
-- =====================================================

-- Drop the old function
DROP FUNCTION IF EXISTS public.create_my_artisan_profile(UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER[], TEXT, TEXT, TEXT);

-- Create updated function that uses join table
CREATE OR REPLACE FUNCTION public.create_my_artisan_profile(
  p_service_category_id UUID,
  p_business_name TEXT,
  p_description_fr TEXT DEFAULT NULL,
  p_description_ar TEXT DEFAULT NULL,
  p_city_id INTEGER,
  p_neighborhood_ids INTEGER[] DEFAULT NULL,
  p_phone TEXT,
  p_whatsapp TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  profile_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_existing_profile UUID;
  v_new_profile_id UUID;
  v_city_exists BOOLEAN;
  v_category_exists BOOLEAN;
  v_neighborhood_id INTEGER;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Validate required fields
  IF p_service_category_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Service category is required'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  IF p_business_name IS NULL OR trim(p_business_name) = '' THEN
    RETURN QUERY SELECT FALSE, 'Business name is required'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  IF p_city_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'City is required'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  IF p_phone IS NULL OR trim(p_phone) = '' THEN
    RETURN QUERY SELECT FALSE, 'Phone number is required'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Validate city exists
  SELECT EXISTS (
    SELECT 1 FROM public.cities WHERE id = p_city_id
  ) INTO v_city_exists;
  
  IF NOT v_city_exists THEN
    RETURN QUERY SELECT FALSE, 'Invalid city ID'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Validate service category exists and is active
  SELECT EXISTS (
    SELECT 1 FROM public.service_categories 
    WHERE id = p_service_category_id AND is_active = TRUE
  ) INTO v_category_exists;
  
  IF NOT v_category_exists THEN
    RETURN QUERY SELECT FALSE, 'Invalid or inactive service category'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Validate neighborhoods belong to the selected city (if provided)
  IF p_neighborhood_ids IS NOT NULL AND array_length(p_neighborhood_ids, 1) > 0 THEN
    IF EXISTS (
      SELECT 1 FROM public.neighborhoods
      WHERE id = ANY(p_neighborhood_ids)
        AND city_id != p_city_id
    ) THEN
      RETURN QUERY SELECT FALSE, 'Neighborhoods must belong to the selected city'::TEXT, NULL::UUID;
      RETURN;
    END IF;
  END IF;
  
  -- Check for duplicate profile (user + service category)
  SELECT id INTO v_existing_profile
  FROM public.artisan_profiles
  WHERE user_id = v_user_id
    AND service_category_id = p_service_category_id;
  
  IF v_existing_profile IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, 'You already have a profile for this service category'::TEXT, v_existing_profile;
    RETURN;
  END IF;
  
  -- Create artisan profile (without neighborhood_ids)
  INSERT INTO public.artisan_profiles (
    user_id,
    service_category_id,
    business_name,
    description_fr,
    description_ar,
    city_id,
    phone,
    whatsapp,
    email,
    is_verified,
    is_active
  ) VALUES (
    v_user_id,
    p_service_category_id,
    trim(p_business_name),
    p_description_fr,
    p_description_ar,
    p_city_id,
    trim(p_phone),
    p_whatsapp,
    p_email,
    FALSE, -- Not verified by default
    TRUE   -- Active by default
  )
  RETURNING id INTO v_new_profile_id;
  
  -- Insert neighborhood associations if provided
  IF p_neighborhood_ids IS NOT NULL AND array_length(p_neighborhood_ids, 1) > 0 THEN
    FOREACH v_neighborhood_id IN ARRAY p_neighborhood_ids
    LOOP
      INSERT INTO public.artisan_profile_neighborhoods (artisan_profile_id, neighborhood_id)
      VALUES (v_new_profile_id, v_neighborhood_id)
      ON CONFLICT (artisan_profile_id, neighborhood_id) DO NOTHING;
    END LOOP;
  END IF;
  
  -- Ensure wallet exists for monetization features
  PERFORM public.ensure_wallet_exists(v_user_id);
  
  -- Return success
  RETURN QUERY SELECT 
    TRUE,
    'Artisan profile created successfully'::TEXT,
    v_new_profile_id;
END;
$$;

COMMENT ON FUNCTION public.create_my_artisan_profile IS 
  'Create artisan profile for authenticated user using join table for neighborhoods (SECURITY DEFINER)';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_my_artisan_profile(UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER[], TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- 6. UPDATE check_contact_access FOR JOIN TABLE
-- =====================================================

-- Update check_contact_access to use join table instead of array
CREATE OR REPLACE FUNCTION public.check_contact_access(
  p_user_id UUID,
  p_city_id INTEGER,
  p_service_category_id UUID,
  p_neighborhood_ids INTEGER[] DEFAULT NULL
)
RETURNS TABLE (
  has_access BOOLEAN,
  pass_id UUID,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check for valid access pass
  -- Pass grants access if:
  -- 1. Same city and service category
  -- 2. Not expired
  -- 3. Neighborhood scope matches:
  --    - If pass.neighborhood_ids IS NULL -> city-wide access (matches any request)
  --    - If pass.neighborhood_ids IS NOT NULL and request has no neighborhoods -> granted
  --    - If both have neighborhoods -> request neighborhoods must be subset or overlap with pass
  
  RETURN QUERY
  SELECT 
    TRUE as has_access,
    cap.id as pass_id,
    cap.expires_at
  FROM public.contact_access_passes cap
  WHERE cap.user_id = p_user_id
    AND cap.city_id = p_city_id
    AND cap.service_category_id = p_service_category_id
    AND cap.expires_at > NOW()
    AND (
      -- City-wide pass (no neighborhood restriction)
      cap.neighborhood_ids IS NULL
      OR
      -- User didn't specify neighborhoods (want city-wide)
      p_neighborhood_ids IS NULL
      OR array_length(p_neighborhood_ids, 1) IS NULL
      OR
      -- Pass covers requested neighborhoods (overlap check)
      cap.neighborhood_ids && p_neighborhood_ids
    )
  ORDER BY cap.expires_at DESC
  LIMIT 1;
  
  -- If no active pass found, return false
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TIMESTAMPTZ;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_contact_access(UUID, INTEGER, UUID, INTEGER[]) TO authenticated;
