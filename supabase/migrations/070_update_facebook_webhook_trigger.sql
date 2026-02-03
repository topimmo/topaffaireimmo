-- =====================================================
-- Migration 070: Update Facebook Webhook Trigger for Published Status
-- =====================================================
--
-- OBJECTIVE:
-- Update the Facebook webhook trigger to use 'published' status instead of 'approved'
-- to align with the new status workflow (draft → pending → published)
--
-- CONTEXT:
-- The Facebook webhook was checking for status='approved', but the new workflow
-- uses 'published' as the final approved state for public visibility.
--
-- =====================================================

-- Update the function to check for 'published' instead of 'approved'
CREATE OR REPLACE FUNCTION public.trigger_facebook_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only trigger on status change to 'published' AND facebook_posted is false
  IF NEW.status = 'published' 
     AND OLD.status != 'published' 
     AND NEW.facebook_posted = FALSE THEN
    
    -- Log the approval/publish event
    RAISE LOG 'Listing published: % - Facebook webhook should be triggered by admin UI', NEW.id;
    
    -- NOTE: Actual webhook is called from admin UI via Edge Function
    -- This trigger is kept for audit trail and potential future automation
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update comment
COMMENT ON FUNCTION public.trigger_facebook_webhook() IS 
  'Logs publish events (status=published). Actual Facebook webhook is called from admin UI via Edge Function.';

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Verify the trigger function was updated:
-- SELECT prosrc FROM pg_proc WHERE proname = 'trigger_facebook_webhook';
-- =====================================================
