-- =====================================================
-- Migration 067: Property Status Workflow & Security
-- =====================================================
--
-- OBJECTIVE:
-- Implement comprehensive status workflow for property listings
-- with security enforcement to prevent advertisers from editing
-- after submission/approval, while allowing admins full control.
--
-- STATUS WORKFLOW:
-- - draft: Advertiser can edit freely
-- - pending: Submitted for review, locked for advertiser
-- - approved: Admin approved, locked for advertiser
-- - published: Publicly visible, locked for advertiser
-- - rejected: Admin rejected, advertiser can edit and resubmit
-- - archived: Removed from public view, admin only
--
-- =====================================================

-- =====================================================
-- STEP 1: Update Status Column Constraint
-- =====================================================

-- Drop existing constraint if it exists
DO $$ 
BEGIN
  -- Drop old constraint
  ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_status_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add new status constraint with all workflow statuses
ALTER TABLE public.properties
  ADD CONSTRAINT properties_status_check 
  CHECK (status IN ('draft', 'pending', 'approved', 'published', 'rejected', 'archived'));

-- Update default status to 'draft'
ALTER TABLE public.properties 
  ALTER COLUMN status SET DEFAULT 'draft';

-- =====================================================
-- STEP 2: Add is_archived Column (Optional)
-- =====================================================

-- Add is_archived boolean for quick filtering
-- (Alternative to checking status = 'archived')
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_properties_is_archived 
  ON public.properties(is_archived) WHERE is_archived = FALSE;

-- =====================================================
-- STEP 3: Migrate Existing Data
-- =====================================================

-- Update existing 'pending' listings to stay as 'pending' (already correct)
-- Update existing 'approved' listings to 'published' for public visibility
UPDATE public.properties 
SET status = 'published', is_archived = FALSE
WHERE status = 'approved';

-- Update existing 'inactive' listings to 'archived'
UPDATE public.properties 
SET status = 'archived', is_archived = TRUE
WHERE status = 'inactive';

-- Any other status values default to 'pending'
UPDATE public.properties 
SET status = 'pending', is_archived = FALSE
WHERE status NOT IN ('draft', 'pending', 'published', 'rejected', 'archived');

-- =====================================================
-- STEP 4: Update RLS Policies
-- =====================================================

-- Drop all existing properties policies
DROP POLICY IF EXISTS "properties_insert_authenticated" ON public.properties;
DROP POLICY IF EXISTS "properties_select_own" ON public.properties;
DROP POLICY IF EXISTS "properties_select_admin" ON public.properties;
DROP POLICY IF EXISTS "properties_select_public" ON public.properties;
DROP POLICY IF EXISTS "properties_update_own" ON public.properties;
DROP POLICY IF EXISTS "properties_update_admin" ON public.properties;
DROP POLICY IF EXISTS "properties_delete_own" ON public.properties;
DROP POLICY IF EXISTS "properties_delete_admin" ON public.properties;

-- =====================================================
-- SELECT POLICIES
-- =====================================================

-- 1. Public can view published (and not archived) listings
CREATE POLICY "properties_select_public" ON public.properties
  FOR SELECT USING (
    status = 'published' AND is_archived = FALSE
  );

-- 2. Advertisers can view their own listings (any status)
CREATE POLICY "properties_select_own" ON public.properties
  FOR SELECT USING (
    owner_id = auth.uid()
  );

-- 3. Admins can view ALL listings
CREATE POLICY "properties_select_admin" ON public.properties
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =====================================================
-- INSERT POLICIES
-- =====================================================

-- Advertisers can insert listings with owner_id = auth.uid()
-- Status will default to 'draft' (can only insert as draft or pending)
CREATE POLICY "properties_insert_authenticated" ON public.properties
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    owner_id = auth.uid() AND
    (status IN ('draft', 'pending') OR status IS NULL)
  );

-- =====================================================
-- UPDATE POLICIES
-- =====================================================

-- 1. Advertisers can update ONLY their own listings
--    AND ONLY when status is 'draft' or 'rejected'
--    AND cannot change status to approved/published/archived
CREATE POLICY "properties_update_own" ON public.properties
  FOR UPDATE 
  USING (
    owner_id = auth.uid() AND
    status IN ('draft', 'rejected')
  )
  WITH CHECK (
    owner_id = auth.uid() AND
    -- Prevent advertisers from setting status to approved/published/archived
    (status IN ('draft', 'pending', 'rejected') OR status IS NULL)
  );

-- 2. Admins can update ANY listing and change to any status
CREATE POLICY "properties_update_admin" ON public.properties
  FOR UPDATE 
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =====================================================
-- DELETE POLICIES
-- =====================================================

-- 1. Advertisers can delete their own listings
--    ONLY when status is 'draft' or 'rejected'
CREATE POLICY "properties_delete_own" ON public.properties
  FOR DELETE USING (
    owner_id = auth.uid() AND
    status IN ('draft', 'rejected')
  );

-- 2. Admins can delete ANY listing
CREATE POLICY "properties_delete_admin" ON public.properties
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =====================================================
-- STEP 5: Enhanced Status Protection Trigger
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS protect_property_status_trigger ON public.properties;
DROP FUNCTION IF EXISTS public.protect_property_status() CASCADE;

-- Create enhanced function to protect property updates
CREATE OR REPLACE FUNCTION public.protect_property_status()
RETURNS TRIGGER AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  is_admin := EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid());
  
  -- If user is admin, allow all changes
  IF is_admin THEN
    RETURN NEW;
  END IF;
  
  -- NON-ADMIN RESTRICTIONS:
  
  -- 1. Cannot update if status is pending/approved/published/archived
  IF OLD.status IN ('pending', 'approved', 'published', 'archived') THEN
    RAISE EXCEPTION 'Cannot modify listing after submission/approval. Status: %', OLD.status
      USING HINT = 'Only admins can modify listings with status: pending, approved, published, or archived';
  END IF;
  
  -- 2. Cannot change status to approved/published/archived
  IF NEW.status IN ('approved', 'published', 'archived') AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Only admins can approve, publish, or archive listings'
      USING HINT = 'Please submit your listing for review instead';
  END IF;
  
  -- 3. Sync is_archived with status
  IF NEW.status = 'archived' THEN
    NEW.is_archived := TRUE;
  ELSIF NEW.status IN ('draft', 'pending', 'approved', 'published', 'rejected') THEN
    NEW.is_archived := FALSE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on properties table
CREATE TRIGGER protect_property_status_trigger
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_property_status();

-- =====================================================
-- STEP 6: Add Comments for Documentation
-- =====================================================

COMMENT ON COLUMN public.properties.status IS 
  'Listing status: draft (editable), pending (under review), approved (admin approved), published (publicly visible), rejected (needs revision), archived (removed from public view)';

COMMENT ON COLUMN public.properties.is_archived IS 
  'Quick filter flag - TRUE when status is archived, FALSE otherwise';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify status constraint:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'properties' AND column_name = 'status';

-- Verify policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies 
-- WHERE tablename = 'properties'
-- ORDER BY cmd, policyname;

-- Verify trigger:
-- SELECT tgname, tgrelid::regclass, tgenabled
-- FROM pg_trigger
-- WHERE tgname = 'protect_property_status_trigger';

-- Test status distribution:
-- SELECT status, COUNT(*) as count, is_archived
-- FROM public.properties
-- GROUP BY status, is_archived
-- ORDER BY status;

-- =====================================================
-- IMPORTANT USAGE NOTES
-- =====================================================

-- ADVERTISER WORKFLOW:
-- 1. Create listing → status = 'draft' (can edit freely)
-- 2. Click "Submit for Review" → status = 'pending' (locked)
-- 3. Admin approves → status = 'published' (locked, publicly visible)
-- 4. Admin rejects → status = 'rejected' (can edit and resubmit)

-- ADMIN WORKFLOW:
-- 1. Review pending listings
-- 2. Approve → set status = 'published' (or 'approved' then 'published')
-- 3. Reject → set status = 'rejected', add rejection_reason
-- 4. Archive/Unpublish → set status = 'archived', is_archived = TRUE
-- 5. Can modify any listing regardless of status

-- =====================================================
-- END OF MIGRATION
-- =====================================================
