// Facebook Webhook Service
// Handles sending approved listings to Make via Edge Function for Facebook posting

import { supabase } from './supabase';

interface FacebookWebhookResponse {
  success: boolean;
  message: string;
  already_posted?: boolean;
  skipped?: boolean;
  error?: string;
  facebook_post_id?: string;
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
      throw new Error('VITE_SUPABASE_URL not configured');
    }

    // Build Edge Function URL
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-facebook-webhook`;

    // Get current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
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

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    return result;
  } catch (error) {
    console.warn('Error sending Facebook webhook:', error);
    throw error;
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
    throw new Error(`Failed to reset listing: ${updateError.message}`);
  }

  // Now send the webhook
  return sendFacebookWebhook(listingId);
}
