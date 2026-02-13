/**
 * Image utility functions for Supabase storage
 * Centralized location for image URL handling to reduce code duplication
 */

import { supabase } from '@/lib/supabase';

/**
 * Get public URL for a property image
 * Handles both full URLs and storage paths
 * @param pathOrUrl - Storage path or full URL
 * @returns Public URL to the image
 */
export function getPublicImageUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return '';
  
  // Already a full URL
  if (pathOrUrl.startsWith('http')) {
    return pathOrUrl;
  }
  
  // Get public URL from storage
  return supabase.storage
    .from('property-images')
    .getPublicUrl(pathOrUrl).data.publicUrl;
}

/**
 * Get display URL for an image with optional size transformation
 * @param img - Image path or URL
 * @param size - Optional size (thumbnail, medium, large)
 * @returns Display URL for the image
 */
export function getDisplayImageUrl(img: string | null | undefined, size?: 'thumbnail' | 'medium' | 'large'): string {
  const baseUrl = getPublicImageUrl(img);
  
  // Add transformation parameters if supported by your storage
  // This is a placeholder - adjust based on your storage service
  if (size && baseUrl) {
    // Example transformation (adjust for your service)
    // return `${baseUrl}?width=${sizeMap[size]}`;
  }
  
  return baseUrl;
}

/**
 * Get fallback image URL
 * Returns a placeholder image from Unsplash
 */
export function getFallbackImageUrl(): string {
  return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80';
}

/**
 * Get image URL with fallback
 * @param pathOrUrl - Image path or URL
 * @returns Image URL or fallback if empty
 */
export function getImageUrlWithFallback(pathOrUrl: string | null | undefined): string {
  return getPublicImageUrl(pathOrUrl) || getFallbackImageUrl();
}
