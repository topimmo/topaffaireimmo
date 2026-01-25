-- =====================================================
-- TRIGGER: Auto-send Facebook webhook when listing approved
-- Note: This trigger is for documentation only
-- Actual webhook is called from admin UI (src/lib/facebookWebhook.ts)
-- =====================================================

-- Function to track approval events (for future use)
CREATE OR REPLACE FUNCTION public.trigger_facebook_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only trigger on status change to 'approved' AND facebook_posted is false
  IF NEW.status = 'approved' 
     AND OLD.status != 'approved' 
     AND NEW.facebook_posted = FALSE THEN
    
    -- Log the approval event
    RAISE LOG 'Listing approved: % - Facebook webhook should be triggered by admin UI', NEW.id;
    
    -- NOTE: Actual webhook is called from admin UI via Edge Function
    -- This trigger is kept for audit trail and potential future automation
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_property_approved ON public.properties;
CREATE TRIGGER on_property_approved
  AFTER UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_facebook_webhook();

-- Add comment
COMMENT ON FUNCTION public.trigger_facebook_webhook() IS 
  'Logs approval events. Actual Facebook webhook is called from admin UI via Edge Function.';
