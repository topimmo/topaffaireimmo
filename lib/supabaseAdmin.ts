/**
 * Supabase Admin Client
 * 
 * This client uses the service role key to bypass RLS policies.
 * ONLY use this on the server-side (API routes, serverless functions).
 * NEVER expose this client or the service role key to the client-side.
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables (server-side only)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Debug log for ENV variables
console.error('[supabaseAdmin] ENV Variables Check:');
console.error(`  SUPABASE_URL: ${supabaseUrl ? 'SET (length: ' + supabaseUrl.length + ')' : 'MISSING'}`);
console.error(`  SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? 'SET (length: ' + supabaseServiceRoleKey.length + ')' : 'MISSING'}`);

if (!supabaseUrl) {
  const errorMsg = 'Missing SUPABASE_URL or VITE_SUPABASE_URL environment variable';
  console.error(`[supabaseAdmin] ${errorMsg}`);
  throw new Error(errorMsg);
}

if (!supabaseServiceRoleKey) {
  const errorMsg = 'Missing SUPABASE_SERVICE_ROLE_KEY environment variable';
  console.error(`[supabaseAdmin] ${errorMsg}`);
  throw new Error(errorMsg);
}

/**
 * Supabase admin client with service role key
 * This client bypasses Row Level Security (RLS) policies
 * Use with caution and only on the server-side
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
