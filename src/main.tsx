import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import * as Sentry from "@sentry/react";
import { initGA } from "./lib/analytics/ga4";

// Initialize Sentry for error monitoring (production only)
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring
    // Session Replay
    replaysSessionSampleRate: 0.1, // Sample 10% of sessions
    replaysOnErrorSampleRate: 1.0, // Always capture replays on errors
    // Don't send errors in development
    beforeSend(event) {
      if (import.meta.env.DEV) {
        return null;
      }
      return event;
    },
  });
}

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

// Initialize Google Analytics 4
initGA();

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
