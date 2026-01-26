# Image Upload Permission System

## Overview
This document explains the role-based permission system for image uploads in TopaffaireImmo.

## User Roles
The system supports three main user roles defined in the `profiles` table:
- **admin**: Full system access
- **real_estate_advertiser**: Can list properties and upload property images
- **commercial_advertiser**: Can create banner ads and upload banner images

## Permission Rules

### Property Images (`property-images` bucket)
**Who can upload:**
- Admin users (`is_admin = true`)
- Real estate advertisers (`user_role = 'real_estate_advertiser'`)

**Who cannot upload:**
- Commercial advertisers
- Unauthenticated users

### Banner Images (`banner-images` bucket)
**Who can upload:**
- Admin users (`is_admin = true`)
- Commercial advertisers (`user_role = 'commercial_advertiser'`)

**Who cannot upload:**
- Real estate advertisers (unless they are also admins)
- Unauthenticated users

### Agency Logos (`agency-logos` bucket)
**Who can upload:**
- Admin users (`is_admin = true`)
- Real estate advertisers with agency type (`user_role = 'real_estate_advertiser' AND advertiser_type = 'agency'`)

**Who cannot upload:**
- Real estate advertisers with owner type
- Commercial advertisers (unless admins)
- Unauthenticated users

### Payment Receipts (`payment-receipts` bucket)
**Who can upload:**
- Any authenticated user

## Implementation

### Frontend Permission Checks
Use the helper functions from `src/lib/permissions.ts`:

```typescript
import { canUploadPropertyImages, getPermissionDeniedMessage } from '@/lib/permissions';

// Check permission before allowing upload
if (!canUploadPropertyImages(profile)) {
  alert(getPermissionDeniedMessage('upload_property_images', language));
  return;
}
```

### Backend RLS Policies
Supabase Row Level Security (RLS) policies enforce permissions at the database level.
See `supabase/migrations/043_fix_image_upload_permissions.sql` for implementation.

## Security Notes
1. **Frontend checks are for UX only** - They provide immediate feedback but can be bypassed
2. **Backend RLS policies are the source of truth** - These cannot be bypassed and ensure security
3. **Folder structure enforcement** - Users can only upload to folders matching their user ID
4. **Profile existence** - RLS policies require that the user has a valid profile in the `profiles` table

## Error Messages
All error messages are multilingual (French/Arabic) and centralized in the permission helper.
This ensures consistency across the application.

## Testing
To test permissions:
1. Create users with different roles
2. Attempt to upload images to various buckets
3. Verify that unauthorized uploads are blocked both in UI and at the backend
4. Check browser console for detailed error messages during development

## Troubleshooting

### "Permission denied" error when uploading
**Possible causes:**
1. User is not authenticated
2. User profile does not exist in the database
3. User role is incorrect for the type of image being uploaded
4. Attempting to upload to a folder that doesn't match user ID

**Solutions:**
1. Ensure user is logged in
2. Check that profile was created during signup (see migration 042)
3. Verify user has the correct role in the `profiles` table
4. Check browser console for detailed error logs

### Images upload in UI but fail at backend
This indicates a mismatch between frontend and backend permissions.
- Check that both use the same role definitions
- Verify RLS policies match frontend permission logic
- Run `043_fix_image_upload_permissions.sql` migration

## Related Files
- `src/lib/permissions.ts` - Permission helper functions
- `src/lib/storage.ts` - File upload implementation
- `src/pages/AddListing.tsx` - Property creation with image upload
- `src/pages/EditListing.tsx` - Property editing with image upload
- `supabase/migrations/043_fix_image_upload_permissions.sql` - RLS policy definitions
- `supabase/migrations/042_production_fixes_comprehensive.sql` - Storage bucket setup
