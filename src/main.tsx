import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { hasEnv, isProd } from "./lib/env";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthDebugLogger } from "./components/AuthDebugLogger";
import { initSessionManager } from "./lib/sessionManager";

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
    
    if (isProd()) {
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.innerHTML = `
          <div style="min-height: 100vh; display: flex; align-items: center; justify-center; background: #f9fafb; padding: 1rem;">
            <div style="max-width: 28rem; width: 100%; background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1.5rem;">
              <h1 style="font-size: 1.25rem; font-weight: 600; color: #dc2626; margin-bottom: 1rem;">Configuration Error</h1>
              <p style="color: #6b7280; margin-bottom: 1rem;">
                The application is not properly configured. Please contact support.
              </p>
              <button onclick="window.location.reload()" style="width: 100%; background: #3b82f6; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; border: none; cursor: pointer;">
                Retry
              </button>
            </div>
          </div>
        `;
      }
    }
    
    return { valid: false, errors };
  }
  
  return { valid: true, errors };
}

// Validate environment BEFORE doing anything else
let envValidation: { valid: boolean; errors: string[] };
try {
  envValidation = validateEnvironmentSync();
} catch (error) {
  console.error('[Main] CRITICAL: Environment validation crashed:', error instanceof Error ? error.message : 'Unknown error');
  envValidation = { valid: false, errors: ['Environment validation crashed'] };
}

if (envValidation.valid) {
  try {
    const basename = import.meta.env.BASE_URL || '/';

    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error('Root element not found');
    }

    // Initialize session manager in background (non-blocking)
    // NOTE: This is intentionally fire-and-forget to prevent blocking app startup
    // AuthContext handles its own session initialization independently
    // SessionManager provides supplementary cleanup (service workers) and validation
    initSessionManager().catch(error => {
      console.error('[Main] Session manager initialization failed:', error);
      // Continue anyway - session manager failure shouldn't block the app
      // AuthContext will handle session validation independently
    });

    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <BrowserRouter basename={basename}>
          <AuthProvider>
            <AuthDebugLogger />
            <App />
          </AuthProvider>
        </BrowserRouter>
      </React.StrictMode>,
    );
  } catch (error) {
    console.error('[Main] CRITICAL: Failed to render application:', error instanceof Error ? error.message : 'Unknown error');
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-center; background: #f9fafb; padding: 1rem;">
          <div style="max-width: 28rem; width: 100%; background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1.5rem;">
            <h1 style="font-size: 1.25rem; font-weight: 600; color: #dc2626; margin-bottom: 1rem;">Application Error</h1>
            <p style="color: #6b7280; margin-bottom: 1rem;">
              Failed to start the application. Please try refreshing the page.
            </p>
            <button onclick="window.location.reload()" style="width: 100%; background: #3b82f6; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; border: none; cursor: pointer;">
              Refresh Page
            </button>
          </div>
        </div>
      `;
    }
  }
} else {
  console.error('❌ Application cannot start - environment validation failed');
}
