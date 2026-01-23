-- =====================================================
-- Migration: Fix Schema Mismatches for Application Code
-- Adds missing columns and fixes field name issues
-- =====================================================

-- 1. Add missing title_en and description_en columns to properties table
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;

-- Set defaults for existing rows (copy from FR version)
UPDATE public.properties SET title_en = title_fr WHERE title_en IS NULL;
UPDATE public.properties SET description_en = description_fr WHERE description_en IS NULL;

-- 2. Ensure is_admin column exists in profiles table
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update phone from contact_phone if exists
UPDATE public.properties SET phone = contact_phone WHERE phone IS NULL AND contact_phone IS NOT NULL;

-- 3. Improve handle_new_user trigger to include all metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    phone, 
    user_role, 
    company_name, 
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'user_role', 'real_estate_advertiser'),
    NEW.raw_user_meta_data->>'company_name',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    user_role = COALESCE(EXCLUDED.user_role, profiles.user_role),
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Simplify properties INSERT policy to avoid race conditions
DROP POLICY IF EXISTS "properties_insert_real_estate" ON public.properties;
DROP POLICY IF EXISTS "realtor_insert" ON public.properties;
DROP POLICY IF EXISTS "properties_insert_authenticated" ON public.properties;

CREATE POLICY "properties_insert_authenticated" ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    -- Allow if no profile exists yet OR profile has correct role OR is admin
    (
      NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()) OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (
          user_role IN ('real_estate_advertiser', 'admin') OR 
          is_admin = true
        )
      )
    )
  );

-- 5. Add helpful indexes for phone field
CREATE INDEX IF NOT EXISTS idx_properties_phone ON public.properties(phone);

-- 6. Create a view that combines all title/description variants for easier querying
CREATE OR REPLACE VIEW public.properties_full AS
SELECT 
  p.*,
  c.name_fr as city_name_fr,
  c.name_ar as city_name_ar,
  n.name_fr as neighborhood_name_fr,
  n.name_ar as neighborhood_name_ar,
  prof.full_name as owner_name,
  prof.phone as owner_phone,
  prof.email as owner_email,
  prof.user_role as owner_role,
  prof.advertiser_type as owner_advertiser_type
FROM public.properties p
LEFT JOIN public.cities c ON p.city_id = c.id
LEFT JOIN public.neighborhoods n ON p.neighborhood_id = n.id
LEFT JOIN public.profiles prof ON p.owner_id = prof.id;

-- Grant SELECT on view to authenticated users
GRANT SELECT ON public.properties_full TO authenticated;
GRANT SELECT ON public.properties_full TO anon;

-- 7. Update function comments
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates profile when auth user is created. Includes all metadata from signup.';
COMMENT ON COLUMN public.properties.phone IS 'Contact phone number for this property listing';
COMMENT ON COLUMN public.properties.title_en IS 'English title (for future multilingual support)';
COMMENT ON COLUMN public.properties.description_en IS 'English description (for future multilingual support)';
