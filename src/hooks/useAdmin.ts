import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { logger, createCorrelatedLogger } from '@/lib/logger';

/**
 * Hook to check if the current user is an admin
 * Queries the admins table to determine admin status
 * Returns { isAdmin, loading, error }
 */
export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function checkAdminStatus() {
      const log = createCorrelatedLogger('useAdmin');

      if (!user) {
        log.debug('No user, not admin');
        setIsAdmin(false);
        setLoading(false);
        setError(null);
        return;
      }

      log.info('Checking admin status', { userId: user.id });

      try {
        // Query admins table to check if user is an admin
        const { data, error } = await supabase
          .from('admins')
          .select('user_id')
          .eq('user_id', user.id)
          .single();

        if (error) {
          // PGRST116 is "not found" error, which is expected for non-admins
          if (error.code === 'PGRST116') {
            log.debug('User is not admin (not in admins table)', { userId: user.id });
            setIsAdmin(false);
            setError(null);
          } else {
            // Other errors (network, permission, etc.) should be logged
            log.error('Error checking admin status', error);
            setError(new Error(error.message));
            // For safety, don't grant admin access on error
            setIsAdmin(false);
          }
        } else {
          const adminStatus = !!data;
          log.info('Admin status checked', { userId: user.id, isAdmin: adminStatus });
          setIsAdmin(adminStatus);
          setError(null);
        }
      } catch (err) {
        log.error('Exception checking admin status', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [user]);

  return { isAdmin, loading, error };
}
