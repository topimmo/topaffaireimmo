/**
 * Database Access Layer - Artisan Profiles
 * 
 * Functions for querying and managing artisan profiles, including
 * neighborhood associations, search, and profile management.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

type ArtisanProfile = Database['public']['Tables']['artisan_profiles']['Row'];
type ServiceCategory = Database['public']['Tables']['service_categories']['Row'];
type City = Database['public']['Tables']['cities']['Row'];
type Neighborhood = Database['public']['Tables']['neighborhoods']['Row'];

// Type for safe updates that excludes monetization and admin-only fields
// These fields can only be modified via RPC functions or by admins
type SafeArtisanProfileUpdate = Omit<
  Partial<ArtisanProfile>,
  'id' | 'user_id' | 'is_verified' | 'is_active' | 'is_boosted' | 'boosted_at' | 'created_at' | 'updated_at'
>;

// Extended type with relations
export interface ArtisanProfileWithRelations extends ArtisanProfile {
  service_category: ServiceCategory;
  city: City;
  neighborhoods: Neighborhood[];
  avg_rating?: number;
  total_reviews?: number;
}

/**
 * Get artisan profile by ID with all relations
 */
export async function getArtisanProfile(
  supabase: ReturnType<typeof createClient<Database>>,
  id: string
): Promise<ArtisanProfileWithRelations | null> {
  const { data, error } = await supabase
    .from('artisan_profiles')
    .select(`
      *,
      service_category:service_categories(*),
      city:cities(*),
      neighborhoods:artisan_profile_neighborhoods(
        neighborhood:neighborhoods(*)
      ),
      reviews:reviews(rating)
    `)
    .eq('id', id)
    .eq('is_verified', true)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    console.error('Error fetching artisan profile:', error);
    return null;
  }

  // Calculate average rating
  const avgRating = data.reviews && data.reviews.length > 0
    ? data.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / data.reviews.length
    : 0;

  return {
    ...data,
    neighborhoods: data.neighborhoods.map((n: any) => n.neighborhood).filter(Boolean),
    avg_rating: avgRating,
    total_reviews: data.reviews?.length || 0,
  } as ArtisanProfileWithRelations;
}

/**
 * Search artisans with filters
 */
export interface SearchArtisansParams {
  city_id?: number;
  service_category_id?: string;
  neighborhood_ids?: number[];
  min_rating?: number;
  search_query?: string;
  page?: number;
  limit?: number;
}

export interface SearchArtisansResult {
  artisans: ArtisanProfileWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function searchArtisans(
  supabase: ReturnType<typeof createClient<Database>>,
  params: SearchArtisansParams
): Promise<SearchArtisansResult> {
  const {
    city_id,
    service_category_id,
    neighborhood_ids,
    search_query,
    page = 1,
    limit = 20,
  } = params;

  let query = supabase
    .from('artisan_profiles')
    .select(`
      *,
      service_category:service_categories(*),
      city:cities(*),
      neighborhoods:artisan_profile_neighborhoods(
        neighborhood:neighborhoods(*)
      ),
      reviews:reviews(rating)
    `, { count: 'exact' })
    .eq('is_verified', true)
    .eq('is_active', true);

  // Apply filters
  if (city_id) {
    query = query.eq('city_id', city_id);
  }

  if (service_category_id) {
    query = query.eq('service_category_id', service_category_id);
  }

  if (search_query) {
    query = query.or(`business_name.ilike.%${search_query}%,description_fr.ilike.%${search_query}%`);
  }

  // Filter by neighborhoods using EXISTS subquery if needed
  if (neighborhood_ids && neighborhood_ids.length > 0) {
    // This requires a different approach - we need to filter in post-processing
    // or use a custom RPC function
    // For now, we'll fetch all and filter client-side (not ideal for large datasets)
  }

  // Order: boosted first, then by created date
  query = query
    .order('is_boosted', { ascending: false })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error searching artisans:', error);
    throw error;
  }

  let artisans = (data || []).map((artisan: any) => {
    const avgRating = artisan.reviews && artisan.reviews.length > 0
      ? artisan.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / artisan.reviews.length
      : 0;

    return {
      ...artisan,
      neighborhoods: artisan.neighborhoods.map((n: any) => n.neighborhood).filter(Boolean),
      avg_rating: avgRating,
      total_reviews: artisan.reviews?.length || 0,
    };
  });

  // Client-side neighborhood filter (if needed)
  if (neighborhood_ids && neighborhood_ids.length > 0) {
    artisans = artisans.filter((artisan: any) =>
      artisan.neighborhoods.some((n: Neighborhood) => neighborhood_ids.includes(n.id))
    );
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    artisans,
    total,
    page,
    limit,
    totalPages,
  };
}

/**
 * Get artisan's neighborhoods
 */
export async function getArtisanNeighborhoods(
  supabase: ReturnType<typeof createClient<Database>>,
  artisan_profile_id: string
): Promise<Neighborhood[]> {
  const { data, error } = await supabase
    .from('artisan_profile_neighborhoods')
    .select('neighborhood:neighborhoods(*)')
    .eq('artisan_profile_id', artisan_profile_id);

  if (error) {
    console.error('Error fetching artisan neighborhoods:', error);
    return [];
  }

  return (data || []).map((item: any) => item.neighborhood).filter(Boolean);
}

/**
 * Update artisan's neighborhoods (delete all + insert new)
 */
export async function updateArtisanNeighborhoods(
  supabase: ReturnType<typeof createClient<Database>>,
  artisan_profile_id: string,
  neighborhood_ids: number[]
): Promise<{ success: boolean; error?: string }> {
  // Start a transaction-like operation
  // 1. Delete existing neighborhoods
  const { error: deleteError } = await supabase
    .from('artisan_profile_neighborhoods')
    .delete()
    .eq('artisan_profile_id', artisan_profile_id);

  if (deleteError) {
    console.error('Error deleting neighborhoods:', deleteError);
    return { success: false, error: deleteError.message };
  }

  // 2. Insert new neighborhoods
  if (neighborhood_ids.length > 0) {
    const neighborhoodRecords = neighborhood_ids.map(nid => ({
      artisan_profile_id,
      neighborhood_id: nid,
    }));

    const { error: insertError } = await supabase
      .from('artisan_profile_neighborhoods')
      .insert(neighborhoodRecords);

    if (insertError) {
      console.error('Error inserting neighborhoods:', insertError);
      return { success: false, error: insertError.message };
    }
  }

  return { success: true };
}

/**
 * Get neighborhoods for a city
 */
export async function getCityNeighborhoods(
  supabase: ReturnType<typeof createClient<Database>>,
  city_id: number
): Promise<Neighborhood[]> {
  const { data, error } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('city_id', city_id)
    .order('name_fr', { ascending: true });

  if (error) {
    console.error('Error fetching city neighborhoods:', error);
    return [];
  }

  return data || [];
}

/**
 * Get artisan profiles for current user
 */
export async function getMyArtisanProfiles(
  supabase: ReturnType<typeof createClient<Database>>
): Promise<ArtisanProfile[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('artisan_profiles')
    .select('*, service_category:service_categories(*), city:cities(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false});

  if (error) {
    console.error('Error fetching my artisan profiles:', error);
    return [];
  }

  return data || [];
}

/**
 * Update artisan profile
 * 
 * SECURITY: This function only accepts safe update fields.
 * Monetization fields (is_boosted, boosted_at) can only be modified via RPC functions.
 * Admin fields (is_verified, is_active) can only be modified by admins directly.
 * RLS policies provide defense-in-depth protection.
 */
export async function updateArtisanProfile(
  supabase: ReturnType<typeof createClient<Database>>,
  id: string,
  updates: SafeArtisanProfileUpdate
): Promise<{ success: boolean; error?: string; data?: ArtisanProfile }> {
  const { data, error } = await supabase
    .from('artisan_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating artisan profile:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Delete artisan profile
 */
export async function deleteArtisanProfile(
  supabase: ReturnType<typeof createClient<Database>>,
  id: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('artisan_profiles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting artisan profile:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
