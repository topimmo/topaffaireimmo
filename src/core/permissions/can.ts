/**
 * Capability Checker
 * Check if a profile has a specific capability
 */

import type { Capability, EnrichedProfile } from './capabilities';
import { getEffectiveRole, getCapabilitiesForRole } from './capabilities';

/**
 * Check if profile has a specific capability
 * @param profile The enriched profile with admin/artisan status
 * @param capability The capability to check
 * @returns true if the profile has the capability
 */
export function can(profile: EnrichedProfile | null, capability: Capability): boolean {
  if (!profile) {
    return false;
  }
  
  const effectiveRole = getEffectiveRole(profile);
  const capabilities = getCapabilitiesForRole(effectiveRole);
  
  return capabilities.includes(capability);
}

/**
 * Check if profile has ANY of the given capabilities
 */
export function canAny(profile: EnrichedProfile | null, capabilities: Capability[]): boolean {
  if (!profile) {
    return false;
  }
  
  return capabilities.some(cap => can(profile, cap));
}

/**
 * Check if profile has ALL of the given capabilities
 */
export function canAll(profile: EnrichedProfile | null, capabilities: Capability[]): boolean {
  if (!profile) {
    return false;
  }
  
  return capabilities.every(cap => can(profile, cap));
}
