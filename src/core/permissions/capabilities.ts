/**
 * Capabilities Model
 * Centralized permission definitions based ONLY on profiles.user_role
 * 
 * IMPORTANT: All permissions derive from profiles.user_role field.
 * announcer_type and advertiser_type are NOT used for permissions.
 * 
 * Roles:
 * - user: Default role, can create listings and service requests
 * - agent: Real estate agents (immobilier)
 * - merchant: Service providers and agencies
 * - admin: Platform administrators
 * 
 * Artisan status (merchant + artisan_profile) adds additional capabilities.
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
 * Uses ONLY profiles.user_role as the source of truth
 * Priority: admin > merchant (includes artisan_verified) > agent > user
 */
export function getEffectiveRole(profile: EnrichedProfile): string {
  // Admin role takes priority (from user_role field)
  if (profile.user_role === 'admin') {
    return 'admin';
  }
  
  // Check artisan status for merchant users
  if (profile.user_role === 'merchant') {
    // Merchants with verified artisan profile get artisan capabilities
    if (profile.artisanProfile?.is_verified && profile.artisanProfile?.is_active) {
      return 'artisan_verified';
    } else if (profile.artisanProfile && !profile.artisanProfile.is_verified) {
      return 'artisan_pending';
    }
    // Regular merchant (no artisan profile or inactive)
    return 'merchant';
  }
  
  // Agent role (real estate agents)
  if (profile.user_role === 'agent') {
    return 'agent';
  }
  
  // Default user role
  return 'user';
}

/**
 * Get all capabilities for a given role
 */
export function getCapabilitiesForRole(role: string): Capability[] {
  return CAPABILITY_MAP[role] || CAPABILITY_MAP.user;
}
