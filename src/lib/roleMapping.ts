/**
 * Role mapping utilities for the TopAffaireImmo application
 * 
 * IMPORTANT: announcer_type is for DISPLAY and METADATA only.
 * ALL permissions and route guards use profiles.user_role ONLY.
 * 
 * Provides consistent mapping for UI display purposes:
 * - announcer_type: Descriptive field for real estate agents
 * - user_role: The ONLY field used for permissions/routing
 */

export type AnnouncerType = 'proprietaire' | 'courtier' | 'agence';
export type UserRole = 'user' | 'agent' | 'merchant' | 'admin';

/**
 * Map announcer type to user_role
 * 
 * Mapping:
 * - proprietaire (owner) → user
 * - courtier (broker/agent) → agent
 * - agence (agency) → merchant
 */
export function mapAnnouncerTypeToUserRole(announcerType: AnnouncerType): UserRole {
  const mapping: Record<AnnouncerType, UserRole> = {
    'proprietaire': 'user',
    'courtier': 'agent',
    'agence': 'merchant',
  };
  
  return mapping[announcerType] || 'user';
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
