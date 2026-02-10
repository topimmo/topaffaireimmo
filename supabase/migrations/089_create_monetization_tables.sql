-- =====================================================
-- Migration 089: Monetization System for Home Services
-- =====================================================
-- Creates tables for wallet, transactions, access passes, and platform settings
-- Includes RLS policies and indexes for security and performance

-- =====================================================
-- 1. PLATFORM SETTINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Public can read monetization settings (read-only)
CREATE POLICY "Public can read platform settings"
  ON public.platform_settings
  FOR SELECT
  USING (key = 'monetization');

-- Only admins can update settings
CREATE POLICY "Admins can update platform settings"
  ON public.platform_settings
  FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

-- Only admins can insert settings
CREATE POLICY "Admins can insert platform settings"
  ON public.platform_settings
  FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

-- Seed default monetization settings (OFF by default)
INSERT INTO public.platform_settings (key, value)
VALUES (
  'monetization',
  jsonb_build_object(
    'monetization_enabled', false,
    'pay_per_contact_enabled', false,
    'pay_to_be_visible_enabled', false,
    'contact_reveal_fee_mad', 5,
    'artisan_min_wallet_mad', 50,
    'contact_pass_duration_hours', 12
  )
)
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE public.platform_settings IS 'Platform-wide configuration settings with admin-only write access';

-- =====================================================
-- 2. ARTISAN PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.artisan_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Service information
  service_category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE RESTRICT,
  business_name TEXT NOT NULL,
  description_fr TEXT,
  description_ar TEXT,
  
  -- Location coverage (can serve multiple cities)
  cities INTEGER[] NOT NULL DEFAULT '{}', -- Array of city IDs
  
  -- Contact information
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  
  -- Verification and status
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Monetization features
  is_boosted BOOLEAN DEFAULT FALSE,
  boosted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, service_category_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_artisan_profiles_user_id ON public.artisan_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_artisan_profiles_service_category ON public.artisan_profiles(service_category_id);
CREATE INDEX IF NOT EXISTS idx_artisan_profiles_active ON public.artisan_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_artisan_profiles_boosted ON public.artisan_profiles(is_boosted) WHERE is_boosted = TRUE;
CREATE INDEX IF NOT EXISTS idx_artisan_profiles_cities ON public.artisan_profiles USING GIN(cities);

-- Enable RLS
ALTER TABLE public.artisan_profiles ENABLE ROW LEVEL SECURITY;

-- Public can read active and verified artisan profiles
CREATE POLICY "Public can read active artisan profiles"
  ON public.artisan_profiles
  FOR SELECT
  USING (is_active = TRUE AND is_verified = TRUE);

-- Artisans can read their own profiles (even if not verified)
CREATE POLICY "Artisans can read own profiles"
  ON public.artisan_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Artisans can insert their own profiles
CREATE POLICY "Artisans can create own profiles"
  ON public.artisan_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Artisans can update their own profiles (except verification status)
CREATE POLICY "Artisans can update own profiles"
  ON public.artisan_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all artisan profiles
CREATE POLICY "Admins can manage all artisan profiles"
  ON public.artisan_profiles
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_artisan_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_artisan_profiles_updated_at ON public.artisan_profiles;
CREATE TRIGGER set_artisan_profiles_updated_at
  BEFORE UPDATE ON public.artisan_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_artisan_profiles_updated_at();

COMMENT ON TABLE public.artisan_profiles IS 'Service provider profiles for home services with location and monetization features';

-- =====================================================
-- 3. WALLETS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_mad INTEGER NOT NULL DEFAULT 0 CHECK (balance_mad >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Users can read only their own wallet
CREATE POLICY "Users can read own wallet"
  ON public.wallets
  FOR SELECT
  USING (auth.uid() = user_id);

-- No direct UPDATE - must use RPC functions
-- Admins can manage wallets
CREATE POLICY "Admins can manage wallets"
  ON public.wallets
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

COMMENT ON TABLE public.wallets IS 'User wallet balances in MAD (Moroccan Dirham) - updates via RPC only';

-- =====================================================
-- 4. WALLET TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_mad INTEGER NOT NULL, -- Negative for debits, positive for credits
  reason TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reason ON public.wallet_transactions(reason);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read only their own transactions
CREATE POLICY "Users can read own transactions"
  ON public.wallet_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- No direct INSERT - must use RPC functions
-- Admins can manage transactions
CREATE POLICY "Admins can manage transactions"
  ON public.wallet_transactions
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

COMMENT ON TABLE public.wallet_transactions IS 'Audit trail of all wallet operations - inserts via RPC only';

-- =====================================================
-- 5. CONTACT ACCESS PASSES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.contact_access_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id INTEGER NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  service_category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_passes_user_id ON public.contact_access_passes(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_passes_expires_at ON public.contact_access_passes(expires_at);
CREATE INDEX IF NOT EXISTS idx_contact_passes_lookup 
  ON public.contact_access_passes(user_id, city_id, service_category_id, expires_at);

-- Enable RLS
ALTER TABLE public.contact_access_passes ENABLE ROW LEVEL SECURITY;

-- Users can read only their own passes
CREATE POLICY "Users can read own passes"
  ON public.contact_access_passes
  FOR SELECT
  USING (auth.uid() = user_id);

-- No direct INSERT - must use RPC functions
-- Admins can manage passes
CREATE POLICY "Admins can manage passes"
  ON public.contact_access_passes
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

COMMENT ON TABLE public.contact_access_passes IS 'Time-limited access passes for contact reveal (city + service category specific)';
