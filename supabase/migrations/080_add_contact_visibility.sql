-- =====================================================
-- Migration: Add International Phone Support & Contact Visibility Controls
-- Adds support for E.164 phone format and per-listing visibility flags
-- =====================================================

-- 1. Ensure contact fields exist (safe ADD COLUMN IF NOT EXISTS)
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- 2. Add visibility flags with safe defaults (hidden by default for privacy)
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS show_phone_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_whatsapp_public BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_email_public BOOLEAN NOT NULL DEFAULT true;

-- 3. Add helpful comments for documentation
COMMENT ON COLUMN public.properties.contact_phone IS 'Contact phone in E.164 format (e.g., +212664228976, +33123456789)';
COMMENT ON COLUMN public.properties.contact_whatsapp IS 'WhatsApp number in E.164 format';
COMMENT ON COLUMN public.properties.contact_email IS 'Contact email address for this listing';
COMMENT ON COLUMN public.properties.show_phone_public IS 'Whether to display phone number publicly (default: false for privacy)';
COMMENT ON COLUMN public.properties.show_whatsapp_public IS 'Whether to display WhatsApp publicly (default: true)';
COMMENT ON COLUMN public.properties.show_email_public IS 'Whether to display email publicly (default: true)';

-- 4. Create a public-safe view that respects visibility flags
-- This view ensures anonymous users cannot see hidden contact details
CREATE OR REPLACE VIEW public.properties_public AS
SELECT 
  p.id,
  p.title_fr,
  p.title_ar,
  p.description_fr,
  p.description_ar,
  p.price,
  p.transaction_type,
  p.property_type,
  p.status,
  p.created_at,
  p.images,
  p.address,
  p.bedrooms,
  p.bathrooms,
  p.area,
  p.year_built,
  p.featured,
  p.advertiser_type,
  p.city_id,
  p.neighborhood_id,
  p.custom_neighborhood,
  p.owner_id,
  
  -- ✅ Conditionally expose contact details based on visibility flags
  CASE WHEN p.show_phone_public = true THEN p.contact_phone ELSE NULL END AS contact_phone,
  CASE WHEN p.show_whatsapp_public = true THEN p.contact_whatsapp ELSE NULL END AS contact_whatsapp,
  CASE WHEN p.show_email_public = true THEN p.contact_email ELSE NULL END AS contact_email,
  
  -- ✅ Always expose visibility flags so UI can decide what to show
  p.show_phone_public,
  p.show_whatsapp_public,
  p.show_email_public
FROM public.properties p
WHERE p.status = 'published' AND (p.is_archived = FALSE OR p.is_archived IS NULL); -- Only show published, non-archived properties to public

-- 5. Grant permissions on the public view
GRANT SELECT ON public.properties_public TO anon;
GRANT SELECT ON public.properties_public TO authenticated;

-- 6. Add indexes for performance on new columns
CREATE INDEX IF NOT EXISTS idx_properties_show_phone_public ON public.properties(show_phone_public) WHERE show_phone_public = true;
CREATE INDEX IF NOT EXISTS idx_properties_show_whatsapp_public ON public.properties(show_whatsapp_public) WHERE show_whatsapp_public = true;
CREATE INDEX IF NOT EXISTS idx_properties_show_email_public ON public.properties(show_email_public) WHERE show_email_public = true;

-- 7. Note: Since columns were created with NOT NULL DEFAULT, existing rows
-- will automatically have default values. No UPDATE statement is needed.
