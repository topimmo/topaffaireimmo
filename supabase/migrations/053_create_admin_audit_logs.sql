-- Migration: Create admin_audit_logs table for tracking admin actions
-- Description: Logs all admin operations (approve, reject, delete, feature, etc.)

-- Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'approve', 'reject', 'delete', 'feature', 'unfavorite', 'update', etc.
  entity_type TEXT NOT NULL, -- 'property', 'user', 'page', 'category', 'settings', etc.
  entity_id UUID, -- ID of the affected entity (nullable for bulk actions)
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional context (e.g., rejection_reason, old_value, new_value)
  
  CONSTRAINT valid_action CHECK (action IN ('approve', 'reject', 'delete', 'feature', 'unfeature', 'update', 'create', 'bulk_action')),
  CONSTRAINT valid_entity_type CHECK (entity_type IN ('property', 'user', 'page', 'category', 'settings', 'location', 'other'))
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_entity ON public.admin_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Policy: Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
    AND admin_id = auth.uid()
  );

-- Comment
COMMENT ON TABLE public.admin_audit_logs IS 'Tracks all admin actions for audit trail and compliance';
