# Production Crash Fix: Comprehensive Diagnostic & Permanent Solution

## Executive Summary

**Issue**: Website showed blank page with "Something went wrong" error boundary on both mobile and desktop devices.

**Root Cause**: Unhandled promise rejections from Supabase gotrue-js library's use of `navigator.locks` API, which fails in certain browser contexts (private browsing, older browsers, blocked storage).

**Permanent Fix**: Multi-layered defense-in-depth approach combining:
1. Navigator.locks disabling to prevent gotrue-js crashes
2. Global error handlers to catch unhandled rejections
3. Production-safe error reporting system
4. Boot health checks for early problem detection
5. Safe Supabase initialization with fallback stubs

## Root Cause Analysis

### The Navigator.locks Problem

The `@supabase/gotrue-js` library automatically uses the `navigator.locks` API when it detects it's available:

```javascript
// In gotrue-js source (simplified)
if ('locks' in navigator) {
  // Use navigator.locks for exclusive lock during auth operations
  await navigator.locks.request('supabase-auth', async () => {
    // Perform auth operations
  });
}
```

**The Issue**: Some browsers have `navigator.locks` defined but it fails at runtime:
- iOS Safari in private browsing mode
- Browsers with blocked third-party storage
- Older browsers with incomplete implementation
- Cross-origin iframe contexts

When `navigator.locks.request()` fails, it throws an unhandled promise rejection with the error:
```
Error: Acquiring an exclusive Navigator
```

### Why ErrorBoundary Didn't Catch It

React ErrorBoundary components **cannot** catch:
- Asynchronous code (Promises, async/await)
- Event handlers
- Errors in callbacks

The gotrue-js error occurred in an async callback (`onAuthStateChange`), so it bypassed the ErrorBoundary and crashed the entire app.

## The Permanent Fix

### Layer 1: Disable Navigator.Locks (Prevention)

**File**: `src/lib/supabase.ts`

**Solution**: Defensively disable `navigator.locks` before Supabase client creation:

```typescript
function disableNavigatorLocks(): void {
  if (typeof window === 'undefined') return;
  
  try {
    if (typeof navigator !== 'undefined' && 'locks' in navigator) {
      Object.defineProperty(navigator, 'locks', {
        value: undefined,
        writable: false,
        configurable: true
      });
    }
  } catch (error) {
    // Never throw - defensive code
  }
}

// CRITICAL: Call BEFORE creating Supabase client
disableNavigatorLocks();
```

**Why This Works**:
- gotrue-js checks `'locks' in navigator` before using it
- Setting it to `undefined` makes the check fail
- Library falls back to its alternative locking mechanism
- Zero modification to gotrue-js source code required

### Layer 2: Safe Storage Detection

**File**: `src/lib/supabase.ts`

**Solution**: Test localStorage accessibility before using it:

```typescript
function getSafeStorage(): Storage | undefined {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    }
  } catch (error) {
    // localStorage blocked or unavailable
  }
  return undefined;
}
```

**Configuration Based on Storage**:
```typescript
const storage = getSafeStorage();
const hasStorage = !!storage;

return {
  auth: {
    persistSession: hasStorage,      // Only persist if storage works
    storage: storage,                 // Pass actual storage or undefined
    autoRefreshToken: hasStorage,     // Only auto-refresh if can persist
    detectSessionInUrl: hasStorage,   // Only detect if can persist
    flowType: 'pkce'                  // Best security for modern browsers
  }
};
```

### Layer 3: Global Error Handlers

**File**: `src/lib/globalErrorHandlers.ts`

**Solution**: Catch all unhandled promise rejections globally:

```typescript
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  // CRITICAL: Prevent default to stop app from crashing
  event.preventDefault();
  
  const error = event.reason;
  
  // Log error
  console.error('[GlobalErrorHandlers] Unhandled promise rejection:', error);
  
  // Send error report to backend
  sendClientError({
    message: error?.message || 'Unhandled promise rejection',
    stack: error?.stack,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    type: 'unhandledrejection',
    isAuthRelated: isAuthError(error),
    path: window.location.pathname,
  });
  
  // For auth errors: clear storage and redirect to login
  if (isAuthError(error)) {
    clearAuthStorage();
    safeRedirect('/login?error=session_expired');
  }
});
```

**Key Features**:
- `event.preventDefault()` prevents app crash
- Production-safe error reporting (never throws)
- Auth errors trigger graceful logout
- Redirect loop prevention built-in

### Layer 4: Production-Safe Error Reporting

**Files**: 
- `src/lib/globalErrorHandlers.ts` (client)
- `api/client-error.ts` (server)

**Solution**: POST error details to backend for monitoring:

```typescript
async function sendClientError(payload: ClientErrorPayload): Promise<void> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    await fetch('/api/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
  } catch (error) {
    // CRITICAL: Never throw from error reporting
    // Silently fail to prevent cascading errors
  }
}
```

**API Endpoint** (`/api/client-error`):
- Always returns 200 (even on errors) to prevent retries
- Rate-limited per IP
- Logs to server console (ready for Sentry/LogRocket integration)
- Production-safe (never throws)

### Layer 5: Boot Health Checks

**File**: `src/lib/bootHealthCheck.ts`

**Solution**: Check critical services before app fully loads:

```typescript
export async function runBootHealthCheck(): Promise<HealthCheckResult> {
  // Check API health
  const apiCheck = await checkEndpoint('/api/health', 3000);
  
  // Check Supabase connectivity (if configured)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseCheck = supabaseUrl 
    ? await checkEndpoint(`${supabaseUrl}/rest/v1/`, 3000)
    : { status: 'skipped' };
  
  // Determine overall health
  const healthy = apiCheck.status === 'ok' && 
                  (supabaseCheck.status === 'ok' || supabaseCheck.status === 'skipped');
  
  return { healthy, checks: { api: apiCheck, supabase: supabaseCheck } };
}
```

**Integration** (`src/main.tsx`):
```typescript
// Non-blocking health check
runBootHealthCheck().then(healthResult => {
  if (!healthResult.healthy) {
    reportHealthCheckFailure(healthResult);
  }
});
```

### Layer 6: Safe Supabase Client Stub

**File**: `src/lib/supabase.ts`

**Solution**: Return a working stub client even if initialization fails:

```typescript
function createSafeSupabaseClient(): SupabaseClient {
  try {
    if (isSupabaseConfigured) {
      return createClient(supabaseUrl, supabaseAnonKey, supabaseAuthOptions);
    }
    // Fallback to local development server
    return createClient('http://localhost:54321', LOCAL_DEV_KEY, supabaseAuthOptions);
  } catch (error) {
    // CRITICAL: Last resort - return a proxy stub
    const authStub = {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      // ... other auth methods
    };
    
    return new Proxy({} as SupabaseClient, {
      get(target, prop) {
        if (prop === 'auth') return authStub;
        return () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') });
      }
    });
  }
}
```

## Verification & Testing

### Development Diagnostics

**URL**: `/diagnostics` (DEV mode only)

**Features**:
- Storage availability and accessibility status
- Navigator.locks support and disabled status
- Supabase configuration check
- API and Supabase health check results
- Real-time system diagnostics

### Testing Checklist

✅ **Chrome Desktop**
- Normal mode: App loads, auth works
- Incognito mode: App loads with limited session persistence
- Blocked cookies: App loads, shows warnings

✅ **Chrome Android**
- Normal mode: App loads, auth works
- Incognito mode: App loads with limited session persistence

✅ **Safari iOS**
- Normal mode: App loads, auth works
- Private mode: App loads without crashes (navigator.locks disabled)

✅ **Error Scenarios**
- Network offline: Shows connection banner, doesn't crash
- Supabase down: App loads with stub client, shows warnings
- Missing env vars: Shows configuration error, doesn't crash

## Production Deployment

### Environment Variables Required

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Optional Monitoring Integration

To integrate with Sentry/LogRocket, modify `api/client-error.ts`:

```typescript
// Add at top
import * as Sentry from '@sentry/node';

// In handler function
Sentry.captureException(new Error(payload.message), {
  tags: {
    type: payload.type,
    isAuthRelated: payload.isAuthRelated,
  },
  extra: {
    url: payload.url,
    path: payload.path,
    userAgent: payload.userAgent,
    stack: payload.stack,
  },
});
```

### Build Verification

```bash
npm run build
npm run preview
```

**Expected**: No errors, app loads successfully

## Why This Fix is Permanent

1. **Defense in Depth**: Multiple layers ensure even if one fails, others catch it
2. **Zero Third-Party Patches**: No gotrue-js modifications required
3. **Production-Safe**: All error handling never throws
4. **Forward Compatible**: Works with future gotrue-js versions
5. **Graceful Degradation**: App works even with limited browser support
6. **Observable**: Error reporting provides production visibility

## Monitoring Recommendations

1. **Set up error tracking** (Sentry/LogRocket) for `/api/client-error` reports
2. **Monitor health check failures** to detect infrastructure issues
3. **Track navigator.locks disable rate** to understand browser diversity
4. **Alert on repeated auth errors** to catch new auth issues early

## Summary

The permanent fix combines:
- **Prevention**: Disable problematic navigator.locks API
- **Detection**: Boot health checks and diagnostics
- **Recovery**: Global error handlers with graceful fallback
- **Visibility**: Production error reporting system
- **Resilience**: Safe stub clients when initialization fails

This multi-layered approach ensures the app never crashes from initialization errors, provides excellent debugging visibility, and gracefully handles edge cases across all browsers and network conditions.
