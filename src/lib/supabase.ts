import { createClient, type SupabaseClientOptions, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Log Supabase configuration status at startup (ALWAYS log in production for debugging)
console.log('🔧 Supabase Client Initialization')
console.log('  - Environment:', import.meta.env.MODE || 'unknown')
console.log('  - URL configured:', !!supabaseUrl, supabaseUrl ? `(${supabaseUrl.substring(0, 30)}...)` : '(missing)')
console.log('  - Anon Key configured:', !!supabaseAnonKey, supabaseAnonKey ? `(${supabaseAnonKey.substring(0, 20)}...)` : '(missing)')
console.log('  - Is Configured:', isSupabaseConfigured)
console.log('  - Session Storage:', isSupabaseConfigured ? 'localStorage (cross-domain compatible)' : 'disabled')
console.log('  - Current Domain:', typeof window !== 'undefined' ? window.location.origin : 'server-side')

const supabaseAuthOptions: SupabaseClientOptions<'public'> = {
  auth: {
    // Store session in localStorage instead of cookies
    // This prevents session loss when domain changes (e.g., from vercel.app to custom domain)
    persistSession: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'topaffaireimmo-auth-token',
    // Automatically refresh tokens when they expire
    autoRefreshToken: true,
    // Detect session from URL hash or query params (email confirmations, password resets)
    detectSessionInUrl: true,
    // Flow type for better security on modern browsers
    flowType: 'pkce'
  }
}

// Create Supabase client with proper session persistence configuration
// CRITICAL: Use localStorage for session storage instead of cookies
// This ensures sessions persist across domain changes and work on all devices
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, supabaseAuthOptions)
  : createClient(
      'http://localhost:54321',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
      supabaseAuthOptions
    )

// Log warning when env vars are missing
if (!isSupabaseConfigured) {
  console.error('❌ CRITICAL: Missing Supabase environment variables!')
  console.error('   Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}
