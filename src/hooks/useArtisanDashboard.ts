import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ArtisanStats {
  totalRequests: number;
  pendingRequests: number;
  averageRating: number;
  completedJobs: number;
}

export interface ServiceRequest {
  id: string;
  client_id: string;
  status: string;
  created_at: string;
  subcategory_id?: string;
  description?: string;
  client_name?: string;
  client_phone?: string;
  service_name?: string;
}

export interface Review {
  id: string;
  client_id: string;
  rating: number;
  review_text: string;
  created_at: string;
  client_name?: string;
  is_verified: boolean;
  artisan_response?: string;
}

export interface ArtisanProfileData {
  id: string;
  business_name: string;
  description_fr?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  city?: string;
  avatar_url?: string;
  is_verified: boolean;
  service_category_id?: string;
}

export interface ServiceCategory {
  id: string;
  name_fr: string;
  name_ar: string;
  slug: string;
}

export interface ServiceSubcategory {
  id: string;
  name_fr: string;
  name_ar: string;
  category_id: string;
}

export interface ArtisanService {
  id: string;
  artisan_id: string;
  category_id: string;
  subcategory_id: string;
  city: string;
}

export function useArtisanStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ArtisanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get artisan profile
        const { data: profile } = await supabase
          .from('artisan_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) {
          setStats(null);
          return;
        }

        // Get requests count
        const { count: totalRequests } = await supabase
          .from('requests')
          .select('*', { count: 'exact', head: true })
          .eq('artisan_profile_id', profile.id);

        // Get pending requests count
        const { count: pendingRequests } = await supabase
          .from('requests')
          .select('*', { count: 'exact', head: true })
          .eq('artisan_profile_id', profile.id)
          .in('status', ['pending', 'viewed']);

        // Get average rating
        const { data: ratingData } = await supabase
          .rpc('get_artisan_rating_stats', { p_artisan_profile_id: profile.id });

        // Get completed jobs from profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('completed_jobs')
          .eq('id', user.id)
          .single();

        setStats({
          totalRequests: totalRequests || 0,
          pendingRequests: pendingRequests || 0,
          averageRating: ratingData?.[0]?.avg_rating || 0,
          completedJobs: profileData?.completed_jobs || 0,
        });
      } catch (err) {
        console.error('[useArtisanStats] Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return { stats, loading, error };
}

export function useArtisanRequests(status?: string) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get artisan profile
        const { data: profile } = await supabase
          .from('artisan_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) {
          setRequests([]);
          return;
        }

        let query = supabase
          .from('requests')
          .select(`
            id,
            client_id,
            status,
            created_at,
            subcategory_id,
            description,
            profiles:client_id (
              full_name,
              phone
            ),
            service_subcategories:subcategory_id (
              name_fr
            )
          `)
          .eq('artisan_profile_id', profile.id)
          .order('created_at', { ascending: false });

        if (status) {
          query = query.eq('status', status);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        const transformedData = (data || []).map((req: any) => ({
          id: req.id,
          client_id: req.client_id,
          status: req.status,
          created_at: req.created_at,
          subcategory_id: req.subcategory_id,
          description: req.description,
          client_name: req.profiles?.full_name,
          client_phone: req.profiles?.phone,
          service_name: req.service_subcategories?.name_fr,
        }));

        setRequests(transformedData);
      } catch (err) {
        console.error('[useArtisanRequests] Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user, status]);

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      setRequests(prev =>
        prev.map(req => (req.id === requestId ? { ...req, status: newStatus } : req))
      );
      return { success: true };
    } catch (err) {
      console.error('[updateRequestStatus] Error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  return { requests, loading, error, updateRequestStatus };
}

export function useArtisanReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get artisan profile
        const { data: profile } = await supabase
          .from('artisan_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) {
          setReviews([]);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('reviews')
          .select(`
            id,
            client_id,
            rating,
            review_text,
            created_at,
            is_verified,
            artisan_response,
            profiles:client_id (
              full_name
            )
          `)
          .eq('artisan_profile_id', profile.id)
          .eq('is_hidden', false)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        const transformedData = (data || []).map((review: any) => ({
          id: review.id,
          client_id: review.client_id,
          rating: review.rating,
          review_text: review.review_text,
          created_at: review.created_at,
          is_verified: review.is_verified,
          artisan_response: review.artisan_response,
          client_name: review.profiles?.full_name || 'Client',
        }));

        setReviews(transformedData);
      } catch (err) {
        console.error('[useArtisanReviews] Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [user]);

  return { reviews, loading, error };
}

export function useArtisanProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ArtisanProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('artisan_profiles')
          .select(`
            id,
            business_name,
            description_fr,
            phone,
            whatsapp,
            is_verified,
            service_category_id,
            profiles:user_id (
              email,
              avatar_url
            )
          `)
          .eq('user_id', user.id)
          .single();

        if (fetchError) throw fetchError;

        setProfile({
          id: data.id,
          business_name: data.business_name,
          description_fr: data.description_fr,
          phone: data.phone,
          whatsapp: data.whatsapp,
          is_verified: data.is_verified,
          service_category_id: data.service_category_id,
          email: (data.profiles as any)?.email,
          avatar_url: (data.profiles as any)?.avatar_url,
        });
      } catch (err) {
        console.error('[useArtisanProfile] Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<ArtisanProfileData>) => {
    if (!user || !profile) return { success: false, error: 'No profile' };

    try {
      const { error } = await supabase
        .from('artisan_profiles')
        .update({
          business_name: updates.business_name,
          description_fr: updates.description_fr,
          phone: updates.phone,
          whatsapp: updates.whatsapp,
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile(prev => (prev ? { ...prev, ...updates } : null));
      return { success: true };
    } catch (err) {
      console.error('[updateProfile] Error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  return { profile, loading, error, updateProfile };
}

export function useServiceCategories() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('service_categories')
          .select('id, name_fr, name_ar, slug')
          .eq('is_active', true)
          .order('name_fr');

        if (fetchError) throw fetchError;
        setCategories(data || []);
      } catch (err) {
        console.error('[useServiceCategories] Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

export function useServiceSubcategories(categoryId?: string) {
  const [subcategories, setSubcategories] = useState<ServiceSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('service_subcategories')
          .select('id, name_fr, name_ar, category_id')
          .eq('is_active', true);

        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }

        const { data, error: fetchError } = await query.order('name_fr');

        if (fetchError) throw fetchError;
        setSubcategories(data || []);
      } catch (err) {
        console.error('[useServiceSubcategories] Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSubcategories();
  }, [categoryId]);

  return { subcategories, loading, error };
}

export function useArtisanServices() {
  const { user } = useAuth();
  const [services, setServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchServices = async () => {
      try {
        setLoading(true);

        // artisan_services uses artisan_id which references auth.users.id directly
        const { data, error: fetchError } = await supabase
          .from('artisan_services')
          .select('id, subcategory_id')
          .eq('artisan_id', user.id)
          .eq('is_active', true);

        if (fetchError) throw fetchError;

        setServices((data || []).map(s => s.subcategory_id).filter(Boolean));
      } catch (err) {
        console.error('[useArtisanServices] Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [user]);

  const updateServices = async (subcategoryIds: string[], city?: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      // Get artisan profile to find their category_id and cities
      const { data: profile, error: profileError } = await supabase
        .from('artisan_profiles')
        .select('id, service_category_id, cities')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Artisan profile not found');
      }

      // Determine city name
      let targetCity = city || 'Maroc';  // Default to Morocco in French
      
      // If profile has cities array and no city provided, fetch the first city's name
      if (!city && profile.cities && profile.cities.length > 0) {
        const { data: cityData } = await supabase
          .from('cities')
          .select('name_fr')
          .eq('id', profile.cities[0])
          .single();
        
        if (cityData) {
          targetCity = cityData.name_fr;
        }
      }

      // Delete existing services
      await supabase
        .from('artisan_services')
        .delete()
        .eq('artisan_id', user.id);

      // Insert new services with required fields
      if (subcategoryIds.length > 0 && profile.service_category_id) {
        const { error: insertError } = await supabase
          .from('artisan_services')
          .insert(
            subcategoryIds.map(subcategoryId => ({
              artisan_id: user.id,
              category_id: profile.service_category_id,
              subcategory_id: subcategoryId,
              city: targetCity,
              status: 'pending',
            }))
          );

        if (insertError) throw insertError;
      }

      setServices(subcategoryIds);
      return { success: true };
    } catch (err) {
      console.error('[updateServices] Error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  return { services, loading, error, updateServices };
}
