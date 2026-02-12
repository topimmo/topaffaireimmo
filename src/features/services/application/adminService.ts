/**
 * Admin Service
 * Business logic for admin operations on services module
 */

import {
  getAllServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  toggleServiceCategoryActive,
  deleteServiceCategory,
  createServiceSubcategory,
  updateServiceSubcategory,
  toggleServiceSubcategoryActive,
  deleteServiceSubcategory,
  getSubcategoriesByCategory,
} from '@/core/data/repositories/servicesRepo';

import {
  getAllServiceRequests,
  assignServiceRequest,
  updateServiceRequestStatus,
} from '@/core/data/repositories/requestsRepo';

import {
  getAllArtisanProfiles,
  verifyArtisanProfile,
} from '@/core/data/repositories/artisanRepo';

import type { 
  ServiceCategory, 
  ServiceSubcategory,
  ServiceCategoryCreateInput,
  ServiceCategoryUpdateInput,
  ServiceRequest,
} from '@/features/services/domain/types';
import type { ArtisanProfile } from '@/features/artisans/domain/types';

// ============ Service Categories Management ============

export async function adminGetAllCategories(): Promise<ServiceCategory[]> {
  return await getAllServiceCategories(false); // Include inactive
}

export async function adminCreateCategory(
  input: ServiceCategoryCreateInput
): Promise<{ success: boolean; category?: ServiceCategory; error?: string }> {
  const result = await createServiceCategory(input);
  
  if (result.error || !result.category) {
    return {
      success: false,
      error: result.error || 'Failed to create category',
    };
  }

  return {
    success: true,
    category: result.category,
  };
}

export async function adminUpdateCategory(
  input: ServiceCategoryUpdateInput
): Promise<{ success: boolean; error?: string }> {
  const success = await updateServiceCategory(input);
  
  return {
    success,
    error: success ? undefined : 'Failed to update category',
  };
}

export async function adminToggleCategoryActive(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const success = await toggleServiceCategoryActive(id, isActive);
  
  return {
    success,
    error: success ? undefined : 'Failed to toggle category status',
  };
}

export async function adminDeleteCategory(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const success = await deleteServiceCategory(id);
  
  return {
    success,
    error: success ? undefined : 'Failed to delete category',
  };
}

// ============ Service Subcategories Management ============

export async function adminGetSubcategories(categoryId: string): Promise<ServiceSubcategory[]> {
  return await getSubcategoriesByCategory(categoryId, false); // Include inactive
}

export async function adminCreateSubcategory(
  categoryId: string,
  name_fr: string,
  name_ar: string,
  slug: string
): Promise<{ success: boolean; subcategory?: ServiceSubcategory; error?: string }> {
  const result = await createServiceSubcategory(categoryId, name_fr, name_ar, slug);
  
  if (result.error || !result.subcategory) {
    return {
      success: false,
      error: result.error || 'Failed to create subcategory',
    };
  }

  return {
    success: true,
    subcategory: result.subcategory,
  };
}

export async function adminUpdateSubcategory(
  id: string,
  updates: Partial<ServiceSubcategory>
): Promise<{ success: boolean; error?: string }> {
  const success = await updateServiceSubcategory(id, updates);
  
  return {
    success,
    error: success ? undefined : 'Failed to update subcategory',
  };
}

export async function adminToggleSubcategoryActive(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const success = await toggleServiceSubcategoryActive(id, isActive);
  
  return {
    success,
    error: success ? undefined : 'Failed to toggle subcategory status',
  };
}

export async function adminDeleteSubcategory(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const success = await deleteServiceSubcategory(id);
  
  return {
    success,
    error: success ? undefined : 'Failed to delete subcategory',
  };
}

// ============ Service Requests Management ============

export async function adminGetAllRequests(): Promise<ServiceRequest[]> {
  return await getAllServiceRequests();
}

export async function adminAssignRequest(
  requestId: string,
  artisanId: string
): Promise<{ success: boolean; error?: string }> {
  const success = await assignServiceRequest(requestId, artisanId);
  
  return {
    success,
    error: success ? undefined : 'Failed to assign request',
  };
}

export async function adminUpdateRequestStatus(
  requestId: string,
  status: ServiceRequest['status']
): Promise<{ success: boolean; error?: string }> {
  const success = await updateServiceRequestStatus(requestId, status);
  
  return {
    success,
    error: success ? undefined : 'Failed to update request status',
  };
}

// ============ Artisan Management ============

export async function adminGetAllArtisans(): Promise<ArtisanProfile[]> {
  return await getAllArtisanProfiles();
}

export async function adminVerifyArtisan(
  profileId: string,
  verified: boolean
): Promise<{ success: boolean; error?: string }> {
  const success = await verifyArtisanProfile(profileId, verified);
  
  return {
    success,
    error: success ? undefined : 'Failed to verify artisan',
  };
}
