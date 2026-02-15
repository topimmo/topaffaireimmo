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

// PRODUCTION SAFETY: Log clear error if environment variables are missing
// Always log in production so missing config can be detected
if (!supabaseUrl || !supabaseAnonKey) {
  const isDev = import.meta.env.DEV;
  const prefix = isDev ? '❌ CRITICAL' : '⚠️ WARNING';
  
  console.error(`${prefix}: Missing Supabase environment variables!`);
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  
  if (isDev) {
    console.error('   Please set these in your .env file (see .env.example)');
  }
}

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
 * 
 * WHY: @supabase/gotrue-js automatically uses navigator.locks when available
 * but has no configuration option to disable it. The library checks for availability
 * using 'locks' in navigator, but some browsers (iOS Safari private mode, older browsers)
 * have the API present but it fails at runtime. Setting it to undefined prevents
 * gotrue-js from attempting to use it, forcing it to use the fallback mechanism.
 * 
 * ALTERNATIVE CONSIDERED: Patching gotrue-js or using a custom build was rejected
 * because it would require maintaining a fork and updating with every gotrue-js release.
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
 * PRODUCTION SAFETY: Initialize Supabase client
 * Returns null if initialization fails
 * CRITICAL: Never throws - returns null on any error
 */
function initializeSupabaseClient(): SupabaseClient | null {
  try {
    if (isSupabaseConfigured && supabaseUrl && supabaseAnonKey) {
      // CRITICAL: Wrap createClient in try-catch to prevent crashes
      try {
        const client = createClient(supabaseUrl, supabaseAnonKey, supabaseAuthOptions)
        if (import.meta.env.DEV) {
          console.log('[Supabase] Client initialized successfully')
        }
        return client
      } catch (clientError) {
        if (import.meta.env.DEV) {
          console.error('[Supabase] Failed to create client with credentials:', clientError instanceof Error ? clientError.message : 'Unknown error')
        }
        return null
      }
    }
    
    // In development without config, try fallback to local development server
    if (import.meta.env.DEV) {
      console.warn('[Supabase] No production config - attempting local development fallback')
      try {
        const client = createClient(
          'http://localhost:54321',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
          supabaseAuthOptions
        )
        console.warn('[Supabase] Using local development server')
        return client
      } catch (fallbackError) {
        console.error('[Supabase] Local development fallback failed:', fallbackError instanceof Error ? fallbackError.message : 'Unknown error')
        return null
      }
    }
    
    // Production without config - return null
    if (import.meta.env.DEV) {
      console.error('[Supabase] CRITICAL: Missing Supabase environment variables!')
      console.error('   Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
    }
    return null
  } catch (error) {
    // CRITICAL: Never throw - always return null on error
    if (import.meta.env.DEV) {
      console.error('[Supabase] FATAL: Supabase initialization failed:', error instanceof Error ? error.message : 'Unknown error')
    }
    return null
  }
}

/**
 * Supabase client instance
 * CRITICAL: Can be null if initialization fails
 * Components MUST check for null before using
 */
export let supabase: SupabaseClient | null = null

/**
 * Initialize Supabase client
 * PRODUCTION SAFETY: Returns boolean success status
 * CRITICAL: Never throws
 */
export function initSupabase(): boolean {
  try {
    supabase = initializeSupabaseClient()
    return supabase !== null
  } catch (error) {
    // CRITICAL: Never throw
    if (import.meta.env.DEV) {
      console.error('[Supabase] initSupabase() failed:', error instanceof Error ? error.message : 'Unknown error')
    }
    return false
  }
}

// Auto-initialize on module load
// This maintains backward compatibility with existing code
initSupabase()
