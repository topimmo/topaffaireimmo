/**
 * Supabase client re-export
 * 
 * This file provides a clean export of the Supabase client
 * for use throughout the application.
 * 
 * The actual client is configured in ./supabase.ts
 */
export { supabase, isSupabaseConfigured } from './supabase';
export { supabase as default } from './supabase';
