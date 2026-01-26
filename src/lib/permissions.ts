/**
 * Permission helper functions for role-based access control
 * Centralized location for permission logic to keep frontend and backend in sync
 */

export type UserRole = 'admin' | 'real_estate_advertiser' | 'commercial_advertiser';

/**
 * Minimal user profile interface for permission checks
 * Compatible with the Profile interface from AuthContext
 */
export interface UserProfile {
  id: string;
  user_role?: UserRole;
  advertiser_type?: 'owner' | 'broker' | 'agency' | null;
  is_admin?: boolean;
  // Optional fields from full Profile interface (not needed for permission checks)
  email?: string;
  full_name?: string;
  phone?: string;
  company_name?: string;
  is_active?: boolean;
  is_verified?: boolean;
}

/**
 * Check if a user can upload property images
 * Only admins and real estate advertisers can upload property images
 */
export function canUploadPropertyImages(profile: UserProfile | null): boolean {
  if (!profile) return false;
  
  // Admin users can always upload
  if (profile.is_admin === true || profile.user_role === 'admin') {
    return true;
  }
  
  // Real estate advertisers can upload if they have a valid advertiser_type
  // Note: advertiser_type should be set, but we allow upload even if NULL to avoid blocking
  // The storage policy will handle the final check
  if (profile.user_role === 'real_estate_advertiser') {
    return true;
  }
  
  return false;
}

/**
 * Check if a user has a valid advertiser type set
 * Used to show onboarding prompts
 */
export function hasValidAdvertiserType(profile: UserProfile | null): boolean {
  if (!profile) return false;
  
  // Only real estate advertisers need advertiser_type
  if (profile.user_role === 'real_estate_advertiser') {
    return profile.advertiser_type !== null && profile.advertiser_type !== undefined;
  }
  
  // Other roles don't need advertiser_type
  return true;
}

/**
 * Check if a user can upload banner images
 * Only admins and commercial advertisers can upload banner images
 */
export function canUploadBannerImages(profile: UserProfile | null): boolean {
  if (!profile) return false;
  
  // Admin users can always upload
  if (profile.is_admin === true || profile.user_role === 'admin') {
    return true;
  }
  
  // Commercial advertisers can upload
  if (profile.user_role === 'commercial_advertiser') {
    return true;
  }
  
  return false;
}

/**
 * Check if a user can create property listings
 * Only admins and real estate advertisers can create listings
 */
export function canCreatePropertyListing(profile: UserProfile | null): boolean {
  if (!profile) return false;
  
  // Admin users can always create
  if (profile.is_admin === true || profile.user_role === 'admin') {
    return true;
  }
  
  // Real estate advertisers can create
  if (profile.user_role === 'real_estate_advertiser') {
    return true;
  }
  
  return false;
}

/**
 * Get a user-friendly error message for permission denial
 */
export function getPermissionDeniedMessage(
  action: 'upload_property_images' | 'upload_banner_images' | 'create_listing' | 'missing_advertiser_type',
  language: 'fr' | 'ar' = 'fr'
): string {
  const messages = {
    upload_property_images: {
      fr: 'Permission refusée. Seuls les annonceurs immobiliers et les administrateurs peuvent télécharger des images de propriétés.',
      ar: 'تم رفض الإذن. يمكن فقط للمعلنين العقاريين والمسؤولين تحميل صور العقارات.'
    },
    upload_banner_images: {
      fr: 'Permission refusée. Seuls les annonceurs commerciaux et les administrateurs peuvent télécharger des bannières.',
      ar: 'تم رفض الإذن. يمكن فقط للمعلنين التجاريين والمسؤولين تحميل اللافتات.'
    },
    create_listing: {
      fr: 'Permission refusée. Seuls les annonceurs immobiliers et les administrateurs peuvent créer des annonces.',
      ar: 'تم رفض الإذن. يمكن فقط للمعلنين العقاريين والمسؤولين إنشاء إعلانات.'
    },
    missing_advertiser_type: {
      fr: 'Veuillez sélectionner votre type d\'annonceur (Propriétaire/Courtier/Agence) dans les paramètres de votre profil avant de télécharger des images.',
      ar: 'يرجى تحديد نوع المعلن (مالك/وسيط/وكالة) في إعدادات ملفك الشخصي قبل تحميل الصور.'
    }
  };
  
  return messages[action][language];
}
