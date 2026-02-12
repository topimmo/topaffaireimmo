/**
 * Capabilities Model
 * Centralized permission definitions based on roles and statuses
 * DB is the single source of truth
 */

import type { ArtisanProfile } from '@/features/artisans/domain/types';

export type Capability =
  // User capabilities
  | 'can_create_listing'
  | 'can_view_own_listings'
  | 'can_create_service_request'
  
  // Artisan capabilities
  | 'can_view_artisan_onboarding'
  | 'can_access_artisan_dashboard'
  | 'can_create_artisan_service'
  | 'can_view_artisan_requests'
  | 'can_respond_to_requests'
  
  // Admin capabilities
  | 'can_access_admin'
  | 'can_manage_users'
  | 'can_manage_listings'
  | 'can_manage_service_categories'
  | 'can_manage_subcategories'
  | 'can_manage_artisans'
  | 'can_manage_service_requests'
  | 'can_view_admin_analytics';

/**
 * Profile type from DB with necessary fields for capability checks
 */
export interface ProfileForCapabilities {
  id: string;
  user_role?: string;
  advertiser_type?: string;
}

/**
 * Extended profile with artisan and admin status
 */
export interface EnrichedProfile extends ProfileForCapabilities {
  isAdmin: boolean;
  artisanProfile?: ArtisanProfile | null;
}

/**
 * Capability map: defines which capabilities each role/status has
 */
export const CAPABILITY_MAP: Record<string, Capability[]> = {
  // Default user capabilities
  user: [
    'can_create_listing',
    'can_view_own_listings',
    'can_create_service_request',
  ],
  
  // Agent capabilities (real estate agent/broker)
  agent: [
    'can_create_listing',
    'can_view_own_listings',
    'can_create_service_request',
  ],
  
  // Merchant capabilities (agency or commercial advertiser)
  merchant: [
    'can_create_listing',
    'can_view_own_listings',
    'can_create_service_request',
  ],
  
  // Artisan with pending verification
  artisan_pending: [
    'can_view_artisan_onboarding',
    'can_create_service_request',
  ],
  
  // Verified artisan
  artisan_verified: [
    'can_access_artisan_dashboard',
    'can_create_artisan_service',
    'can_view_artisan_requests',
    'can_respond_to_requests',
    'can_create_service_request',
  ],
  
  // Admin has all capabilities
  admin: [
    'can_access_admin',
    'can_manage_users',
    'can_manage_listings',
    'can_manage_service_categories',
    'can_manage_subcategories',
    'can_manage_artisans',
    'can_manage_service_requests',
    'can_view_admin_analytics',
    // Also include user capabilities
    'can_create_listing',
    'can_view_own_listings',
    'can_create_service_request',
  ],
};

/**
 * Determine user's effective role for capability checking
 * Priority: admin > artisan_verified > artisan_pending > merchant > agent > user
 */
export function getEffectiveRole(profile: EnrichedProfile): string {
  // Admin always takes priority
  if (profile.isAdmin) {
    return 'admin';
  }
  
  // Check artisan status
  if (profile.artisanProfile) {
    if (profile.artisanProfile.is_verified && profile.artisanProfile.is_active) {
      return 'artisan_verified';
    } else if (!profile.artisanProfile.is_verified) {
      return 'artisan_pending';
    }
  }
  
  // Check user_role and advertiser_type from profile
  if (profile.user_role === 'commercial_advertiser') {
    return 'merchant';
  }
  
  if (profile.user_role === 'real_estate_advertiser') {
    if (profile.advertiser_type === 'broker') {
      return 'agent';
    }
    if (profile.advertiser_type === 'agency') {
      return 'merchant';
    }
  }
  
  // Default to user
  return 'user';
}

/**
 * Get all capabilities for a given role
 */
export function getCapabilitiesForRole(role: string): Capability[] {
  return CAPABILITY_MAP[role] || CAPABILITY_MAP.user;
}
