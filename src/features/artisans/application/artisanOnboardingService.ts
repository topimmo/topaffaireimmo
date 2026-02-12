/**
 * Artisan Onboarding Service
 * Business logic for artisan onboarding flow
 * DB-first approach with resumable state
 */

import { 
  getArtisanProfile, 
  createArtisanProfile 
} from '@/core/data/repositories/artisanRepo';
import type { 
  ArtisanOnboardingState, 
  ArtisanProfileCreateInput,
  ArtisanProfile 
} from '@/features/artisans/domain/types';

/**
 * Get current onboarding state from DB
 * Determines which step user should see
 */
export async function getOnboardingState(userId: string): Promise<ArtisanOnboardingState> {
  const profile = await getArtisanProfile(userId);

  // No profile exists - start from category selection
  if (!profile) {
    return {
      status: null,
      nextStep: 'select_category',
      hasExistingProfile: false,
    };
  }

  // Profile exists - determine status
  const status = profile.is_verified ? 'verified' : 'pending';

  return {
    categoryId: profile.service_category_id,
    status,
    profileId: profile.id,
    nextStep: profile.is_verified ? 'complete' : 'pending_verification',
    hasExistingProfile: true,
  };
}

/**
 * Set category (persist to DB immediately)
 * Note: Since artisan_profiles requires all fields, we create the full profile at once
 * This is a helper to check if a partial profile can be created
 */
export async function checkCategoryAvailability(
  userId: string,
  categoryId: string
): Promise<{ available: boolean; existingProfile?: ArtisanProfile }> {
  const existingProfile = await getArtisanProfile(userId);

  // If profile exists with same category, not available
  if (existingProfile && existingProfile.service_category_id === categoryId) {
    return {
      available: false,
      existingProfile,
    };
  }

  // If profile exists with different category, user already has an artisan profile
  // In current model, one user = one artisan profile
  if (existingProfile) {
    return {
      available: false,
      existingProfile,
    };
  }

  return { available: true };
}

/**
 * Submit artisan profile for verification
 * Creates complete profile in DB
 */
export async function submitForVerification(
  userId: string,
  input: ArtisanProfileCreateInput
): Promise<{ success: boolean; profile?: ArtisanProfile; error?: string }> {
  // Check if profile already exists
  const existing = await getArtisanProfile(userId);
  
  if (existing) {
    return {
      success: false,
      error: 'Un profil artisan existe déjà pour cet utilisateur',
    };
  }

  // Create artisan profile
  const result = await createArtisanProfile(userId, input);

  if (result.error || !result.profile) {
    return {
      success: false,
      error: result.error || 'Erreur lors de la création du profil',
    };
  }

  return {
    success: true,
    profile: result.profile,
  };
}

/**
 * Resume onboarding from saved state
 * Returns data to pre-fill form
 */
export async function resumeOnboarding(userId: string): Promise<{
  canResume: boolean;
  profile?: ArtisanProfile;
}> {
  const profile = await getArtisanProfile(userId);

  if (!profile) {
    return { canResume: false };
  }

  return {
    canResume: true,
    profile,
  };
}
