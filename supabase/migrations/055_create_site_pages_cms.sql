-- Migration: Create site_pages table for CMS
-- Description: Database-driven content management for static pages (About, Privacy, Terms, etc.)

-- Create site_pages table
CREATE TABLE IF NOT EXISTS public.site_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- 'about', 'privacy', 'terms', 'contact', etc.
  title_fr TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  content_fr TEXT NOT NULL, -- Can be plain text or markdown
  content_ar TEXT NOT NULL,
  meta_description_fr TEXT, -- SEO meta description
  meta_description_ar TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$') -- Only lowercase, numbers, and hyphens
);

-- Create index for slug (most common query)
CREATE INDEX IF NOT EXISTS idx_site_pages_slug ON public.site_pages(slug);
CREATE INDEX IF NOT EXISTS idx_site_pages_published ON public.site_pages(is_published);

-- Enable RLS
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

-- Policy: Public can read published pages
CREATE POLICY "Public can read published pages"
  ON public.site_pages
  FOR SELECT
  USING (is_published = TRUE);

-- Policy: Admins can read all pages (including unpublished)
CREATE POLICY "Admins can read all pages"
  ON public.site_pages
  FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Policy: Only admins can insert pages
CREATE POLICY "Admins can insert pages"
  ON public.site_pages
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Policy: Only admins can update pages
CREATE POLICY "Admins can update pages"
  ON public.site_pages
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Policy: Only admins can delete pages
CREATE POLICY "Admins can delete pages"
  ON public.site_pages
  FOR DELETE
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_site_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS set_site_pages_updated_at ON public.site_pages;
CREATE TRIGGER set_site_pages_updated_at
  BEFORE UPDATE ON public.site_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_site_pages_updated_at();

-- Seed default pages
INSERT INTO public.site_pages (slug, title_fr, title_ar, content_fr, content_ar, is_published)
VALUES
  ('about', 'À Propos', 'معلومات عنا', 'Contenu par défaut pour la page À Propos.', 'محتوى افتراضي لصفحة معلومات عنا.', TRUE),
  ('privacy', 'Politique de Confidentialité', 'سياسة الخصوصية', 'Contenu par défaut pour la politique de confidentialité.', 'محتوى افتراضي لسياسة الخصوصية.', TRUE),
  ('terms', 'Conditions d''Utilisation', 'شروط الاستخدام', 'Contenu par défaut pour les conditions d''utilisation.', 'محتوى افتراضي لشروط الاستخدام.', TRUE),
  ('contact', 'Contact', 'اتصل بنا', 'Contenu par défaut pour la page Contact.', 'محتوى افتراضي لصفحة اتصل بنا.', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Comment
COMMENT ON TABLE public.site_pages IS 'CMS for managing static pages with multilingual content (FR/AR)';
