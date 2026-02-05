/**
 * Push Notification Utilities
 * 
 * Helper functions for managing web push notification subscriptions
 * Handles browser compatibility, permission requests, and subscription management
 */

import { supabase } from './supabase';

/**
 * Check if push notifications are supported by the browser
 */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission from user
 * Only call this in response to user interaction!
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[Push] Notifications not supported');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[Push] Permission result:', permission);
    return permission;
  } catch (error) {
    console.error('[Push] Error requesting permission:', error);
    return 'denied';
  }
}

/**
 * Convert base64 URL-safe string to Uint8Array
 * Required for VAPID public key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe to push notifications
 * Creates a push subscription and stores it in Supabase
 */
export async function subscribeToPushNotifications(
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if push is supported
    if (!isPushSupported()) {
      return { success: false, error: 'Push notifications not supported' };
    }

    // Check permission
    const permission = getNotificationPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission not granted' };
    }

    // Get VAPID public key from environment
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error('[Push] VAPID public key not configured');
      return { success: false, error: 'Push notifications not configured' };
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      console.log('[Push] New subscription created:', subscription);
    } else {
      console.log('[Push] Using existing subscription:', subscription);
    }

    // Extract subscription data
    const subscriptionJson = subscription.toJSON();
    if (!subscriptionJson.endpoint || !subscriptionJson.keys) {
      throw new Error('Invalid subscription data');
    }

    // Store subscription in Supabase
    const { error: dbError } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: userId || null,
          endpoint: subscriptionJson.endpoint,
          p256dh: subscriptionJson.keys.p256dh!,
          auth: subscriptionJson.keys.auth!,
          is_active: true,
        },
        {
          onConflict: 'endpoint',
        }
      );

    if (dbError) {
      console.error('[Push] Error storing subscription:', dbError);
      return { success: false, error: 'Failed to store subscription' };
    }

    console.log('[Push] Subscription stored successfully');
    return { success: true };

  } catch (error) {
    console.error('[Push] Error subscribing to notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Unsubscribe from push notifications
 * Removes the push subscription and marks it inactive in database
 */
export async function unsubscribeFromPushNotifications(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!isPushSupported()) {
      return { success: false, error: 'Push notifications not supported' };
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Get existing subscription
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log('[Push] No active subscription found');
      return { success: true };
    }

    // Unsubscribe from push service
    const unsubscribed = await subscription.unsubscribe();

    if (unsubscribed) {
      // Mark as inactive in database
      const subscriptionJson = subscription.toJSON();
      if (subscriptionJson.endpoint) {
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('endpoint', subscriptionJson.endpoint);
      }

      console.log('[Push] Unsubscribed successfully');
      return { success: true };
    } else {
      return { success: false, error: 'Failed to unsubscribe' };
    }

  } catch (error) {
    console.error('[Push] Error unsubscribing from notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if user has an active push subscription
 */
export async function hasActiveSubscription(): Promise<boolean> {
  try {
    if (!isPushSupported()) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    return subscription !== null;
  } catch (error) {
    console.error('[Push] Error checking subscription:', error);
    return false;
  }
}

/**
 * Get the current push subscription
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  try {
    if (!isPushSupported()) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('[Push] Error getting subscription:', error);
    return null;
  }
}
