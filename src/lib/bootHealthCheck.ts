/**
 * Boot Health Check
 * 
 * Performs critical health checks before the app fully initializes
 * PRODUCTION SAFETY: All checks have timeouts and never block app startup
 */

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  healthy: boolean;
  checks: {
    api: { status: 'ok' | 'failed' | 'timeout'; responseTime?: number; error?: string };
    supabase: { status: 'ok' | 'failed' | 'timeout' | 'skipped'; responseTime?: number; error?: string };
  };
  timestamp: string;
}

/**
 * Check if a URL is reachable with timeout
 */
async function checkEndpoint(url: string, timeout: number = 3000): Promise<{ status: 'ok' | 'failed' | 'timeout'; responseTime?: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      // Don't send credentials for health checks
      credentials: 'omit',
    });
    
    clearTimeout(timeoutId);
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok || response.status === 404) {
      // 404 is fine for HEAD requests - server is reachable
      return { status: 'ok', responseTime };
    }
    
    return { 
      status: 'failed', 
      responseTime,
      error: `HTTP ${response.status}` 
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    if (error instanceof Error && error.name === 'AbortError') {
      return { status: 'timeout', responseTime, error: 'Request timeout' };
    }
    
    return { 
      status: 'failed', 
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Run boot health checks
 * PRODUCTION SAFETY: Never throws, always returns a result
 */
export async function runBootHealthCheck(): Promise<HealthCheckResult> {
  try {
    const timestamp = new Date().toISOString();
    
    // 1. Check API health (our own API)
    let apiCheck: HealthCheckResult['checks']['api'];
    try {
      apiCheck = await checkEndpoint('/api/health', 3000);
    } catch (error) {
      apiCheck = { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
    
    // 2. Check Supabase connectivity (if configured)
    let supabaseCheck: HealthCheckResult['checks']['supabase'];
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      if (!supabaseUrl) {
        supabaseCheck = { status: 'skipped', error: 'Supabase not configured' };
      } else {
        // Check Supabase health endpoint
        supabaseCheck = await checkEndpoint(`${supabaseUrl}/rest/v1/`, 3000);
      }
    } catch (error) {
      supabaseCheck = { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
    
    // Determine overall health
    const healthy = apiCheck.status === 'ok' && (supabaseCheck.status === 'ok' || supabaseCheck.status === 'skipped');
    
    const result: HealthCheckResult = {
      healthy,
      checks: {
        api: apiCheck,
        supabase: supabaseCheck,
      },
      timestamp,
    };
    
    // Log results (DEV only)
    if (import.meta.env.DEV) {
      console.group('🏥 Boot Health Check');
      console.log('Overall Status:', healthy ? '✅ Healthy' : '❌ Unhealthy');
      console.log('API Status:', apiCheck.status, apiCheck.responseTime ? `(${apiCheck.responseTime}ms)` : '');
      console.log('Supabase Status:', supabaseCheck.status, supabaseCheck.responseTime ? `(${supabaseCheck.responseTime}ms)` : '');
      if (!healthy) {
        console.warn('Health check failed:', {
          api: apiCheck.error,
          supabase: supabaseCheck.error,
        });
      }
      console.groupEnd();
    }
    
    return result;
  } catch (error) {
    // CRITICAL: Never let health check crash the app
    if (import.meta.env.DEV) {
      console.error('[BootHealthCheck] Health check crashed (non-critical):', error);
    }
    
    return {
      healthy: false,
      checks: {
        api: { status: 'failed', error: 'Health check crashed' },
        supabase: { status: 'failed', error: 'Health check crashed' },
      },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Report health check failure to error reporting endpoint
 */
export async function reportHealthCheckFailure(result: HealthCheckResult): Promise<void> {
  try {
    // Only report in production or if explicitly enabled in dev
    if (import.meta.env.DEV && !import.meta.env.VITE_ENABLE_ERROR_REPORTING) {
      return;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    await fetch('/api/client-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Boot health check failed',
        stack: JSON.stringify(result.checks, null, 2),
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: result.timestamp,
        type: 'error',
        isAuthRelated: false,
        path: window.location.pathname,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
  } catch (error) {
    // Silently fail - don't cascade errors
    if (import.meta.env.DEV) {
      console.warn('[BootHealthCheck] Failed to report health check failure:', error);
    }
  }
}
