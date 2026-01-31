/**
 * useNotifications hook
 * Provides real-time notifications for admin users
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchUnreadNotifications,
  countUnreadNotifications,
  type AdminNotification,
} from '@/lib/notifications';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Initial fetch
    loadNotifications();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('admin_notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_notifications',
          filter: 'user_id=is.null',
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadNotifications = async () => {
    setLoading(true);
    
    const [notificationsResult, count] = await Promise.all([
      fetchUnreadNotifications(),
      countUnreadNotifications(),
    ]);

    if (notificationsResult.data) {
      setNotifications(notificationsResult.data);
    }
    setUnreadCount(count);
    setLoading(false);
  };

  const refresh = () => {
    loadNotifications();
  };

  return {
    notifications,
    unreadCount,
    loading,
    refresh,
  };
}
