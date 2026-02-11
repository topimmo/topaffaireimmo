-- =====================================================
-- Migration 098: Comprehensive Security Hardening
-- =====================================================
-- Purpose: Fix critical monetization vulnerabilities identified in security audit
-- - Protect is_boosted from direct updates (CRITICAL)
-- - Implement wallet deduction for boost activation (CRITICAL)
-- - Create contact_access_neighborhoods join table
-- - Harden RLS policies
-- - Add missing indexes and constraints
-- =====================================================

-- =====================================================
-- 1. FIX CRITICAL RLS VULNERABILITY: Protect is_boosted
-- =====================================================

-- Drop existing RLS policy
DROP POLICY IF EXISTS "Artisans can update own profiles" ON public.artisan_profiles;

-- Create hardened policy that prevents modification of monetization fields
CREATE POLICY "Artisans can update own profiles"
  ON public.artisan_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      -- If user is admin, allow all changes
      auth.uid() IN (SELECT user_id FROM public.admins)
      OR (
        -- If not admin, ensure critical fields remain unchanged
        NEW.is_verified = OLD.is_verified
        AND NEW.is_active = OLD.is_active
        AND NEW.is_boosted = OLD.is_boosted  -- CRITICAL FIX: Prevent direct boost manipulation
        AND NEW.boosted_at = OLD.boosted_at  -- Also protect boosted_at timestamp
      )
    )
  );

COMMENT ON POLICY "Artisans can update own profiles" ON public.artisan_profiles IS 
  'Artisans can update their own profiles but cannot change is_verified, is_active, or is_boosted (admin/RPC-only fields)';

-- =====================================================
-- 2. CREATE CONTACT ACCESS NEIGHBORHOODS JOIN TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.contact_access_neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_pass_id UUID NOT NULL REFERENCES public.contact_access_passes(id) ON DELETE CASCADE,
  neighborhood_id INTEGER NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate entries
  CONSTRAINT unique_access_pass_neighborhood UNIQUE (access_pass_id, neighborhood_id)
);

COMMENT ON TABLE public.contact_access_neighborhoods IS 
  'Junction table for N:M relationship between contact access passes and neighborhoods';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_can_access_pass 
  ON public.contact_access_neighborhoods(access_pass_id);

CREATE INDEX IF NOT EXISTS idx_can_neighborhood 
  ON public.contact_access_neighborhoods(neighborhood_id);

-- =====================================================
-- 3. MIGRATE EXISTING CONTACT PASS DATA TO JOIN TABLE
-- =====================================================

-- Migrate data from neighborhood_ids array to join table (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'contact_access_passes' 
      AND column_name = 'neighborhood_ids'
  ) THEN
    
    INSERT INTO public.contact_access_neighborhoods (access_pass_id, neighborhood_id)
    SELECT 
      cap.id as access_pass_id,
      unnest(cap.neighborhood_ids) as neighborhood_id
    FROM public.contact_access_passes cap
    WHERE cap.neighborhood_ids IS NOT NULL 
      AND array_length(cap.neighborhood_ids, 1) > 0
    ON CONFLICT (access_pass_id, neighborhood_id) DO NOTHING;
    
    RAISE NOTICE 'Migrated contact access pass neighborhoods to join table';
  END IF;
END $$;

-- =====================================================
-- 4. ENABLE RLS ON JOIN TABLE
-- =====================================================

ALTER TABLE public.contact_access_neighborhoods ENABLE ROW LEVEL SECURITY;

-- Users can read their own access pass neighborhoods
DROP POLICY IF EXISTS "Users can read own access neighborhoods" ON public.contact_access_neighborhoods;
CREATE POLICY "Users can read own access neighborhoods"
  ON public.contact_access_neighborhoods
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contact_access_passes cap
      WHERE cap.id = contact_access_neighborhoods.access_pass_id
        AND cap.user_id = auth.uid()
    )
  );

-- No direct INSERT/UPDATE/DELETE - must use RPC functions
-- Admins can manage all
DROP POLICY IF EXISTS "Admins can manage access neighborhoods" ON public.contact_access_neighborhoods;
CREATE POLICY "Admins can manage access neighborhoods"
  ON public.contact_access_neighborhoods
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

-- =====================================================
-- 5. ADD MISSING INDEXES FOR PERFORMANCE
-- =====================================================

-- Wallet indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_balance ON public.wallets(balance_mad) WHERE balance_mad > 0;

-- Wallet transactions indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created 
  ON public.wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reason 
  ON public.wallet_transactions(reason);

-- Artisan profiles indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_artisan_profiles_user_id 
  ON public.artisan_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_artisan_profiles_boosted_verified 
  ON public.artisan_profiles(is_boosted, is_verified) 
  WHERE is_active = TRUE;

-- Contact access passes indexes
CREATE INDEX IF NOT EXISTS idx_contact_passes_user_expires 
  ON public.contact_access_passes(user_id, expires_at)
  WHERE expires_at > NOW();

-- =====================================================
-- 6. ADD CHECK CONSTRAINTS
-- =====================================================

-- Ensure wallet balance never goes negative
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'wallets_balance_non_negative'
  ) THEN
    ALTER TABLE public.wallets 
      ADD CONSTRAINT wallets_balance_non_negative 
      CHECK (balance_mad >= 0);
  END IF;
END $$;

-- =====================================================
-- 7. UPDATE toggle_artisan_boost TO DEDUCT FROM WALLET
-- =====================================================

CREATE OR REPLACE FUNCTION public.toggle_artisan_boost(
  p_artisan_profile_id UUID,
  p_enable_boost BOOLEAN
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  is_boosted BOOLEAN,
  new_balance INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_settings JSONB;
  v_monetization_enabled BOOLEAN;
  v_pay_to_be_visible_enabled BOOLEAN;
  v_boost_fee_mad INTEGER;
  v_min_wallet_mad INTEGER;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_profile_user_id UUID;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated'::TEXT, FALSE, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check profile ownership
  SELECT user_id INTO v_profile_user_id
  FROM public.artisan_profiles
  WHERE id = p_artisan_profile_id;
  
  IF v_profile_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Profile not found'::TEXT, FALSE, NULL::INTEGER;
    RETURN;
  END IF;
  
  IF v_profile_user_id != v_user_id THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: not your profile'::TEXT, FALSE, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- If disabling boost, just update and return (no refund)
  IF NOT p_enable_boost THEN
    UPDATE public.artisan_profiles
    SET is_boosted = FALSE,
        boosted_at = NULL,
        updated_at = NOW()
    WHERE id = p_artisan_profile_id;
    
    -- Get current balance
    SELECT balance_mad INTO v_current_balance
    FROM public.wallets
    WHERE user_id = v_user_id;
    
    RETURN QUERY SELECT TRUE, 'Boost disabled'::TEXT, FALSE, COALESCE(v_current_balance, 0);
    RETURN;
  END IF;
  
  -- Get monetization settings
  SELECT value INTO v_settings
  FROM public.platform_settings
  WHERE key = 'monetization';
  
  IF v_settings IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Settings not configured'::TEXT, FALSE, NULL::INTEGER;
    RETURN;
  END IF;
  
  v_monetization_enabled := (v_settings->>'monetization_enabled')::BOOLEAN;
  v_pay_to_be_visible_enabled := (v_settings->>'pay_to_be_visible_enabled')::BOOLEAN;
  
  -- Get boost fee (default to 50 MAD if not configured)
  v_boost_fee_mad := COALESCE((v_settings->>'boost_activation_fee_mad')::INTEGER, 50);
  v_min_wallet_mad := COALESCE((v_settings->>'artisan_min_wallet_mad')::INTEGER, 50);
  
  IF NOT v_monetization_enabled OR NOT v_pay_to_be_visible_enabled THEN
    -- Monetization disabled, allow free boost
    UPDATE public.artisan_profiles
    SET is_boosted = TRUE,
        boosted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_artisan_profile_id;
    
    SELECT balance_mad INTO v_current_balance
    FROM public.wallets
    WHERE user_id = v_user_id;
    
    RETURN QUERY SELECT TRUE, 'Boost enabled (free mode)'::TEXT, TRUE, COALESCE(v_current_balance, 0);
    RETURN;
  END IF;
  
  -- Ensure wallet exists
  PERFORM public.ensure_wallet_exists(v_user_id);
  
  -- Lock wallet row and get current balance
  SELECT balance_mad INTO v_current_balance
  FROM public.wallets
  WHERE user_id = v_user_id
  FOR UPDATE;
  
  -- Check sufficient balance for fee
  IF v_current_balance < v_boost_fee_mad THEN
    RETURN QUERY SELECT 
      FALSE,
      'Insufficient balance: ' || v_current_balance || ' MAD (need ' || v_boost_fee_mad || ' MAD to activate boost)'::TEXT,
      FALSE,
      v_current_balance;
    RETURN;
  END IF;
  
  -- CRITICAL: Deduct boost fee from wallet
  v_new_balance := v_current_balance - v_boost_fee_mad;
  
  UPDATE public.wallets
  SET balance_mad = v_new_balance,
      updated_at = NOW()
  WHERE user_id = v_user_id;
  
  -- Record transaction
  INSERT INTO public.wallet_transactions (user_id, amount_mad, reason, meta)
  VALUES (
    v_user_id,
    -v_boost_fee_mad,
    'boost_activation',
    jsonb_build_object(
      'artisan_profile_id', p_artisan_profile_id,
      'fee_mad', v_boost_fee_mad,
      'timestamp', NOW()
    )
  );
  
  -- Enable boost
  UPDATE public.artisan_profiles
  SET is_boosted = TRUE,
      boosted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_artisan_profile_id;
  
  RETURN QUERY SELECT TRUE, 'Boost enabled successfully (charged ' || v_boost_fee_mad || ' MAD)'::TEXT, TRUE, v_new_balance;
END;
$$;

COMMENT ON FUNCTION public.toggle_artisan_boost IS 
  'Enable or disable boost for artisan profile - DEDUCTS fee from wallet when enabling (SECURITY DEFINER)';

GRANT EXECUTE ON FUNCTION public.toggle_artisan_boost(UUID, BOOLEAN) TO authenticated;

-- =====================================================
-- 8. UPDATE check_contact_access TO USE JOIN TABLE
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
  -- Check for valid access pass using join table
  -- Pass grants access if:
  -- 1. Same city and service category
  -- 2. Not expired
  -- 3. Neighborhood scope matches:
  --    - If pass has NO neighborhoods -> city-wide access (matches any request)
  --    - If pass has neighborhoods AND request has none -> granted
  --    - If both have neighborhoods -> request neighborhoods must overlap with pass
  
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
      NOT EXISTS (
        SELECT 1 FROM public.contact_access_neighborhoods can
        WHERE can.access_pass_id = cap.id
      )
      OR
      -- User didn't specify neighborhoods (want city-wide)
      p_neighborhood_ids IS NULL
      OR array_length(p_neighborhood_ids, 1) IS NULL
      OR
      -- Pass covers requested neighborhoods (overlap check using join table)
      EXISTS (
        SELECT 1 FROM public.contact_access_neighborhoods can
        WHERE can.access_pass_id = cap.id
          AND can.neighborhood_id = ANY(p_neighborhood_ids)
      )
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
  'Check if user has valid contact access pass using join table architecture (SECURITY DEFINER)';

GRANT EXECUTE ON FUNCTION public.check_contact_access(UUID, INTEGER, UUID, INTEGER[]) TO authenticated;

-- =====================================================
-- 9. UPDATE debit_wallet_for_contact TO USE JOIN TABLE
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
  v_neighborhood_id INTEGER;
  v_city_exists BOOLEAN;
  v_category_exists BOOLEAN;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated'::TEXT, NULL::INTEGER, NULL::UUID, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Validate city exists
  SELECT EXISTS (
    SELECT 1 FROM public.cities WHERE id = p_city_id
  ) INTO v_city_exists;
  
  IF NOT v_city_exists THEN
    RETURN QUERY SELECT FALSE, 'Invalid city'::TEXT, NULL::INTEGER, NULL::UUID, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Validate service category exists
  SELECT EXISTS (
    SELECT 1 FROM public.service_categories WHERE id = p_service_category_id AND is_active = TRUE
  ) INTO v_category_exists;
  
  IF NOT v_category_exists THEN
    RETURN QUERY SELECT FALSE, 'Invalid service category'::TEXT, NULL::INTEGER, NULL::UUID, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Validate neighborhoods belong to city (if provided)
  IF p_neighborhood_ids IS NOT NULL AND array_length(p_neighborhood_ids, 1) > 0 THEN
    IF EXISTS (
      SELECT 1 FROM public.neighborhoods
      WHERE id = ANY(p_neighborhood_ids)
        AND city_id != p_city_id
    ) THEN
      RETURN QUERY SELECT FALSE, 'Neighborhoods must belong to the selected city'::TEXT, NULL::INTEGER, NULL::UUID, NULL::TIMESTAMPTZ;
      RETURN;
    END IF;
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
    -- Monetization disabled, deny access with clear message
    -- This forces proper flow - no silent free access
    RETURN QUERY SELECT FALSE, 'Monetization disabled - contact admin'::TEXT, NULL::INTEGER, NULL::UUID, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Check if user already has valid pass
  SELECT pass_id, expires_at INTO v_existing_pass, v_existing_expires_at
  FROM public.check_contact_access(v_user_id, p_city_id, p_service_category_id, p_neighborhood_ids);
  
  IF v_existing_pass IS NOT NULL THEN
    -- User already has valid pass
    SELECT balance_mad INTO v_current_balance
    FROM public.wallets
    WHERE user_id = v_user_id;
    
    RETURN QUERY SELECT TRUE, 'Already have access'::TEXT, COALESCE(v_current_balance, 0), v_existing_pass, v_existing_expires_at;
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
      'Insufficient balance: ' || v_current_balance || ' MAD (need ' || v_fee || ' MAD)'::TEXT,
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
      'neighborhood_count', COALESCE(array_length(p_neighborhood_ids, 1), 0),
      'fee_mad', v_fee
    )
  );
  
  -- Create access pass (without neighborhood_ids array)
  v_new_expires_at := NOW() + (v_duration_hours || ' hours')::INTERVAL;
  
  INSERT INTO public.contact_access_passes (
    user_id,
    city_id,
    service_category_id,
    expires_at
  )
  VALUES (
    v_user_id,
    p_city_id,
    p_service_category_id,
    v_new_expires_at
  )
  RETURNING id INTO v_new_pass_id;
  
  -- Insert neighborhood associations into join table (if provided)
  IF p_neighborhood_ids IS NOT NULL AND array_length(p_neighborhood_ids, 1) > 0 THEN
    FOREACH v_neighborhood_id IN ARRAY p_neighborhood_ids
    LOOP
      INSERT INTO public.contact_access_neighborhoods (access_pass_id, neighborhood_id)
      VALUES (v_new_pass_id, v_neighborhood_id)
      ON CONFLICT (access_pass_id, neighborhood_id) DO NOTHING;
    END LOOP;
  END IF;
  
  -- Return success
  RETURN QUERY SELECT 
    TRUE,
    'Access granted for ' || v_duration_hours || ' hours'::TEXT,
    v_new_balance,
    v_new_pass_id,
    v_new_expires_at;
END;
$$;

COMMENT ON FUNCTION public.debit_wallet_for_contact IS 
  'Debit wallet and create contact access pass using join table (SECURITY DEFINER)';

GRANT EXECUTE ON FUNCTION public.debit_wallet_for_contact(INTEGER, UUID, INTEGER[]) TO authenticated;

-- =====================================================
-- 10. ADD BOOST FEE TO PLATFORM SETTINGS
-- =====================================================

-- Update platform settings to include boost fee
DO $$
DECLARE
  v_current_settings JSONB;
BEGIN
  SELECT value INTO v_current_settings
  FROM public.platform_settings
  WHERE key = 'monetization';
  
  IF v_current_settings IS NOT NULL THEN
    -- Add boost_activation_fee_mad if not present
    IF NOT v_current_settings ? 'boost_activation_fee_mad' THEN
      v_current_settings := v_current_settings || jsonb_build_object('boost_activation_fee_mad', 50);
      
      UPDATE public.platform_settings
      SET value = v_current_settings,
          updated_at = NOW()
      WHERE key = 'monetization';
      
      RAISE NOTICE 'Added boost_activation_fee_mad to platform settings';
    END IF;
  END IF;
END $$;

-- =====================================================
-- 11. DEPRECATE neighborhood_ids ARRAY COLUMN
-- =====================================================

-- Mark old column as deprecated (do not drop yet for safety)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'contact_access_passes' 
      AND column_name = 'neighborhood_ids'
  ) THEN
    COMMENT ON COLUMN public.contact_access_passes.neighborhood_ids IS 
      'DEPRECATED: Use contact_access_neighborhoods join table instead. This column will be removed in a future migration.';
    
    RAISE NOTICE 'Marked contact_access_passes.neighborhood_ids as deprecated';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERIES (Run manually after migration)
-- =====================================================

-- Verify RLS policy protects is_boosted:
-- As non-admin artisan, try: UPDATE artisan_profiles SET is_boosted = true WHERE user_id = auth.uid();
-- Should fail with policy violation

-- Verify wallet deduction on boost:
-- SELECT * FROM wallet_transactions WHERE reason = 'boost_activation';

-- Verify join table migration:
-- SELECT COUNT(*) FROM contact_access_neighborhoods;

-- Check no negative balances possible:
-- Try: UPDATE wallets SET balance_mad = -100 WHERE user_id = auth.uid();
-- Should fail with constraint violation
