/**
 * Audit Logging Utility
 * Logs admin actions to the admin_audit_logs table
 */

import { supabase } from './supabase';

export type AuditAction = 'approve' | 'reject' | 'delete' | 'feature' | 'unfeature' | 'update' | 'create' | 'bulk_action';
export type AuditEntityType = 'property' | 'user' | 'page' | 'category' | 'settings' | 'location' | 'other';

export interface AuditLogEntry {
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an admin action to the audit log
 * @param entry - The audit log entry to create
 * @returns Promise with success status
 */
export async function logAdminAction(entry: AuditLogEntry): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Cannot log audit action: No authenticated user');
      return { success: false, error: 'No authenticated user' };
    }

    const { error } = await supabase
      .from('admin_audit_logs')
      .insert({
        admin_id: user.id,
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        metadata: entry.metadata || {},
      });

    if (error) {
      console.error('Failed to log admin action:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception logging admin action:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Fetch recent audit logs
 * @param limit - Number of logs to fetch
 * @param entityType - Optional filter by entity type
 * @returns Promise with audit logs
 */
export async function fetchAuditLogs(limit: number = 50, entityType?: AuditEntityType) {
  try {
    let query = supabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Exception fetching audit logs:', error);
    return { data: null, error: String(error) };
  }
}

/**
 * Fetch audit logs for a specific entity
 * @param entityType - Entity type
 * @param entityId - Entity ID
 * @returns Promise with audit logs
 */
export async function fetchEntityAuditLogs(entityType: AuditEntityType, entityId: string) {
  try {
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch entity audit logs:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Exception fetching entity audit logs:', error);
    return { data: null, error: String(error) };
  }
}
