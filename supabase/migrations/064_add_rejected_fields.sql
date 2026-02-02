-- =====================================================
-- Migration 064: Add rejected_at and rejected_by fields
-- =====================================================
--
-- OBJECTIVE:
-- Add timestamp and user tracking for rejected listings
-- to match the existing approved_at/approved_by pattern
--
-- =====================================================

-- Add rejected tracking fields to properties table
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES public.profiles(id);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_properties_rejected_at ON public.properties(rejected_at);

-- Add comments for documentation
COMMENT ON COLUMN public.properties.rejected_at IS 'Timestamp when listing was rejected by admin';
COMMENT ON COLUMN public.properties.rejected_by IS 'Admin user ID who rejected the listing';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
