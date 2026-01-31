-- Migration: Create admin_notifications table
-- Description: Store notifications for admins (new listings, reports, system alerts)

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ, -- NULL if unread, timestamp when marked as read
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for all admins, specific ID for targeted notification
  link TEXT, -- Optional URL to navigate to
  notification_type TEXT DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
  
  CONSTRAINT valid_notification_type CHECK (notification_type IN ('info', 'warning', 'success', 'error'))
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_notifications_user_id ON public.admin_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read_at ON public.admin_notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read their notifications (user_id = auth.uid() OR user_id IS NULL for broadcast)
CREATE POLICY "Admins can read their notifications"
  ON public.admin_notifications
  FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

-- Policy: Admins can update their own notifications (mark as read)
CREATE POLICY "Admins can update their notifications"
  ON public.admin_notifications
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
    AND (user_id = auth.uid() OR user_id IS NULL)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

-- Policy: Only admins can insert notifications
CREATE POLICY "Admins can insert notifications"
  ON public.admin_notifications
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Comment
COMMENT ON TABLE public.admin_notifications IS 'Notifications for admin users about new listings, reports, and system events';
