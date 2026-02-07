/**
 * Google Analytics 4 (GA4) Tracking Utilities
 * 
 * Provides safe, production-only tracking for TopAffaireImmo.
 * - Only tracks on production domains (topaffaireimmo.com, www.topaffaireimmo.com)
 * - Prevents duplicate page_view events in SPA
 * - Supports custom event tracking
 * - Fails silently if GA script is blocked
 */

// GA4 Measurement ID
const GA_MEASUREMENT_ID = 'G-TMY9XWWH6G';

// Track if GA has been initialized to prevent duplicate script injection
let gaInitialized = false;

// Track last page view to prevent duplicates
let lastPageView = '';

/**
 * Check if current domain is a production domain
 * Only topaffaireimmo.com and www.topaffaireimmo.com should track
 */
export function isProdDomain(): boolean {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname.toLowerCase();
  
  // Production domains
  const prodDomains = [
    'topaffaireimmo.com',
    'www.topaffaireimmo.com'
  ];
  
  return prodDomains.includes(hostname);
}

/**
 * Initialize Google Analytics 4
 * Injects GA scripts only once and only on production domains
 */
export function initGA(): void {
  // Only initialize on production domains
  if (!isProdDomain()) {
    console.log('[GA4] Not on production domain, skipping initialization');
    return;
  }
  
  // Prevent duplicate initialization
  if (gaInitialized) {
    console.log('[GA4] Already initialized');
    return;
  }
  
  try {
    // Check if gtag is already defined (script might be loaded by other means)
    if (typeof window.gtag !== 'undefined') {
      console.log('[GA4] gtag already defined');
      gaInitialized = true;
      return;
    }
    
    // Create dataLayer if it doesn't exist
    window.dataLayer = window.dataLayer || [];
    
    // Define gtag function
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
    
    // Initialize with current time
    window.gtag('js', new Date());
    
    // Configure GA4 with page_view disabled (we'll track manually)
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false, // Disable automatic page views to prevent duplicates in SPA
    });
    
    // Inject GA script asynchronously
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    
    // Handle script load errors silently
    script.onerror = () => {
      console.warn('[GA4] Failed to load script (may be blocked)');
    };
    
    document.head.appendChild(script);
    
    gaInitialized = true;
    console.log('[GA4] Initialized successfully');
  } catch (error) {
    console.warn('[GA4] Initialization error:', error);
  }
}

/**
 * Track a page view
 * Call this on route changes in SPA
 * 
 * @param path - Optional path to track (defaults to current location)
 */
export function trackPageView(path?: string): void {
  if (!isProdDomain()) return;
  if (!gaInitialized) {
    console.warn('[GA4] Not initialized, cannot track page view');
    return;
  }
  
  try {
    const currentPath = path || window.location.pathname + window.location.search;
    
    // Prevent duplicate page views
    if (currentPath === lastPageView) {
      console.log('[GA4] Duplicate page view prevented:', currentPath);
      return;
    }
    
    lastPageView = currentPath;
    
    window.gtag?.('event', 'page_view', {
      page_path: currentPath,
      page_location: window.location.href,
      page_title: document.title,
    });
    
    console.log('[GA4] Page view tracked:', currentPath);
  } catch (error) {
    console.warn('[GA4] Error tracking page view:', error);
  }
}

/**
 * Track a custom event
 * 
 * @param name - Event name (e.g., 'generate_lead', 'whatsapp_click')
 * @param params - Event parameters
 */
export function trackEvent(name: string, params?: Record<string, any>): void {
  if (!isProdDomain()) return;
  if (!gaInitialized) {
    console.warn('[GA4] Not initialized, cannot track event');
    return;
  }
  
  try {
    window.gtag?.('event', name, params);
    console.log('[GA4] Event tracked:', name, params);
  } catch (error) {
    console.warn('[GA4] Error tracking event:', error);
  }
}

// Type declarations for gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}
