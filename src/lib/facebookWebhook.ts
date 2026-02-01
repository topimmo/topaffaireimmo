// Facebook Webhook Service
// Handles sending approved listings to Make via Edge Function for Facebook posting

import { supabase } from './supabase';

interface FacebookWebhookResponse {
  success: boolean;
  message?: string;
  already_posted?: boolean;
  skipped?: boolean;
  error?: string;
  facebook_post_id?: string;
  status?: number;
  data?: any;
}

/**
 * Send a listing to Make for Facebook posting via Supabase Edge Function
 * This is called after admin approves a listing
 * 
 * @param listingId - The UUID of the approved listing
 * @returns Response from the Edge Function
 */
export async function sendFacebookWebhook(
  listingId: string
): Promise<FacebookWebhookResponse> {
  try {
    // Get the Supabase URL from environment
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      console.warn('Facebook webhook: VITE_SUPABASE_URL not configured');
      return {
        success: false,
        error: 'VITE_SUPABASE_URL not configured'
      };
    }

    // Build Edge Function URL
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-facebook-webhook`;

    // Get current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn('Facebook webhook: No active session');
      return {
        success: false,
        error: 'No active session'
      };
    }

    // Call Edge Function
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ listing_id: listingId }),
    });

    // Try to parse response JSON
    let result: any;
    try {
      result = await response.json();
    } catch (parseError) {
      console.warn('Facebook webhook: Failed to parse response JSON:', parseError);
      result = {};
    }

    if (!response.ok) {
      console.warn('Facebook webhook failed:', {
        status: response.status,
        statusText: response.statusText,
        data: result
      });
      return {
        success: false,
        status: response.status,
        data: result,
        error: result.error || `HTTP ${response.status}`
      };
    }

    return result;
  } catch (error) {
    console.warn('Facebook webhook error:', error);
    return {
      success: false,
      error: String(error)
    };
  }
}

/**
 * Retry posting a listing to Facebook
 * Used when initial posting failed
 * 
 * @param listingId - The UUID of the listing to retry
 */
export async function retryFacebookPost(listingId: string): Promise<FacebookWebhookResponse> {
  // Clear the facebook_posted flag to allow retry
  const { error: updateError } = await supabase
    .from('properties')
    .update({ 
      facebook_posted: false,
      facebook_post_error: null 
    })
    .eq('id', listingId);

  if (updateError) {
    console.warn('Failed to reset listing for retry:', updateError);
    return {
      success: false,
      error: `Failed to reset listing: ${updateError.message}`
    };
  }

  // Now send the webhook
  return sendFacebookWebhook(listingId);
}
