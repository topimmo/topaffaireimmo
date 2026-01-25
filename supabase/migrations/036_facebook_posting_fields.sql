-- =====================================================
-- FACEBOOK AUTO-PUBLISH AFTER APPROVAL
-- Migration to add fields for Facebook posting via Make webhook
-- =====================================================

-- Add new fields to properties table
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS facebook_posted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS facebook_posted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS facebook_post_id TEXT,
  ADD COLUMN IF NOT EXISTS facebook_post_error TEXT,
  ADD COLUMN IF NOT EXISTS share_token TEXT;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_properties_facebook_posted ON public.properties(facebook_posted);
CREATE INDEX IF NOT EXISTS idx_properties_approved_at ON public.properties(approved_at);

-- Add comment for documentation
COMMENT ON COLUMN public.properties.approved_at IS 'Timestamp when listing was approved by admin';
COMMENT ON COLUMN public.properties.approved_by IS 'Admin user ID who approved the listing';
COMMENT ON COLUMN public.properties.published_at IS 'Timestamp when listing was published';
COMMENT ON COLUMN public.properties.facebook_posted IS 'Whether listing has been posted to Facebook (idempotency flag)';
COMMENT ON COLUMN public.properties.facebook_posted_at IS 'Timestamp when posted to Facebook';
COMMENT ON COLUMN public.properties.facebook_post_id IS 'Facebook post ID returned by Make';
COMMENT ON COLUMN public.properties.facebook_post_error IS 'Last error message if Facebook posting failed';
COMMENT ON COLUMN public.properties.share_token IS 'Optional share token for public listing URL';
