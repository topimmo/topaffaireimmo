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
const GA_MEASUREMENT_ID = 'G-TMY9XWHH6G';

// Track if GA has been initialized to prevent duplicate script injection
let gaInitialized = false;

// Track if script is loading
let gaScriptLoading = false;

// Track last page view to prevent duplicates
let lastPageView = '';

/**
 * Check if current domain is a production domain
 * Only topaffaireimmo.com and www.topaffaireimmo.com should track
 */
export function isProdDomain(): boolean {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname.toLowerCase();
  
  // Production domains - support both www and non-www
  const isProduction = hostname === 'topaffaireimmo.com' || 
                       hostname === 'www.topaffaireimmo.com';
  
  if (!isProduction) {
    console.log('[GA4] Not on production domain:', hostname);
  }
  
  return isProduction;
}

/**
 * Initialize Google Analytics 4
 * Injects GA scripts only once and only on production domains
 * NOTE: GA4 may already be loaded from index.html
 */
export function initGA(): void {
  // Only initialize on production domains
  if (!isProdDomain()) {
    console.log('[GA4] Not on production domain, skipping initialization');
    return;
  }
  
  // Check if already initialized (either by this function or by index.html script)
  if (gaInitialized) {
    console.log('[GA4] Already initialized');
    return;
  }
  
  // Check if gtag was already loaded by index.html script
  if (typeof window.gtag === 'function' && window.dataLayer && window.dataLayer.length > 0) {
    console.log('[GA4] Already loaded by index.html script');
    gaInitialized = true;
    return;
  }
  
  // Prevent multiple initialization attempts
  if (gaScriptLoading) {
    console.log('[GA4] Script already loading');
    return;
  }
  
  try {
    gaScriptLoading = true;
    
    // Create dataLayer if it doesn't exist
    window.dataLayer = window.dataLayer || [];
    
    // Define gtag function as a stub that queues commands
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
    
    // Initialize with current time
    window.gtag('js', new Date());
    
    // Inject GA script asynchronously
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    
    // Handle successful script load
    script.onload = () => {
      console.log('[GA4] Script loaded successfully');
      
      // Configure GA4 AFTER script loads
      if (window.gtag) {
        window.gtag('config', GA_MEASUREMENT_ID, {
          send_page_view: false, // We'll track page views manually in SPA
          cookie_flags: 'SameSite=None;Secure', // Ensure cookies work correctly
        });
        console.log('[GA4] Configuration complete');
      }
      
      gaInitialized = true;
      gaScriptLoading = false;
    };
    
    // Handle script load errors
    script.onerror = (error) => {
      console.error('[GA4] Failed to load script:', error);
      console.error('[GA4] This may be due to:');
      console.error('  - Ad blocker blocking Google Analytics');
      console.error('  - Content Security Policy restrictions');
      console.error('  - Network connectivity issues');
      console.error('  - Google Analytics being down');
      gaScriptLoading = false;
    };
    
    // Append script to head
    document.head.appendChild(script);
    
    console.log('[GA4] Initialization started, loading script...');
  } catch (error) {
    console.error('[GA4] Initialization error:', error);
    gaScriptLoading = false;
  }
}

/**
 * Check if GA4 is ready (gtag function exists and is callable)
 */
function isGAReady(): boolean {
  return typeof window !== 'undefined' && 
         typeof window.gtag === 'function' && 
         Array.isArray(window.dataLayer);
}

/**
 * Track a page view
 * Call this on route changes in SPA
 * 
 * @param path - Optional path to track (defaults to current location)
 */
export function trackPageView(path?: string): void {
  if (!isProdDomain()) {
    console.log('[GA4] Skipping page view (not on production domain)');
    return;
  }
  
  // Check if GA is ready (might be loaded from index.html or from initGA)
  if (!isGAReady()) {
    console.warn('[GA4] Not ready yet, will retry in 500ms...');
    // Retry a few times in case GA is still loading
    let retryCount = 0;
    const maxRetries = 6; // 3 seconds total
    const retryInterval = setInterval(() => {
      retryCount++;
      if (isGAReady()) {
        clearInterval(retryInterval);
        trackPageView(path);
      } else if (retryCount >= maxRetries) {
        clearInterval(retryInterval);
        console.error('[GA4] Failed to initialize after', maxRetries * 500, 'ms');
      }
    }, 500);
    return;
  }
  
  // Mark as initialized if not already
  if (!gaInitialized && isGAReady()) {
    gaInitialized = true;
    console.log('[GA4] Detected existing initialization');
  }
  
  try {
    const currentPath = path || window.location.pathname + window.location.search;
    
    // Prevent duplicate page views for the same path
    if (currentPath === lastPageView) {
      console.log('[GA4] Duplicate page view prevented:', currentPath);
      return;
    }
    
    lastPageView = currentPath;
    
    // Send page_view event
    window.gtag('event', 'page_view', {
      page_path: currentPath,
      page_location: window.location.href,
      page_title: document.title,
    });
    
    console.log('[GA4] ✅ Page view tracked:', {
      path: currentPath,
      title: document.title,
      url: window.location.href
    });
  } catch (error) {
    console.error('[GA4] Error tracking page view:', error);
  }
}

/**
 * Track a custom event
 * 
 * @param name - Event name (e.g., 'generate_lead', 'whatsapp_click')
 * @param params - Event parameters
 */
export function trackEvent(name: string, params?: Record<string, any>): void {
  if (!isProdDomain()) {
    console.log('[GA4] Skipping event (not on production domain):', name);
    return;
  }
  
  if (!isGAReady()) {
    console.warn('[GA4] Not ready, cannot track event:', name);
    return;
  }
  
  try {
    window.gtag('event', name, params);
    console.log('[GA4] ✅ Event tracked:', name, params);
  } catch (error) {
    console.error('[GA4] Error tracking event:', error);
  }
}

// Type declarations for gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}
