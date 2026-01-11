import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Property, City, Neighborhood, PropertyType } from '@/types/supabase';

export interface PropertyFilters {
  transaction_type?: 'sale' | 'rent';
  property_type?: string;
  city_id?: number;
  neighborhood_id?: number;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  bedrooms?: number;
  status?: string;
  featured?: boolean;
  owner_id?: string;
}

export interface PropertyWithRelations extends Property {
  city?: City;
  neighborhood?: Neighborhood;
  owner?: {
    id: string;
    full_name: string | null;
    phone: string | null;
    agency_name: string | null;
    advertiser_type: string | null;
  };
}

export function useProperties(filters?: PropertyFilters) {
  const [properties, setProperties] = useState<PropertyWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('properties')
        .select(`
          *,
          city:cities(id, name_fr, name_ar),
          neighborhood:neighborhoods(id, name_fr, name_ar),
          owner:profiles(id, full_name, phone, agency_name, advertiser_type)
        `, { count: 'exact' });

      // Apply filters
      if (filters?.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type);
      }
      if (filters?.property_type) {
        query = query.eq('property_type', filters.property_type);
      }
      if (filters?.city_id) {
        query = query.eq('city_id', filters.city_id);
      }
      if (filters?.neighborhood_id) {
        query = query.eq('neighborhood_id', filters.neighborhood_id);
      }
      if (filters?.min_price) {
        query = query.gte('price', filters.min_price);
      }
      if (filters?.max_price) {
        query = query.lte('price', filters.max_price);
      }
      if (filters?.min_area) {
        query = query.gte('area', filters.min_area);
      }
      if (filters?.max_area) {
        query = query.lte('area', filters.max_area);
      }
      if (filters?.bedrooms) {
        query = query.eq('bedrooms', filters.bedrooms);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.featured !== undefined) {
        query = query.eq('featured', filters.featured);
      }
      if (filters?.owner_id) {
        query = query.eq('owner_id', filters.owner_id);
      }

      // Default: only approved properties unless owner_id is specified
      if (!filters?.owner_id && !filters?.status) {
        query = query.eq('status', 'approved');
      }

      query = query.order('created_at', { ascending: false });

      const { data, error: fetchError, count: totalCount } = await query;

      if (fetchError) throw fetchError;

      setProperties(data as PropertyWithRelations[] || []);
      setCount(totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return { properties, loading, error, count, refetch: fetchProperties };
}

export function useProperty(id: string | undefined) {
  const [property, setProperty] = useState<PropertyWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchProperty = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('properties')
          .select(`
            *,
            city:cities(id, name_fr, name_ar, region_fr, region_ar),
            neighborhood:neighborhoods(id, name_fr, name_ar),
            owner:profiles(id, full_name, phone, email, agency_name, agency_logo, advertiser_type)
          `)
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        // Increment view count
        await supabase
          .from('properties')
          .update({ views_count: (data?.views_count || 0) + 1 })
          .eq('id', id);

        setProperty(data as PropertyWithRelations);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  return { property, loading, error };
}

export function useFeaturedProperties(limit = 6) {
  return useProperties({ featured: true, status: 'approved' });
}

export function useLatestProperties(limit = 12) {
  const [properties, setProperties] = useState<PropertyWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      const { data } = await supabase
        .from('properties')
        .select(`
          *,
          city:cities(id, name_fr, name_ar),
          owner:profiles(id, full_name, agency_name, advertiser_type)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(limit);

      setProperties(data as PropertyWithRelations[] || []);
      setLoading(false);
    };

    fetchLatest();
  }, [limit]);

  return { properties, loading };
}

export function useMyProperties() {
  const [properties, setProperties] = useState<PropertyWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyProperties = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('properties')
        .select(`
          *,
          city:cities(id, name_fr, name_ar)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      setProperties(data as PropertyWithRelations[] || []);
      setLoading(false);
    };

    fetchMyProperties();
  }, []);

  return { properties, loading };
}
