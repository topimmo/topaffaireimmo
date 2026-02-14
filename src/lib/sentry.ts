/**
 * Sentry Error Tracking Configuration
 * Captures frontend errors, failed Supabase queries, and unhandled rejections
 * Attaches user context and sanitizes sensitive data
 */

import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for error tracking
 * Only enabled in production with valid DSN
 */
export function initializeSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE || 'development';
  const isProduction = import.meta.env.PROD;

  // Only initialize in production with valid DSN
  if (!isProduction || !dsn || dsn.includes('YOUR_SENTRY_DSN')) {
    if (import.meta.env.DEV) {
      console.log('🔍 [Sentry] Not initialized (development mode or missing DSN)');
    }
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment,
      
      // Performance Monitoring
      integrations: [
        Sentry.browserTracingIntegration(),
      ],

      // Set sample rates
      tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
      
      // Capture 100% of errors (they're already filtered)
      sampleRate: 1.0,

      // Release tracking (from environment variables set during build)
      release: import.meta.env.VITE_SENTRY_RELEASE || undefined,

      // Before sending any event, sanitize sensitive data
      beforeSend(event, hint) {
        // Remove sensitive data from event
        if (event.request) {
          // Remove query parameters that might contain tokens
          if (event.request.url) {
            try {
              const url = new URL(event.request.url);
              // Remove sensitive query parameters
              const sensitiveParams = ['token', 'access_token', 'refresh_token', 'apiKey', 'api_key'];
              sensitiveParams.forEach(param => url.searchParams.delete(param));
              event.request.url = url.toString();
            } catch (e) {
              // Invalid URL, skip sanitization
            }
          }

          // Remove sensitive headers
          if (event.request.headers) {
            const sensitiveHeaders = ['authorization', 'cookie', 'apikey'];
            sensitiveHeaders.forEach(header => {
              if (event.request?.headers) {
                delete event.request.headers[header];
              }
            });
          }

          // Remove sensitive data from request body
          if (event.request.data) {
            event.request.data = sanitizeData(event.request.data);
          }
        }

        // Sanitize extra data
        if (event.extra) {
          event.extra = sanitizeData(event.extra);
        }

        // Sanitize contexts
        if (event.contexts) {
          event.contexts = sanitizeData(event.contexts);
        }

        return event;
      },

      // Before capturing breadcrumb, sanitize it
      beforeBreadcrumb(breadcrumb) {
        // Sanitize console breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.message) {
          breadcrumb.message = sanitizeString(breadcrumb.message);
        }

        // Sanitize HTTP breadcrumbs
        if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
          if (breadcrumb.data?.url) {
            try {
              const url = new URL(breadcrumb.data.url);
              const sensitiveParams = ['token', 'access_token', 'refresh_token', 'apiKey', 'api_key'];
              sensitiveParams.forEach(param => url.searchParams.delete(param));
              breadcrumb.data.url = url.toString();
            } catch (e) {
              // Invalid URL, skip sanitization
            }
          }
        }

        return breadcrumb;
      },

      // Ignore specific errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',
        
        // Network errors (too noisy)
        'NetworkError',
        'Failed to fetch',
        'Network request failed',
        
        // ResizeObserver errors (benign)
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        
        // Common development errors
        'Cannot read property of undefined',
        
        // Known safe errors
        'Non-Error promise rejection captured',
      ],

      // Denylist specific URLs
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^moz-extension:\/\//i,
        
        // Hot reload (development)
        /webpack/i,
        /hmr/i,
      ],
    });

    console.log('🔍 [Sentry] Initialized successfully');
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Sanitize data to remove sensitive information
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = [
    'password',
    'token',
    'access_token',
    'accessToken',
    'refresh_token',
    'refreshToken',
    'apiKey',
    'api_key',
    'secret',
    'authorization',
    'cookie',
    'session',
    'sessionId',
    'session_id',
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    
    // Check if key contains sensitive information
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Sanitize string to remove sensitive patterns
 */
function sanitizeString(str: string): string {
  // Remove JWT tokens
  str = str.replace(/eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, '[JWT_REDACTED]');
  
  // Remove API keys (common patterns)
  str = str.replace(/sk-[a-zA-Z0-9]{32,}/g, '[API_KEY_REDACTED]');
  str = str.replace(/[a-zA-Z0-9]{32,64}/g, match => {
    // Only redact if it looks like a key/token (all lowercase or uppercase)
    if (match === match.toLowerCase() || match === match.toUpperCase()) {
      return '[KEY_REDACTED]';
    }
    return match;
  });
  
  return str;
}

/**
 * Set user context for error tracking
 * Call this when user logs in
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  role?: string;
}): void {
  if (!import.meta.env.PROD) return;

  try {
    Sentry.setUser({
      id: user.id,
      email: user.email, // Sentry automatically hashes emails
      role: user.role,
    });
  } catch (error) {
    console.debug('[Sentry] Failed to set user context:', error);
  }
}

/**
 * Clear user context
 * Call this when user logs out
 */
export function clearUserContext(): void {
  if (!import.meta.env.PROD) return;

  try {
    Sentry.setUser(null);
  } catch (error) {
    console.debug('[Sentry] Failed to clear user context:', error);
  }
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (!import.meta.env.PROD) {
    console.error('[Sentry] Exception (not sent in dev):', error, context);
    return;
  }

  try {
    Sentry.captureException(error, {
      extra: context ? sanitizeData(context) : undefined,
    });
  } catch (e) {
    console.debug('[Sentry] Failed to capture exception:', e);
  }
}

/**
 * Capture message manually
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (!import.meta.env.PROD) {
    console.log(`[Sentry] Message (not sent in dev) [${level}]:`, message);
    return;
  }

  try {
    Sentry.captureMessage(message, level);
  } catch (error) {
    console.debug('[Sentry] Failed to capture message:', error);
  }
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
  if (!import.meta.env.PROD) return;

  try {
    Sentry.addBreadcrumb({
      message,
      category,
      data: data ? sanitizeData(data) : undefined,
      level: 'info',
    });
  } catch (error) {
    console.debug('[Sentry] Failed to add breadcrumb:', error);
  }
}

/**
 * Create Sentry error boundary wrapper
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Track Supabase query errors
 */
export function trackSupabaseError(
  queryName: string,
  error: any,
  metadata?: Record<string, any>
): void {
  if (!import.meta.env.PROD) return;

  try {
    Sentry.captureException(new Error(`Supabase Query Failed: ${queryName}`), {
      extra: {
        queryName,
        error: sanitizeData(error),
        metadata: metadata ? sanitizeData(metadata) : undefined,
      },
      tags: {
        errorType: 'supabase_query',
        queryName,
      },
    });
  } catch (e) {
    console.debug('[Sentry] Failed to track Supabase error:', e);
  }
}

export default {
  initializeSentry,
  setUserContext,
  clearUserContext,
  captureException,
  captureMessage,
  addBreadcrumb,
  trackSupabaseError,
};
