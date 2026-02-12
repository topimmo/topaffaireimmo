import { createClient, type SupabaseClientOptions, SupabaseClient } from '@supabase/supabase-js'

/**
 * PRODUCTION SAFETY: Defensive environment variable access
 * Never throws, returns undefined for missing variables
 */
function getEnvVar(key: string): string | undefined {
  try {
    return import.meta.env?.[key]
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`[Supabase] Failed to read env var ${key}:`, error instanceof Error ? error.message : 'Unknown error')
    }
    return undefined
  }
}

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL')
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY')

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

/**
 * PRODUCTION SAFETY: Defensively disable navigator.locks to prevent gotrue-js crashes
 * This prevents "Error: Acquiring an exclusive Navigator" on browsers where
 * navigator.locks is unsupported or failing (e.g., private browsing, older browsers)
 * 
 * CRITICAL: Must be called BEFORE creating Supabase client
 * - Only runs in browser (typeof window !== 'undefined')
 * - Never throws (wrapped in try/catch)
 * - Logs only in DEV mode
 */
function disableNavigatorLocks(): void {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  try {
    // Check if navigator.locks exists
    if (typeof navigator !== 'undefined' && 'locks' in navigator) {
      // Defensively disable navigator.locks by setting it to undefined
      // This prevents @supabase/gotrue-js from attempting to use it
      Object.defineProperty(navigator, 'locks', {
        value: undefined,
        writable: false,
        configurable: true
      });

      if (import.meta.env.DEV) {
        console.log('[Supabase] Navigator.locks disabled to prevent gotrue-js crashes');
      }
    }
  } catch (error) {
    // CRITICAL: Never throw - this is defensive code
    if (import.meta.env.DEV) {
      console.warn('[Supabase] Failed to disable navigator.locks:', error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

// CRITICAL: Disable navigator.locks BEFORE creating Supabase client
disableNavigatorLocks();

/**
 * PRODUCTION SAFETY: Safe storage accessor
 * Returns undefined if localStorage is not available
 */
function getSafeStorage(): Storage | undefined {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Test if localStorage is actually accessible (can be blocked in private mode)
      const testKey = '__storage_test__'
      window.localStorage.setItem(testKey, 'test')
      window.localStorage.removeItem(testKey)
      return window.localStorage
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[Supabase] localStorage not accessible:', error instanceof Error ? error.message : 'Unknown error')
    }
  }
  return undefined
}

/**
 * PRODUCTION SAFETY: Create safe auth options based on storage availability
 * If storage is not available (private mode, blocked storage, lock issues):
 * - Set persistSession to false
 * - Set storage to undefined
 * - Disable autoRefreshToken (can't work without persistence)
 * - Disable detectSessionInUrl (requires storage to persist)
 */
function createSafeAuthOptions(): SupabaseClientOptions<'public'> {
  const storage = getSafeStorage();
  const hasStorage = !!storage;

  if (!hasStorage && import.meta.env.DEV) {
    console.warn('[Supabase] Storage not available - disabling session persistence');
  }

  return {
    auth: {
      // CRITICAL: Only persist session if storage is available
      persistSession: hasStorage,
      storage: storage,
      storageKey: 'topaffaireimmo-auth-token',
      // CRITICAL: Only auto-refresh tokens if we can persist them
      autoRefreshToken: hasStorage,
      // CRITICAL: Only detect session in URL if we can persist it
      detectSessionInUrl: hasStorage,
      // Flow type for better security on modern browsers
      flowType: 'pkce'
    }
  };
}

// PRODUCTION SAFETY: Safe console logging - never throws
// Only log in development mode to reduce production noise
if (import.meta.env.DEV) {
  try {
    const storage = getSafeStorage();
    const hasStorage = !!storage;
    
    console.log('🔧 Supabase Client Initialization')
    console.log('  - Environment:', getEnvVar('MODE') || 'unknown')
    console.log('  - URL configured:', !!supabaseUrl, supabaseUrl ? `(${supabaseUrl.substring(0, 30)}...)` : '(missing)')
    console.log('  - Anon Key configured:', !!supabaseAnonKey, supabaseAnonKey ? `(${supabaseAnonKey.substring(0, 20)}...)` : '(missing)')
    console.log('  - Is Configured:', isSupabaseConfigured)
    console.log('  - Storage Available:', hasStorage)
    console.log('  - Session Storage:', hasStorage ? 'localStorage (with persistence)' : 'disabled (no persistence)')
    console.log('  - Auto Refresh Token:', hasStorage)
    console.log('  - Detect Session In URL:', hasStorage)
    console.log('  - Current Domain:', typeof window !== 'undefined' ? window.location.origin : 'server-side')
  } catch (error) {
    // Never let logging crash the app
  }
}

const supabaseAuthOptions: SupabaseClientOptions<'public'> = createSafeAuthOptions();

/**
 * PRODUCTION SAFETY: Safe Supabase client creation
 * CRITICAL: Never throws - returns a client even if environment is misconfigured
 * Fallback client will fail gracefully at runtime
 */
function createSafeSupabaseClient(): SupabaseClient {
  try {
    if (isSupabaseConfigured && supabaseUrl && supabaseAnonKey) {
      // CRITICAL: Wrap createClient in try-catch to prevent crashes
      try {
        return createClient(supabaseUrl, supabaseAnonKey, supabaseAuthOptions)
      } catch (clientError) {
        if (import.meta.env.DEV) {
          console.error('[Supabase] Failed to create client with credentials:', clientError instanceof Error ? clientError.message : 'Unknown error')
        }
        throw clientError; // Re-throw to be caught by outer catch
      }
    }
    
    // Fallback to local development server
    if (import.meta.env.DEV) {
      console.warn('[Supabase] Using fallback local development configuration')
    }
    try {
      return createClient(
        'http://localhost:54321',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        supabaseAuthOptions
      )
    } catch (fallbackError) {
      if (import.meta.env.DEV) {
        console.error('[Supabase] Fallback client creation failed:', fallbackError instanceof Error ? fallbackError.message : 'Unknown error')
      }
      throw fallbackError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Supabase] CRITICAL: Failed to create Supabase client:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    // CRITICAL: Last resort - create a minimal stub client that won't crash but will fail gracefully
    // This ensures the app can still load even if Supabase is completely broken
    try {
      return createClient(
        'http://localhost:54321',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        {} // Empty options as fallback
      )
    } catch (finalError) {
      // CRITICAL: This should never happen, but if it does, return a proxy stub
      if (import.meta.env.DEV) {
        console.error('[Supabase] FATAL: Even fallback client creation failed, using proxy stub')
      }
      
      // Return a proxy that provides method stubs for common Supabase operations
      const errorStub = () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') })
      
      // Create a stub auth object with proper methods that return null session
      const authStub = {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase not initialized') }),
        signInWithOtp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase not initialized') }),
        signUp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase not initialized') }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      };
      
      return new Proxy({} as SupabaseClient, {
        get(target, prop) {
          // Handle auth property specially to return proper session stubs
          if (prop === 'auth') {
            return authStub;
          }
          // Handle common property access patterns
          if (prop === 'from' || prop === 'storage') {
            return () => new Proxy({}, {
              get() {
                return errorStub
              }
            })
          }
          // For any other property, return error stub
          if (import.meta.env.DEV) {
            console.warn(`[Supabase] Attempted to access '${String(prop)}' but client is not initialized`)
          }
          return errorStub
        }
      })
    }
  }
}

// Create Supabase client with proper session persistence configuration
// CRITICAL: Use localStorage for session storage instead of cookies
// This ensures sessions persist across domain changes and work on all devices
export const supabase: SupabaseClient = createSafeSupabaseClient()

// Log warning when env vars are missing (non-blocking, DEV only)
if (!isSupabaseConfigured && import.meta.env.DEV) {
  try {
    console.error('❌ CRITICAL: Missing Supabase environment variables!')
    console.error('   Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  } catch (error) {
    // Never let logging crash the app
  }
}
