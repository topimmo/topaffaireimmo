/**
 * Services Domain Types
 * Core business entities for services module
 */

export type RequestStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface ServiceCategory {
  id: string;
  name_fr: string;
  name_ar: string;
  slug: string;
  description_fr?: string;
  description_ar?: string;
  icon?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceSubcategory {
  id: string;
  category_id: string;
  name_fr: string;
  name_ar: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequest {
  id: string;
  user_id: string;
  service_category_id: string;
  service_subcategory_id?: string;
  title: string;
  description: string;
  city: string;
  neighborhood?: string;
  status: RequestStatus;
  assigned_artisan_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceCategoryCreateInput {
  name_fr: string;
  name_ar: string;
  slug: string;
  description_fr?: string;
  description_ar?: string;
  icon?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface ServiceCategoryUpdateInput extends Partial<ServiceCategoryCreateInput> {
  id: string;
}
