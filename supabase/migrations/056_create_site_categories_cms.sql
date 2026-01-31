-- Migration: Create site_categories table for CMS
-- Description: Manage property categories or site categories with multilingual support

-- Create site_categories table
CREATE TABLE IF NOT EXISTS public.site_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- 'appartement', 'villa', 'terrain', etc.
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_fr TEXT,
  description_ar TEXT,
  icon TEXT, -- Optional icon name (lucide-react icon name)
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$') -- Only lowercase, numbers, and hyphens
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_site_categories_slug ON public.site_categories(slug);
CREATE INDEX IF NOT EXISTS idx_site_categories_active ON public.site_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_site_categories_sort_order ON public.site_categories(sort_order);

-- Enable RLS
ALTER TABLE public.site_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Public can read active categories
CREATE POLICY "Public can read active categories"
  ON public.site_categories
  FOR SELECT
  USING (is_active = TRUE);

-- Policy: Admins can read all categories
CREATE POLICY "Admins can read all categories"
  ON public.site_categories
  FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Policy: Only admins can insert categories
CREATE POLICY "Admins can insert categories"
  ON public.site_categories
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Policy: Only admins can update categories
CREATE POLICY "Admins can update categories"
  ON public.site_categories
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Policy: Only admins can delete categories
CREATE POLICY "Admins can delete categories"
  ON public.site_categories
  FOR DELETE
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_site_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS set_site_categories_updated_at ON public.site_categories;
CREATE TRIGGER set_site_categories_updated_at
  BEFORE UPDATE ON public.site_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_site_categories_updated_at();

-- Seed default categories (property types)
INSERT INTO public.site_categories (slug, name_fr, name_ar, description_fr, description_ar, sort_order, is_active)
VALUES
  ('appartement', 'Appartement', 'شقة', 'Appartements à vendre ou à louer', 'شقق للبيع أو الإيجار', 1, TRUE),
  ('villa', 'Villa', 'فيلا', 'Villas de luxe', 'فلل فاخرة', 2, TRUE),
  ('maison', 'Maison', 'منزل', 'Maisons traditionnelles et modernes', 'منازل تقليدية وحديثة', 3, TRUE),
  ('terrain', 'Terrain', 'أرض', 'Terrains constructibles', 'أراضي قابلة للبناء', 4, TRUE),
  ('commercial', 'Commercial', 'تجاري', 'Locaux commerciaux et bureaux', 'محلات تجارية ومكاتب', 5, TRUE),
  ('bureau', 'Bureau', 'مكتب', 'Espaces de bureau', 'مساحات مكتبية', 6, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Comment
COMMENT ON TABLE public.site_categories IS 'CMS for managing property categories with multilingual support (FR/AR)';
