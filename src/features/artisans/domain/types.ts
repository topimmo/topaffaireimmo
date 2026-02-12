/**
 * Artisan Domain Types
 * Core business entities for artisan module
 */

export type ArtisanStatus = 'pending' | 'verified' | 'rejected';

export interface ArtisanProfile {
  id: string;
  user_id: string;
  service_category_id: string;
  business_name: string;
  description_fr?: string;
  description_ar?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  is_verified: boolean;
  is_active: boolean;
  is_boosted: boolean;
  boosted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ArtisanOnboardingState {
  categoryId?: string;
  status: ArtisanStatus | null;
  profileId?: string;
  nextStep: 'select_category' | 'fill_details' | 'pending_verification' | 'complete';
  hasExistingProfile: boolean;
}

export interface ArtisanProfileCreateInput {
  service_category_id: string;
  business_name: string;
  description_fr?: string;
  description_ar?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  city_id: string;
  neighborhood_ids: number[];
}
