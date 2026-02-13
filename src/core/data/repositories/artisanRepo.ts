/**
 * Artisan Repository
 * Data access layer for artisan profile operations
 */

import { supabase } from '@/lib/supabase';
import type { ArtisanProfile, ArtisanProfileCreateInput } from '@/features/artisans/domain/types';

export async function getArtisanProfile(userId: string): Promise<ArtisanProfile | null> {
  const { data, error } = await supabase
    .from('artisan_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[artisanRepo] Error fetching artisan profile:', error);
    return null;
  }

  return data;
}

export async function getArtisanProfileById(profileId: string): Promise<ArtisanProfile | null> {
  const { data, error } = await supabase
    .from('artisan_profiles')
    .select('*')
    .eq('id', profileId)
    .maybeSingle();

  if (error) {
    console.error('[artisanRepo] Error fetching artisan profile by id:', error);
    return null;
  }

  return data;
}

/**
 * Create artisan profile (onboarding)
 * Returns the created profile or null on error
 */
export async function createArtisanProfile(
  userId: string,
  input: ArtisanProfileCreateInput
): Promise<{ profile: ArtisanProfile | null; error?: string }> {
  try {
    // Insert artisan profile
    const { data: profile, error: profileError } = await supabase
      .from('artisan_profiles')
      .insert({
        user_id: userId,
        service_category_id: input.service_category_id,
        business_name: input.business_name,
        description_fr: input.description_fr,
        description_ar: input.description_ar,
        phone: input.phone,
        whatsapp: input.whatsapp,
        email: input.email,
        cities: [parseInt(input.city_id)], // Store as array
        is_verified: false, // Needs admin approval
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      console.error('[artisanRepo] Error creating artisan profile:', profileError);
      return { profile: null, error: profileError.message };
    }

    if (!profile) {
      return { profile: null, error: 'No profile returned after creation' };
    }

    // Insert neighborhood associations
    if (input.neighborhood_ids && input.neighborhood_ids.length > 0) {
      const neighborhoodLinks = input.neighborhood_ids.map(neighborhoodId => ({
        artisan_profile_id: profile.id,
        neighborhood_id: neighborhoodId,
      }));

      const { error: linkError } = await supabase
        .from('artisan_profile_neighborhoods')
        .insert(neighborhoodLinks);

      if (linkError) {
        console.error('[artisanRepo] Error linking neighborhoods:', linkError);
        // Profile is already created, so we'll return it anyway
        // The neighborhoods can be added later
      }
    }

    return { profile };
  } catch (error) {
    console.error('[artisanRepo] Unexpected error creating artisan profile:', error);
    return { 
      profile: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Update artisan profile
 */
export async function updateArtisanProfile(
  profileId: string,
  updates: Partial<ArtisanProfile>
): Promise<boolean> {
  // Remove fields that shouldn't be updated by artisan
  const { id, user_id, is_verified, is_boosted, boosted_at, created_at, ...safeUpdates } = updates;

  const { error } = await supabase
    .from('artisan_profiles')
    .update(safeUpdates)
    .eq('id', profileId);

  if (error) {
    console.error('[artisanRepo] Error updating artisan profile:', error);
    return false;
  }

  return true;
}

/**
 * Admin: Verify artisan profile
 */
export async function verifyArtisanProfile(profileId: string, verified: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('artisan_profiles')
    .update({ is_verified: verified })
    .eq('id', profileId);

  if (error) {
    console.error('[artisanRepo] Error verifying artisan profile:', error);
    return false;
  }

  return true;
}

/**
 * Get all artisan profiles (admin view)
 */
export async function getAllArtisanProfiles(): Promise<ArtisanProfile[]> {
  const { data, error } = await supabase
    .from('artisan_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[artisanRepo] Error fetching all artisan profiles:', error);
    return [];
  }

  return data || [];
}
