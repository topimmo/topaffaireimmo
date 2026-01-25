import { supabase } from './supabase';
/**
 * Upload a file to Supabase Storage with retry logic
 * Files are organized by user ID for proper RLS enforcement
 */
export async function uploadFile({ bucket, file, userId, folder }) {
    const maxRetries = 2;
    let lastError = null;
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
                // Add helpful context for common errors
                if (uploadError.message?.toLowerCase().includes('permission') ||
                    uploadError.message?.toLowerCase().includes('unauthorized') ||
                    uploadError.message?.toLowerCase().includes('forbidden')) {
                    console.error('[Storage] Permission denied. Possible causes:');
                    console.error('  1. User profile does not exist in the profiles table');
                    console.error('  2. User role is not \'real_estate_advertiser\' or \'admin\'');
                    console.error('  3. User is not authenticated (auth.uid() is null)');
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
        }
        catch (error) {
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
        userFriendlyError = 'Permission denied. Please ensure you are logged in as a real estate advertiser.';
    }
    else if (errorMessage.toLowerCase().includes('size') ||
        errorMessage.toLowerCase().includes('payload') ||
        errorMessage.toLowerCase().includes('exceeded')) {
        userFriendlyError = `File too large. Maximum size is ${(BUCKET_CONFIG[bucket]?.maxSize || 5242880) / 1024 / 1024}MB.`;
    }
    else if (errorMessage.toLowerCase().includes('type') ||
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
export async function uploadFiles(bucket, files, userId, folder) {
    const results = await Promise.all(files.map(file => uploadFile({ bucket, file, userId, folder })));
    return results;
}
/**
 * Delete a file from storage
 */
export async function deleteFile(bucket, path) {
    const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);
    return !error;
}
/**
 * Delete multiple files
 */
export async function deleteFiles(bucket, paths) {
    if (paths.length === 0)
        return true;
    const { error } = await supabase.storage
        .from(bucket)
        .remove(paths);
    return !error;
}
/**
 * Get signed URL for private files (like payment receipts)
 */
export async function getSignedUrl(bucket, path, expiresIn = 3600) {
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);
    if (error)
        return null;
    return data.signedUrl;
}
/**
 * Upload property images
 */
export async function uploadPropertyImages(files, userId, propertyId) {
    const folder = propertyId || 'temp';
    return uploadFiles('property-images', files, userId, folder);
}
/**
 * Upload banner image
 */
export async function uploadBannerImage(file, userId) {
    return uploadFile({
        bucket: 'banner-images',
        file,
        userId,
    });
}
/**
 * Upload payment receipt
 */
export async function uploadPaymentReceipt(file, userId) {
    return uploadFile({
        bucket: 'payment-receipts',
        file,
        userId,
    });
}
/**
 * Upload agency logo
 */
export async function uploadAgencyLogo(file, userId) {
    return uploadFile({
        bucket: 'agency-logos',
        file,
        userId,
    });
}
/**
 * Validate file before upload with detailed error messages
 */
export function validateFile(file, options) {
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
export function validateFiles(files, options) {
    const { maxCount } = options;
    const errors = [];
    const validFiles = [];
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
        }
        else {
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
};
