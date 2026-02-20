/**
 * Image utility functions for Supabase storage
 * Centralized location for image URL handling to reduce code duplication
 */

import { supabase } from '@/lib/supabase';

/** Files larger than this threshold (bytes) will be compressed before upload. */
export const IMAGE_COMPRESSION_THRESHOLD = 1.5 * 1024 * 1024; // 1.5 MB

/**
 * Compress an image file using a canvas element.
 * Only compresses JPEG/WebP source files; PNG files are returned as-is to
 * avoid lossy degradation when the source may have transparency.
 *
 * @param file    - The original image file.
 * @param quality - JPEG/WebP quality (0–1). Defaults to 0.8.
 * @returns A new File that is the compressed version, or the original file
 *          if compression is not applicable / didn't reduce size.
 */
export async function compressImage(file: File, quality = 0.8): Promise<File> {
  // Only compress JPEG and WebP (PNG often gets larger when re-encoded as JPEG)
  if (!['image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
    return file;
  }
  // Skip if already small enough
  if (file.size <= IMAGE_COMPRESSION_THRESHOLD) {
    return file;
  }

  return new Promise<File>((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      // Downsample if very large (max 1920 on longest side)
      const MAX_DIMENSION = 1920;
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      const outputType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // Compression made it larger or failed – keep original
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name, { type: outputType, lastModified: Date.now() }));
        },
        outputType,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fallback to original on error
    };

    img.src = objectUrl;
  });
}

/**
 * Get public URL for a property image
 * Handles both full URLs and storage paths
 * @param pathOrUrl - Storage path or full URL
 * @returns Public URL to the image, or empty string if input is null/undefined
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
