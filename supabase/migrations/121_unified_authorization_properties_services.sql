-- =====================================================
-- Migration 121: Unified Authorization for Properties & Services
-- =====================================================
-- Purpose: Implement consistent authorization and moderation for both
--          properties and artisan_services tables
-- 
-- Changes:
-- 1. Verify/enhance RPC permission functions (is_admin, can_approve_*)
-- 2. Add moderation fields to artisan_services table
-- 3. Update RLS policies for artisan_services with admin moderation
-- 4. Create moderation RPC functions for artisan_services
-- 5. Ensure consistent status workflow for both resources
-- 6. Add performance indexes
-- =====================================================

-- =====================================================
-- PART 1: VERIFY AND ENHANCE ADMIN RPC FUNCTIONS
-- =====================================================

-- is_admin() already exists from migration 120, verify it works
-- This is the SINGLE SOURCE OF TRUTH for admin status

-- Create wrapper functions for specific permissions
CREATE OR REPLACE FUNCTION public.can_approve_properties()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Properties approval requires active admin status
  SELECT public.is_admin();
$$;

COMMENT ON FUNCTION public.can_approve_properties IS 
  'Returns TRUE if current user can approve/reject properties. 
   Currently same as is_admin() but allows for future granular permissions.';

GRANT EXECUTE ON FUNCTION public.can_approve_properties() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_approve_properties() TO anon;

CREATE OR REPLACE FUNCTION public.can_approve_services()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Services approval requires active admin status
  SELECT public.is_admin();
$$;

COMMENT ON FUNCTION public.can_approve_services IS 
  'Returns TRUE if current user can approve/reject artisan services. 
   Currently same as is_admin() but allows for future granular permissions.';

GRANT EXECUTE ON FUNCTION public.can_approve_services() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_approve_services() TO anon;

-- Generic permission checker function (for future extensibility)
CREATE OR REPLACE FUNCTION public.has_permission(permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Currently all permissions require admin status
  -- Future: could check a permissions table for granular access control
  
  CASE permission_key
    WHEN 'approve_properties' THEN
      RETURN public.is_admin();
    WHEN 'approve_services' THEN
      RETURN public.is_admin();
    WHEN 'manage_users' THEN
      RETURN public.is_admin();
    WHEN 'view_analytics' THEN
      RETURN public.is_admin();
    ELSE
      -- Unknown permission defaults to deny
      RETURN FALSE;
  END CASE;
END;
$$;

COMMENT ON FUNCTION public.has_permission IS 
  'Generic permission checker. Pass permission_key like "approve_properties", "approve_services", etc.
   Returns TRUE if current user has the specified permission.
   Future: can be extended with a permissions table for role-based access control.';

GRANT EXECUTE ON FUNCTION public.has_permission(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(TEXT) TO anon;

-- =====================================================
-- PART 2: ADD MODERATION FIELDS TO ARTISAN_SERVICES
-- =====================================================

-- Add status column with workflow states (similar to properties)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artisan_services' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.artisan_services 
      ADD COLUMN status TEXT DEFAULT 'pending' NOT NULL
      CHECK (status IN ('pending', 'approved', 'rejected', 'inactive'));
    
    RAISE NOTICE '✓ Added status column to artisan_services';
  ELSE
    RAISE NOTICE 'ℹ status column already exists in artisan_services';
  END IF;
END $$;

-- Add approved_at timestamp
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artisan_services' 
    AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE public.artisan_services 
      ADD COLUMN approved_at TIMESTAMPTZ;
    
    RAISE NOTICE '✓ Added approved_at column to artisan_services';
  ELSE
    RAISE NOTICE 'ℹ approved_at column already exists';
  END IF;
END $$;

-- Add approved_by reference to admin
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artisan_services' 
    AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE public.artisan_services 
      ADD COLUMN approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✓ Added approved_by column to artisan_services';
  ELSE
    RAISE NOTICE 'ℹ approved_by column already exists';
  END IF;
END $$;

-- Add rejected_at timestamp
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artisan_services' 
    AND column_name = 'rejected_at'
  ) THEN
    ALTER TABLE public.artisan_services 
      ADD COLUMN rejected_at TIMESTAMPTZ;
    
    RAISE NOTICE '✓ Added rejected_at column to artisan_services';
  ELSE
    RAISE NOTICE 'ℹ rejected_at column already exists';
  END IF;
END $$;

-- Add rejected_by reference to admin
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artisan_services' 
    AND column_name = 'rejected_by'
  ) THEN
    ALTER TABLE public.artisan_services 
      ADD COLUMN rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✓ Added rejected_by column to artisan_services';
  ELSE
    RAISE NOTICE 'ℹ rejected_by column already exists';
  END IF;
END $$;

-- Add moderated_at timestamp (updated on any moderation action)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artisan_services' 
    AND column_name = 'moderated_at'
  ) THEN
    ALTER TABLE public.artisan_services 
      ADD COLUMN moderated_at TIMESTAMPTZ;
    
    RAISE NOTICE '✓ Added moderated_at column to artisan_services';
  ELSE
    RAISE NOTICE 'ℹ moderated_at column already exists';
  END IF;
END $$;

-- Add moderated_by reference to admin
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artisan_services' 
    AND column_name = 'moderated_by'
  ) THEN
    ALTER TABLE public.artisan_services 
      ADD COLUMN moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✓ Added moderated_by column to artisan_services';
  ELSE
    RAISE NOTICE 'ℹ moderated_by column already exists';
  END IF;
END $$;

-- Add rejection_reason text field
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artisan_services' 
    AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE public.artisan_services 
      ADD COLUMN rejection_reason TEXT;
    
    RAISE NOTICE '✓ Added rejection_reason column to artisan_services';
  ELSE
    RAISE NOTICE 'ℹ rejection_reason column already exists';
  END IF;
END $$;

-- Add column comments for documentation
COMMENT ON COLUMN public.artisan_services.status IS 
  'Service status: pending (awaiting review), approved (admin approved), rejected (needs revision), inactive (disabled by owner or admin)';
COMMENT ON COLUMN public.artisan_services.approved_at IS 
  'Timestamp when service was approved by admin';
COMMENT ON COLUMN public.artisan_services.approved_by IS 
  'Admin user ID who approved the service';
COMMENT ON COLUMN public.artisan_services.rejected_at IS 
  'Timestamp when service was rejected by admin';
COMMENT ON COLUMN public.artisan_services.rejected_by IS 
  'Admin user ID who rejected the service';
COMMENT ON COLUMN public.artisan_services.moderated_at IS 
  'Timestamp when service was last moderated (approved or rejected)';
COMMENT ON COLUMN public.artisan_services.moderated_by IS 
  'Admin user ID who last moderated the service';
COMMENT ON COLUMN public.artisan_services.rejection_reason IS 
  'Reason provided by admin when rejecting the service';

-- =====================================================
-- PART 3: ADD PERFORMANCE INDEXES
-- =====================================================

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_artisan_services_status 
  ON public.artisan_services(status);

-- Index on approved_at for sorting
CREATE INDEX IF NOT EXISTS idx_artisan_services_approved_at 
  ON public.artisan_services(approved_at) WHERE approved_at IS NOT NULL;

-- Index on moderated_at for admin dashboard
CREATE INDEX IF NOT EXISTS idx_artisan_services_moderated_at 
  ON public.artisan_services(moderated_at) WHERE moderated_at IS NOT NULL;

-- Drop invalid index if it exists (city column may not exist in production)
DROP INDEX IF EXISTS public.idx_artisan_services_status_city;

-- Composite index for common queries (approved services by creation date)
CREATE INDEX IF NOT EXISTS idx_artisan_services_status_created 
  ON public.artisan_services(status, created_at) WHERE status = 'approved';

-- Composite index for admin moderation queue
CREATE INDEX IF NOT EXISTS idx_artisan_services_pending 
  ON public.artisan_services(status, created_at) WHERE status = 'pending';

-- =====================================================
-- PART 4: UPDATE RLS POLICIES FOR ARTISAN_SERVICES
-- =====================================================

-- Drop existing policies to recreate with moderation support
DROP POLICY IF EXISTS "Public can read active artisan services" ON public.artisan_services;
DROP POLICY IF EXISTS "Artisans can read own services" ON public.artisan_services;
DROP POLICY IF EXISTS "Artisans can insert own services" ON public.artisan_services;
DROP POLICY IF EXISTS "Artisans can update own services" ON public.artisan_services;
DROP POLICY IF EXISTS "Artisans can delete own services" ON public.artisan_services;
DROP POLICY IF EXISTS "Admins can manage all artisan services" ON public.artisan_services;

-- SELECT POLICIES

-- 1. Public can read APPROVED services (changed from is_active to status)
CREATE POLICY "artisan_services_select_public" ON public.artisan_services
  FOR SELECT USING (
    status = 'approved'
  );

-- 2. Artisans can read their own services (any status)
CREATE POLICY "artisan_services_select_own" ON public.artisan_services
  FOR SELECT USING (
    auth.uid() = artisan_id
  );

-- 3. Admins can read ALL services
CREATE POLICY "artisan_services_select_admin" ON public.artisan_services
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE)
  );

-- INSERT POLICIES

-- Artisans can insert their own services (status defaults to 'pending')
CREATE POLICY "artisan_services_insert_own" ON public.artisan_services
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = artisan_id AND
    -- New services must start as pending or can be marked inactive by owner
    status IN ('pending', 'inactive')
  );

-- UPDATE POLICIES

-- 1. Artisans can update their own services (but NOT moderation fields)
CREATE POLICY "artisan_services_update_own" ON public.artisan_services
  FOR UPDATE 
  USING (
    auth.uid() = artisan_id
  )
  WITH CHECK (
    auth.uid() = artisan_id AND
    -- Cannot change status to approved (only admin can do this)
    -- Can change from pending to inactive or vice versa
    status IN ('pending', 'inactive')
  );

-- 2. Admins can update ANY service and change to any status
CREATE POLICY "artisan_services_update_admin" ON public.artisan_services
  FOR UPDATE 
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE)
  );

-- DELETE POLICIES

-- 1. Artisans can delete their own services (only if pending or rejected)
CREATE POLICY "artisan_services_delete_own" ON public.artisan_services
  FOR DELETE USING (
    auth.uid() = artisan_id AND
    status IN ('pending', 'rejected', 'inactive')
  );

-- 2. Admins can delete ANY service
CREATE POLICY "artisan_services_delete_admin" ON public.artisan_services
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE)
  );

-- =====================================================
-- PART 5: CREATE TRIGGER TO PROTECT MODERATION FIELDS
-- =====================================================

-- Create function to prevent non-admins from modifying moderation fields
CREATE OR REPLACE FUNCTION public.protect_artisan_service_moderation()
RETURNS TRIGGER AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  v_is_admin := EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = TRUE
  );
  
  -- If user is admin, allow all changes
  IF v_is_admin THEN
    RETURN NEW;
  END IF;
  
  -- NON-ADMIN RESTRICTIONS:
  
  -- Prevent changing status to 'approved' (only admin can approve)
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    RAISE EXCEPTION 'Only admins can approve services'
      USING HINT = 'Services are automatically submitted for review';
  END IF;
  
  -- Prevent modifying moderation fields
  IF (OLD.approved_at IS DISTINCT FROM NEW.approved_at) OR
     (OLD.approved_by IS DISTINCT FROM NEW.approved_by) OR
     (OLD.rejected_at IS DISTINCT FROM NEW.rejected_at) OR
     (OLD.rejected_by IS DISTINCT FROM NEW.rejected_by) OR
     (OLD.moderated_at IS DISTINCT FROM NEW.moderated_at) OR
     (OLD.moderated_by IS DISTINCT FROM NEW.moderated_by) OR
     (OLD.rejection_reason IS DISTINCT FROM NEW.rejection_reason) THEN
    
    -- Silently revert moderation field changes
    NEW.approved_at := OLD.approved_at;
    NEW.approved_by := OLD.approved_by;
    NEW.rejected_at := OLD.rejected_at;
    NEW.rejected_by := OLD.rejected_by;
    NEW.moderated_at := OLD.moderated_at;
    NEW.moderated_by := OLD.moderated_by;
    NEW.rejection_reason := OLD.rejection_reason;
    
    RAISE NOTICE 'Moderation field changes prevented - only admins can modify these fields';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on artisan_services table
DROP TRIGGER IF EXISTS protect_artisan_service_moderation_trigger ON public.artisan_services;
CREATE TRIGGER protect_artisan_service_moderation_trigger
  BEFORE UPDATE ON public.artisan_services
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_artisan_service_moderation();

COMMENT ON FUNCTION public.protect_artisan_service_moderation IS 
  'Trigger function to prevent non-admins from modifying service moderation fields';

-- =====================================================
-- PART 6: CREATE MODERATION RPC FUNCTIONS
-- =====================================================

-- NOTE: These functions check for the existence of notifications and admin_audit_logs tables
--       before attempting to insert into them. This ensures the migration works even if those
--       tables don't exist yet (though they should exist from earlier migrations).
--       Future optimization: Consider creating a helper function to reduce code duplication.

-- Approve artisan service
CREATE OR REPLACE FUNCTION public.approve_artisan_service(service_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service RECORD;
  v_admin_id UUID;
BEGIN
  -- Check if user is admin
  SELECT user_id INTO v_admin_id
  FROM public.admins
  WHERE user_id = auth.uid() AND is_active = TRUE;
  
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only active admins can approve services';
  END IF;
  
  -- Get service details
  SELECT * INTO v_service
  FROM public.artisan_services
  WHERE id = service_id;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found';
  END IF;
  
  -- Update service status
  UPDATE public.artisan_services
  SET status = 'approved',
      approved_at = NOW(),
      approved_by = v_admin_id,
      moderated_at = NOW(),
      moderated_by = v_admin_id,
      -- Clear rejection fields if previously rejected
      rejected_at = NULL,
      rejected_by = NULL,
      rejection_reason = NULL
  WHERE id = service_id;
  
  -- Create notification for service owner (if notifications table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      v_service.artisan_id,
      'artisan_verification',
      'Service Approved',
      'Your service has been approved and is now visible to clients.',
      jsonb_build_object(
        'service_id', service_id, 
        'status', 'approved',
        'subcategory_id', v_service.subcategory_id
      )
    );
  END IF;
  
  -- Log audit (if audit table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit_logs') THEN
    INSERT INTO public.admin_audit_logs (admin_id, action_type, target_type, target_id, metadata)
    VALUES (
      v_admin_id,
      'approve',
      'artisan_service',
      service_id,
      jsonb_build_object('previous_status', v_service.status)
    );
  END IF;
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.approve_artisan_service IS 
  'Approve an artisan service listing (admin only). Sets status to approved and updates moderation timestamps.';

GRANT EXECUTE ON FUNCTION public.approve_artisan_service(UUID) TO authenticated;

-- Reject artisan service
CREATE OR REPLACE FUNCTION public.reject_artisan_service(service_id UUID, reason TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service RECORD;
  v_admin_id UUID;
BEGIN
  -- Check if user is admin
  SELECT user_id INTO v_admin_id
  FROM public.admins
  WHERE user_id = auth.uid() AND is_active = TRUE;
  
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only active admins can reject services';
  END IF;
  
  -- Validate reason
  IF reason IS NULL OR LENGTH(TRIM(reason)) < 10 THEN
    RAISE EXCEPTION 'Rejection reason must be at least 10 characters';
  END IF;
  
  -- Get service details
  SELECT * INTO v_service
  FROM public.artisan_services
  WHERE id = service_id;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found';
  END IF;
  
  -- Update service status
  UPDATE public.artisan_services
  SET status = 'rejected',
      rejected_at = NOW(),
      rejected_by = v_admin_id,
      rejection_reason = reason,
      moderated_at = NOW(),
      moderated_by = v_admin_id,
      -- Clear approval fields if previously approved
      approved_at = NULL,
      approved_by = NULL
  WHERE id = service_id;
  
  -- Create notification for service owner (if notifications table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      v_service.artisan_id,
      'artisan_verification',
      'Service Rejected',
      'Your service has been rejected. Reason: ' || reason,
      jsonb_build_object(
        'service_id', service_id, 
        'status', 'rejected',
        'reason', reason,
        'subcategory_id', v_service.subcategory_id
      )
    );
  END IF;
  
  -- Log audit (if audit table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit_logs') THEN
    INSERT INTO public.admin_audit_logs (admin_id, action_type, target_type, target_id, metadata)
    VALUES (
      v_admin_id,
      'reject',
      'artisan_service',
      service_id,
      jsonb_build_object('previous_status', v_service.status, 'reason', reason)
    );
  END IF;
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.reject_artisan_service IS 
  'Reject an artisan service listing with reason (admin only). Sets status to rejected and stores rejection reason.';

GRANT EXECUTE ON FUNCTION public.reject_artisan_service(UUID, TEXT) TO authenticated;

-- Submit service for review (artisan function)
CREATE OR REPLACE FUNCTION public.submit_artisan_service_for_review(service_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service RECORD;
BEGIN
  -- Get service details - must be owned by current user
  SELECT * INTO v_service
  FROM public.artisan_services
  WHERE id = service_id
    AND artisan_id = auth.uid();
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found or access denied';
  END IF;
  
  -- Only inactive or rejected services can be submitted
  IF v_service.status NOT IN ('inactive', 'rejected') THEN
    RAISE EXCEPTION 'Only inactive or rejected services can be submitted for review. Current status: %', v_service.status;
  END IF;
  
  -- Update status to pending
  UPDATE public.artisan_services
  SET status = 'pending',
      updated_at = NOW()
  WHERE id = service_id;
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.submit_artisan_service_for_review IS 
  'Submit an artisan service for admin review. Changes status from inactive/rejected to pending.';

GRANT EXECUTE ON FUNCTION public.submit_artisan_service_for_review(UUID) TO authenticated;

-- =====================================================
-- PART 7: MIGRATE EXISTING DATA
-- =====================================================

-- Update existing artisan_services records
-- The artisan_services table already has is_active column (from migration 100)
-- We need to migrate existing data to use the new status field
-- Convert is_active=TRUE to status='approved' (backward compatible: assume active services were approved)
-- Convert is_active=FALSE to status='inactive'
-- NOTE: We set approved_at to created_at for migrated records, but leave approved_by as NULL
--       to indicate these are legacy records that were migrated without full approval metadata

UPDATE public.artisan_services
SET status = CASE 
  WHEN is_active = TRUE THEN 'approved'
  WHEN is_active = FALSE THEN 'inactive'
  ELSE 'pending'
END,
-- For backward compatibility, set approved_at for previously active services
-- approved_by remains NULL to indicate legacy data without full audit trail
approved_at = CASE WHEN is_active = TRUE THEN created_at ELSE NULL END
WHERE TRUE; -- Update all existing records to migrate from is_active to status

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify columns were added
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'artisan_services' 
  AND column_name IN (
    'status', 'approved_at', 'approved_by', 
    'rejected_at', 'rejected_by', 
    'moderated_at', 'moderated_by', 'rejection_reason'
  );
  
  IF column_count = 8 THEN
    RAISE NOTICE '✓ All 8 moderation columns added to artisan_services';
  ELSE
    RAISE WARNING '⚠ Expected 8 columns, found %', column_count;
  END IF;
END $$;

-- Verify indexes were created
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND tablename = 'artisan_services'
  AND indexname LIKE 'idx_artisan_services_%';
  
  RAISE NOTICE 'ℹ Created % indexes on artisan_services', index_count;
END $$;

-- Verify RLS policies
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'artisan_services';
  
  IF policy_count >= 8 THEN
    RAISE NOTICE '✓ RLS policies created for artisan_services (%)', policy_count;
  ELSE
    RAISE WARNING '⚠ Expected at least 8 policies, found %', policy_count;
  END IF;
END $$;

-- Verify RPC functions were created
DO $$
DECLARE
  function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN (
    'can_approve_properties',
    'can_approve_services',
    'has_permission',
    'approve_artisan_service',
    'reject_artisan_service',
    'submit_artisan_service_for_review'
  );
  
  IF function_count = 6 THEN
    RAISE NOTICE '✓ All 6 RPC functions created';
  ELSE
    RAISE WARNING '⚠ Expected 6 functions, found %', function_count;
  END IF;
END $$;

-- Display summary
DO $$
DECLARE
  total_services INTEGER;
  approved_services INTEGER;
  pending_services INTEGER;
  rejected_services INTEGER;
  inactive_services INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_services FROM public.artisan_services;
  SELECT COUNT(*) INTO approved_services FROM public.artisan_services WHERE status = 'approved';
  SELECT COUNT(*) INTO pending_services FROM public.artisan_services WHERE status = 'pending';
  SELECT COUNT(*) INTO rejected_services FROM public.artisan_services WHERE status = 'rejected';
  SELECT COUNT(*) INTO inactive_services FROM public.artisan_services WHERE status = 'inactive';
  
  RAISE NOTICE '=== ARTISAN SERVICES STATUS SUMMARY ===';
  RAISE NOTICE 'Total: %', total_services;
  RAISE NOTICE 'Approved: % (%)', approved_services, 
    CASE WHEN total_services > 0 THEN ROUND(approved_services::NUMERIC / total_services * 100, 1) || '%' ELSE '0%' END;
  RAISE NOTICE 'Pending: % (%)', pending_services,
    CASE WHEN total_services > 0 THEN ROUND(pending_services::NUMERIC / total_services * 100, 1) || '%' ELSE '0%' END;
  RAISE NOTICE 'Rejected: %', rejected_services;
  RAISE NOTICE 'Inactive: %', inactive_services;
END $$;

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================

/*
After this migration:

1. ADMIN STATUS (Single Source of Truth):
   - Determined ONLY by public.admins table with is_active = TRUE
   - Never use profiles.user_role or profiles.is_admin

2. PERMISSION FUNCTIONS:
   - is_admin() - Core admin check (from migration 120)
   - can_approve_properties() - Permission for property moderation
   - can_approve_services() - Permission for service moderation
   - has_permission(key) - Generic permission checker

3. PROPERTIES MODERATION (already existed):
   - RPC: approve_property(id), reject_property(id, reason)
   - Status workflow: draft → pending → approved/rejected
   - Moderation fields: approved_at, approved_by, rejected_at, rejected_by, moderated_at, moderated_by, rejection_reason

4. SERVICES MODERATION (NEW):
   - RPC: approve_artisan_service(id), reject_artisan_service(id, reason), submit_artisan_service_for_review(id)
   - Status workflow: pending → approved/rejected, inactive → pending
   - Same moderation fields as properties

5. AUTHORIZATION PATTERN:
   - Owners can INSERT their own records (default status: pending)
   - Owners can UPDATE/DELETE only their own records
   - Owners CANNOT modify moderation fields (enforced by trigger)
   - Admins can approve/reject any record
   - Admins can update moderation fields
   - Non-admins blocked from admin operations (RLS + triggers)

6. STATUS WORKFLOW (consistent for both):
   - pending: Default on insert, awaiting admin review
   - approved: Admin approved, sets approved_at + approved_by
   - rejected: Admin rejected, sets rejected_at + rejected_by + rejection_reason
   - moderated_at + moderated_by: Updated on ANY moderation action
   - inactive: Owner or admin disabled

7. FRONTEND USAGE:
   - Use useAdmin() hook to check admin status
   - Use RequireAdmin component for admin routes
   - Call RPC functions for moderation actions
   - Handle forbidden responses gracefully

8. TO GRANT ADMIN ACCESS:
   INSERT INTO public.admins (user_id, is_active, role)
   VALUES ('user-uuid-here', TRUE, 'admin');

9. TO REVOKE ADMIN ACCESS:
   UPDATE public.admins SET is_active = FALSE WHERE user_id = 'user-uuid';
*/

-- =====================================================
-- END OF MIGRATION
-- =====================================================
