import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { isValidUuid } from '@/lib/utils';
import { Session } from '@supabase/supabase-js';

interface AdminState {
  loading: boolean;
  isAdmin: boolean;
  role: string | null;
  error: Error | null;
}

/**
 * Hook to check if the current user is an admin
 * Checks profiles.user_role field (single source of truth for permissions)
 * 
 * Features:
 * - Checks admin status on mount and session changes
 * - Subscribes to auth state changes (login/logout/token refresh)
 * - Prevents state updates after unmount
 * - Uses profiles.user_role as the ONLY source of truth
 * 
 * Returns { loading, isAdmin, role, error }
 */
export function useAdmin() {
  const [state, setState] = useState<AdminState>({
    loading: true,
    isAdmin: false,
    role: null,
    error: null,
  });

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true;

    /**
     * Check admin status for a given session
     */
    async function checkAdminStatus(session: Session | null) {
      // Set loading to true at the start of any check
      // This prevents redirects during async operations
      if (isMountedRef.current) {
        setState(prevState => ({
          ...prevState,
          loading: true,
        }));
      }

      // If no session, user is not admin
        if (!session || !isValidUuid(session.user.id)) {
          if (isMountedRef.current) {
            setState({
              loading: false,
            isAdmin: false,
            role: null,
            error: null,
          });
        }
        return;
      }

      try {
        // Query profiles table for user_role (single source of truth)
        const { data, error } = await supabase
          .from('profiles')
          .select('user_role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (isMountedRef.current) {
          if (error) {
            // Handle query errors
            console.error('[useAdmin] Error checking admin status:', error);
            setState({
              loading: false,
              isAdmin: false,
              role: null,
              error: new Error(error.message),
            });
          } else {
            // Check if user_role is 'admin'
            const isAdmin = data?.user_role === 'admin';
            setState({
              loading: false,
              isAdmin,
              role: data?.user_role || null,
              error: null,
            });
          }
        }
      } catch (err) {
        // Handle unexpected exceptions
        console.error('[useAdmin] Exception checking admin status:', err);
        if (isMountedRef.current) {
          setState({
            loading: false,
            isAdmin: false,
            role: null,
            error: err instanceof Error ? err : new Error('Unknown error'),
          });
        }
      }
    }

    // Initial check: get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAdminStatus(session);
    });

    // Subscribe to auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAdminStatus(session);
    });

    // Cleanup: unsubscribe and mark as unmounted
    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
