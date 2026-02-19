import { supabase } from './supabase';

export type StorageBucket = 'property-images' | 'banner-images' | 'payment-receipts' | 'agency-logos' | 'artisan-avatars';

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
  fileName?: string;
  size?: number;
  mimeType?: string;
}

// Cache for bucket existence checks to avoid repeated API calls
const bucketExistenceCache: Map<string, boolean> = new Map();

/**
 * Check if a storage bucket exists
 */
async function checkBucketExists(bucketName: string): Promise<boolean> {
  // Check cache first
  if (bucketExistenceCache.has(bucketName)) {
    return bucketExistenceCache.get(bucketName)!;
  }

  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.warn(`[Storage] Unable to verify bucket existence for '${bucketName}':`, error.message);
      console.warn('[Storage] This is non-blocking - upload will be attempted anyway');
      // Assume bucket exists to avoid blocking uploads
      bucketExistenceCache.set(bucketName, true);
      return true;
    }

    const exists = data?.some(bucket => bucket.id === bucketName || bucket.name === bucketName) || false;
    
    // Cache the result
    bucketExistenceCache.set(bucketName, exists);
    
    if (!exists) {
      console.warn(`[Storage] ⚠️ Bucket '${bucketName}' not found in Supabase Storage`);
      console.warn('[Storage] Expected buckets: property-images, banner-images, payment-receipts, agency-logos, artisan-avatars');
      console.warn('[Storage] To fix: Run migrations supabase/migrations/065_verify_storage_buckets.sql and 106_add_artisan_avatar_support.sql');
      console.warn('[Storage] Or create buckets manually in Supabase Storage Dashboard');
      console.warn('[Storage] Upload will be attempted anyway - it may fail if bucket does not exist');
    }
    
    return exists;
  } catch (err) {
    console.warn(`[Storage] Error checking bucket '${bucketName}':`, err instanceof Error ? err.message : 'Unknown error');
    console.warn('[Storage] This is non-blocking - upload will be attempted anyway');
    // Assume bucket exists to avoid blocking uploads
    bucketExistenceCache.set(bucketName, true);
    return true;
  }
}

/**
 * Upload a file to Supabase Storage with retry logic
 * Files are organized by user ID for proper RLS enforcement
 */
export async function uploadFile({ bucket, file, userId, folder }: UploadOptions): Promise<UploadResult> {
  const maxRetries = 2;
  let lastError: Error | null = null;

  // ── Client-side validation (size + type) before touching the network ──
  const bucketCfg = BUCKET_CONFIG[bucket];
  if (bucketCfg) {
    const validation = validateFile(file, {
      maxSize: bucketCfg.maxSize,
      allowedTypes: bucketCfg.allowedTypes,
    });
    if (!validation.valid) {
      console.error(`[Storage] Pre-upload validation failed for ${file.name}:`, validation.error);
      return { url: '', path: '', error: validation.error ?? 'Fichier invalide.', fileName: file.name, size: file.size, mimeType: file.type };
    }
  }

  // Check if bucket exists (with caching to avoid repeated checks)
  const bucketExists = await checkBucketExists(bucket);
  if (!bucketExists) {
    console.warn(`[Storage] Proceeding with upload to '${bucket}' despite bucket not being found. If upload fails, ensure bucket is created.`);
  }

  // Log upload attempt
  console.log(`[Storage] Uploading file to bucket '${bucket}':`, {
    fileName: file.name,
    size: `${(file.size / 1024).toFixed(2)} KB`,
    mimeType: file.type,
    userId: userId.substring(0, 8) + '...',
  });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const ext = file.name.split('.').pop();
      const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;
      
      // Build path: userId/[folder/]filename
      const path = folder 
        ? `${userId}/${folder}/${fileName}`
        : `${userId}/${fileName}`;

      if (attempt > 0) {
        console.log(`[Storage] Retry attempt ${attempt}/${maxRetries} for ${file.name}`);
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error(`[Storage] Upload error (attempt ${attempt + 1}):`, uploadError);
        
        // Check if error is due to missing bucket
        if (uploadError.message?.toLowerCase().includes('bucket') && 
            uploadError.message?.toLowerCase().includes('not found')) {
          console.error(`[Storage] Bucket '${bucket}' does not exist.`);
          console.error('[Storage] Please create the bucket in Supabase Storage Dashboard or run migrations:');
          console.error(`  supabase/migrations/065_verify_storage_buckets.sql`);
        }
        
        // Add helpful context for common errors
        if (uploadError.message?.toLowerCase().includes('permission') || 
            uploadError.message?.toLowerCase().includes('unauthorized') ||
            uploadError.message?.toLowerCase().includes('forbidden')) {
          console.error('[Storage] Permission denied. Possible causes:');
          console.error('  1. User is not authenticated (auth.uid() is null)');
          console.error('  2. Attempting to upload to a folder that doesn\'t match user ID');
          console.error('  3. User role does not match bucket requirements (check RLS policies)');
          console.error('  4. Storage bucket RLS policy is blocking the upload');
        }
        
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      console.log(`[Storage] Upload successful:`, {
        fileName: file.name,
        url: publicUrl.substring(0, 50) + '...',
      });

      return {
        url: publicUrl,
        path,
        error: null,
        fileName: file.name,
        size: file.size,
        mimeType: file.type,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Upload failed');
      
      // Don't retry on certain error types
      const errorMsg = lastError.message.toLowerCase();
      const nonRetriableErrors = [
        'payload', 'size', 'type', 'permission', 
        'unauthorized', 'forbidden', 'invalid', 'exceeded'
      ];
      
      if (nonRetriableErrors.some(keyword => errorMsg.includes(keyword))) {
        console.error(`[Storage] Non-retryable error for ${file.name}:`, lastError.message);
        break;
      }
    }
  }

  const errorMessage = lastError?.message || 'Upload failed after retries';
  console.error(`[Storage] Final upload failure for ${file.name}:`, errorMessage);

  // Provide user-friendly error message based on error type
  let userFriendlyError = errorMessage;
  if (errorMessage.toLowerCase().includes('permission') || 
      errorMessage.toLowerCase().includes('unauthorized') ||
      errorMessage.toLowerCase().includes('forbidden')) {
    // Generic permission error - specific role requirements should be checked in the UI
    userFriendlyError = 'Permission denied. Please ensure you are logged in and have the required permissions.';
  } else if (errorMessage.toLowerCase().includes('size') || 
             errorMessage.toLowerCase().includes('payload') ||
             errorMessage.toLowerCase().includes('exceeded')) {
    userFriendlyError = `File too large. Maximum size is ${(BUCKET_CONFIG[bucket]?.maxSize || 5242880) / 1024 / 1024}MB.`;
  } else if (errorMessage.toLowerCase().includes('type') || 
             errorMessage.toLowerCase().includes('invalid')) {
    userFriendlyError = `Invalid file type. Allowed types: ${BUCKET_CONFIG[bucket]?.allowedTypes.join(', ') || 'image/*'}.`;
  }

  return {
    url: '',
    path: '',
    error: userFriendlyError,
    fileName: file.name,
    size: file.size,
    mimeType: file.type,
  };
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
 * Upload property images and register them in property_images table
 */
export async function uploadPropertyImages(
  files: File[], 
  userId: string, 
  propertyId?: string
): Promise<UploadResult[]> {
  const folder = propertyId || 'temp';
  const results = await uploadFiles('property-images', files, userId, folder);
  
  // If we have a propertyId and successful uploads, register them in property_images table
  if (propertyId && propertyId !== 'temp') {
    const successfulUploads = results.filter(r => !r.error && r.path);
    
    if (successfulUploads.length > 0) {
      try {
        // Insert into property_images table for proper access control
        const propertyImageEntries = successfulUploads.map((upload, index) => ({
          property_id: propertyId,
          image_path: upload.path,
          image_order: index,
        }));
        
        const { error: insertError } = await supabase
          .from('property_images')
          .insert(propertyImageEntries);
        
        if (insertError) {
          console.error('[Storage] CRITICAL: Failed to register images in property_images table:', insertError.message);
          console.error('[Storage] Property ID:', propertyId);
          console.error('[Storage] Images uploaded but NOT registered - this may cause access issues');
          console.error('[Storage] Error details:', insertError);
          // Images are uploaded but not registered - this is a serious issue that should be logged
        } else {
          console.log(`[Storage] Successfully registered ${successfulUploads.length} images in property_images table`);
        }
      } catch (err) {
        console.error('[Storage] CRITICAL: Exception registering images:', err instanceof Error ? err.message : 'Unknown error');
        console.error('[Storage] Stack trace:', err);
      }
    }
  }
  
  return results;
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
 * Upload artisan avatar
 */
export async function uploadArtisanAvatar(
  file: File, 
  userId: string
): Promise<UploadResult> {
  return uploadFile({
    bucket: 'artisan-avatars',
    file,
    userId,
  });
}

/**
 * Validate file before upload with detailed error messages
 */
export function validateFile(
  file: File, 
  options: { maxSize?: number; allowedTypes?: string[] }
): { valid: boolean; error?: string } {
  const { maxSize = 5 * 1024 * 1024, allowedTypes } = options;

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
    return { 
      valid: false, 
      error: `File "${file.name}" is too large (${fileSizeMB}MB). Maximum size is ${maxSizeMB}MB.` 
    };
  }

  // Check file type
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `File "${file.name}" has an unsupported type (${file.type}). Allowed types: ${allowedTypes.join(', ')}.` 
    };
  }

  return { valid: true };
}

/**
 * Validate multiple files and return detailed results
 */
export function validateFiles(
  files: File[],
  options: { maxSize?: number; allowedTypes?: string[]; maxCount?: number }
): { valid: boolean; errors: string[]; validFiles: File[] } {
  const { maxCount } = options;
  const errors: string[] = [];
  const validFiles: File[] = [];

  // Check max count
  if (maxCount && files.length > maxCount) {
    errors.push(`Too many files selected. Maximum ${maxCount} files allowed.`);
    return { valid: false, errors, validFiles: [] };
  }

  // Validate each file
  for (const file of files) {
    const validation = validateFile(file, options);
    if (validation.valid) {
      validFiles.push(file);
    } else {
      errors.push(validation.error || 'Unknown validation error');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    validFiles
  };
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
  'artisan-avatars': {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
};
