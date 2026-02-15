import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AnalyticsData {
  viewsOverTime: { date: string; count: number }[];
  leadsOverTime: { date: string; count: number }[];
  topProperties: { id: string; title: string; views: number; leads: number }[];
  contactClicks: { phone: number; whatsapp: number; email: number };
}

export function useAnalytics(days: number = 30) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    viewsOverTime: [],
    leadsOverTime: [],
    topProperties: [],
    contactClicks: { phone: 0, whatsapp: 0, email: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Get user's property IDs
        const { data: userProperties } = await supabase
          .from('properties')
          .select('id, title_fr')
          .eq('owner_id', user.id);

        const propertyIds = userProperties?.map(p => p.id) || [];

        if (propertyIds.length === 0) {
          setLoading(false);
          return;
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString();

        // Fetch views over time
        const { data: viewsData } = await supabase
          .from('property_views')
          .select('created_at')
          .in('property_id', propertyIds)
          .gte('created_at', startDateStr)
          .order('created_at', { ascending: true });

        // Group views by day
        const viewsByDay = (viewsData || []).reduce((acc, view) => {
          const date = new Date(view.created_at).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const viewsOverTime = Object.entries(viewsByDay).map(([date, count]) => ({
          date,
          count,
        }));

        // Fetch leads over time
        const { data: leadsData } = await supabase
          .from('property_leads')
          .select('created_at')
          .eq('advertiser_id', user.id)
          .gte('created_at', startDateStr)
          .order('created_at', { ascending: true });

        // Group leads by day
        const leadsByDay = (leadsData || []).reduce((acc, lead) => {
          const date = new Date(lead.created_at).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const leadsOverTime = Object.entries(leadsByDay).map(([date, count]) => ({
          date,
          count,
        }));

        // Fetch top properties by views
        const { data: allViews } = await supabase
          .from('property_views')
          .select('property_id')
          .in('property_id', propertyIds);

        const { data: allLeads } = await supabase
          .from('property_leads')
          .select('property_id')
          .eq('advertiser_id', user.id);

        // Count views and leads per property
        const viewsPerProperty = (allViews || []).reduce((acc, view) => {
          acc[view.property_id] = (acc[view.property_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const leadsPerProperty = (allLeads || []).reduce((acc, lead) => {
          acc[lead.property_id] = (acc[lead.property_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const topProperties = userProperties
          ?.map(p => ({
            id: p.id,
            title: p.title_fr || 'Propriété',
            views: viewsPerProperty[p.id] || 0,
            leads: leadsPerProperty[p.id] || 0,
          }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 5) || [];

        // Fetch contact clicks
        const { data: clicksData } = await supabase
          .from('property_contact_clicks')
          .select('contact_type')
          .in('property_id', propertyIds);

        const contactClicks = (clicksData || []).reduce(
          (acc, click) => {
            if (click.contact_type === 'phone') acc.phone++;
            else if (click.contact_type === 'whatsapp') acc.whatsapp++;
            else if (click.contact_type === 'email') acc.email++;
            return acc;
          },
          { phone: 0, whatsapp: 0, email: 0 }
        );

        setAnalytics({
          viewsOverTime,
          leadsOverTime,
          topProperties,
          contactClicks,
        });
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [days]);

  return { analytics, loading, error };
}
