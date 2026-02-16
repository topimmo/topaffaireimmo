import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface AdminStats {
  totalUsers: number;
  totalProperties: number;
  pendingProperties: number;
  approvedProperties: number;
  totalArtisans: number;
  unverifiedArtisans: number;
}

export interface PropertyModeration {
  id: string;
  title: string;
  user_id: string;
  status: string;
  created_at: string;
  author_name?: string;
  author_email?: string;
  city?: string;
  price?: number;
}

export interface ArtisanVerification {
  id: string;
  business_name: string;
  user_id: string;
  is_verified: boolean;
  created_at: string;
  phone: string;
  service_category?: string;
}

export interface UserManagement {
  id: string;
  email: string;
  full_name?: string;
  user_role: string;
  created_at: string;
  is_active: boolean;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  created_at: string;
  metadata?: any;
  admin_name?: string;
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get total users count
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Get total properties count
        const { count: totalProperties } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true });

        // Get pending properties count
        const { count: pendingProperties } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // Get approved properties count
        const { count: approvedProperties } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved');

        // Get total artisans count
        const { count: totalArtisans } = await supabase
          .from('artisan_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        // Get unverified artisans count
        const { count: unverifiedArtisans } = await supabase
          .from('artisan_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_verified', false)
          .eq('is_active', true);

        setStats({
          totalUsers: totalUsers || 0,
          totalProperties: totalProperties || 0,
          pendingProperties: pendingProperties || 0,
          approvedProperties: approvedProperties || 0,
          totalArtisans: totalArtisans || 0,
          unverifiedArtisans: unverifiedArtisans || 0,
        });
      } catch (err) {
        console.error('[useAdminStats] Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}

export function usePendingProperties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyModeration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          user_id,
          status,
          created_at,
          city,
          price,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const transformedData = (data || []).map((prop: any) => ({
        id: prop.id,
        title: prop.title,
        user_id: prop.user_id,
        status: prop.status,
        created_at: prop.created_at,
        city: prop.city,
        price: prop.price,
        author_name: prop.profiles?.full_name,
        author_email: prop.profiles?.email,
      }));

      setProperties(transformedData);
    } catch (err) {
      console.error('[usePendingProperties] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const approveProperty = async (propertyId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      // Use RPC function for property approval (handles all moderation logic)
      const { data, error: rpcError } = await supabase.rpc('approve_property', {
        property_id: propertyId,
      });

      if (rpcError) throw rpcError;

      // Remove from local state
      setProperties(prev => prev.filter(p => p.id !== propertyId));
      return { success: true };
    } catch (err) {
      console.error('[approveProperty] Error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  const rejectProperty = async (propertyId: string, reason?: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    // Require rejection reason (min 10 characters as per RPC function)
    if (!reason || reason.trim().length < 10) {
      return { 
        success: false, 
        error: 'Rejection reason is required and must be at least 10 characters' 
      };
    }

    try {
      // Use RPC function for property rejection (handles all moderation logic)
      const { data, error: rpcError } = await supabase.rpc('reject_property', {
        property_id: propertyId,
        reason: reason.trim(),
      });

      if (rpcError) throw rpcError;

      // Remove from local state
      setProperties(prev => prev.filter(p => p.id !== propertyId));
      return { success: true };
    } catch (err) {
      console.error('[rejectProperty] Error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  return { properties, loading, error, approveProperty, rejectProperty, refresh: fetchProperties };
}

export function useUnverifiedArtisans() {
  const { user } = useAuth();
  const [artisans, setArtisans] = useState<ArtisanVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArtisans();
  }, []);

  const fetchArtisans = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('artisan_profiles')
        .select(`
          id,
          business_name,
          user_id,
          is_verified,
          created_at,
          phone,
          service_categories:service_category_id (
            name_fr
          )
        `)
        .eq('is_verified', false)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const transformedData = (data || []).map((artisan: any) => ({
        id: artisan.id,
        business_name: artisan.business_name,
        user_id: artisan.user_id,
        is_verified: artisan.is_verified,
        created_at: artisan.created_at,
        phone: artisan.phone,
        service_category: artisan.service_categories?.name_fr,
      }));

      setArtisans(transformedData);
    } catch (err) {
      console.error('[useUnverifiedArtisans] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const verifyArtisan = async (artisanId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error: updateError } = await supabase
        .from('artisan_profiles')
        .update({ is_verified: true })
        .eq('id', artisanId);

      if (updateError) throw updateError;

      // Log the action
      const { error: auditError } = await supabase.from('admin_audit_logs').insert({
        admin_id: user.id,
        action: 'approve',
        entity_type: 'artisan',
        entity_id: artisanId,
      });

      if (auditError) {
        console.error('[verifyArtisan] Failed to log audit:', auditError);
        // Continue - audit log failure shouldn't block the operation
      }

      // Remove from local state
      setArtisans(prev => prev.filter(a => a.id !== artisanId));
      return { success: true };
    } catch (err) {
      console.error('[verifyArtisan] Error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  const rejectArtisan = async (artisanId: string, reason?: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      // For now, just log the rejection (you might want to add a rejection status)
      const { error: auditError } = await supabase.from('admin_audit_logs').insert({
        admin_id: user.id,
        action: 'reject',
        entity_type: 'artisan',
        entity_id: artisanId,
        metadata: { reason },
      });

      if (auditError) {
        console.error('[rejectArtisan] Failed to log audit:', auditError);
        // Continue - audit log failure shouldn't block the operation
      }

      // Remove from local state
      setArtisans(prev => prev.filter(a => a.id !== artisanId));
      return { success: true };
    } catch (err) {
      console.error('[rejectArtisan] Error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  return { artisans, loading, error, verifyArtisan, rejectArtisan, refresh: fetchArtisans };
}

export function useUsers(searchTerm?: string) {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('profiles')
        .select('id, email, full_name, user_role, created_at, is_active')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setUsers(data || []);
    } catch (err) {
      console.error('[useUsers] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ user_role: newRole })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log the action
      const { error: auditError } = await supabase.from('admin_audit_logs').insert({
        admin_id: user.id,
        action: 'update',
        entity_type: 'user',
        entity_id: userId,
        metadata: { field: 'user_role', new_value: newRole },
      });

      if (auditError) {
        console.error('[updateUserRole] Failed to log audit:', auditError);
        // Continue - audit log failure shouldn't block the operation
      }

      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, user_role: newRole } : u))
      );
      return { success: true };
    } catch (err) {
      console.error('[updateUserRole] Error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  const toggleUserStatus = async (userId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return { success: false, error: 'User not found' };

      const newStatus = !targetUser.is_active;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_active: newStatus })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log the action
      const { error: auditError } = await supabase.from('admin_audit_logs').insert({
        admin_id: user.id,
        action: newStatus ? 'unban' : 'ban',
        entity_type: 'user',
        entity_id: userId,
      });

      if (auditError) {
        console.error('[toggleUserStatus] Failed to log audit:', auditError);
        // Continue - audit log failure shouldn't block the operation
      }

      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, is_active: newStatus } : u))
      );
      return { success: true };
    } catch (err) {
      console.error('[toggleUserStatus] Error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  return { users, loading, error, updateUserRole, toggleUserStatus, refresh: fetchUsers };
}

export function useAuditLogs(filters?: { action?: string; entityType?: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [filters?.action, filters?.entityType]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('admin_audit_logs')
        .select(`
          id,
          admin_id,
          action,
          entity_type,
          entity_id,
          created_at,
          metadata,
          profiles:admin_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }

      if (filters?.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const transformedData = (data || []).map((log: any) => ({
        id: log.id,
        admin_id: log.admin_id,
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        created_at: log.created_at,
        metadata: log.metadata,
        admin_name: log.profiles?.full_name || 'Admin',
      }));

      setLogs(transformedData);
    } catch (err) {
      console.error('[useAuditLogs] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { logs, loading, error, refresh: fetchLogs };
}
