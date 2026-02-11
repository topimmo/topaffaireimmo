-- =====================================================
-- Migration 100: Service Subcategories & Artisan Services
-- =====================================================
-- Creates service_subcategories and artisan_services tables
-- Required for granular service management and artisan service offerings
-- =====================================================

-- =====================================================
-- 1. CREATE SERVICE_SUBCATEGORIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.service_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  
  -- Multilingual support
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT service_subcategories_valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

COMMENT ON TABLE public.service_subcategories IS 
  'Service subcategories (e.g., plumbing -> leak repair, installation). Belongs to service_categories.';

-- =====================================================
-- 2. CREATE INDEXES FOR SERVICE_SUBCATEGORIES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_service_subcategories_category 
  ON public.service_subcategories(category_id);

CREATE INDEX IF NOT EXISTS idx_service_subcategories_slug 
  ON public.service_subcategories(slug);

CREATE INDEX IF NOT EXISTS idx_service_subcategories_active 
  ON public.service_subcategories(is_active) WHERE is_active = TRUE;

-- =====================================================
-- 3. CREATE TRIGGER FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_service_subcategories_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_service_subcategories_updated_at ON public.service_subcategories;
CREATE TRIGGER set_service_subcategories_updated_at
  BEFORE UPDATE ON public.service_subcategories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_service_subcategories_updated_at();

-- =====================================================
-- 4. ENABLE RLS ON SERVICE_SUBCATEGORIES
-- =====================================================

ALTER TABLE public.service_subcategories ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE RLS POLICIES FOR SERVICE_SUBCATEGORIES
-- =====================================================

-- Public can read only active service subcategories
DROP POLICY IF EXISTS "Public can read active service subcategories" ON public.service_subcategories;
CREATE POLICY "Public can read active service subcategories"
  ON public.service_subcategories
  FOR SELECT
  USING (is_active = TRUE);

-- Admins can read all service subcategories
DROP POLICY IF EXISTS "Admins can read all service subcategories" ON public.service_subcategories;
CREATE POLICY "Admins can read all service subcategories"
  ON public.service_subcategories
  FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.admins));

-- Admins can insert service subcategories
DROP POLICY IF EXISTS "Admins can insert service subcategories" ON public.service_subcategories;
CREATE POLICY "Admins can insert service subcategories"
  ON public.service_subcategories
  FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

-- Admins can update service subcategories
DROP POLICY IF EXISTS "Admins can update service subcategories" ON public.service_subcategories;
CREATE POLICY "Admins can update service subcategories"
  ON public.service_subcategories
  FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

-- Admins can delete service subcategories
DROP POLICY IF EXISTS "Admins can delete service subcategories" ON public.service_subcategories;
CREATE POLICY "Admins can delete service subcategories"
  ON public.service_subcategories
  FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM public.admins));

-- =====================================================
-- 6. CREATE ARTISAN_SERVICES TABLE
-- =====================================================
-- This table links artisans to specific services they offer
-- Different from artisan_profiles which is 1:1 with user per category

CREATE TABLE IF NOT EXISTS public.artisan_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Artisan reference
  artisan_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Service categorization
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE RESTRICT,
  subcategory_id UUID REFERENCES public.service_subcategories(id) ON DELETE SET NULL,
  
  -- Location coverage for this specific service
  city TEXT NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints: artisan can only offer same subcategory once per city
  UNIQUE(artisan_id, subcategory_id, city)
);

COMMENT ON TABLE public.artisan_services IS 
  'Services offered by artisans. Links artisans to specific service subcategories and cities.';

-- =====================================================
-- 7. CREATE INDEXES FOR ARTISAN_SERVICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_artisan_services_artisan 
  ON public.artisan_services(artisan_id);

CREATE INDEX IF NOT EXISTS idx_artisan_services_category 
  ON public.artisan_services(category_id);

CREATE INDEX IF NOT EXISTS idx_artisan_services_subcategory 
  ON public.artisan_services(subcategory_id);

CREATE INDEX IF NOT EXISTS idx_artisan_services_city 
  ON public.artisan_services(city);

CREATE INDEX IF NOT EXISTS idx_artisan_services_active 
  ON public.artisan_services(is_active) WHERE is_active = TRUE;

-- Composite index for service search
CREATE INDEX IF NOT EXISTS idx_artisan_services_search 
  ON public.artisan_services(category_id, city, is_active);

-- =====================================================
-- 8. CREATE TRIGGER FOR ARTISAN_SERVICES UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_artisan_services_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_artisan_services_updated_at ON public.artisan_services;
CREATE TRIGGER set_artisan_services_updated_at
  BEFORE UPDATE ON public.artisan_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_artisan_services_updated_at();

-- =====================================================
-- 9. ENABLE RLS ON ARTISAN_SERVICES
-- =====================================================

ALTER TABLE public.artisan_services ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. CREATE RLS POLICIES FOR ARTISAN_SERVICES
-- =====================================================

-- Public can read active artisan services (for search/discovery)
DROP POLICY IF EXISTS "Public can read active artisan services" ON public.artisan_services;
CREATE POLICY "Public can read active artisan services"
  ON public.artisan_services
  FOR SELECT
  USING (is_active = TRUE);

-- Artisans can read their own services
DROP POLICY IF EXISTS "Artisans can read own services" ON public.artisan_services;
CREATE POLICY "Artisans can read own services"
  ON public.artisan_services
  FOR SELECT
  USING (auth.uid() = artisan_id);

-- Artisans can insert their own services
DROP POLICY IF EXISTS "Artisans can insert own services" ON public.artisan_services;
CREATE POLICY "Artisans can insert own services"
  ON public.artisan_services
  FOR INSERT
  WITH CHECK (auth.uid() = artisan_id);

-- Artisans can update their own services
DROP POLICY IF EXISTS "Artisans can update own services" ON public.artisan_services;
CREATE POLICY "Artisans can update own services"
  ON public.artisan_services
  FOR UPDATE
  USING (auth.uid() = artisan_id)
  WITH CHECK (auth.uid() = artisan_id);

-- Artisans can delete their own services
DROP POLICY IF EXISTS "Artisans can delete own services" ON public.artisan_services;
CREATE POLICY "Artisans can delete own services"
  ON public.artisan_services
  FOR DELETE
  USING (auth.uid() = artisan_id);

-- Admins have full access
DROP POLICY IF EXISTS "Admins can manage all artisan services" ON public.artisan_services;
CREATE POLICY "Admins can manage all artisan services"
  ON public.artisan_services
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

-- =====================================================
-- 11. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON public.service_subcategories TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.service_subcategories TO authenticated;
GRANT ALL ON public.service_subcategories TO postgres, service_role;

GRANT SELECT ON public.artisan_services TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.artisan_services TO authenticated;
GRANT ALL ON public.artisan_services TO postgres, service_role;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
