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
 * Only register SW on the actual production domain
 */
function isProductionEnvironment(): boolean {
  // Never register in development mode
  if (import.meta.env.DEV) {
    return false;
  }

  // Never register in Vercel preview deployments
  const vercelEnv = import.meta.env.VITE_VERCEL_ENV;
  if (vercelEnv === 'preview' || vercelEnv === 'development') {
    return false;
  }

  // Check hostname - only allow actual production domain
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    
    // Get the expected production domain
    const productionDomain = import.meta.env.VITE_PRODUCTION_DOMAIN || 'topaffaireimmo.com';
    
    // Block all vercel.app domains (preview deployments)
    if (currentHost.includes('vercel.app')) {
      return false;
    }
    
    // Only allow exact production domain match
    const allowedHosts = [
      productionDomain,
      `www.${productionDomain}`,
      'localhost', // For local production build testing
      '127.0.0.1'
    ];
    
    if (!allowedHosts.includes(currentHost)) {
      console.log(`[SW] Skipped: hostname "${currentHost}" not in allowed list`);
      return false;
    }
  }

  // Must be in production mode
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
    
    // Service worker file path (can be overridden via env var)
    const swPath = import.meta.env.VITE_SW_PATH || '/sw.js';
    
    const registration = await navigator.serviceWorker.register(swPath, {
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
