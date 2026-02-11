-- =====================================================
-- Migration 091: Fix Artisan Location Model & Add Missing RPCs
-- =====================================================
-- Changes artisan_profiles from cities[] to city_id + neighborhood_ids[]
-- Adds create_my_artisan_profile RPC function
-- Improves RLS policies to prevent self-verification

-- =====================================================
-- 1. FIX ARTISAN_PROFILES LOCATION MODEL
-- =====================================================

-- Drop the old GIN index on cities array
DROP INDEX IF EXISTS public.idx_artisan_profiles_cities;

-- Rename old cities column to cities_old for migration
ALTER TABLE public.artisan_profiles 
  RENAME COLUMN cities TO cities_old;

-- Add new location columns
ALTER TABLE public.artisan_profiles
  ADD COLUMN IF NOT EXISTS city_id INTEGER REFERENCES public.cities(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS neighborhood_ids INTEGER[] DEFAULT '{}';

-- Migrate existing data (use first city from cities_old array)
UPDATE public.artisan_profiles
SET city_id = cities_old[1]
WHERE cities_old IS NOT NULL AND array_length(cities_old, 1) > 0;

-- Make city_id NOT NULL after migration
ALTER TABLE public.artisan_profiles
  ALTER COLUMN city_id SET NOT NULL;

-- Create indexes for new location model
CREATE INDEX IF NOT EXISTS idx_artisan_profiles_city_id 
  ON public.artisan_profiles(city_id);

CREATE INDEX IF NOT EXISTS idx_artisan_profiles_neighborhoods 
  ON public.artisan_profiles USING GIN(neighborhood_ids);

-- Composite index for common queries (city + service category + boosted)
CREATE INDEX IF NOT EXISTS idx_artisan_profiles_search 
  ON public.artisan_profiles(city_id, service_category_id, is_boosted, is_verified, is_active);

-- Drop old cities_old column (only after verifying migration)
-- Commented out for safety - can be dropped in next migration after verification
-- ALTER TABLE public.artisan_profiles DROP COLUMN cities_old;

COMMENT ON COLUMN public.artisan_profiles.city_id IS 'Primary city where artisan operates (required)';
COMMENT ON COLUMN public.artisan_profiles.neighborhood_ids IS 'Optional array of neighborhood IDs within the city';

-- =====================================================
-- 2. ADD NEIGHBORHOOD SCOPE TO CONTACT ACCESS PASSES
-- =====================================================

-- Add neighborhood_ids to contact_access_passes for scoped access
ALTER TABLE public.contact_access_passes
  ADD COLUMN IF NOT EXISTS neighborhood_ids INTEGER[] DEFAULT NULL;

-- Update index to include neighborhood scope
DROP INDEX IF EXISTS public.idx_contact_passes_lookup;
CREATE INDEX idx_contact_passes_lookup 
  ON public.contact_access_passes(user_id, city_id, service_category_id, expires_at)
  WHERE expires_at > NOW();

-- Add index for neighborhood filtering
CREATE INDEX IF NOT EXISTS idx_contact_passes_neighborhoods
  ON public.contact_access_passes USING GIN(neighborhood_ids)
  WHERE neighborhood_ids IS NOT NULL;

COMMENT ON COLUMN public.contact_access_passes.neighborhood_ids IS 'Optional neighborhood scope - NULL means city-wide access, array means specific neighborhoods';

-- =====================================================
-- 3. IMPROVE RLS POLICIES - PREVENT SELF-VERIFICATION
-- =====================================================

-- Drop existing artisan update policy
DROP POLICY IF EXISTS "Artisans can update own profiles" ON public.artisan_profiles;

-- Create new policy that prevents changing is_verified or is_active
CREATE POLICY "Artisans can update own profiles"
  ON public.artisan_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    -- Prevent artisans from changing verification status
    AND (
      -- If user is admin, allow all changes
      auth.uid() IN (SELECT user_id FROM public.admins)
      OR (
        -- If not admin, ensure is_verified and is_active remain unchanged
        NEW.is_verified = OLD.is_verified
        AND NEW.is_active = OLD.is_active
      )
    )
  );

COMMENT ON POLICY "Artisans can update own profiles" ON public.artisan_profiles IS 
  'Artisans can update their own profiles but cannot change is_verified or is_active (admin-only fields)';

-- =====================================================
-- 4. CREATE RPC: create_my_artisan_profile
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_my_artisan_profile(
  p_service_category_id UUID,
  p_business_name TEXT,
  p_description_fr TEXT DEFAULT NULL,
  p_description_ar TEXT DEFAULT NULL,
  p_city_id INTEGER,
  p_neighborhood_ids INTEGER[] DEFAULT '{}',
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
  
  -- Create artisan profile
  INSERT INTO public.artisan_profiles (
    user_id,
    service_category_id,
    business_name,
    description_fr,
    description_ar,
    city_id,
    neighborhood_ids,
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
    COALESCE(p_neighborhood_ids, '{}'),
    trim(p_phone),
    p_whatsapp,
    p_email,
    FALSE, -- Not verified by default
    TRUE   -- Active by default
  )
  RETURNING id INTO v_new_profile_id;
  
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
  'Create artisan profile for authenticated user (SECURITY DEFINER) - validates all inputs and ensures wallet exists';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_my_artisan_profile TO authenticated;

-- =====================================================
-- 5. UPDATE check_contact_access FOR NEIGHBORHOOD SCOPE
-- =====================================================

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

COMMENT ON FUNCTION public.check_contact_access IS 
  'Check if user has valid contact access pass for city + service category + optional neighborhoods';

GRANT EXECUTE ON FUNCTION public.check_contact_access TO authenticated;

-- =====================================================
-- 6. UPDATE debit_wallet_for_contact FOR NEIGHBORHOOD SCOPE
-- =====================================================

CREATE OR REPLACE FUNCTION public.debit_wallet_for_contact(
  p_city_id INTEGER,
  p_service_category_id UUID,
  p_neighborhood_ids INTEGER[] DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  new_balance INTEGER,
  pass_id UUID,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_settings JSONB;
  v_monetization_enabled BOOLEAN;
  v_pay_per_contact_enabled BOOLEAN;
  v_fee INTEGER;
  v_duration_hours INTEGER;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_existing_pass UUID;
  v_existing_expires_at TIMESTAMPTZ;
  v_new_expires_at TIMESTAMPTZ;
  v_new_pass_id UUID;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated'::TEXT, NULL::INTEGER, NULL::UUID, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Get monetization settings
  SELECT value INTO v_settings
  FROM public.platform_settings
  WHERE key = 'monetization';
  
  IF v_settings IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Settings not configured'::TEXT, NULL::INTEGER, NULL::UUID, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Check if monetization is enabled
  v_monetization_enabled := (v_settings->>'monetization_enabled')::BOOLEAN;
  v_pay_per_contact_enabled := (v_settings->>'pay_per_contact_enabled')::BOOLEAN;
  
  IF NOT v_monetization_enabled OR NOT v_pay_per_contact_enabled THEN
    -- Monetization disabled, allow free access
    RETURN QUERY SELECT TRUE, 'Free access (monetization disabled)'::TEXT, NULL::INTEGER, NULL::UUID, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Check if user already has valid pass
  SELECT pass_id, expires_at INTO v_existing_pass, v_existing_expires_at
  FROM public.check_contact_access(v_user_id, p_city_id, p_service_category_id, p_neighborhood_ids);
  
  IF v_existing_pass IS NOT NULL THEN
    -- User already has valid pass
    RETURN QUERY SELECT TRUE, 'Already have access'::TEXT, NULL::INTEGER, v_existing_pass, v_existing_expires_at;
    RETURN;
  END IF;
  
  -- Get pricing
  v_fee := (v_settings->>'contact_reveal_fee_mad')::INTEGER;
  v_duration_hours := (v_settings->>'contact_pass_duration_hours')::INTEGER;
  
  -- Ensure wallet exists
  PERFORM public.ensure_wallet_exists(v_user_id);
  
  -- Lock wallet row and get current balance
  SELECT balance_mad INTO v_current_balance
  FROM public.wallets
  WHERE user_id = v_user_id
  FOR UPDATE;
  
  -- Check sufficient balance
  IF v_current_balance < v_fee THEN
    RETURN QUERY SELECT 
      FALSE, 
      'Insufficient balance'::TEXT,
      v_current_balance,
      NULL::UUID,
      NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Debit wallet
  v_new_balance := v_current_balance - v_fee;
  
  UPDATE public.wallets
  SET balance_mad = v_new_balance,
      updated_at = NOW()
  WHERE user_id = v_user_id;
  
  -- Record transaction
  INSERT INTO public.wallet_transactions (user_id, amount_mad, reason, meta)
  VALUES (
    v_user_id,
    -v_fee,
    'contact_reveal',
    jsonb_build_object(
      'city_id', p_city_id,
      'service_category_id', p_service_category_id,
      'neighborhood_ids', p_neighborhood_ids,
      'fee_mad', v_fee
    )
  );
  
  -- Create access pass
  v_new_expires_at := NOW() + (v_duration_hours || ' hours')::INTERVAL;
  
  INSERT INTO public.contact_access_passes (
    user_id,
    city_id,
    service_category_id,
    neighborhood_ids,
    expires_at
  )
  VALUES (
    v_user_id,
    p_city_id,
    p_service_category_id,
    p_neighborhood_ids,
    v_new_expires_at
  )
  RETURNING id INTO v_new_pass_id;
  
  -- Return success
  RETURN QUERY SELECT 
    TRUE,
    'Contact revealed successfully'::TEXT,
    v_new_balance,
    v_new_pass_id,
    v_new_expires_at;
END;
$$;

COMMENT ON FUNCTION public.debit_wallet_for_contact IS 
  'Debit wallet and create contact access pass with neighborhood scope (SECURITY DEFINER)';

GRANT EXECUTE ON FUNCTION public.debit_wallet_for_contact TO authenticated;
