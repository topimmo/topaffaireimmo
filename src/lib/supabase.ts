import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Log Supabase configuration status at startup (ALWAYS log in production for debugging)
console.log('🔧 Supabase Client Initialization')
console.log('  - Environment:', import.meta.env.MODE || 'unknown')
console.log('  - URL configured:', !!supabaseUrl, supabaseUrl ? `(${supabaseUrl.substring(0, 30)}...)` : '(missing)')
console.log('  - Anon Key configured:', !!supabaseAnonKey, supabaseAnonKey ? `(${supabaseAnonKey.substring(0, 20)}...)` : '(missing)')
console.log('  - Is Configured:', isSupabaseConfigured)

// Create Supabase client only when env vars are properly configured
// When not configured, we still export a client to avoid null checks everywhere,
// but it uses a local-only URL that won't make external requests
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('http://localhost:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0')

// Log warning when env vars are missing
if (!isSupabaseConfigured) {
  console.error('❌ CRITICAL: Missing Supabase environment variables!')
  console.error('   Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}
