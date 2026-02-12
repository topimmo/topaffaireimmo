import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./core/auth/AuthProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import { setupGlobalErrorHandlers, checkForStaleAuthToken } from "./lib/globalErrorHandlers";

/**
 * CRITICAL: Synchronous environment validation BEFORE React renders
 * This prevents crashes from missing environment variables
 */
function validateEnvironmentSync(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!import.meta.env.VITE_SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL is not configured');
  }
  
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY is not configured');
  }
  
  if (errors.length > 0) {
    console.error('❌ Critical environment variables missing:', errors);
    
    // In production, show user-friendly error instead of crashing
    if (import.meta.env.PROD) {
      document.getElementById('root')!.innerHTML = `
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
      return { valid: false, errors };
    }
  }
  
  return { valid: true, errors };
}

// CRITICAL: Validate environment BEFORE doing anything else
const envValidation = validateEnvironmentSync();

if (envValidation.valid) {
  // CRITICAL: Setup global error handlers BEFORE React renders
  // This catches unhandled promise rejections that ErrorBoundary can't catch
  setupGlobalErrorHandlers();

  // Check for stale auth tokens (e.g., after deployment with cache issues)
  checkForStaleAuthToken();

  const basename = import.meta.env.BASE_URL;

  // Log deployment information for debugging
  console.group('🚀 Application Deployment Info');
  try {
    const buildTimestamp = document.querySelector('meta[name="build-timestamp"]')?.getAttribute('content');
    const deploymentVersion = document.querySelector('meta[name="deployment-version"]')?.getAttribute('content');
    console.log('Build Timestamp:', buildTimestamp || 'Not available');
    console.log('Deployment Version:', deploymentVersion || 'Not available');
    console.log('Current URL:', window.location.href);
    console.log('Environment Mode:', import.meta.env.MODE);
    console.log('Base URL:', basename);
  } catch (err) {
    console.error('Error reading deployment metadata:', err);
  }
  console.groupEnd();

  ReactDOM.createRoot(document.getElementById("root")!).render(
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
} else {
  // Environment validation failed - error UI already shown
  console.error('❌ Application cannot start - environment validation failed');
}
