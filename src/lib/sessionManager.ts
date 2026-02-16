/**
 * Session Manager Utility
 * 
 * Handles session cleanup, refresh, and validation
 */

import { supabase } from './supabase';

/**
 * Clear invalid or expired auth tokens from localStorage
 */
export function clearInvalidAuthTokens(): void {
  if (typeof window === 'undefined') return;

  try {
    // Check if localStorage is available
    if (!window.localStorage) return;

    // Get the storage key from supabase config
    const storageKey = 'topaffaireimmo-auth-token';
    
    // Remove the auth token
    window.localStorage.removeItem(storageKey);
    
    console.log('[SessionManager] Cleared auth tokens from localStorage');
  } catch (error) {
    console.warn('[SessionManager] Failed to clear tokens:', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Check if the current session is valid
 */
export async function isSessionValid(): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[SessionManager] Session check error:', error.message);
      return false;
    }

    if (!session) {
      console.log('[SessionManager] No active session');
      return false;
    }

    // Check if session is expired
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      if (now >= expiresAt) {
        console.warn('[SessionManager] Session expired');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('[SessionManager] Exception checking session:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * Refresh the current session
 */
export async function refreshSession(): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('[SessionManager] Session refresh error:', error.message);
      
      // If refresh fails due to invalid token, clear storage
      if (error.message.includes('invalid') || error.message.includes('expired')) {
        console.log('[SessionManager] Clearing invalid session');
        clearInvalidAuthTokens();
      }
      
      return false;
    }

    if (!session) {
      console.warn('[SessionManager] Refresh returned no session');
      return false;
    }

    console.log('[SessionManager] Session refreshed successfully');
    return true;
  } catch (error) {
    console.error('[SessionManager] Exception refreshing session:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * Validate and refresh session if needed
 * Call this on app startup or before critical operations
 */
export async function validateAndRefreshSession(): Promise<{
  valid: boolean;
  refreshed: boolean;
}> {
  const isValid = await isSessionValid();
  
  if (isValid) {
    return { valid: true, refreshed: false };
  }

  // Try to refresh
  const refreshed = await refreshSession();
  
  return {
    valid: refreshed,
    refreshed,
  };
}

/**
 * Clear all session data and sign out
 */
export async function clearSession(): Promise<void> {
  try {
    if (supabase) {
      await supabase.auth.signOut();
    }
    
    clearInvalidAuthTokens();
    
    console.log('[SessionManager] Session cleared');
  } catch (error) {
    console.error('[SessionManager] Error clearing session:', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Check and cleanup service workers (PWA remnants)
 */
export async function cleanupServiceWorkers(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    if (registrations.length === 0) {
      console.log('[SessionManager] No service workers found');
      return;
    }

    console.log(`[SessionManager] Found ${registrations.length} service worker(s), unregistering...`);
    
    for (const registration of registrations) {
      await registration.unregister();
    }
    
    console.log('[SessionManager] All service workers unregistered');
  } catch (error) {
    console.warn('[SessionManager] Failed to cleanup service workers:', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Initialize session manager
 * Call this once on app startup
 */
export async function initSessionManager(): Promise<void> {
  console.log('[SessionManager] Initializing...');
  
  // Cleanup any service workers
  await cleanupServiceWorkers();
  
  // Validate session
  const { valid, refreshed } = await validateAndRefreshSession();
  
  if (!valid) {
    console.log('[SessionManager] No valid session, user needs to sign in');
  } else if (refreshed) {
    console.log('[SessionManager] Session was refreshed');
  } else {
    console.log('[SessionManager] Session is valid');
  }
  
  console.log('[SessionManager] Initialization complete');
}
