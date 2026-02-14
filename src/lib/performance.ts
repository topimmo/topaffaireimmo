/**
 * Performance Monitoring Utility
 * Track slow queries, API latency, page loads, and image loads
 * Automatically logs metrics to database for production monitoring
 */

import { supabase } from './supabase';
import logger from './logger';

/**
 * Metric types
 */
export type MetricType = 'query' | 'api' | 'page_load' | 'image_load';

/**
 * Performance thresholds (milliseconds)
 */
const THRESHOLDS = {
  query: 500,      // Slow query threshold
  api: 1000,       // Slow API threshold
  page_load: 3000, // Slow page load threshold
  image_load: 2000 // Slow image load threshold
};

/**
 * Performance metric interface
 */
export interface PerformanceMetric {
  type: MetricType;
  name: string;
  duration: number;
  metadata?: Record<string, unknown>;
  url?: string;
}

/**
 * Track a performance metric
 */
export async function trackPerformance(metric: PerformanceMetric): Promise<void> {
  const { type, name, duration, metadata = {}, url } = metric;

  // Log to console in development
  if (import.meta.env.DEV) {
    const threshold = THRESHOLDS[type];
    const isSlow = duration > threshold;
    const emoji = isSlow ? '🐌' : '⚡';
    console.log(
      `${emoji} [Performance] ${type}:${name} - ${duration}ms`,
      isSlow ? `(>${threshold}ms)` : '',
      metadata
    );
  }

  // In production, persist to database
  if (import.meta.env.PROD) {
    try {
      if (!supabase) return;

      await supabase.rpc('track_performance_metric', {
        p_metric_type: type,
        p_metric_name: name,
        p_duration_ms: duration,
        p_metadata: metadata,
        p_url: url || (typeof window !== 'undefined' ? window.location.href : null),
      });
    } catch (error) {
      // Silently fail - don't let monitoring crash the app
      if (import.meta.env.DEV) {
        console.debug('[Performance] Failed to persist metric:', error);
      }
    }
  }

  // Log slow operations as warnings
  const threshold = THRESHOLDS[type];
  if (duration > threshold) {
    logger.warn(
      'Performance',
      `Slow ${type}: ${name} took ${duration}ms (threshold: ${threshold}ms)`,
      { type, name, duration, threshold, metadata }
    );
  }
}

/**
 * Measure and track a synchronous function's performance
 */
export function measureSync<T>(
  type: MetricType,
  name: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): T {
  const start = performance.now();
  try {
    const result = fn();
    const duration = Math.round(performance.now() - start);
    trackPerformance({ type, name, duration, metadata }).catch(() => {});
    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    trackPerformance({ type, name, duration, metadata: { ...metadata, error: true } }).catch(() => {});
    throw error;
  }
}

/**
 * Measure and track an async function's performance
 */
export async function measureAsync<T>(
  type: MetricType,
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = Math.round(performance.now() - start);
    await trackPerformance({ type, name, duration, metadata });
    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    await trackPerformance({ type, name, duration, metadata: { ...metadata, error: true } });
    throw error;
  }
}

/**
 * Create a performance timer
 * Usage:
 *   const timer = createTimer('query', 'fetch_properties');
 *   // ... do work ...
 *   timer.end({ total: 50 });
 */
export function createTimer(type: MetricType, name: string) {
  const start = performance.now();
  
  return {
    end(metadata?: Record<string, unknown>) {
      const duration = Math.round(performance.now() - start);
      trackPerformance({ type, name, duration, metadata }).catch(() => {});
      return duration;
    }
  };
}

/**
 * Track Supabase query performance
 * Wraps a Supabase query and automatically tracks its performance
 */
export async function trackQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  return measureAsync('query', queryName, queryFn, metadata);
}

/**
 * Track API call performance
 */
export async function trackApiCall<T>(
  apiName: string,
  apiFn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  return measureAsync('api', apiName, apiFn, metadata);
}

/**
 * Track page load performance
 * Call this in useEffect when page component mounts
 */
export function trackPageLoad(pageName: string): void {
  if (typeof window === 'undefined') return;

  // Use Navigation Timing API
  const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (perfData) {
    const loadTime = Math.round(perfData.loadEventEnd - perfData.fetchStart);
    const domContentLoaded = Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart);
    
    trackPerformance({
      type: 'page_load',
      name: pageName,
      duration: loadTime,
      metadata: {
        domContentLoaded,
        dns: Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
        tcp: Math.round(perfData.connectEnd - perfData.connectStart),
        ttfb: Math.round(perfData.responseStart - perfData.requestStart),
        download: Math.round(perfData.responseEnd - perfData.responseStart),
        dom: Math.round(perfData.domComplete - perfData.domInteractive),
      }
    }).catch(() => {});
  }
}

/**
 * Track image load performance
 */
export function trackImageLoad(imageName: string, imageUrl: string): void {
  if (typeof window === 'undefined') return;

  const img = new Image();
  const start = performance.now();
  
  img.onload = () => {
    const duration = Math.round(performance.now() - start);
    trackPerformance({
      type: 'image_load',
      name: imageName,
      duration,
      metadata: { url: imageUrl, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight }
    }).catch(() => {});
  };
  
  img.onerror = () => {
    const duration = Math.round(performance.now() - start);
    trackPerformance({
      type: 'image_load',
      name: imageName,
      duration,
      metadata: { url: imageUrl, error: true }
    }).catch(() => {});
  };
  
  img.src = imageUrl;
}

/**
 * Monitor Web Vitals (Core Web Vitals)
 * Tracks LCP, FID, CLS automatically
 */
export function monitorWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint (LCP)
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const finalLcpEntry = entries[entries.length - 1] as PerformanceEntry;
    
    trackPerformance({
      type: 'page_load',
      name: 'LCP',
      duration: Math.round(finalLcpEntry.startTime),
      metadata: { metric: 'largest-contentful-paint' }
    }).catch(() => {});
  });
  
  try {
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // LCP not supported
  }

  // First Input Delay (FID)
  const fidObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      const fidEntry = entry as PerformanceEventTiming;
      trackPerformance({
        type: 'page_load',
        name: 'FID',
        duration: Math.round(fidEntry.processingStart - fidEntry.startTime),
        metadata: { metric: 'first-input-delay' }
      }).catch(() => {});
    });
  });
  
  try {
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    // FID not supported
  }

  // Cumulative Layout Shift (CLS) - tracked on page unload
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const layoutShift = entry as LayoutShift;
      if (!layoutShift.hadRecentInput) {
        clsValue += layoutShift.value;
      }
    }
  });
  
  try {
    clsObserver.observe({ entryTypes: ['layout-shift'] });
    
    // Report CLS on page unload
    window.addEventListener('beforeunload', () => {
      trackPerformance({
        type: 'page_load',
        name: 'CLS',
        duration: Math.round(clsValue * 1000), // Convert to ms-like scale for storage
        metadata: { metric: 'cumulative-layout-shift', value: clsValue }
      }).catch(() => {});
    });
  } catch (e) {
    // CLS not supported
  }
}

// Interface for layout shift entry (not in standard TypeScript lib)
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}
