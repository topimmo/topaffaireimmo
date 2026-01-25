-- =====================================================
-- TRIGGER: Auto-send Facebook webhook when listing approved
-- Calls Edge Function when status changes from pending -> approved
-- =====================================================

-- Function to call Edge Function via pg_net extension
CREATE OR REPLACE FUNCTION public.trigger_facebook_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_url TEXT;
  edge_function_url TEXT;
  payload JSONB;
BEGIN
  -- Only trigger on status change to 'approved' AND facebook_posted is false
  IF NEW.status = 'approved' 
     AND OLD.status != 'approved' 
     AND NEW.facebook_posted = FALSE THEN
    
    -- Build Edge Function URL
    -- In production, this should be: https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-facebook-webhook
    edge_function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-facebook-webhook';
    
    -- Log the trigger
    RAISE LOG 'Triggering Facebook webhook for listing: %', NEW.id;
    
    -- Prepare payload
    payload := jsonb_build_object(
      'listing_id', NEW.id
    );
    
    -- Call Edge Function asynchronously using pg_net (if available)
    -- If pg_net is not available, this will need to be called from application code
    -- For now, we'll rely on the admin UI to call the Edge Function directly
    -- This trigger serves as documentation of the intended behavior
    
    -- Alternative: Use supabase_functions.http_post if available
    -- PERFORM supabase_functions.http_post(
    --   url := edge_function_url,
    --   body := payload
    -- );
    
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
  'Trigger function to call Edge Function when listing is approved. ' ||
  'Edge Function will send webhook to Make for Facebook posting.';
