import { supabase } from './supabase';

export type StorageBucket = 'property-images' | 'banner-images' | 'payment-receipts' | 'agency-logos';

interface UploadOptions {
  bucket: StorageBucket;
  file: File;
  userId: string;
  folder?: string;
}

interface UploadResult {
  url: string;
  path: string;
  error: string | null;
}

/**
 * Upload a file to Supabase Storage
 * Files are organized by user ID for proper RLS enforcement
 */
export async function uploadFile({ bucket, file, userId, folder }: UploadOptions): Promise<UploadResult> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;
    
    // Build path: userId/[folder/]filename
    const path = folder 
      ? `${userId}/${folder}/${fileName}`
      : `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      url: publicUrl,
      path,
      error: null,
    };
  } catch (error) {
    return {
      url: '',
      path: '',
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  bucket: StorageBucket,
  files: File[],
  userId: string,
  folder?: string
): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map(file => uploadFile({ bucket, file, userId, folder }))
  );
  return results;
}

/**
 * Delete a file from storage
 */
export async function deleteFile(bucket: StorageBucket, path: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  return !error;
}

/**
 * Delete multiple files
 */
export async function deleteFiles(bucket: StorageBucket, paths: string[]): Promise<boolean> {
  if (paths.length === 0) return true;
  
  const { error } = await supabase.storage
    .from(bucket)
    .remove(paths);

  return !error;
}

/**
 * Get signed URL for private files (like payment receipts)
 */
export async function getSignedUrl(
  bucket: StorageBucket, 
  path: string, 
  expiresIn = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) return null;
  return data.signedUrl;
}

/**
 * Upload property images
 */
export async function uploadPropertyImages(
  files: File[], 
  userId: string, 
  propertyId?: string
): Promise<UploadResult[]> {
  const folder = propertyId || 'temp';
  return uploadFiles('property-images', files, userId, folder);
}

/**
 * Upload banner image
 */
export async function uploadBannerImage(
  file: File, 
  userId: string
): Promise<UploadResult> {
  return uploadFile({
    bucket: 'banner-images',
    file,
    userId,
  });
}

/**
 * Upload payment receipt
 */
export async function uploadPaymentReceipt(
  file: File, 
  userId: string
): Promise<UploadResult> {
  return uploadFile({
    bucket: 'payment-receipts',
    file,
    userId,
  });
}

/**
 * Upload agency logo
 */
export async function uploadAgencyLogo(
  file: File, 
  userId: string
): Promise<UploadResult> {
  return uploadFile({
    bucket: 'agency-logos',
    file,
    userId,
  });
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File, 
  options: { maxSize?: number; allowedTypes?: string[] }
): { valid: boolean; error?: string } {
  const { maxSize = 5 * 1024 * 1024, allowedTypes } = options;

  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit` 
    };
  }

  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `File type ${file.type} not allowed` 
    };
  }

  return { valid: true };
}

/**
 * Get bucket configuration
 */
export const BUCKET_CONFIG = {
  'property-images': {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  'banner-images': {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
  'payment-receipts': {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  },
  'agency-logos': {
    maxSize: 1 * 1024 * 1024, // 1MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  },
};
