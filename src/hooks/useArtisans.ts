import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface ArtisanProfile {
  id: string;
  user_id: string;
  business_name: string;
  description_fr?: string;
  description_ar?: string;
  phone: string;
  whatsapp?: string;
  city_id?: number; // FK to cities table
  is_verified: boolean;
  is_boosted: boolean;
  created_at: string;
  avatar_url?: string;
  // Joined data
  service_category?: {
    id: string;
    name_fr: string;
    name_ar: string;
    slug: string;
  };
  city?: {
    id: number;
    name_fr: string;
    name_ar: string;
  };
}

export interface ArtisanFilters {
  serviceCategoryId?: string;
  cityId?: number;
  isVerified?: boolean;
  minRating?: number;
  searchTerm?: string;
}

/**
 * Hook to fetch artisans with optional filters
 */
export function useArtisans(filters?: ArtisanFilters) {
  const [artisans, setArtisans] = useState<ArtisanProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtisans = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('artisan_profiles')
          .select(`
            id,
            user_id,
            business_name,
            description_fr,
            description_ar,
            phone,
            whatsapp,
            city_id,
            is_verified,
            is_boosted,
            created_at,
            avatar_url,
            service_categories:service_category_id (
              id,
              name_fr,
              name_ar,
              slug
            ),
            cities:city_id (
              id,
              name_fr,
              name_ar
            )
          `)
          .eq('is_active', true);

        // Apply filters
        if (filters?.serviceCategoryId) {
          query = query.eq('service_category_id', filters.serviceCategoryId);
        }
        // NOTE: City filtering requires joining through neighborhoods
        // For now, we'll filter client-side until we optimize the query
        if (filters?.isVerified !== undefined) {
          query = query.eq('is_verified', filters.isVerified);
        }
        if (filters?.searchTerm) {
          query = query.ilike('business_name', `%${filters.searchTerm}%`);
        }

        query = query
          .order('is_boosted', { ascending: false })
          .order('created_at', { ascending: false });

        const { data, error: fetchError } = await query;

        if (fetchError) {
          console.error('[useArtisans] Error fetching artisans:', fetchError);
          setError(fetchError.message);
          setArtisans([]);
        } else {
          // Transform data
          let transformedData = (data || []).map((artisan: any) => ({
            ...artisan,
            service_category: artisan.service_categories,
            city: artisan.cities,
          }));

          // Apply client-side filters
          if (filters?.cityId) {
            transformedData = transformedData.filter(
              (a) => a.city_id === filters.cityId
            );
          }

          if (filters?.minRating) {
            transformedData = transformedData.filter(
              (a) => (a.profiles?.rating || 0) >= filters.minRating!
            );
          }

          setArtisans(transformedData);
        }
      } catch (err) {
        console.error('[useArtisans] Unexpected error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setArtisans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArtisans();
  }, [
    filters?.serviceCategoryId,
    filters?.cityId,
    filters?.isVerified,
    filters?.minRating,
    filters?.searchTerm,
  ]);

  return { artisans, loading, error };
}

/**
 * Hook to fetch a single artisan by ID
 */
export function useArtisan(id: string) {
  const [artisan, setArtisan] = useState<ArtisanProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchArtisan = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('artisan_profiles')
          .select(`
            id,
            user_id,
            business_name,
            description_fr,
            description_ar,
            phone,
            whatsapp,
            city_id,
            is_verified,
            is_boosted,
            created_at,
            avatar_url,
            service_categories:service_category_id (
              id,
              name_fr,
              name_ar,
              slug
            ),
            cities:city_id (
              id,
              name_fr,
              name_ar
            )
          `)
          .eq('id', id)
          .eq('is_active', true)
          .single();

        if (fetchError) {
          console.error('[useArtisan] Error fetching artisan:', fetchError);
          setError(fetchError.message);
          setArtisan(null);
        } else {
          // Transform the data
          setArtisan({
            ...data,
            service_category: data.service_categories as any,
            city: data.cities,
          });
        }
      } catch (err) {
        console.error('[useArtisan] Unexpected error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setArtisan(null);
      } finally {
        setLoading(false);
      }
    };

    fetchArtisan();
  }, [id]);

  return { artisan, loading, error };
}

/**
 * Hook to fetch featured/verified artisans
 * @param limit - Number of artisans to fetch (default: 6)
 */
export function useFeaturedArtisans(limit: number = 6) {
  const [artisans, setArtisans] = useState<ArtisanProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtisans = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('artisan_profiles')
          .select(`
            id,
            user_id,
            business_name,
            description_fr,
            description_ar,
            phone,
            whatsapp,
            city_id,
            is_verified,
            is_boosted,
            created_at,
            avatar_url,
            service_categories:service_category_id (
              id,
              name_fr,
              name_ar,
              slug
            ),
            cities:city_id (
              id,
              name_fr,
              name_ar
            )
          `)
          .eq('is_verified', true)
          .eq('is_active', true)
          .order('is_boosted', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(limit);

        if (fetchError) {
          console.error('[useArtisans] Error fetching artisans:', fetchError);
          setError(fetchError.message);
          setArtisans([]);
        } else {
          // Transform the data to match our interface
          const transformedData = (data || []).map((artisan: any) => ({
            ...artisan,
            service_category: artisan.service_categories,
            city: artisan.cities,
          }));
          setArtisans(transformedData);
        }
      } catch (err) {
        console.error('[useArtisans] Unexpected error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setArtisans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArtisans();
  }, [limit]);

  return { artisans, loading, error };
}
