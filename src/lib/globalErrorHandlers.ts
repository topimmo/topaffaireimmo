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

// Track redirects to prevent infinite loops
let redirectAttempts = 0;
const MAX_REDIRECT_ATTEMPTS = 3;
const REDIRECT_RESET_TIMEOUT = 60000; // Reset counter after 1 minute

/**
 * PRODUCTION-SAFE: Client error reporting payload
 */
interface ClientErrorPayload {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  type: 'error' | 'unhandledrejection';
  isAuthRelated: boolean;
  path: string;
  buildVersion?: string;
}

/**
 * PRODUCTION-SAFE: Send client error to backend API
 * Never throws - all errors are silently caught
 * POST to /api/client-error with error details
 */
async function sendClientError(payload: ClientErrorPayload): Promise<void> {
  try {
    // Only send errors in production or if explicitly enabled in dev
    if (import.meta.env.DEV && !import.meta.env.VITE_ENABLE_ERROR_REPORTING) {
      console.log('[GlobalErrorHandlers] Error reporting disabled in DEV');
      return;
    }

    // Add build version if available from meta tag
    try {
      const buildTimestamp = document.querySelector('meta[name="build-timestamp"]')?.getAttribute('content');
      if (buildTimestamp) {
        payload.buildVersion = buildTimestamp;
      }
    } catch (e) {
      // Ignore meta tag errors
    }

    // Send to API endpoint with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    await fetch('/api/client-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (import.meta.env.DEV) {
      console.log('[GlobalErrorHandlers] Error reported successfully');
    }
  } catch (error) {
    // CRITICAL: Never throw from error reporting
    // Silently fail to prevent cascading errors
    if (import.meta.env.DEV) {
      console.warn('[GlobalErrorHandlers] Failed to send error report (non-critical):', error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

/**
 * Reset redirect counter after timeout
 */
function resetRedirectCounter() {
  setTimeout(() => {
    redirectAttempts = 0;
  }, REDIRECT_RESET_TIMEOUT);
}

/**
 * Safely redirect with loop prevention
 */
function safeRedirect(url: string, reason: string): void {
  redirectAttempts++;
  
  if (redirectAttempts > MAX_REDIRECT_ATTEMPTS) {
    if (import.meta.env.DEV) {
      console.error('[GlobalErrorHandlers] Too many redirect attempts - stopping to prevent infinite loop');
      console.error('[GlobalErrorHandlers] Reason:', reason);
    }
    // Don't redirect - just clear auth and stay on current page
    return;
  }
  
  if (import.meta.env.DEV) {
    console.warn(`[GlobalErrorHandlers] Redirecting (attempt ${redirectAttempts}/${MAX_REDIRECT_ATTEMPTS}):`, url);
    console.warn('[GlobalErrorHandlers] Reason:', reason);
  }
  
  window.setTimeout(() => {
    window.location.href = url;
  }, 1000);
  
  resetRedirectCounter();
}

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

  if (import.meta.env.DEV) {
    console.log('[GlobalErrorHandlers] Setting up global error handlers');
  }

  /**
   * Catch unhandled promise rejections
   * This is CRITICAL for auth errors in async callbacks like onAuthStateChange
   * PRODUCTION SAFETY: Prevents ALL unhandled rejections from crashing the app
   */
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const error = event.reason;
    
    // CRITICAL: Always prevent default to stop the app from crashing
    // This is especially important for Supabase/Gotrue Navigator.locks errors
    // REQUIREMENT: Per problem statement, prevent ALL unhandled rejections from crashing
    // React ErrorBoundary will still catch synchronous errors in components
    event.preventDefault();
    
    // Log the error for debugging (DEV mode only)
    if (import.meta.env.DEV) {
      console.error('[GlobalErrorHandlers] Unhandled promise rejection:', {
        message: error?.message || 'Unknown error',
        name: error?.name || 'Error',
        stack: error?.stack,
        path: window.location.pathname
      });
    }
    
    // Check if this is an auth-related error
    const isAuthError = 
      error?.message?.toLowerCase().includes('refresh') ||
      error?.message?.toLowerCase().includes('auth') ||
      error?.message?.toLowerCase().includes('token') ||
      error?.message?.toLowerCase().includes('supabase') ||
      error?.message?.toLowerCase().includes('navigator') ||
      error?.message?.toLowerCase().includes('gotrue');

    // Send error report to backend (production-safe, never throws)
    sendClientError({
      message: error?.message || 'Unhandled promise rejection',
      stack: error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      type: 'unhandledrejection',
      isAuthRelated: isAuthError,
      path: window.location.pathname,
    }).catch(() => {
      // Silently ignore reporting errors
    });

    if (isAuthError) {
      if (import.meta.env.DEV) {
        console.error('[GlobalErrorHandlers] Auth-related unhandled rejection detected');
      }

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
        if (import.meta.env.DEV) {
          console.warn('[GlobalErrorHandlers] Auth storage cleared due to unhandled auth error');
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[GlobalErrorHandlers] Failed to clear auth storage:', err);
        }
      }

      // Only redirect if not already on login page and haven't redirected too many times
      if (!window.location.pathname.includes('/login')) {
        safeRedirect('/login?error=session_expired', 'Auth promise rejection');
      }
    }
    // For non-auth errors: preventDefault() was called above
    // We log them but don't redirect - they're just logged for debugging
    // React ErrorBoundary will still catch synchronous component errors
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

    if (import.meta.env.DEV) {
      console.error('[GlobalErrorHandlers] Global error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        path: window.location.pathname,
        isAuthError
      });
    }

    // Send error report to backend (production-safe, never throws)
    sendClientError({
      message: event.message || 'Global error',
      stack: error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      type: 'error',
      isAuthRelated: isAuthError,
      path: window.location.pathname,
    }).catch(() => {
      // Silently ignore reporting errors
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
        if (import.meta.env.DEV) {
          console.warn('[GlobalErrorHandlers] Auth storage cleared due to global auth error');
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[GlobalErrorHandlers] Failed to clear auth storage:', err);
        }
      }

      // Redirect to login with loop prevention
      if (!window.location.pathname.includes('/login')) {
        safeRedirect('/login?error=session_expired', 'Global auth error');
      }
    }
    
    // For non-auth errors, let ErrorBoundary handle them
    // Don't call event.preventDefault() so React ErrorBoundary can catch them
  });

  if (import.meta.env.DEV) {
    console.log('[GlobalErrorHandlers] Global error handlers ready');
  }
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
      if (import.meta.env.DEV) {
        console.warn('[GlobalErrorHandlers] Auth token missing expiry - may be stale');
      }
      return;
    }

    const expiryDate = new Date(expiresAt * 1000);
    const now = new Date();

    if (expiryDate < now) {
      if (import.meta.env.DEV) {
        console.warn('[GlobalErrorHandlers] Auth token is expired, clearing storage');
      }
      window.localStorage.removeItem(authKey);
    } else {
      if (import.meta.env.DEV) {
        console.log('[GlobalErrorHandlers] Auth token is valid, expires at:', expiryDate.toISOString());
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[GlobalErrorHandlers] Error checking auth token:', error);
    }
  }
}
