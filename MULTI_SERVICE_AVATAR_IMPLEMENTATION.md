# Multi-Service Support & Profile Avatar - Implementation Summary

This document summarizes the implementation of multi-service support and profile avatar functionality for artisan profiles.

## Overview

This implementation adds two major features to the artisan profile system:

1. **Avatar Upload**: Artisans can upload a profile picture with fallback to initials
2. **Multi-Service Support**: Artisans can select up to 5 service subcategories they offer

## Database Changes

### Migrations

#### Migration 106: Avatar Support (`106_add_artisan_avatar_support.sql`)

- **Table Changes**:
  - Added `avatar_url` column to `artisan_profiles` table (TEXT, nullable)
  
- **Storage Bucket**:
  - Created `artisan-avatars` bucket (public)
  - Files stored at: `artisan-avatars/{userId}/{timestamp-random}.ext`
  
- **RLS Policies**:
  - Public: SELECT (anyone can view avatars)
  - Artisans: INSERT/UPDATE/DELETE their own avatars (path must match user_id)
  - Admins: Full access to all avatars

#### Migration 107: Multi-Service Support (`107_enhance_multi_service_support.sql`)

- **Helper Functions**:
  - `count_artisan_services(artisan_user_id)`: Count active services for an artisan
  - `get_artisan_services_with_details(artisan_user_id)`: Fetch services with category/subcategory details
  - `upsert_artisan_services(artisan_user_id, services)`: Replace artisan's services (max 5)
  
- **Validation**:
  - Trigger function `validate_artisan_service_limit()`: Enforces max 5 active services per artisan
  - Trigger on `artisan_services` table executes validation before INSERT/UPDATE
  
- **Error Handling**:
  - Raises exception with helpful message if limit exceeded
  - HINT provided to guide users to deactivate existing services

## Storage Integration

### Updated Files: `src/lib/storage.ts`

**New Bucket Type**:
```typescript
export type StorageBucket = 
  | 'property-images' 
  | 'banner-images' 
  | 'payment-receipts' 
  | 'agency-logos' 
  | 'artisan-avatars';  // NEW
```

**New Upload Function**:
```typescript
export async function uploadArtisanAvatar(
  file: File, 
  userId: string
): Promise<UploadResult>
```

**Bucket Configuration**:
```typescript
'artisan-avatars': {
  maxSize: 2 * 1024 * 1024,  // 2MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
}
```

## UI Components

### 1. AvatarUpload Component (`src/components/artisan/AvatarUpload.tsx`)

**Features**:
- Upload avatar with preview
- Remove avatar functionality
- File validation (type, size)
- Loading states with spinner overlay
- Error handling with user-friendly messages
- Avatar fallback to initials (first + last name)
- Configurable sizes: sm, md, lg, xl

**Props**:
```typescript
interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userId: string;
  userName?: string;
  onUploadSuccess?: (url: string) => void;
  onRemove?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}
```

**Usage Example**:
```tsx
<AvatarUpload
  currentAvatarUrl={profile.avatar_url}
  userId={user.id}
  userName={profile.business_name}
  onUploadSuccess={(url) => updateProfile({ avatar_url: url })}
  onRemove={() => updateProfile({ avatar_url: null })}
  size="xl"
/>
```

### 2. MultiServiceSelector Component (`src/components/artisan/MultiServiceSelector.tsx`)

**Features**:
- Fetches service categories and subcategories from database
- Loads user's existing selected services
- Checkbox-based selection interface
- Groups subcategories by category
- Shows selected services as badges with remove option
- Validates max 5 services limit
- Error messages for validation failures
- Real-time service count display

**Props**:
```typescript
interface MultiServiceSelectorProps {
  userId: string;
  currentCity: string;
  onServicesChange?: (services: SelectedService[]) => void;
  maxServices?: number;
  className?: string;
}
```

**Usage Example**:
```tsx
<MultiServiceSelector
  userId={user.id}
  currentCity="Casablanca"
  onServicesChange={(services) => setSelectedServices(services)}
  maxServices={5}
/>
```

### 3. ArtisanPublicProfile Component (`src/components/artisan/ArtisanPublicProfile.tsx`)

**Features**:
- Displays artisan profile with avatar
- Avatar fallback to initials if no image
- Shows verification badge
- Displays selected services as tags
- Contact information (phone, WhatsApp, email)
- Boosted badge for promoted profiles
- RTL support

**Props**:
```typescript
interface ArtisanPublicProfileProps {
  profile: {
    id: string;
    business_name: string;
    description_fr?: string | null;
    description_ar?: string | null;
    phone: string;
    whatsapp?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    is_verified: boolean;
    is_boosted: boolean;
    city_name_fr?: string;
    city_name_ar?: string;
  };
  services?: ArtisanService[];
  isRTL?: boolean;
  className?: string;
}
```

**Usage Example**:
```tsx
<ArtisanPublicProfile
  profile={artisanProfile}
  services={artisanServices}
  isRTL={language === 'ar'}
/>
```

## Pages

### ArtisanProfileEdit Page (`src/pages/artisan/ArtisanProfileEdit.tsx`)

**Route**: `/artisan/profile/edit`

**Features**:
- Edit basic information (business name, descriptions)
- Upload/remove avatar
- Update contact information
- Select up to 5 services
- Save all changes with single action
- Uses RPC function for transactional service updates

**Sections**:
1. **Avatar Upload**: Profile photo management
2. **Basic Information**: Business name, descriptions (FR/AR)
3. **Contact Information**: Phone, WhatsApp, Email
4. **Services**: Multi-service selector
5. **Actions**: Save/Cancel buttons

## Route Updates

### Updated Files: `src/App.tsx`

**New Routes**:
```tsx
<Route path="/artisan/profile/edit" element={<ArtisanProfileEdit />} />
```

**Updated Dashboard Link**:
- Changed "Modifier le profil" button in `ArtisanDashboard` to link to `/artisan/profile/edit` instead of `/artisan/onboarding`

## Database Queries

### Example: Fetch Profile with Services

```typescript
// Fetch artisan profile
const { data: profile } = await supabase
  .from('artisan_profiles')
  .select('*, cities(id, name_fr, name_ar)')
  .eq('user_id', userId)
  .single();

// Fetch services using RPC
const { data: services } = await supabase
  .rpc('get_artisan_services_with_details', {
    artisan_user_id: userId
  });
```

### Example: Update Services

```typescript
// Update services (replaces all existing)
const { error } = await supabase.rpc('upsert_artisan_services', {
  artisan_user_id: userId,
  services: [
    {
      category_id: 'uuid-1',
      subcategory_id: 'uuid-2',
      city: 'Casablanca'
    },
    // ... up to 5 services
  ]
});
```

## Security Considerations

### RLS Policies

1. **artisan_profiles**:
   - Public: SELECT (active & verified profiles only)
   - Owner: SELECT/UPDATE (their own profile)
   - Admin: All operations

2. **artisan_services**:
   - Public: SELECT (active services only)
   - Owner: INSERT/UPDATE/DELETE (their own services)
   - Admin: All operations

3. **Storage (artisan-avatars)**:
   - Public: SELECT (view all avatars)
   - Owner: INSERT/UPDATE/DELETE (path must match user_id)
   - Admin: All operations

### Validation

- **File Upload**: Type, size validated client-side and server-side
- **Services Limit**: Enforced by database trigger (max 5)
- **User Ownership**: RPC functions verify auth.uid() matches artisan_user_id

## Performance Optimizations

1. **Single Query for Services**: RPC function fetches services with category/subcategory details in one call
2. **Efficient Avatar Fallback**: Uses CSS and SVG for initials, no external requests
3. **Optimized Images**: WebP support for modern browsers, JPEG/PNG fallback
4. **Caching**: Storage bucket existence checks cached in memory

## Migration Instructions

### For Development

1. **Run Migrations**:
   ```bash
   # Ensure Supabase CLI is installed
   supabase migration up
   ```

2. **Verify Storage Bucket**:
   - Go to Supabase Dashboard → Storage
   - Verify `artisan-avatars` bucket exists
   - Check RLS policies are enabled

3. **Test in Browser**:
   - Navigate to `/artisan/profile/edit`
   - Upload avatar (should work)
   - Select services (should enforce max 5)
   - Save changes (should persist)

### For Production

1. **Apply Migrations**:
   ```sql
   -- Run in Supabase SQL Editor
   -- Copy contents of 106_add_artisan_avatar_support.sql
   -- Copy contents of 107_enhance_multi_service_support.sql
   ```

2. **Verify Setup**:
   ```sql
   -- Check avatar_url column exists
   SELECT avatar_url FROM artisan_profiles LIMIT 1;
   
   -- Check RPC functions exist
   SELECT proname FROM pg_proc WHERE proname LIKE '%artisan%';
   
   -- Check trigger exists
   SELECT tgname FROM pg_trigger WHERE tgname = 'enforce_artisan_service_limit';
   ```

3. **Test Upload**:
   - Create test artisan account
   - Upload avatar
   - Select multiple services
   - Verify limits enforced

## Future Enhancements

### Potential Improvements

1. **Avatar Cropping**: Add client-side image cropping tool
2. **Service Icons**: Display icons for each service category
3. **Service Search**: Filter services by keyword
4. **Service History**: Track when services were added/removed
5. **Avatar Compression**: Automatically compress uploaded images
6. **Multiple Avatars**: Allow gallery of work photos
7. **Service Pricing**: Add price ranges for each service
8. **Availability Calendar**: Show service availability by date

### Technical Debt

1. **Type Generation**: Need to regenerate Supabase types after migration
2. **E2E Tests**: Add Playwright tests for avatar upload and service selection
3. **Accessibility**: Improve keyboard navigation in MultiServiceSelector
4. **i18n**: Extract hardcoded strings to translation files

## Testing Checklist

- [ ] Upload avatar (JPG, PNG, WebP)
- [ ] Remove avatar (verify it clears)
- [ ] Avatar fallback displays initials correctly
- [ ] File size validation (reject >2MB)
- [ ] File type validation (reject non-images)
- [ ] Select 1-5 services successfully
- [ ] Attempt to select 6th service (should show error)
- [ ] Deselect service (should allow adding different one)
- [ ] Save profile (verify all changes persist)
- [ ] Public profile displays avatar and services correctly
- [ ] RLS policies prevent unauthorized access
- [ ] Verify responsive design on mobile

## Support

For questions or issues:
- Check migration files for exact SQL
- Review RLS policies in Supabase Dashboard
- Test RPC functions in SQL Editor
- Verify storage bucket configuration

## Contributors

- Implementation: GitHub Copilot Agent
- Review: Project Team
