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

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Query admins table to check if user is an admin
        const { data, error } = await supabase
          .from('admins')
          .select('user_id')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected for non-admins
          console.error('Error checking admin status:', error);
        }

        setIsAdmin(!!data);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [user]);

  return { isAdmin, loading };
}
