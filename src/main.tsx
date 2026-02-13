import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { setupGlobalErrorHandlers, checkForStaleAuthToken } from "./lib/globalErrorHandlers";
import { runBootHealthCheck, reportHealthCheckFailure } from "./lib/bootHealthCheck";
import { hasEnv, isProd, getBaseUrl } from "./lib/env";

/**
 * CRITICAL: Synchronous environment validation BEFORE React renders
 * This prevents crashes from missing environment variables
 * PRODUCTION SAFETY: Never throws, shows UI error instead
 */
function validateEnvironmentSync(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    if (!hasEnv('VITE_SUPABASE_URL')) {
      errors.push('VITE_SUPABASE_URL is not configured');
    }
    
    if (!hasEnv('VITE_SUPABASE_ANON_KEY')) {
      errors.push('VITE_SUPABASE_ANON_KEY is not configured');
    }
  } catch (error) {
    console.error('[Main] Environment validation error:', error instanceof Error ? error.message : 'Unknown error');
    errors.push('Failed to validate environment');
  }
  
  if (errors.length > 0) {
    console.error('❌ Critical environment variables missing:', errors);
    
    // In production, show user-friendly error instead of crashing
    try {
      if (isProd()) {
        const rootEl = document.getElementById('root');
        if (rootEl) {
          rootEl.innerHTML = `
            <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f9fafb; padding: 1rem;">
              <div style="max-width: 28rem; width: 100%; background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center; gap: 0.5rem; color: #dc2626; margin-bottom: 1rem;">
                  <svg xmlns="http://www.w3.org/2000/svg" style="height: 1.5rem; width: 1.5rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h1 style="font-size: 1.25rem; font-weight: 600;">Configuration Error</h1>
                </div>
                <p style="color: #6b7280; margin-bottom: 1rem;">
                  The application is not properly configured. Please contact support.
                </p>
                <button onclick="window.location.reload()" style="width: 100%; background: #3b82f6; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; border: none; cursor: pointer; font-size: 1rem;">
                  Retry
                </button>
              </div>
            </div>
          `;
        }
      }
    } catch (uiError) {
      console.error('[Main] Failed to show error UI:', uiError instanceof Error ? uiError.message : 'Unknown error');
    }
    
    return { valid: false, errors };
  }
  
  return { valid: true, errors };
}

// CRITICAL: Validate environment BEFORE doing anything else
// PRODUCTION SAFETY: Wrapped in try-catch to prevent initialization crash
let envValidation: { valid: boolean; errors: string[] };
try {
  envValidation = validateEnvironmentSync();
} catch (error) {
  console.error('[Main] CRITICAL: Environment validation crashed:', error instanceof Error ? error.message : 'Unknown error');
  envValidation = { valid: false, errors: ['Environment validation crashed'] };
}

if (envValidation.valid) {
  try {
    // CRITICAL: Setup global error handlers BEFORE React renders
    // This catches unhandled promise rejections that ErrorBoundary can't catch
    setupGlobalErrorHandlers();

    // Check for stale auth tokens (e.g., after deployment with cache issues)
    checkForStaleAuthToken();

    // PRODUCTION SAFETY: Run boot health check (non-blocking)
    // This detects network/API issues early and reports them
    runBootHealthCheck().then(healthResult => {
      if (!healthResult.healthy) {
        if (import.meta.env.DEV) {
          console.warn('[Main] Boot health check failed (non-blocking)');
        }
        // Report health check failure (fire and forget)
        reportHealthCheckFailure(healthResult).catch(() => {
          // Silently ignore reporting errors
        });
      }
    }).catch(error => {
      if (import.meta.env.DEV) {
        console.warn('[Main] Boot health check error (non-blocking):', error);
      }
    });

    // Get base URL safely
    const basename = getBaseUrl();

    // Log deployment information for debugging
    // PRODUCTION SAFETY: Wrapped in try-catch
    try {
      console.group('🚀 Application Deployment Info');
      const buildTimestamp = document.querySelector('meta[name="build-timestamp"]')?.getAttribute('content');
      const deploymentVersion = document.querySelector('meta[name="deployment-version"]')?.getAttribute('content');
      console.log('Build Timestamp:', buildTimestamp || 'Not available');
      console.log('Deployment Version:', deploymentVersion || 'Not available');
      console.log('Current URL:', window.location.href);
      console.log('Base URL:', basename);
      console.groupEnd();
    } catch (err) {
      console.error('[Main] Error reading deployment metadata:', err instanceof Error ? err.message : 'Unknown error');
    }

    // PRODUCTION SAFETY: Wrap ReactDOM.createRoot in try-catch
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error('Root element not found');
    }

    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ErrorBoundary>
          <BrowserRouter basename={basename}>
            <LanguageProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </LanguageProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </React.StrictMode>,
    );
  } catch (error) {
    console.error('[Main] CRITICAL: Failed to render application:', error instanceof Error ? error.message : 'Unknown error');
    // Show fallback error UI
    try {
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.innerHTML = `
          <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f9fafb; padding: 1rem;">
            <div style="max-width: 28rem; width: 100%; background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="display: flex; align-items: center; gap: 0.5rem; color: #dc2626; margin-bottom: 1rem;">
                <svg xmlns="http://www.w3.org/2000/svg" style="height: 1.5rem; width: 1.5rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h1 style="font-size: 1.25rem; font-weight: 600;">Application Error</h1>
              </div>
              <p style="color: #6b7280; margin-bottom: 1rem;">
                Failed to start the application. Please try refreshing the page.
              </p>
              <button onclick="window.location.reload()" style="width: 100%; background: #3b82f6; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; border: none; cursor: pointer; font-size: 1rem;">
                Refresh Page
              </button>
            </div>
          </div>
        `;
      }
    } catch (uiError) {
      // Last resort - can't even show error UI
      console.error('[Main] Failed to show error UI');
    }
  }
} else {
  // Environment validation failed - error UI already shown
  console.error('❌ Application cannot start - environment validation failed');
}
