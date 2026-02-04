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
  images?: string[] | null;
  title_fr?: string | null;
  title_ar?: string | null;
  address?: string | null;
  status?: string;
}

export function useProperties(filters?: PropertyFilters) {
  const [properties, setProperties] = useState<PropertyWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);

    let hasCompleted = false;

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (!hasCompleted) {
        console.warn('[useProperties] Loading timeout - setting loading to false');
        hasCompleted = true;
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    try {
      let query = supabase
        .from('properties')
        .select(`
          *,
          city:cities(id, name_fr, name_ar),
          neighborhood:neighborhoods(id, name_fr, name_ar),
          owner:profiles!properties_owner_id_fkey(id, full_name, phone, agency_name, advertiser_type)
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

      // Default: only published properties for public viewing
      // Published = approved by admin AND live on the site (not pending/approved but unpublished)
      // When owner_id is specified, users see their own properties regardless of status
      if (!filters?.owner_id && !filters?.status) {
        query = query.eq('status', 'published').or('is_archived.is.null,is_archived.eq.false');
        console.log('📋 [useProperties] Applying public filter: status=published, is_archived IS DISTINCT FROM true');
      }

      query = query.order('created_at', { ascending: false });

      const { data, error: fetchError, count: totalCount } = await query;

      if (fetchError) throw fetchError;

      console.log(`✅ [useProperties] Fetched ${data?.length || 0} properties (total: ${totalCount || 0})`);
      if (data && data.length > 0) {
        const statusCounts = data.reduce((acc, prop) => {
          const status = (prop as PropertyWithRelations).status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log('📊 [useProperties] Status distribution:', statusCounts);
      }

      setProperties(data as PropertyWithRelations[] || []);
      setCount(totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      clearTimeout(loadingTimeout);
      if (!hasCompleted) {
        hasCompleted = true;
        setLoading(false);
      }
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
            owner:profiles!properties_owner_id_fkey(id, full_name, phone, email, agency_name, agency_logo, advertiser_type)
          `)
          .eq('id', id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        
        if (!data) {
          throw new Error('Property not found');
        }

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
  const [properties, setProperties] = useState<PropertyWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    let hasCompleted = false;
    
    const loadingTimeout = setTimeout(() => {
      if (!isCancelled && !hasCompleted) {
        console.warn('[useFeaturedProperties] Loading timeout');
        hasCompleted = true;
        setLoading(false);
      }
    }, 10000);

    const fetchFeaturedProperties = async () => {
      try {
        // First, fetch real featured properties ordered by rank
        const { data: featuredData, error: featuredError } = await supabase
          .from('properties')
          .select(`
            *,
            city:cities(id, name_fr, name_ar),
            neighborhood:neighborhoods(id, name_fr, name_ar),
            owner:profiles!properties_owner_id_fkey(id, full_name, phone, agency_name, advertiser_type)
          `)
          .eq('featured', true)
          .eq('status', 'published')
          .order('featured_rank', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(limit);

        if (isCancelled) return;

        if (featuredError) {
          console.error('Error loading featured properties:', featuredError);
        }

        const realFeatured = (featuredData as PropertyWithRelations[] || []).map(prop => ({
          ...prop,
          isDummy: false
        }));

        // If we have enough real featured properties, use them
        if (realFeatured.length >= limit) {
          setProperties(realFeatured.slice(0, limit));
        } else {
          // Otherwise, fetch dummy properties to fill the gap
          const neededCount = limit - realFeatured.length;
          
          const { data: dummyData, error: dummyError } = await supabase
            .from('dummy_properties')
            .select(`
              id,
              transaction_type,
              property_type,
              city_id,
              neighborhood_id,
              title_fr,
              title_ar,
              description_fr,
              description_ar,
              price,
              area,
              bedrooms,
              bathrooms,
              images,
              featured_rank,
              city:cities(id, name_fr, name_ar),
              neighborhood:neighborhoods(id, name_fr, name_ar)
            `)
            .eq('is_active', true)
            .order('featured_rank', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(neededCount);

          if (isCancelled) return;

          if (dummyError) {
            console.error('Error loading dummy properties:', dummyError);
          }

          // Map dummy properties to match PropertyWithRelations interface
          const dummyProperties = (dummyData || []).map(dummy => ({
            ...dummy,
            featured: false, // Dummy properties should not show featured badge
            isDummy: true,
            status: 'published',
            owner_id: null,
            created_at: dummy.created_at || new Date().toISOString(),
            updated_at: dummy.created_at || new Date().toISOString()
          } as PropertyWithRelations & { isDummy: boolean }));

          // Combine real featured and dummy properties
          setProperties([...realFeatured, ...dummyProperties]);
        }
      } catch (error) {
        if (isCancelled) return;
        console.error('Exception loading featured properties:', error);
        setProperties([]);
      } finally {
        clearTimeout(loadingTimeout);
        if (!isCancelled && !hasCompleted) {
          hasCompleted = true;
          setLoading(false);
        }
      }
    };

    fetchFeaturedProperties();

    return () => {
      isCancelled = true;
      clearTimeout(loadingTimeout);
    };
  }, [limit]);

  return { properties, loading };
}

export function useLatestProperties(limit = 12) {
  const [properties, setProperties] = useState<PropertyWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    let hasCompleted = false;
    
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (!isCancelled && !hasCompleted) {
        console.warn('[useLatestProperties] Loading timeout - setting loading to false');
        hasCompleted = true;
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    const fetchLatest = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select(`
            *,
            city:cities(id, name_fr, name_ar),
            owner:profiles!properties_owner_id_fkey(id, full_name, agency_name, advertiser_type)
          `)
          // Only show published properties on public site (not pending/approved)
          .eq('status', 'published')
          .or('is_archived.is.null,is_archived.eq.false')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (isCancelled) return;

        if (error) {
          console.error('Error loading latest properties:', error);
          setProperties([]);
        } else {
          setProperties(data as PropertyWithRelations[] || []);
        }
      } catch (error) {
        if (isCancelled) return;
        console.error('Exception loading latest properties:', error);
        setProperties([]);
      } finally {
        clearTimeout(loadingTimeout);
        if (!isCancelled && !hasCompleted) {
          hasCompleted = true;
          setLoading(false);
        }
      }
    };

    fetchLatest();

    return () => {
      isCancelled = true;
      clearTimeout(loadingTimeout);
    };
  }, [limit]);

  return { properties, loading };
}

export function useMyProperties() {
  const [properties, setProperties] = useState<PropertyWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    let hasCompleted = false;
    
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (!isCancelled && !hasCompleted) {
        console.warn('[useMyProperties] Loading timeout - setting loading to false');
        hasCompleted = true;
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    const fetchMyProperties = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          if (!isCancelled && !hasCompleted) {
            hasCompleted = true;
            setLoading(false);
          }
          return;
        }

        // Filter by created_by OR owner_id to show all user's listings
        const { data, error } = await supabase
          .from('properties')
          .select(`
            *,
            city:cities(id, name_fr, name_ar)
          `)
          .or(`created_by.eq.${user.id},owner_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (isCancelled) return;

        if (error) {
          console.error('Error loading user properties:', error);
          setProperties([]);
        } else {
          setProperties(data as PropertyWithRelations[] || []);
        }
      } catch (error) {
        if (isCancelled) return;
        console.error('Exception loading user properties:', error);
        setProperties([]);
      } finally {
        clearTimeout(loadingTimeout);
        if (!isCancelled && !hasCompleted) {
          hasCompleted = true;
          setLoading(false);
        }
      }
    };

    fetchMyProperties();

    return () => {
      isCancelled = true;
      clearTimeout(loadingTimeout);
    };
  }, []);

  return { properties, loading };
}
