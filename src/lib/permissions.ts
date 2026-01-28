/**
 * Permission helper functions
 * SIMPLIFIED: All permissions enforced via Supabase RLS
 * Frontend checks removed - authorization is server-side only
 */

/**
 * Legacy function - kept for backward compatibility
 * All authenticated users can upload property images (enforced by RLS)
 */
export function canUploadPropertyImages(userId: string | null | undefined): boolean {
  return !!userId;
}

/**
 * Legacy function - kept for backward compatibility  
 * All authenticated users can create property listings (enforced by RLS)
 */
export function canCreatePropertyListing(userId: string | null | undefined): boolean {
  return !!userId;
}

/**
 * Get a user-friendly error message for permission denial
 */
export function getPermissionDeniedMessage(
  action: 'upload_property_images' | 'create_listing' | 'not_authenticated',
  language: 'fr' | 'ar' = 'fr'
): string {
  const messages = {
    upload_property_images: {
      fr: 'Vous devez être connecté pour télécharger des images.',
      ar: 'يجب أن تكون متصلاً لتحميل الصور.'
    },
    create_listing: {
      fr: 'Vous devez être connecté pour créer une annonce.',
      ar: 'يجب أن تكون متصلاً لإنشاء إعلان.'
    },
    not_authenticated: {
      fr: 'Vous devez être connecté pour effectuer cette action.',
      ar: 'يجب أن تكون متصلاً لتنفيذ هذا الإجراء.'
    }
  };
  
  return messages[action][language];
}
