-- Migration: Home Services - Zones & Categories Enhancement
-- Description: Adds artisan zones support and expands service categories

-- ===========================
-- PART 1: SERVICE ZONES TABLE (artisan coverage areas)
-- ===========================

CREATE TABLE IF NOT EXISTS public.artisan_service_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_slug TEXT NOT NULL,
  zone_slug TEXT,
  neighborhood_slugs TEXT[] DEFAULT '{}',
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT artisan_service_zones_city_slug_check CHECK (city_slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT artisan_service_zones_zone_slug_check CHECK (zone_slug IS NULL OR zone_slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX IF NOT EXISTS idx_artisan_service_zones_user_id ON public.artisan_service_zones(user_id);
CREATE INDEX IF NOT EXISTS idx_artisan_service_zones_city_slug ON public.artisan_service_zones(city_slug);
CREATE INDEX IF NOT EXISTS idx_artisan_service_zones_zone_slug ON public.artisan_service_zones(zone_slug);

ALTER TABLE public.artisan_service_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own service zones" ON public.artisan_service_zones;
CREATE POLICY "Users can read own service zones"
  ON public.artisan_service_zones
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can read service zones for listings" ON public.artisan_service_zones;
CREATE POLICY "Public can read service zones for listings"
  ON public.artisan_service_zones
  FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Users can insert own service zones" ON public.artisan_service_zones;
CREATE POLICY "Users can insert own service zones"
  ON public.artisan_service_zones
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own service zones" ON public.artisan_service_zones;
CREATE POLICY "Users can update own service zones"
  ON public.artisan_service_zones
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own service zones" ON public.artisan_service_zones;
CREATE POLICY "Users can delete own service zones"
  ON public.artisan_service_zones
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_artisan_service_zones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_artisan_service_zones_updated_at ON public.artisan_service_zones;
CREATE TRIGGER set_artisan_service_zones_updated_at
  BEFORE UPDATE ON public.artisan_service_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_artisan_service_zones_updated_at();

COMMENT ON TABLE public.artisan_service_zones IS 'Service coverage areas for artisans (city, zone, neighborhoods). Allows proximity-based matching.';

-- ===========================
-- PART 2: ENSURE SERVICE CATEGORIES TABLE HAS ALL COLUMNS
-- ===========================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'service_categories' 
    AND column_name = 'description_fr'
  ) THEN
    ALTER TABLE public.service_categories ADD COLUMN description_fr TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'service_categories' 
    AND column_name = 'description_ar'
  ) THEN
    ALTER TABLE public.service_categories ADD COLUMN description_ar TEXT;
  END IF;
END $$;

-- ===========================
-- PART 3: ADD MISSING SERVICE CATEGORIES (HIGH & MEDIUM PRIORITY)
-- ===========================

INSERT INTO public.service_categories (slug, name_fr, name_ar, description_fr, description_ar, icon, sort_order, is_active)
VALUES
  ('renovation', 'Rénovation / Travaux', 'ترميم / أشغال', 'Rénovation intérieure et extérieure, petits travaux', 'أعمال الترميم الداخلية والخارجية', 'hammer', 4, TRUE),
  ('demenagement', 'Déménagement', 'نقل الأثاث', 'Services de déménagement professionnel', 'خدمات نقل الأثاث الاحترافية', 'truck', 10, TRUE),
  ('aluminium-menuiserie', 'Aluminium & Menuiserie', 'الألمنيوم والنجارة', 'Fenêtres, portes aluminium et menuiserie', 'نوافذ وأبواب ألمنيوم ونجارة', 'door-open', 11, TRUE),
  ('menuiserie-bois', 'Menuiserie bois', 'نجارة الخشب', 'Fabrication et réparation de meubles en bois', 'صناعة وإصلاح الأثاث الخشبي', 'axe', 12, TRUE),
  ('serrurerie', 'Serrurerie', 'أقفال ومفاتيح', 'Ouverture de portes, changement de serrures', 'فتح الأبواب وتغيير الأقفال', 'key', 13, TRUE),
  ('internet-parabole', 'Internet / Parabole / Caméras', 'إنترنت / صحن / كاميرات', 'Installation internet, antennes et vidéosurveillance', 'تركيب الإنترنت والصحن وكاميرات المراقبة', 'satellite-dish', 14, TRUE),
  ('nettoyage-fin-chantier', 'Nettoyage fin chantier', 'تنظيف بعد البناء', 'Nettoyage après travaux et construction', 'تنظيف ما بعد أعمال البناء', 'hard-hat', 20, TRUE),
  ('securite-alarmes', 'Sécurité / Alarmes', 'أمن / إنذارات', 'Systèmes d alarme et sécurité résidentielle', 'أنظمة الإنذار والأمان المنزلي', 'shield-alert', 21, TRUE),
  ('decoration-interieure', 'Décoration intérieure', 'ديكور داخلي', 'Design d intérieur et décoration', 'تصميم وديكور داخلي', 'sofa', 22, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_ar = EXCLUDED.name_ar,
  description_fr = EXCLUDED.description_fr,
  description_ar = EXCLUDED.description_ar,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active;

-- ===========================
-- PART 4: REORDER TOP PRIORITY CATEGORIES
-- ===========================

UPDATE public.service_categories SET sort_order = 1 WHERE slug = 'plomberie';
UPDATE public.service_categories SET sort_order = 2 WHERE slug = 'electricite';
UPDATE public.service_categories SET sort_order = 3 WHERE slug = 'climatisation';
UPDATE public.service_categories SET sort_order = 4 WHERE slug = 'renovation';
UPDATE public.service_categories SET sort_order = 5 WHERE slug = 'peinture';
UPDATE public.service_categories SET sort_order = 6 WHERE slug = 'nettoyage';
UPDATE public.service_categories SET sort_order = 7 WHERE slug = 'demenagement';
UPDATE public.service_categories SET sort_order = 8 WHERE slug = 'aluminium-menuiserie';
UPDATE public.service_categories SET sort_order = 9 WHERE slug = 'menuiserie-bois';
UPDATE public.service_categories SET sort_order = 10 WHERE slug = 'serrurerie';
UPDATE public.service_categories SET sort_order = 11 WHERE slug = 'internet-parabole';
UPDATE public.service_categories SET sort_order = 12 WHERE slug = 'jardinage';
UPDATE public.service_categories SET sort_order = 20 WHERE slug = 'nettoyage-fin-chantier';
UPDATE public.service_categories SET sort_order = 21 WHERE slug = 'securite-alarmes';
UPDATE public.service_categories SET sort_order = 22 WHERE slug = 'decoration-interieure';
