import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./core/auth/AuthProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import { setupGlobalErrorHandlers, checkForStaleAuthToken } from "./lib/globalErrorHandlers";

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
