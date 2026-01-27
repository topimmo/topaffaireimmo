/**
 * Role mapping utilities for the TopAffaireImmo application
 * Provides consistent mapping between announcer types and technical roles
 */

export type AnnouncerType = 'proprietaire' | 'courtier' | 'agence';
export type Role = 'user' | 'agent' | 'merchant' | 'admin';

/**
 * Map announcer type to technical role
 * 
 * Mapping:
 * - proprietaire (owner) → user
 * - courtier (broker/agent) → agent
 * - agence (agency) → merchant
 */
export function mapAnnouncerTypeToRole(announcerType: AnnouncerType): Role {
  const mapping: Record<AnnouncerType, Role> = {
    'proprietaire': 'user',
    'courtier': 'agent',
    'agence': 'merchant',
  };
  
  return mapping[announcerType] || 'user';
}

/**
 * Map role to user_role for backward compatibility
 */
export function mapRoleToUserRole(role: Role): string {
  const mapping: Record<Role, string> = {
    'admin': 'admin',
    'merchant': 'commercial_advertiser',
    'agent': 'real_estate_advertiser',
    'user': 'real_estate_advertiser',
  };
  
  return mapping[role] || 'real_estate_advertiser';
}

/**
 * Map old advertiser_type to new announcer_type
 */
export function mapAdvertiserTypeToAnnouncerType(advertiserType: string): AnnouncerType | null {
  const mapping: Record<string, AnnouncerType> = {
    'owner': 'proprietaire',
    'broker': 'courtier',
    'agency': 'agence',
  };
  
  return mapping[advertiserType] || null;
}

/**
 * Get announcer type label in French
 */
export function getAnnouncerTypeLabel(announcerType: AnnouncerType, language: 'fr' | 'ar' = 'fr'): string {
  const labels = {
    'proprietaire': { fr: 'Propriétaire', ar: 'مالك' },
    'courtier': { fr: 'Courtier', ar: 'سمسار' },
    'agence': { fr: 'Agence', ar: 'وكالة' },
  };
  
  return labels[announcerType]?.[language] || announcerType;
}
