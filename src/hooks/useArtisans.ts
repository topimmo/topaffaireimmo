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
  is_verified: boolean;
  is_boosted: boolean;
  avatar_url?: string;
  created_at: string;
  // Joined data
  service_category?: {
    id: string;
    name_fr: string;
    name_ar: string;
    slug: string;
  };
  cities?: Array<{
    id: number;
    name_fr: string;
    name_ar: string;
  }>;
  artisan_services?: Array<{
    service_subcategory: {
      id: string;
      name_fr: string;
      name_ar: string;
    };
  }>;
  profiles?: {
    rating?: number;
    completed_jobs?: number;
  };
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
            is_verified,
            is_boosted,
            avatar_url,
            created_at,
            service_categories:service_category_id (
              id,
              name_fr,
              name_ar,
              slug
            ),
            artisan_services (
              service_subcategory:service_subcategory_id (
                id,
                name_fr,
                name_ar
              )
            ),
            profiles:user_id (
              rating,
              completed_jobs
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
            profiles: artisan.profiles?.[0] || undefined,
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
