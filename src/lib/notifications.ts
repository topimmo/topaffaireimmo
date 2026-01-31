/**
 * Admin Notifications Utility
 * Manage admin notifications (create, read, mark as read)
 */

import { supabase } from './supabase';

export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export interface AdminNotification {
  id: string;
  created_at: string;
  title: string;
  body: string;
  read_at: string | null;
  user_id: string | null;
  link?: string | null;
  notification_type: NotificationType;
}

export interface CreateNotificationInput {
  title: string;
  body: string;
  link?: string;
  notification_type?: NotificationType;
  user_id?: string; // Specific user or null for all admins
}

/**
 * Create a notification for admin(s)
 * @param input - Notification data
 * @returns Promise with success status
 */
export async function createAdminNotification(input: CreateNotificationInput): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('admin_notifications')
      .insert({
        title: input.title,
        body: input.body,
        link: input.link,
        notification_type: input.notification_type || 'info',
        user_id: input.user_id || null,
      });

    if (error) {
      console.error('Failed to create notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception creating notification:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Fetch unread notifications for the current admin
 * @returns Promise with notifications
 */
export async function fetchUnreadNotifications() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'No authenticated user' };
    }

    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .is('read_at', null)
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch unread notifications:', error);
      return { data: null, error: error.message };
    }

    return { data: data as AdminNotification[], error: null };
  } catch (error) {
    console.error('Exception fetching unread notifications:', error);
    return { data: null, error: String(error) };
  }
}

/**
 * Fetch all notifications for the current admin
 * @param limit - Number of notifications to fetch
 * @returns Promise with notifications
 */
export async function fetchAllNotifications(limit: number = 50) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'No authenticated user' };
    }

    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch notifications:', error);
      return { data: null, error: error.message };
    }

    return { data: data as AdminNotification[], error: null };
  } catch (error) {
    console.error('Exception fetching notifications:', error);
    return { data: null, error: String(error) };
  }
}

/**
 * Mark a notification as read
 * @param notificationId - Notification ID
 * @returns Promise with success status
 */
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to mark notification as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception marking notification as read:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Mark all notifications as read for the current admin
 * @returns Promise with success status
 */
export async function markAllNotificationsAsRead(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'No authenticated user' };
    }

    const { error } = await supabase
      .from('admin_notifications')
      .update({ read_at: new Date().toISOString() })
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .is('read_at', null);

    if (error) {
      console.error('Failed to mark all notifications as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception marking all notifications as read:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Count unread notifications for the current admin
 * @returns Promise with count
 */
export async function countUnreadNotifications(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return 0;
    }

    const { count, error } = await supabase
      .from('admin_notifications')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null)
      .or(`user_id.eq.${user.id},user_id.is.null`);

    if (error) {
      console.error('Failed to count unread notifications:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Exception counting unread notifications:', error);
    return 0;
  }
}
