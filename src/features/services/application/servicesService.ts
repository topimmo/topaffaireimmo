/**
 * Services Application Service
 * Business logic for service categories and subcategories
 */

import {
  getAllServiceCategories,
  getServiceCategoryById,
  getSubcategoriesByCategory,
} from '@/core/data/repositories/servicesRepo';
import type { ServiceCategory, ServiceSubcategory } from '@/features/services/domain/types';

/**
 * Get all active service categories for public display
 */
export async function getActiveServiceCategories(): Promise<ServiceCategory[]> {
  return await getAllServiceCategories(true);
}

/**
 * Get service category by ID
 */
export async function getServiceCategory(id: string): Promise<ServiceCategory | null> {
  return await getServiceCategoryById(id);
}

/**
 * Get active subcategories for a category
 */
export async function getActiveSubcategories(categoryId: string): Promise<ServiceSubcategory[]> {
  return await getSubcategoriesByCategory(categoryId, true);
}

/**
 * Get subcategories for a category (all, including inactive for admin)
 */
export async function getAllSubcategories(categoryId: string): Promise<ServiceSubcategory[]> {
  return await getSubcategoriesByCategory(categoryId, false);
}
