-- Migration: Create service_categories table for home services catalog
-- Description: Stores service categories (plumbing, electricity, etc.) with multilingual support

CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_fr TEXT,
  description_ar TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT service_categories_valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_service_categories_slug ON public.service_categories(slug);
CREATE INDEX IF NOT EXISTS idx_service_categories_active ON public.service_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_service_categories_sort_order ON public.service_categories(sort_order);

-- Enable RLS
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- Public can read only active service categories
CREATE POLICY "Public can read active service categories"
  ON public.service_categories
  FOR SELECT
  USING (is_active = TRUE);

-- Admins can read all service categories
CREATE POLICY "Admins can read all service categories"
  ON public.service_categories
  FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.admins));

-- Admins can insert service categories
CREATE POLICY "Admins can insert service categories"
  ON public.service_categories
  FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

-- Admins can update service categories
CREATE POLICY "Admins can update service categories"
  ON public.service_categories
  FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

-- Admins can delete service categories
CREATE POLICY "Admins can delete service categories"
  ON public.service_categories
  FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM public.admins));

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_service_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_service_categories_updated_at ON public.service_categories;
CREATE TRIGGER set_service_categories_updated_at
  BEFORE UPDATE ON public.service_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_service_categories_updated_at();

-- Seed default service categories (idempotent)
INSERT INTO public.service_categories (slug, name_fr, name_ar, description_fr, description_ar, icon, sort_order, is_active)
VALUES
  ('plomberie', 'Plomberie', 'السباكة', 'Installation et réparation plomberie', 'التركيب والصيانة في السباكة', 'wrench', 1, TRUE),
  ('electricite', 'Électricité', 'الكهرباء', 'Dépannage et installations électriques', 'خدمات كهربائية وصيانة', 'zap', 2, TRUE),
  ('climatisation', 'Climatisation', 'التكييف', 'Installation et entretien climatisation', 'تركيب وصيانة المكيفات', 'wind', 3, TRUE),
  ('peinture', 'Peinture', 'الطلاء', 'Peinture intérieure et extérieure', 'أعمال الطلاء الداخلية والخارجية', 'paint-roller', 4, TRUE),
  ('nettoyage', 'Nettoyage', 'التنظيف', 'Nettoyage ménager et professionnel', 'خدمات التنظيف المنزلي والمهني', 'sparkles', 5, TRUE),
  ('jardinage', 'Jardinage', 'البستنة', 'Entretien des jardins et espaces verts', 'العناية بالحدائق والمساحات الخضراء', 'leaf', 6, TRUE)
ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE public.service_categories IS 'Service categories for home and professional services (FR/AR) with public read access to active rows';
