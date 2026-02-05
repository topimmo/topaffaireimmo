/**
 * Safe Service Worker Registration
 * 
 * Registers the service worker with proper environment and bot detection checks.
 * Prevents registration in:
 * - SSR (server-side rendering)
 * - Development/preview environments
 * - Bot user agents (HeadlessChrome, crawlers, etc.)
 * 
 * Handles errors silently to prevent Sentry noise from bot failures.
 */

/**
 * Detect if the current user agent is a bot/crawler
 */
function isBot(): boolean {
  if (typeof navigator === 'undefined' || !navigator.userAgent) {
    return true; // SSR context
  }

  const userAgent = navigator.userAgent.toLowerCase();
  
  // Common bot patterns
  const botPatterns = [
    'bot',
    'crawler',
    'spider',
    'headless',
    'phantom',
    'selenium',
    'puppeteer',
    'playwright',
    'prerender',
    'lighthouse',
    'pagespeed',
    'googlebot',
    'bingbot',
    'slurp',
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'facebookexternalhit',
    'twitterbot',
    'rogerbot',
    'linkedinbot',
    'whatsapp',
    'embedly',
    'quora',
    'outbrain',
    'pinterest',
    'slackbot',
    'vkshare',
    'w3c_validator',
    'redditbot',
    'applebot',
    'discordbot',
    'telegrambot',
  ];

  return botPatterns.some(pattern => userAgent.includes(pattern));
}

/**
 * Check if we're in a production environment
 * Only register SW in production builds
 */
function isProductionEnvironment(): boolean {
  // Check Vite environment mode
  if (import.meta.env.DEV) {
    return false;
  }

  // Check if this is a Vercel production deployment
  // Preview deployments will have VERCEL_ENV set to 'preview'
  const isVercelProduction = import.meta.env.VITE_VERCEL_ENV === 'production';
  const isVercelPreview = import.meta.env.VITE_VERCEL_ENV === 'preview';
  
  // If on Vercel, only allow production, not preview
  if (isVercelPreview) {
    return false;
  }

  // For production builds, check domain (optional additional check)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Allow localhost for testing production builds locally
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }
    
    // Only allow production domain, not preview URLs
    const isProductionDomain = 
      hostname === 'topaffaireimmo.com' ||
      hostname === 'www.topaffaireimmo.com';
    
    const isVercelPreviewDomain = hostname.includes('vercel.app');
    
    // If it's a Vercel preview domain, don't register
    if (isVercelPreviewDomain && !isVercelProduction) {
      return false;
    }
    
    // For production builds, prefer production domain but allow others if PROD mode
    return import.meta.env.PROD;
  }

  // Default: if we're in PROD mode and not explicitly preview, allow it
  return import.meta.env.PROD;
}

/**
 * Check if we're in a client-side environment (not SSR)
 */
function isClientSide(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

/**
 * Check if Service Worker is supported in the browser
 */
function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Register the service worker with all safety checks
 * Returns true if registration was attempted, false if skipped
 */
export async function registerServiceWorker(): Promise<boolean> {
  // Safety check: Only run on client side
  if (!isClientSide()) {
    console.log('[SW] Skipped: Not client-side (SSR detected)');
    return false;
  }

  // Check if Service Worker is supported
  if (!isServiceWorkerSupported()) {
    console.log('[SW] Skipped: Service Worker not supported');
    return false;
  }

  // Check if we're in production environment
  if (!isProductionEnvironment()) {
    console.log('[SW] Skipped: Not production environment');
    return false;
  }

  // Check if user agent is a bot
  if (isBot()) {
    console.log('[SW] Skipped: Bot/crawler detected');
    return false;
  }

  // All checks passed, register the service worker
  try {
    // Wait for page to load before registering
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        window.addEventListener('load', resolve, { once: true });
      });
    }

    console.log('[SW] Registering service worker...');
    
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none', // Always check for updates
    });

    console.log('[SW] Service worker registered successfully:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] New version available, will refresh on next visit');
          }
        });
      }
    });

    return true;
  } catch (error) {
    // Silent error handling - log to console but don't throw
    // This prevents Sentry from capturing bot registration failures
    console.warn('[SW] Registration failed (this is normal for some environments):', error);
    
    // Don't rethrow - we want this to fail silently
    return false;
  }
}

/**
 * Unregister all service workers (useful for cleanup)
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isClientSide() || !isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (const registration of registrations) {
      await registration.unregister();
      console.log('[SW] Service worker unregistered:', registration.scope);
    }
    
    return true;
  } catch (error) {
    console.warn('[SW] Unregistration failed:', error);
    return false;
  }
}
