-- =====================================================
-- Migration 069: Fix Approved Listings to Published
-- =====================================================
--
-- OBJECTIVE:
-- Convert any remaining listings with status='approved' to status='published'
-- to ensure they appear on the public website.
--
-- CONTEXT:
-- Migration 067 introduced the status workflow and migrated approved → published.
-- However, the legacy AdminPanel was still setting status to 'approved' instead
-- of 'published', causing listings to be hidden from public view.
-- This migration ensures all approved listings are visible publicly.
--
-- =====================================================

-- Update any listings with status='approved' to status='published'
-- and set is_archived to FALSE to ensure public visibility
UPDATE public.properties 
SET 
  status = 'published',
  is_archived = FALSE,
  -- Set published_at if not already set
  published_at = COALESCE(published_at, approved_at, updated_at, created_at)
WHERE status = 'approved';

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running this migration, verify:
-- SELECT status, COUNT(*) as count, is_archived
-- FROM public.properties
-- GROUP BY status, is_archived
-- ORDER BY status;
--
-- Should show 0 listings with status='approved'
-- =====================================================
