-- Migration 074: Fix site_settings contact fields
-- 
-- This migration fixes the contact information in site_settings:
-- 1. Removes contact_phone and contact_whatsapp (not needed)
-- 2. Ensures contact_email is stored as proper JSONB
--
-- The site_settings.value column is JSONB type, so we must use to_jsonb()
-- when inserting text values.
--
-- Context: Previous error occurred when inserting plain text into JSONB column:
-- "ERROR 22P02 invalid input syntax for type json ... Token 'contact' is invalid"
--
-- Production requirements:
-- - Only email contact should exist
-- - contact_email should contain: contact@topaffaireimmo.com
-- - Stored as proper JSONB: to_jsonb('contact@topaffaireimmo.com'::text)

BEGIN;

-- Step 1: Delete contact_phone and contact_whatsapp from site_settings
DELETE FROM public.site_settings
WHERE key IN ('contact_phone', 'contact_whatsapp');

-- Step 2: Upsert contact_email with proper JSONB format
-- Using to_jsonb() to convert text to JSONB properly
INSERT INTO public.site_settings (key, value, category, is_public, description_fr)
VALUES (
  'contact_email',
  to_jsonb('contact@topaffaireimmo.com'::text),
  'contact',
  true,
  'Contact email address for the website'
)
ON CONFLICT (key)
DO UPDATE SET
  value = to_jsonb('contact@topaffaireimmo.com'::text),
  category = 'contact',
  is_public = true,
  description_fr = 'Contact email address for the website',
  updated_at = now();

COMMIT;

-- Verification query (run after migration):
-- SELECT key, value, category, is_public 
-- FROM public.site_settings 
-- WHERE key LIKE 'contact_%'
-- ORDER BY key;
--
-- Expected result:
-- key           | value                              | category | is_public
-- --------------|-----------------------------------|----------|----------
-- contact_email | "contact@topaffaireimmo.com"      | contact  | true
--
-- Note: value column shows the JSONB representation with quotes
