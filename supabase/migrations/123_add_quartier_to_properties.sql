-- =====================================================
-- Migration 123: Add quartier column to properties table
-- =====================================================
-- Purpose: Add a dedicated free-text quartier column as requested.
--          The existing custom_neighborhood column is kept for backward
--          compatibility; both are populated from the same UI input
--          until custom_neighborhood is deprecated.
-- =====================================================

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS quartier TEXT;

-- Optional index for search/filter by quartier
CREATE INDEX IF NOT EXISTS idx_properties_quartier ON public.properties(quartier);
