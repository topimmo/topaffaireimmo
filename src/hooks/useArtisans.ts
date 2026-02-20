import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/** In-memory cache for artisan search results. Key: stable JSON of filters. */
const artisanCache = new Map<string, { data: ArtisanProfile[]; ts: number }>();
/** Cache TTL in milliseconds (60 s). */
const CACHE_TTL_MS = 60_000;
/** Minimum search-term length before triggering a DB query. */
export const MIN_SEARCH_LENGTH = 2;

export interface ArtisanProfile {
  id: string;
  user_id: string;
  business_name: string;
  description_fr?: string;
  description_ar?: string;
  phone: string;
  whatsapp?: string;
  city_id?: number;
  is_verified: boolean;
  is_boosted: boolean;
  created_at: string;
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
  profiles?: {
    full_name?: string;
    phone?: string;
    avatar_url?: string;
    role?: string;
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
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Enforce minimum search term length to avoid overly broad queries
    if (filters?.searchTerm !== undefined && filters.searchTerm.length > 0 && filters.searchTerm.length < MIN_SEARCH_LENGTH) {
      setArtisans([]);
      setLoading(false);
      return;
    }

    // Build a stable cache key from the current filters
    const cacheKey = JSON.stringify({
      serviceCategoryId: filters?.serviceCategoryId,
      cityId: filters?.cityId,
      isVerified: filters?.isVerified,
      minRating: filters?.minRating,
      searchTerm: filters?.searchTerm,
    });

    // Return cached results if they are still fresh
    const cached = artisanCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      setArtisans(cached.data);
      setLoading(false);
      return;
    }

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

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
            service_category:service_category_id (
              id,
              name_fr,
              name_ar,
              slug
            ),
            city:city_id (
              id,
              name_fr,
              name_ar
            ),
            profiles:user_id (
              full_name,
              phone,
              avatar_url,
              role
            )
          `)
          .eq('is_active', true)
          .limit(50); // Cap results to prevent unbounded queries

        // Apply filters
        if (filters?.serviceCategoryId) {
          query = query.eq('service_category_id', filters.serviceCategoryId);
        }
        if (filters?.cityId) {
          query = query.eq('city_id', filters.cityId);
        }
        if (filters?.isVerified !== undefined) {
          query = query.eq('is_verified', filters.isVerified);
        }
        if (filters?.searchTerm) {
          query = query.ilike('business_name', `%${filters.searchTerm}%`);
        }

        // FULL FREE MODE: Removed is_boosted ordering
        query = query.order('created_at', { ascending: false });

        // Guard: abort before network call if already superseded
        if (controller.signal.aborted) return;

        const { data, error: fetchError } = await query.abortSignal(controller.signal);

        // Ignore results if this request was superseded
        if (controller.signal.aborted) return;

        if (fetchError) {
          console.error('[useArtisans] Error fetching artisans:', fetchError);
          setError(fetchError.message);
          setArtisans([]);
        } else {
          // Transform data - Supabase returns joined data as single objects, not arrays
          const transformedData = (data || []).map((artisan: any) => ({
            ...artisan,
            service_category: artisan.service_category || undefined,
            city: artisan.city || undefined,
            profiles: artisan.profiles || undefined,
          }));

          // Store in cache
          artisanCache.set(cacheKey, { data: transformedData, ts: Date.now() });
          setArtisans(transformedData);
        }
      } catch (err) {
        if (controller.signal.aborted) return; // Request was cancelled – not an error
        console.error('[useArtisans] Unexpected error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setArtisans([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchArtisans();

    return () => {
      controller.abort();
    };
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
            service_category:service_category_id (
              id,
              name_fr,
              name_ar,
              slug
            ),
            city:city_id (
              id,
              name_fr,
              name_ar
            ),
            profiles:user_id (
              full_name,
              phone,
              avatar_url,
              role
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
          // Transform the data - Supabase returns joined data as single objects
          setArtisan({
            ...data,
            service_category: (data.service_category as any) || undefined,
            city: (data.city as any) || undefined,
            profiles: (data.profiles as any) || undefined,
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
            service_category:service_category_id (
              id,
              name_fr,
              name_ar,
              slug
            ),
            city:city_id (
              id,
              name_fr,
              name_ar
            ),
            profiles:user_id (
              full_name,
              phone,
              avatar_url,
              role
            )
          `)
          .eq('is_verified', true)
          .eq('is_active', true)
          // FULL FREE MODE: Removed is_boosted ordering
          .order('created_at', { ascending: false })
          .limit(limit);

        if (fetchError) {
          console.error('[useArtisans] Error fetching artisans:', fetchError);
          setError(fetchError.message);
          setArtisans([]);
        } else {
          // Transform the data to match our interface - Supabase returns joined data as single objects
          const transformedData = (data || []).map((artisan: any) => ({
            ...artisan,
            service_category: artisan.service_category || undefined,
            city: artisan.city || undefined,
            profiles: artisan.profiles || undefined,
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
