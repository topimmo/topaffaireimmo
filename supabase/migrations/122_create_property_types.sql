-- =====================================================
-- Migration 122: Create property_types table and seed Morocco data
-- =====================================================
-- Purpose: Ensure property_types table exists with correct schema,
--          seed Morocco-specific property types, and enable public RLS.
--
-- The frontend hook usePropertyTypes() expects:
--   id, code, name_fr, name_ar, icon, is_active, display_order, created_at
-- =====================================================

-- 1. Create table if it doesn't already exist
CREATE TABLE IF NOT EXISTS public.property_types (
  id            SERIAL PRIMARY KEY,
  code          TEXT UNIQUE NOT NULL,
  name_fr       TEXT NOT NULL,
  name_ar       TEXT NOT NULL,
  icon          TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Seed Morocco property types (idempotent via ON CONFLICT DO UPDATE)
INSERT INTO public.property_types (code, name_fr, name_ar, icon, display_order) VALUES
  ('apartment', 'Appartement',      'شقة',          'Building2',  1),
  ('house',     'Maison',           'منزل',         'Home',       2),
  ('villa',     'Villa',            'فيلا',         'Castle',     3),
  ('land',      'Terrain',          'أرض',          'Map',        4),
  ('bureau',    'Bureau',           'مكتب',         'Briefcase',  5),
  ('magasin',   'Magasin',          'متجر',         'Store',      6),
  ('riad',      'Riad',             'رياض',         'TreePine',   7),
  ('immeuble',  'Immeuble',         'عمارة',        'Building',   8)
ON CONFLICT (code) DO UPDATE SET
  name_fr       = EXCLUDED.name_fr,
  name_ar       = EXCLUDED.name_ar,
  icon          = EXCLUDED.icon,
  display_order = EXCLUDED.display_order,
  is_active     = TRUE;

-- 3. Enable Row Level Security
ALTER TABLE public.property_types ENABLE ROW LEVEL SECURITY;

-- 4. Drop any conflicting policies and create a single public-read policy
DROP POLICY IF EXISTS "property_types_select_all"       ON public.property_types;
DROP POLICY IF EXISTS "property_types_admin_all"        ON public.property_types;
DROP POLICY IF EXISTS "property_types_public_read"      ON public.property_types;
DROP POLICY IF EXISTS "Property types are viewable by everyone" ON public.property_types;
DROP POLICY IF EXISTS "Anyone can view property types"  ON public.property_types;
DROP POLICY IF EXISTS "property_types_select"           ON public.property_types;
DROP POLICY IF EXISTS "property_types_admin"            ON public.property_types;

-- Public read (anon + authenticated)
CREATE POLICY "property_types_public_read"
  ON public.property_types
  FOR SELECT
  USING (is_active = TRUE);

-- 5. Grant SELECT on the table to anon and authenticated roles
GRANT SELECT ON public.property_types TO anon, authenticated;
