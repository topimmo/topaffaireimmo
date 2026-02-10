-- =====================================================
-- Migration 090: Monetization RPC Functions
-- =====================================================
-- Secure server-side functions for wallet operations
-- All functions are SECURITY DEFINER to bypass RLS

-- =====================================================
-- 1. HELPER: Ensure Wallet Exists
-- =====================================================

CREATE OR REPLACE FUNCTION public.ensure_wallet_exists(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance_mad)
  VALUES (target_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

COMMENT ON FUNCTION public.ensure_wallet_exists IS 'Creates wallet for user if it does not exist (idempotent)';

-- =====================================================
-- 2. HELPER: Check Contact Access
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_contact_access(
  p_user_id UUID,
  p_city_id INTEGER,
  p_service_category_id UUID
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
  ORDER BY cap.expires_at DESC
  LIMIT 1;
  
  -- If no active pass found, return false
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TIMESTAMPTZ;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.check_contact_access IS 'Checks if user has valid contact access pass for city + service category';

-- =====================================================
-- 3. DEBIT WALLET FOR CONTACT REVEAL
-- =====================================================

CREATE OR REPLACE FUNCTION public.debit_wallet_for_contact(
  p_city_id INTEGER,
  p_service_category_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  new_balance INTEGER,
  pass_id UUID
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
  v_expires_at TIMESTAMPTZ;
  v_new_pass_id UUID;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated', NULL::INTEGER, NULL::UUID;
    RETURN;
  END IF;
  
  -- Get monetization settings
  SELECT value INTO v_settings
  FROM public.platform_settings
  WHERE key = 'monetization';
  
  IF v_settings IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Settings not configured', NULL::INTEGER, NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if monetization is enabled
  v_monetization_enabled := (v_settings->>'monetization_enabled')::BOOLEAN;
  v_pay_per_contact_enabled := (v_settings->>'pay_per_contact_enabled')::BOOLEAN;
  
  IF NOT v_monetization_enabled OR NOT v_pay_per_contact_enabled THEN
    -- Monetization disabled, allow free access
    RETURN QUERY SELECT TRUE, 'Free access (monetization disabled)', NULL::INTEGER, NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if user already has valid pass
  SELECT pass_id, expires_at INTO v_existing_pass, v_expires_at
  FROM public.check_contact_access(v_user_id, p_city_id, p_service_category_id);
  
  IF v_existing_pass IS NOT NULL THEN
    -- User already has valid pass
    RETURN QUERY SELECT TRUE, 'Already have access', NULL::INTEGER, v_existing_pass;
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
      'Insufficient balance: ' || v_current_balance || ' MAD (need ' || v_fee || ' MAD)',
      v_current_balance,
      NULL::UUID;
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
      'fee_mad', v_fee
    )
  );
  
  -- Create access pass
  v_expires_at := NOW() + (v_duration_hours || ' hours')::INTERVAL;
  
  INSERT INTO public.contact_access_passes (user_id, city_id, service_category_id, expires_at)
  VALUES (v_user_id, p_city_id, p_service_category_id, v_expires_at)
  RETURNING id INTO v_new_pass_id;
  
  -- Return success
  RETURN QUERY SELECT 
    TRUE,
    'Contact revealed successfully',
    v_new_balance,
    v_new_pass_id;
END;
$$;

COMMENT ON FUNCTION public.debit_wallet_for_contact IS 'Debit wallet and create contact access pass (SECURITY DEFINER)';

-- =====================================================
-- 4. ADMIN TOP-UP WALLET
-- =====================================================

CREATE OR REPLACE FUNCTION public.admin_topup_wallet(
  p_target_user_id UUID,
  p_amount_mad INTEGER,
  p_reason TEXT DEFAULT 'admin_topup'
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  new_balance INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_is_admin BOOLEAN;
  v_new_balance INTEGER;
BEGIN
  -- Get authenticated user
  v_admin_id := auth.uid();
  
  IF v_admin_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated'::TEXT, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = v_admin_id
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: admin access required'::TEXT, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Validate amount
  IF p_amount_mad <= 0 THEN
    RETURN QUERY SELECT FALSE, 'Amount must be positive'::TEXT, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Ensure wallet exists
  PERFORM public.ensure_wallet_exists(p_target_user_id);
  
  -- Update wallet balance
  UPDATE public.wallets
  SET balance_mad = balance_mad + p_amount_mad,
      updated_at = NOW()
  WHERE user_id = p_target_user_id
  RETURNING balance_mad INTO v_new_balance;
  
  -- Record transaction
  INSERT INTO public.wallet_transactions (user_id, amount_mad, reason, meta)
  VALUES (
    p_target_user_id,
    p_amount_mad,
    p_reason,
    jsonb_build_object(
      'admin_id', v_admin_id,
      'admin_topup', true
    )
  );
  
  -- Return success
  RETURN QUERY SELECT 
    TRUE,
    'Wallet topped up successfully'::TEXT,
    v_new_balance;
END;
$$;

COMMENT ON FUNCTION public.admin_topup_wallet IS 'Admin-only function to add credits to user wallet';

-- =====================================================
-- 5. GET WALLET BALANCE (Helper for UI)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_my_wallet_balance()
RETURNS TABLE (
  balance_mad INTEGER,
  has_wallet BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT 0, FALSE;
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    COALESCE(w.balance_mad, 0) as balance_mad,
    (w.user_id IS NOT NULL) as has_wallet
  FROM (SELECT v_user_id as uid) u
  LEFT JOIN public.wallets w ON w.user_id = u.uid;
END;
$$;

COMMENT ON FUNCTION public.get_my_wallet_balance IS 'Get current user wallet balance (safe for client calls)';

-- =====================================================
-- 6. TOGGLE ARTISAN BOOST
-- =====================================================

CREATE OR REPLACE FUNCTION public.toggle_artisan_boost(
  p_artisan_profile_id UUID,
  p_enable_boost BOOLEAN
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  is_boosted BOOLEAN
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
  v_min_wallet_mad INTEGER;
  v_current_balance INTEGER;
  v_profile_user_id UUID;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated'::TEXT, FALSE;
    RETURN;
  END IF;
  
  -- Check profile ownership
  SELECT user_id INTO v_profile_user_id
  FROM public.artisan_profiles
  WHERE id = p_artisan_profile_id;
  
  IF v_profile_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Profile not found'::TEXT, FALSE;
    RETURN;
  END IF;
  
  IF v_profile_user_id != v_user_id THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: not your profile'::TEXT, FALSE;
    RETURN;
  END IF;
  
  -- If disabling boost, just update and return
  IF NOT p_enable_boost THEN
    UPDATE public.artisan_profiles
    SET is_boosted = FALSE,
        boosted_at = NULL,
        updated_at = NOW()
    WHERE id = p_artisan_profile_id;
    
    RETURN QUERY SELECT TRUE, 'Boost disabled'::TEXT, FALSE;
    RETURN;
  END IF;
  
  -- Get monetization settings
  SELECT value INTO v_settings
  FROM public.platform_settings
  WHERE key = 'monetization';
  
  IF v_settings IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Settings not configured'::TEXT, FALSE;
    RETURN;
  END IF;
  
  v_monetization_enabled := (v_settings->>'monetization_enabled')::BOOLEAN;
  v_pay_to_be_visible_enabled := (v_settings->>'pay_to_be_visible_enabled')::BOOLEAN;
  
  IF NOT v_monetization_enabled OR NOT v_pay_to_be_visible_enabled THEN
    -- Monetization disabled, allow free boost
    UPDATE public.artisan_profiles
    SET is_boosted = TRUE,
        boosted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_artisan_profile_id;
    
    RETURN QUERY SELECT TRUE, 'Boost enabled (free mode)'::TEXT, TRUE;
    RETURN;
  END IF;
  
  -- Check wallet balance requirement
  v_min_wallet_mad := (v_settings->>'artisan_min_wallet_mad')::INTEGER;
  
  -- Ensure wallet exists
  PERFORM public.ensure_wallet_exists(v_user_id);
  
  SELECT balance_mad INTO v_current_balance
  FROM public.wallets
  WHERE user_id = v_user_id;
  
  IF v_current_balance < v_min_wallet_mad THEN
    RETURN QUERY SELECT 
      FALSE,
      'Insufficient balance: ' || v_current_balance || ' MAD (need ' || v_min_wallet_mad || ' MAD minimum)'::TEXT,
      FALSE;
    RETURN;
  END IF;
  
  -- Enable boost
  UPDATE public.artisan_profiles
  SET is_boosted = TRUE,
      boosted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_artisan_profile_id;
  
  RETURN QUERY SELECT TRUE, 'Boost enabled successfully'::TEXT, TRUE;
END;
$$;

COMMENT ON FUNCTION public.toggle_artisan_boost IS 'Enable or disable boost for artisan profile (checks wallet balance if monetization ON)';
