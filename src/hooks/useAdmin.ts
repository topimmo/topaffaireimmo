import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

/**
 * Hook to check if the current user is an admin
 * Queries the admins table to determine admin status
 * Returns { isAdmin, loading }
 */
export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        setError(null);
        return;
      }

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
            setIsAdmin(false);
            setError(null);
          } else {
            // Other errors (network, permission, etc.) should be logged
            console.error('Error checking admin status:', error);
            setError(new Error(error.message));
            // For safety, don't grant admin access on error
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(!!data);
          setError(null);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
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
