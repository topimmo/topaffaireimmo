-- =====================================================
-- Migration 065: Verify Storage Buckets Exist
-- =====================================================
--
-- OBJECTIVE:
-- Ensure all required storage buckets are created
-- This migration is idempotent and safe to run multiple times
--
-- =====================================================

-- Ensure all storage buckets exist with correct configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('property-images', 'property-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('banner-images', 'banner-images', false, 1048576, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('payment-receipts', 'payment-receipts', false, 2097152, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
  ('agency-logos', 'agency-logos', true, 524288, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Log successful bucket verification
DO $$
BEGIN
  RAISE NOTICE '✅ Storage buckets verified/created: property-images, banner-images, payment-receipts, agency-logos';
END $$;
