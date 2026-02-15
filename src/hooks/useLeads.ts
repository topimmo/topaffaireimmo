import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Lead {
  id: string;
  property_id: string;
  advertiser_id: string;
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  source: 'form' | 'phone' | 'whatsapp' | 'email';
  status: 'new' | 'contacted' | 'qualified' | 'closed' | 'spam';
  notes?: string;
  advertiser_notes?: string;
  created_at: string;
  updated_at: string;
  contacted_at?: string;
  property?: {
    title_fr: string;
  };
}

export interface LeadsFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
}

export function useLeads(filters?: LeadsFilters) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from('property_leads')
        .select(`
          *,
          property:properties(title_fr)
        `)
        .eq('advertiser_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setLeads(data as Lead[] || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateLeadStatus = async (leadId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('property_leads')
        .update({ 
          status,
          contacted_at: status === 'contacted' ? new Date().toISOString() : undefined
        })
        .eq('id', leadId);

      if (error) throw error;

      // Refresh leads
      await fetchLeads();
    } catch (err) {
      console.error('Error updating lead status:', err);
      throw err;
    }
  };

  return { leads, loading, error, refetch: fetchLeads, updateLeadStatus };
}
