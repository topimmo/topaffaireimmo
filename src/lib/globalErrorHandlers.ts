/**
 * Global Error Handlers
 * 
 * CRITICAL: React ErrorBoundaries do NOT catch:
 * - Event handlers
 * - Asynchronous code (setTimeout, promises, async/await)
 * - Server-side rendering errors
 * - Errors in the error boundary itself
 * 
 * This file sets up global handlers to catch these missed errors
 * and prevent the "Something went wrong" crash from unhandled promise rejections
 */

/**
 * Setup global error handlers
 * Must be called BEFORE React renders to catch all errors
 */
export function setupGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  // Track if we've already set up handlers (prevent duplicates in dev strict mode)
  if ((window as any).__globalErrorHandlersSetup) {
    return;
  }
  (window as any).__globalErrorHandlersSetup = true;

  console.log('[GlobalErrorHandlers] Setting up global error handlers');

  /**
   * Catch unhandled promise rejections
   * This is CRITICAL for auth errors in async callbacks like onAuthStateChange
   */
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const error = event.reason;
    
    // Check if this is an auth-related error
    const isAuthError = 
      error?.message?.toLowerCase().includes('refresh') ||
      error?.message?.toLowerCase().includes('auth') ||
      error?.message?.toLowerCase().includes('token') ||
      error?.message?.toLowerCase().includes('supabase');

    if (isAuthError) {
      console.error('[GlobalErrorHandlers] Unhandled auth promise rejection:', {
        message: error?.message || 'Unknown error',
        name: error?.name || 'Error',
        path: window.location.pathname,
        isAuthError: true
      });

      // Prevent the default behavior (which would crash the app)
      event.preventDefault();

      // Clear auth storage to prevent infinite loops
      try {
        const authKeys = [
          'topaffaireimmo-auth-token',
          'sb-auth-token',
          'supabase.auth.token',
        ];
        authKeys.forEach(key => {
          try {
            window.localStorage.removeItem(key);
          } catch (err) {
            // Ignore storage errors
          }
        });
        console.warn('[GlobalErrorHandlers] Auth storage cleared due to unhandled auth error');
      } catch (err) {
        console.error('[GlobalErrorHandlers] Failed to clear auth storage:', err);
      }

      // Reload to clear state (only if not already on login page)
      if (!window.location.pathname.includes('/login')) {
        console.warn('[GlobalErrorHandlers] Reloading to clear auth state...');
        window.setTimeout(() => {
          window.location.href = '/login?error=session_expired';
        }, 1000);
      }
    } else {
      // Log non-auth errors but let them through (handled by error boundary)
      console.error('[GlobalErrorHandlers] Unhandled promise rejection:', {
        message: error?.message || 'Unknown error',
        name: error?.name || 'Error',
        path: window.location.pathname,
        isAuthError: false
      });
      
      // Don't prevent default for non-auth errors - let ErrorBoundary catch them
      // event.preventDefault() would prevent ErrorBoundary from working
    }
  });

  /**
   * Catch global errors (backup for anything not caught by ErrorBoundary)
   */
  window.addEventListener('error', (event: ErrorEvent) => {
    const error = event.error;
    
    // Check if this is an auth-related error
    const isAuthError = 
      error?.message?.toLowerCase().includes('refresh') ||
      error?.message?.toLowerCase().includes('auth') ||
      error?.message?.toLowerCase().includes('token') ||
      error?.message?.toLowerCase().includes('supabase');

    console.error('[GlobalErrorHandlers] Global error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      path: window.location.pathname,
      isAuthError
    });

    // For auth errors, prevent propagation and handle gracefully
    if (isAuthError) {
      event.preventDefault();
      
      // Clear auth storage
      try {
        const authKeys = [
          'topaffaireimmo-auth-token',
          'sb-auth-token',
          'supabase.auth.token',
        ];
        authKeys.forEach(key => {
          try {
            window.localStorage.removeItem(key);
          } catch (err) {
            // Ignore storage errors
          }
        });
        console.warn('[GlobalErrorHandlers] Auth storage cleared due to global auth error');
      } catch (err) {
        console.error('[GlobalErrorHandlers] Failed to clear auth storage:', err);
      }

      // Redirect to login
      if (!window.location.pathname.includes('/login')) {
        console.warn('[GlobalErrorHandlers] Redirecting to login...');
        window.setTimeout(() => {
          window.location.href = '/login?error=session_expired';
        }, 1000);
      }
    }
    
    // For non-auth errors, let ErrorBoundary handle them
    // Don't call event.preventDefault() so React ErrorBoundary can catch them
  });

  console.log('[GlobalErrorHandlers] Global error handlers ready');
}

/**
 * Check if there's a stale auth token on startup
 * This helps prevent issues from cached tokens after deployments
 */
export function checkForStaleAuthToken(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const authKey = 'topaffaireimmo-auth-token';
    const authData = window.localStorage.getItem(authKey);
    
    if (!authData) return;

    const parsed = JSON.parse(authData);
    const expiresAt = parsed?.expires_at;

    if (!expiresAt) {
      console.warn('[GlobalErrorHandlers] Auth token missing expiry - may be stale');
      return;
    }

    const expiryDate = new Date(expiresAt * 1000);
    const now = new Date();

    if (expiryDate < now) {
      console.warn('[GlobalErrorHandlers] Auth token is expired, clearing storage');
      window.localStorage.removeItem(authKey);
    } else {
      console.log('[GlobalErrorHandlers] Auth token is valid, expires at:', expiryDate.toISOString());
    }
  } catch (error) {
    console.error('[GlobalErrorHandlers] Error checking auth token:', error);
  }
}
