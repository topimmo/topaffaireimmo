/**
 * Zod Validation Schemas for Marketplace
 * 
 * This file contains all validation schemas used throughout the application
 * for artisan profiles, requests, reviews, and related entities.
 */

import { z } from 'zod';

// =====================================================
// COMMON SCHEMAS
// =====================================================

const phoneRegex = /^\+212[0-9]{9}$/;

export const MoroccanPhoneSchema = z.string()
  .regex(phoneRegex, 'Phone must be a valid Moroccan number (+212XXXXXXXXX)')
  .or(z.string().length(0)); // Allow empty string

export const UUIDSchema = z.string().uuid('Invalid UUID format');

export const IntegerIDSchema = z.number().int().positive('ID must be a positive integer');

// =====================================================
// ARTISAN PROFILE SCHEMAS
// =====================================================

export const CreateArtisanProfileSchema = z.object({
  business_name: z.string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must be less than 100 characters')
    .trim(),
  
  phone: z.string()
    .regex(phoneRegex, 'Phone must be a valid Moroccan number (+212XXXXXXXXX)'),
  
  whatsapp: z.string()
    .regex(phoneRegex, 'WhatsApp must be a valid Moroccan number')
    .optional()
    .or(z.literal('')),
  
  email: z.string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  
  description_fr: z.string()
    .max(1000, 'French description must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  
  description_ar: z.string()
    .max(1000, 'Arabic description must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  
  service_category_id: UUIDSchema,
  
  city_id: IntegerIDSchema,
});

export type CreateArtisanProfileInput = z.infer<typeof CreateArtisanProfileSchema>;

export const UpdateArtisanProfileSchema = CreateArtisanProfileSchema.partial().extend({
  id: UUIDSchema,
});

export type UpdateArtisanProfileInput = z.infer<typeof UpdateArtisanProfileSchema>;

// =====================================================
// NEIGHBORHOOD SELECTION SCHEMA
// =====================================================

export const UpdateNeighborhoodsSchema = z.object({
  artisan_profile_id: UUIDSchema,
  neighborhood_ids: z.array(IntegerIDSchema)
    .min(1, 'Select at least one neighborhood')
    .max(20, 'Maximum 20 neighborhoods allowed'),
});

export type UpdateNeighborhoodsInput = z.infer<typeof UpdateNeighborhoodsSchema>;

// =====================================================
// REQUEST SCHEMAS
// =====================================================

export const CreateRequestSchema = z.object({
  artisan_profile_id: UUIDSchema,
  
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters')
    .trim(),
  
  preferred_contact_method: z.enum(['phone', 'whatsapp', 'email']).default('phone'),
  
  client_name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100)
    .optional(),
  
  client_phone: z.string()
    .regex(phoneRegex)
    .optional(),
  
  client_email: z.string()
    .email()
    .optional(),
  
  client_whatsapp: z.string()
    .regex(phoneRegex)
    .optional(),
  
  urgency: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  
  preferred_date: z.string()
    .date()
    .optional()
    .or(z.literal('')),
  
  preferred_time_slot: z.enum(['morning', 'afternoon', 'evening', 'flexible'])
    .optional()
    .or(z.literal('')),
  
  budget_min: z.number()
    .int()
    .nonnegative('Budget must be positive')
    .optional(),
  
  budget_max: z.number()
    .int()
    .nonnegative('Budget must be positive')
    .optional(),
}).refine(
  (data) => {
    // If both budgets provided, max must be >= min
    if (data.budget_min !== undefined && data.budget_max !== undefined) {
      return data.budget_max >= data.budget_min;
    }
    return true;
  },
  {
    message: 'Maximum budget must be greater than or equal to minimum budget',
    path: ['budget_max'],
  }
);

export type CreateRequestInput = z.infer<typeof CreateRequestSchema>;

export const UpdateRequestStatusSchema = z.object({
  request_id: UUIDSchema,
  status: z.enum(['pending', 'viewed', 'contacted', 'accepted', 'rejected', 'completed', 'cancelled']),
  artisan_response: z.string()
    .max(1000)
    .optional(),
});

export type UpdateRequestStatusInput = z.infer<typeof UpdateRequestStatusSchema>;

// =====================================================
// REVIEW SCHEMAS
// =====================================================

export const CreateReviewSchema = z.object({
  artisan_profile_id: UUIDSchema,
  
  request_id: UUIDSchema.optional(),
  
  rating: z.number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  
  title: z.string()
    .max(200, 'Title must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  
  review_text: z.string()
    .min(10, 'Review must be at least 10 characters')
    .max(2000, 'Review must be less than 2000 characters')
    .trim(),
  
  // Optional detailed ratings
  quality_rating: z.number().int().min(1).max(5).optional(),
  professionalism_rating: z.number().int().min(1).max(5).optional(),
  communication_rating: z.number().int().min(1).max(5).optional(),
  value_rating: z.number().int().min(1).max(5).optional(),
  
  would_recommend: z.boolean().default(true),
  
  photo_urls: z.array(z.string().url()).max(5, 'Maximum 5 photos').optional(),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

export const RespondToReviewSchema = z.object({
  review_id: UUIDSchema,
  artisan_response: z.string()
    .min(10, 'Response must be at least 10 characters')
    .max(1000, 'Response must be less than 1000 characters')
    .trim(),
});

export type RespondToReviewInput = z.infer<typeof RespondToReviewSchema>;

// =====================================================
// SEARCH/FILTER SCHEMAS
// =====================================================

export const SearchArtisansSchema = z.object({
  city_id: IntegerIDSchema.optional(),
  service_category_id: UUIDSchema.optional(),
  neighborhood_ids: z.array(IntegerIDSchema).optional(),
  search_query: z.string().max(100).optional(),
  min_rating: z.number().min(1).max(5).optional(),
  is_boosted: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type SearchArtisansInput = z.infer<typeof SearchArtisansSchema>;

// =====================================================
// ADMIN SCHEMAS
// =====================================================

export const VerifyArtisanSchema = z.object({
  artisan_profile_id: UUIDSchema,
  is_verified: z.boolean(),
  is_active: z.boolean(),
  rejection_reason: z.string()
    .max(500)
    .optional(),
});

export type VerifyArtisanInput = z.infer<typeof VerifyArtisanSchema>;

export const ModerateReviewSchema = z.object({
  review_id: UUIDSchema,
  is_hidden: z.boolean(),
  is_flagged: z.boolean(),
  moderation_note: z.string()
    .max(500)
    .optional(),
});

export type ModerateReviewInput = z.infer<typeof ModerateReviewSchema>;

// =====================================================
// MEDIA SCHEMAS
// =====================================================

export const UploadMediaSchema = z.object({
  artisan_profile_id: UUIDSchema,
  media_type: z.enum(['image', 'video', 'document', 'certificate']),
  category: z.enum([
    'profile_photo',
    'cover_photo',
    'work_sample',
    'certificate',
    'license',
    'insurance',
    'other'
  ]),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  is_public: z.boolean().default(true),
});

export type UploadMediaInput = z.infer<typeof UploadMediaSchema>;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Validate data against a schema and return typed result
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * Format Zod errors for display
 */
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(err.message);
  });
  
  return formatted;
}

/**
 * Get first error message for a field
 */
export function getFieldError(
  errors: Record<string, string[]> | undefined,
  field: string
): string | undefined {
  if (!errors || !errors[field]) return undefined;
  return errors[field][0];
}
