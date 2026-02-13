/**
 * Services Repository
 * Data access layer for service categories and subcategories
 */

import { supabase } from '@/lib/supabase';
import type { 
  ServiceCategory, 
  ServiceSubcategory,
  ServiceCategoryCreateInput,
  ServiceCategoryUpdateInput
} from '@/features/services/domain/types';

// ============ Service Categories ============

export async function getAllServiceCategories(activeOnly = false): Promise<ServiceCategory[]> {
  let query = supabase
    .from('service_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[servicesRepo] Error fetching service categories:', error);
    return [];
  }

  return data || [];
}

export async function getServiceCategoryById(id: string): Promise<ServiceCategory | null> {
  const { data, error } = await supabase
    .from('service_categories')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[servicesRepo] Error fetching service category:', error);
    return null;
  }

  return data;
}

export async function createServiceCategory(
  input: ServiceCategoryCreateInput
): Promise<{ category: ServiceCategory | null; error?: string }> {
  const { data, error } = await supabase
    .from('service_categories')
    .insert({
      name_fr: input.name_fr,
      name_ar: input.name_ar,
      slug: input.slug,
      description_fr: input.description_fr,
      description_ar: input.description_ar,
      icon: input.icon,
      is_active: input.is_active ?? true,
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    console.error('[servicesRepo] Error creating service category:', error);
    return { category: null, error: error.message };
  }

  return { category: data };
}

export async function updateServiceCategory(
  input: ServiceCategoryUpdateInput
): Promise<boolean> {
  const { id, ...updates } = input;

  const { error } = await supabase
    .from('service_categories')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('[servicesRepo] Error updating service category:', error);
    return false;
  }

  return true;
}

export async function toggleServiceCategoryActive(id: string, isActive: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('service_categories')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) {
    console.error('[servicesRepo] Error toggling service category:', error);
    return false;
  }

  return true;
}

export async function deleteServiceCategory(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('service_categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[servicesRepo] Error deleting service category:', error);
    return false;
  }

  return true;
}

// ============ Service Subcategories ============

export async function getSubcategoriesByCategory(
  categoryId: string,
  activeOnly = false
): Promise<ServiceSubcategory[]> {
  let query = supabase
    .from('service_subcategories')
    .select('*')
    .eq('category_id', categoryId);

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[servicesRepo] Error fetching subcategories:', error);
    return [];
  }

  return data || [];
}

export async function createServiceSubcategory(
  categoryId: string,
  name_fr: string,
  name_ar: string,
  slug: string
): Promise<{ subcategory: ServiceSubcategory | null; error?: string }> {
  const { data, error } = await supabase
    .from('service_subcategories')
    .insert({
      category_id: categoryId,
      name_fr,
      name_ar,
      slug,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('[servicesRepo] Error creating subcategory:', error);
    return { subcategory: null, error: error.message };
  }

  return { subcategory: data };
}

export async function updateServiceSubcategory(
  id: string,
  updates: Partial<ServiceSubcategory>
): Promise<boolean> {
  const { error } = await supabase
    .from('service_subcategories')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('[servicesRepo] Error updating subcategory:', error);
    return false;
  }

  return true;
}

export async function toggleServiceSubcategoryActive(id: string, isActive: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('service_subcategories')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) {
    console.error('[servicesRepo] Error toggling subcategory:', error);
    return false;
  }

  return true;
}

export async function deleteServiceSubcategory(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('service_subcategories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[servicesRepo] Error deleting subcategory:', error);
    return false;
  }

  return true;
}
