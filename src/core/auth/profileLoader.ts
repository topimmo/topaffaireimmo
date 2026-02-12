/**
 * Profile Loader
 * Single source of truth for profile data
 * Ensures profile exists and fetches complete profile data including admin/artisan status
 */

import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { EnrichedProfile } from '@/core/permissions/capabilities';
import type { ArtisanProfile } from '@/features/artisans/domain/types';

export interface ProfileLoadResult {
  success: boolean;
  profile: EnrichedProfile | null;
  error?: string;
}

/**
 * Ensure a profile exists for the given user
 * Creates one if missing (e.g., for Google OAuth users)
 * @returns true if profile exists or was created successfully
 */
export async function ensureProfileExists(user: User): Promise<boolean> {
  if (!user) {
    return false;
  }

  try {
    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (checkError) {
      console.error('[profileLoader] Error checking profile:', checkError);
      return false;
    }

    // Profile already exists
    if (existingProfile) {
      return true;
    }

    // Create profile with safe defaults
    console.log('[profileLoader] Creating missing profile for user:', user.id);
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        user_role: 'user', // Default role - never auto-assign merchant/advertiser
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('[profileLoader] Error creating profile:', insertError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[profileLoader] Unexpected error in ensureProfileExists:', error);
    return false;
  }
}

/**
 * Fetch complete profile data including admin and artisan status
 * This is the single source of truth for all profile-related data
 */
export async function fetchProfile(userId: string): Promise<ProfileLoadResult> {
  if (!userId) {
    return {
      success: false,
      profile: null,
      error: 'No user ID provided',
    };
  }

  try {
    // Fetch base profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_role, advertiser_type')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      return {
        success: false,
        profile: null,
        error: `Profile fetch error: ${profileError.message}`,
      };
    }

    if (!profile) {
      return {
        success: false,
        profile: null,
        error: 'Profile not found',
      };
    }

    // Check if user is admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (adminError && adminError.code !== 'PGRST116') { // PGRST116 = not found, which is ok
      console.warn('[profileLoader] Error checking admin status:', adminError);
    }

    const isAdmin = !!adminData;

    // Fetch artisan profile if exists
    const { data: artisanProfiles, error: artisanError } = await supabase
      .from('artisan_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (artisanError && artisanError.code !== 'PGRST116') {
      console.warn('[profileLoader] Error fetching artisan profile:', artisanError);
    }

    const artisanProfile: ArtisanProfile | null = 
      artisanProfiles && artisanProfiles.length > 0 ? artisanProfiles[0] : null;

    // Build enriched profile
    const enrichedProfile: EnrichedProfile = {
      id: profile.id,
      user_role: profile.user_role,
      advertiser_type: profile.advertiser_type,
      isAdmin,
      artisanProfile,
    };

    return {
      success: true,
      profile: enrichedProfile,
    };
  } catch (error) {
    console.error('[profileLoader] Unexpected error in fetchProfile:', error);
    return {
      success: false,
      profile: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Load profile with automatic creation if needed
 * This is the primary function to use in auth flows
 */
export async function loadProfile(user: User | null): Promise<ProfileLoadResult> {
  if (!user) {
    return {
      success: false,
      profile: null,
      error: 'No user provided',
    };
  }

  // First ensure profile exists
  const profileExists = await ensureProfileExists(user);
  
  if (!profileExists) {
    return {
      success: false,
      profile: null,
      error: 'Failed to ensure profile exists',
    };
  }

  // Then fetch complete profile data
  return await fetchProfile(user.id);
}
