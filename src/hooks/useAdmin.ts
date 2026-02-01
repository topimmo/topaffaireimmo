import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AdminState {
  loading: boolean;
  isAdmin: boolean;
  role: string | null;
  error: Error | null;
}

/**
 * Hook to check if the current user is an admin
 * Queries the public.admins table to determine admin status
 * 
 * Features:
 * - Checks admin status on mount and session changes
 * - Subscribes to auth state changes (login/logout/token refresh)
 * - Prevents state updates after unmount
 * - Uses maybeSingle() to avoid errors for non-admin users
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
      if (!session) {
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
        // Query public.admins table
        // Use maybeSingle() to avoid PGRST116 error when no row exists
        const { data, error } = await supabase
          .from('admins')
          .select('role')
          .eq('user_id', session.user.id)
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
            // data will be null if no admin row exists, otherwise it will have the role
            const isAdmin = !!data;
            setState({
              loading: false,
              isAdmin,
              role: data?.role || null,
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
