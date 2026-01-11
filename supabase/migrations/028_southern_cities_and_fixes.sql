-- =====================================================
-- Migration: Add Southern Moroccan Cities + Critical Fixes
-- =====================================================

-- 1️⃣ ADD SOUTHERN MOROCCAN CITIES (Under Moroccan Sovereignty)
-- =====================================================

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Laâyoune', 'العيون', 'Laâyoune-Sakia El Hamra', 'العيون-الساقية الحمراء', 21, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Laâyoune');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Dakhla', 'الداخلة', 'Dakhla-Oued Ed-Dahab', 'الداخلة-وادي الذهب', 22, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Dakhla');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Smara', 'السمارة', 'Laâyoune-Sakia El Hamra', 'العيون-الساقية الحمراء', 23, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Smara');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Boujdour', 'بوجدور', 'Laâyoune-Sakia El Hamra', 'العيون-الساقية الحمراء', 24, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Boujdour');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Tarfaya', 'طرفاية', 'Laâyoune-Sakia El Hamra', 'العيون-الساقية الحمراء', 25, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Tarfaya');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Guelmim', 'كلميم', 'Guelmim-Oued Noun', 'كلميم-واد نون', 26, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Guelmim');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Tan-Tan', 'طانطان', 'Guelmim-Oued Noun', 'كلميم-واد نون', 27, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Tan-Tan');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Aousserd', 'أوسرد', 'Dakhla-Oued Ed-Dahab', 'الداخلة-وادي الذهب', 28, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Aousserd');

-- Also add some other important Moroccan cities that might be missing
INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Al Hoceïma', 'الحسيمة', 'Tanger-Tétouan-Al Hoceïma', 'طنجة-تطوان-الحسيمة', 29, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Al Hoceïma');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Ouarzazate', 'ورزازات', 'Drâa-Tafilalet', 'درعة-تافيلالت', 30, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Ouarzazate');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Tiznit', 'تزنيت', 'Souss-Massa', 'سوس-ماسة', 31, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Tiznit');

-- 2️⃣ FIX: Ensure properties can be submitted with minimal required fields
-- Note: Most columns are already nullable in the schema
-- =====================================================

-- Add advertiser_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'properties' 
    AND column_name = 'advertiser_type') THEN
    ALTER TABLE public.properties ADD COLUMN advertiser_type TEXT DEFAULT 'owner' 
      CHECK (advertiser_type IN ('owner', 'broker', 'agency'));
  END IF;
END $$;

-- Add region columns to cities if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cities' 
    AND column_name = 'region_fr') THEN
    ALTER TABLE public.cities ADD COLUMN region_fr TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cities' 
    AND column_name = 'region_ar') THEN
    ALTER TABLE public.cities ADD COLUMN region_ar TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cities' 
    AND column_name = 'display_order') THEN
    ALTER TABLE public.cities ADD COLUMN display_order INTEGER DEFAULT 100;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cities' 
    AND column_name = 'is_active') THEN
    ALTER TABLE public.cities ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- 3️⃣ FIX: Make banner target_url optional in banner_requests table
-- =====================================================

ALTER TABLE public.banner_requests 
ALTER COLUMN target_url DROP NOT NULL;

-- 4️⃣ Ensure all cities are accessible
-- =====================================================

UPDATE public.cities SET is_active = true WHERE is_active IS NULL OR is_active = false;

-- 5️⃣ Refresh RLS policies for better access
-- =====================================================

DROP POLICY IF EXISTS "Properties can be inserted by authenticated users" ON public.properties;
CREATE POLICY "Properties can be inserted by authenticated users" ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Properties are viewable by everyone" ON public.properties;
CREATE POLICY "Properties are viewable by everyone" ON public.properties
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Properties can be updated by owner" ON public.properties;
CREATE POLICY "Properties can be updated by owner" ON public.properties
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Properties can be deleted by owner" ON public.properties;
CREATE POLICY "Properties can be deleted by owner" ON public.properties
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- Ensure RLS is enabled
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

-- Refresh cities policy
DROP POLICY IF EXISTS "Cities are viewable by everyone" ON public.cities;
CREATE POLICY "Cities are viewable by everyone" ON public.cities
  FOR SELECT USING (true);

-- Refresh neighborhoods policy
DROP POLICY IF EXISTS "Neighborhoods are viewable by everyone" ON public.neighborhoods;
CREATE POLICY "Neighborhoods are viewable by everyone" ON public.neighborhoods
  FOR SELECT USING (true);
