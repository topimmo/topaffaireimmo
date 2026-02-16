/**
 * Auth Debug Logger
 * 
 * This component logs auth state to the console for debugging purposes.
 * Only runs in development mode.
 * 
 * Add this to your App.tsx to enable auth debugging:
 * import { AuthDebugLogger } from '@/components/AuthDebugLogger'
 * 
 * Then inside <AuthProvider>:
 * <AuthDebugLogger />
 */

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/lib/supabase';

export function AuthDebugLogger() {
  const { user, profile, session, role, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  useEffect(() => {
    // Only log in development mode
    if (!import.meta.env.DEV) return;

    console.group('🔐 Auth State Debug');
    console.log('Loading:', loading);
    console.log('Admin Loading:', adminLoading);
    console.log('User:', user ? {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    } : null);
    console.log('Profile:', profile ? {
      id: profile.id,
      full_name: profile.full_name,
      user_role: profile.user_role,
      is_active: profile.is_active,
    } : null);
    console.log('Session:', session ? {
      access_token: session.access_token.substring(0, 20) + '...',
      refresh_token: session.refresh_token ? 'present' : 'missing',
      expires_at: session.expires_at,
      expires_in: session.expires_in,
    } : null);
    console.log('Role:', role);
    console.log('Is Admin (from RPC):', isAdmin);
    console.groupEnd();
  }, [user, profile, session, role, isAdmin, loading, adminLoading]);

  useEffect(() => {
    if (!import.meta.env.DEV || !supabase) return;

    // Log all auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.group('🔄 Auth State Change');
      console.log('Event:', event);
      console.log('Session:', session ? {
        user_id: session.user?.id,
        expires_at: session.expires_at,
      } : null);
      console.groupEnd();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // This component doesn't render anything
  return null;
}
