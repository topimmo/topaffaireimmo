import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface DashboardStats {
  totalProperties: number;
  totalViews: number;
  totalLeads: number;
  conversionRate: number;
}

export interface RecentActivity {
  id: string;
  type: 'view' | 'lead';
  propertyTitle: string;
  propertyId: string;
  timestamp: string;
  userName?: string;
  contactType?: string;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    totalViews: 0,
    totalLeads: 0,
    conversionRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch total properties
        const { count: propertiesCount } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id);

        // Get user's property IDs for filtering
        const { data: userProperties } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', user.id);

        const propertyIds = userProperties?.map(p => p.id) || [];

        let totalViews = 0;
        let totalLeads = 0;

        if (propertyIds.length > 0) {
          // Fetch total views
          const { count: viewsCount } = await supabase
            .from('property_views')
            .select('*', { count: 'exact', head: true })
            .in('property_id', propertyIds);

          totalViews = viewsCount || 0;

          // Fetch total leads
          const { count: leadsCount } = await supabase
            .from('property_leads')
            .select('*', { count: 'exact', head: true })
            .eq('advertiser_id', user.id);

          totalLeads = leadsCount || 0;
        }

        const conversionRate = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0;

        // Note: This is a basic conversion rate (leads/views).
        // Consider using unique visitors instead of total views for more accurate metrics.
        setStats({
          totalProperties: propertiesCount || 0,
          totalViews,
          totalLeads,
          conversionRate: Number(conversionRate.toFixed(2)),
        });

        // Fetch recent activity (last 5 views and leads combined)
        if (propertyIds.length > 0) {
          const { data: recentViews } = await supabase
            .from('property_views')
            .select('id, property_id, created_at, properties(title_fr)')
            .in('property_id', propertyIds)
            .order('created_at', { ascending: false })
            .limit(5);

          const { data: recentLeads } = await supabase
            .from('property_leads')
            .select('id, property_id, name, source, created_at, properties(title_fr)')
            .eq('advertiser_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

          const viewsActivity: RecentActivity[] = (recentViews || []).map(v => ({
            id: v.id,
            type: 'view' as const,
            propertyTitle: (v.properties as any)?.title_fr || 'Propriété',
            propertyId: v.property_id,
            timestamp: v.created_at,
          }));

          const leadsActivity: RecentActivity[] = (recentLeads || []).map(l => ({
            id: l.id,
            type: 'lead' as const,
            propertyTitle: (l.properties as any)?.title_fr || 'Propriété',
            propertyId: l.property_id,
            timestamp: l.created_at,
            userName: l.name,
            contactType: l.source,
          }));

          const combined = [...viewsActivity, ...leadsActivity]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5);

          setRecentActivity(combined);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, recentActivity, loading, error };
}
