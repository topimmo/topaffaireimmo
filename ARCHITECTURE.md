# Clean Architecture Documentation

## Overview

This document describes the clean architecture implementation for the TopAffaireImmo application. The refactoring addresses critical issues with role assignment, artisan onboarding persistence, and routing determinism.

## Architecture Layers

The application follows a strict layered architecture:

```
┌─────────────────────────────────────────────┐
│           UI Layer (React Components)       │
│   /src/features/*/ui/pages                  │
│   /src/features/*/ui/components             │
│   /src/pages (legacy)                       │
└──────────────────┬──────────────────────────┘
                   │ uses
┌──────────────────▼──────────────────────────┐
│      Application Layer (Business Logic)     │
│   /src/features/*/application               │
│   - Services (business logic)               │
│   - Use cases                               │
└──────────────────┬──────────────────────────┘
                   │ uses
┌──────────────────▼──────────────────────────┐
│      Domain Layer (Business Entities)       │
│   /src/features/*/domain                    │
│   - Types                                   │
│   - Interfaces                              │
└─────────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│      Data Layer (Database Access)           │
│   /src/core/data/repositories               │
│   - Repositories (DB operations)            │
└─────────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│      Infrastructure (External Services)     │
│   /src/lib/supabase.ts                      │
│   - Supabase client                         │
│   - External APIs                           │
└─────────────────────────────────────────────┘
```

## Folder Structure

```
src/
├── core/                           # Core infrastructure (cross-cutting concerns)
│   ├── auth/
│   │   ├── AuthProvider.tsx        # Enhanced auth context with enriched profile
│   │   ├── profileLoader.ts        # Single source of truth for profile data
│   │   └── useAuth.ts              # Auth hook export
│   ├── permissions/
│   │   ├── capabilities.ts         # Capability definitions & role mapping
│   │   └── can.ts                  # Capability checking functions
│   ├── routing/
│   │   └── guards/
│   │       ├── RequireAuth.tsx          # Authentication guard
│   │       ├── RequireProfileReady.tsx  # Profile loading guard
│   │       └── RequireCapability.tsx    # Permission guard
│   └── data/
│       └── repositories/
│           ├── userRepo.ts              # User/profile operations
│           ├── artisanRepo.ts           # Artisan profile operations
│           ├── servicesRepo.ts          # Service categories operations
│           └── requestsRepo.ts          # Service requests operations
│
├── features/                       # Feature modules (domain-driven)
│   ├── artisans/
│   │   ├── domain/
│   │   │   └── types.ts                 # Artisan domain types
│   │   ├── application/
│   │   │   └── artisanOnboardingService.ts  # Artisan business logic
│   │   └── ui/
│   │       └── pages/
│   │           ├── ArtisanOnboardingRefactored.tsx
│   │           └── ArtisanPending.tsx
│   └── services/
│       ├── domain/
│       │   └── types.ts                 # Services domain types
│       ├── application/
│       │   ├── servicesService.ts       # Public services logic
│       │   └── adminService.ts          # Admin services logic
│       └── ui/
│           └── pages/                   # (To be created)
│
├── pages/                          # Legacy pages (to be migrated)
├── components/                     # Shared UI components
├── contexts/                       # React contexts
├── hooks/                          # React hooks
└── lib/                            # Utilities & helpers
```

## Key Components

### 1. Authentication & Profile Management

#### AuthProvider (`/src/core/auth/AuthProvider.tsx`)

Enhanced authentication provider that manages:
- User authentication state (`user`, `session`)
- **Enriched profile** with admin and artisan status
- **profileReady flag** - true only after complete profile fetch
- Automatic profile creation for new users

**Key Features:**
- Uses `profileLoader` for single source of truth
- Prevents race conditions by waiting for profile before routing
- Timeout protection (4s) to prevent infinite loading

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: EnrichedProfile | null;  // NEW: Enriched with admin/artisan data
  loading: boolean;
  profileReady: boolean;              // NEW: Only true when fully loaded
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;  // NEW: Manually refresh profile
}
```

#### profileLoader (`/src/core/auth/profileLoader.ts`)

**Single source of truth** for all profile-related data.

```typescript
// Ensure profile exists (create if missing)
ensureProfileExists(user: User): Promise<boolean>

// Fetch complete profile with admin/artisan status
fetchProfile(userId: string): Promise<ProfileLoadResult>

// Combined: ensure + fetch
loadProfile(user: User): Promise<ProfileLoadResult>
```

**Returns `EnrichedProfile`:**
```typescript
{
  id: string;
  user_role?: string;
  advertiser_type?: string;
  isAdmin: boolean;                    // From admins table
  artisanProfile?: ArtisanProfile;     // From artisan_profiles table
}
```

### 2. Permissions & Capabilities

#### Capabilities Model (`/src/core/permissions/capabilities.ts`)

Centralized permission definitions based on roles and statuses.

**Capability Types:**
```typescript
type Capability =
  // User
  | 'can_create_listing'
  | 'can_view_own_listings'
  | 'can_create_service_request'
  // Artisan
  | 'can_view_artisan_onboarding'
  | 'can_access_artisan_dashboard'
  | 'can_create_artisan_service'
  | 'can_view_artisan_requests'
  | 'can_respond_to_requests'
  // Admin
  | 'can_access_admin'
  | 'can_manage_users'
  | 'can_manage_listings'
  | 'can_manage_service_categories'
  | 'can_manage_subcategories'
  | 'can_manage_artisans'
  | 'can_manage_service_requests'
  | 'can_view_admin_analytics';
```

**Role Mapping:**
```typescript
const CAPABILITY_MAP = {
  user: ['can_create_listing', ...],
  artisan_pending: ['can_view_artisan_onboarding', ...],
  artisan_verified: ['can_access_artisan_dashboard', ...],
  admin: ['can_access_admin', ...],  // Has all capabilities
}
```

**Effective Role Priority:**
```
admin > artisan_verified > artisan_pending > merchant > agent > user
```

#### Capability Checker (`/src/core/permissions/can.ts`)

```typescript
// Check single capability
can(profile: EnrichedProfile | null, capability: Capability): boolean

// Check if has ANY of the capabilities
canAny(profile: EnrichedProfile | null, capabilities: Capability[]): boolean

// Check if has ALL capabilities
canAll(profile: EnrichedProfile | null, capabilities: Capability[]): boolean
```

### 3. Routing Guards

Guards ensure **deterministic routing** without race conditions.

#### RequireAuth

Ensures user is authenticated before accessing route.

```tsx
<RequireAuth redirectTo="/login">
  <ProtectedPage />
</RequireAuth>
```

#### RequireProfileReady

Waits for profile to be **completely loaded** before rendering.

```tsx
<RequireProfileReady>
  <PageThatNeedsProfile />
</RequireProfileReady>
```

**Critical for preventing:**
- Flash of wrong content
- Redirects before profile is loaded
- Race conditions between auth and role checks

#### RequireCapability

Checks if user has required capability and redirects appropriately.

```tsx
<RequireCapability 
  capability="can_access_artisan_dashboard"
  fallbackPath="/artisan/onboarding"
>
  <ArtisanDashboard />
</RequireCapability>
```

**Smart Fallback Logic:**
- No artisan profile → `/artisan/onboarding`
- Artisan pending → `/artisan/pending`
- Missing admin capability → `/dashboard`

### 4. Data Repositories

Repositories abstract database access and provide a clean API.

#### User Repository (`userRepo.ts`)

```typescript
getUserProfile(userId: string): Promise<UserProfile | null>
updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean>
isUserAdmin(userId: string): Promise<boolean>
```

#### Artisan Repository (`artisanRepo.ts`)

```typescript
getArtisanProfile(userId: string): Promise<ArtisanProfile | null>
createArtisanProfile(userId: string, input: ArtisanProfileCreateInput): Promise<...>
updateArtisanProfile(profileId: string, updates: Partial<ArtisanProfile>): Promise<boolean>
verifyArtisanProfile(profileId: string, verified: boolean): Promise<boolean>
getAllArtisanProfiles(): Promise<ArtisanProfile[]>
```

**Key Feature:** Transaction-safe profile creation with neighborhood linking.

#### Services Repository (`servicesRepo.ts`)

```typescript
// Categories
getAllServiceCategories(activeOnly: boolean): Promise<ServiceCategory[]>
createServiceCategory(input: ServiceCategoryCreateInput): Promise<...>
updateServiceCategory(input: ServiceCategoryUpdateInput): Promise<boolean>
toggleServiceCategoryActive(id: string, isActive: boolean): Promise<boolean>

// Subcategories
getSubcategoriesByCategory(categoryId: string, activeOnly: boolean): Promise<...>
createServiceSubcategory(...): Promise<...>
updateServiceSubcategory(...): Promise<boolean>
```

#### Requests Repository (`requestsRepo.ts`)

```typescript
getAllServiceRequests(): Promise<ServiceRequest[]>
getServiceRequestsByUser(userId: string): Promise<ServiceRequest[]>
getServiceRequestsByArtisan(artisanId: string): Promise<ServiceRequest[]>
assignServiceRequest(requestId: string, artisanId: string): Promise<boolean>
updateServiceRequestStatus(requestId: string, status: RequestStatus): Promise<boolean>
```

### 5. Application Services

Services contain **business logic** and orchestrate repository operations.

#### Artisan Onboarding Service (`artisanOnboardingService.ts`)

**DB-first, resumable onboarding flow.**

```typescript
// Get current state from DB (single source of truth)
getOnboardingState(userId: string): Promise<ArtisanOnboardingState>

// Check if category is available
checkCategoryAvailability(userId: string, categoryId: string): Promise<...>

// Submit complete profile for verification
submitForVerification(userId: string, input: ArtisanProfileCreateInput): Promise<...>

// Resume from saved state
resumeOnboarding(userId: string): Promise<...>
```

**Returns `ArtisanOnboardingState`:**
```typescript
{
  categoryId?: string;
  status: 'pending' | 'verified' | null;
  profileId?: string;
  nextStep: 'select_category' | 'fill_details' | 'pending_verification' | 'complete';
  hasExistingProfile: boolean;
}
```

#### Services Service (`servicesService.ts`)

Public-facing service operations.

```typescript
getActiveServiceCategories(): Promise<ServiceCategory[]>
getServiceCategory(id: string): Promise<ServiceCategory | null>
getActiveSubcategories(categoryId: string): Promise<ServiceSubcategory[]>
```

#### Admin Service (`adminService.ts`)

Admin operations for services module.

```typescript
// Categories
adminGetAllCategories(): Promise<ServiceCategory[]>
adminCreateCategory(input: ServiceCategoryCreateInput): Promise<...>
adminUpdateCategory(input: ServiceCategoryUpdateInput): Promise<...>
adminToggleCategoryActive(id: string, isActive: boolean): Promise<...>
adminDeleteCategory(id: string): Promise<...>

// Subcategories
adminGetSubcategories(categoryId: string): Promise<...>
adminCreateSubcategory(...): Promise<...>

// Requests
adminGetAllRequests(): Promise<ServiceRequest[]>
adminAssignRequest(requestId: string, artisanId: string): Promise<...>
adminUpdateRequestStatus(requestId: string, status: RequestStatus): Promise<...>

// Artisans
adminGetAllArtisans(): Promise<ArtisanProfile[]>
adminVerifyArtisan(profileId: string, verified: boolean): Promise<...>
```

## Critical Fixes

### 1. No Auto Role Assignment

**Problem:** Users were auto-assigned merchant/advertiser roles just by visiting pages.

**Solution:**
- Default role is always `'user'` in `profileLoader`
- No role inference from page visits
- Roles only change through explicit user action or admin verification

### 2. Artisan Onboarding Persistence

**Problem:** Onboarding state lost on page refresh or back navigation.

**Solution:**
- All form data persisted to DB immediately
- `getOnboardingState()` reads from DB on mount
- Resume logic restores exact state
- Pending status persists across sessions

**Flow:**
```
1. User selects category → (future: persist to draft)
2. User fills form → Submit → DB insert
3. Page refresh → Load state from DB
4. Status shows "pending" → Persists
5. Admin verifies → Status "verified"
6. User refresh → Redirect to dashboard
```

### 3. Race Condition Prevention

**Problem:** Redirects happened before profile/role was loaded.

**Solution:**
- `profileReady` flag ensures profile is fully loaded
- Guards (`RequireProfileReady`) wait for profile
- No redirects until `profileReady === true`
- Timeout protection prevents infinite loading

**Sequence:**
```
1. Auth loads → user & session set
2. profileLoader.loadProfile() called
3. Profile fetched from DB
4. Admin status checked
5. Artisan profile loaded
6. profileReady = true
7. Guards allow access
```

### 4. Deterministic Routing

**Problem:** Inconsistent redirects, different behavior on refresh.

**Solution:**
- All routing decisions based on DB state
- Guards use capabilities (DB-driven)
- No client-side role caching (except in auth context)
- Smart fallback logic in `RequireCapability`

**Example:**
```tsx
// Artisan dashboard route
<Route path="/dashboard/artisan" element={
  <RequireAuth>
    <RequireProfileReady>
      <RequireCapability capability="can_access_artisan_dashboard">
        <ArtisanDashboard />
      </RequireCapability>
    </RequireProfileReady>
  </RequireAuth>
} />
```

**Behavior:**
- Not logged in → `/login`
- Logged in but no profile → Wait
- Profile ready but no artisan profile → `/artisan/onboarding`
- Artisan pending → `/artisan/pending`
- Artisan verified → Show dashboard

## Migration Guide

### For Existing Pages

To migrate an existing page to use clean architecture:

1. **Wrap with Guards**

```tsx
// Before
<Route path="/some-page" element={<SomePage />} />

// After
<Route path="/some-page" element={
  <RequireAuth>
    <RequireProfileReady>
      <RequireCapability capability="can_do_something">
        <SomePage />
      </RequireCapability>
    </RequireProfileReady>
  </RequireAuth>
} />
```

2. **Use New Auth Hook**

```tsx
// Before
import { useAuth } from '@/contexts/AuthContext';
const { user } = useAuth();

// After
import { useAuth } from '@/core/auth/useAuth';
const { user, profile, profileReady } = useAuth();

// Check capabilities
import { can } from '@/core/permissions/can';
if (can(profile, 'can_manage_users')) {
  // Show admin UI
}
```

3. **Use Repositories Instead of Direct Supabase**

```tsx
// Before
const { data } = await supabase.from('artisan_profiles').select('*');

// After
import { getAllArtisanProfiles } from '@/core/data/repositories/artisanRepo';
const profiles = await getAllArtisanProfiles();
```

4. **Use Application Services for Business Logic**

```tsx
// Before (mixed logic in component)
const handleSubmit = async () => {
  // DB insert
  await supabase.from('artisan_profiles').insert(data);
  // Navigate
  navigate('/somewhere');
}

// After (logic in service)
import { submitForVerification } from '@/features/artisans/application/artisanOnboardingService';

const handleSubmit = async () => {
  const result = await submitForVerification(user.id, formData);
  if (result.success) {
    navigate('/artisan/pending');
  }
}
```

## Testing Guidelines

### Test Scenarios

1. **Signup Flow**
   - New user signs up
   - Profile created with role `'user'`
   - No auto merchant/advertiser assignment
   - Can access user dashboard

2. **Artisan Onboarding**
   - User navigates to `/artisan/onboarding`
   - Selects category (future: persists immediately)
   - Fills form and submits
   - Redirected to `/artisan/pending`
   - Refresh page → Still shows pending
   - Back navigation → Returns to pending (not onboarding)

3. **Artisan Verification**
   - Admin verifies artisan profile
   - Artisan refresh page
   - Auto-redirected to `/dashboard/artisan`
   - Can access artisan features

4. **Admin Access**
   - Only admin can access `/admin/*`
   - Non-admin redirected to `/dashboard`
   - Admin status checked from DB

5. **Page Refresh**
   - All pages restore correct state
   - No redirect loops
   - No flash of wrong content

### Automated Tests

(To be implemented)

```typescript
// Example test structure
describe('Artisan Onboarding', () => {
  it('should persist category selection to DB', async () => {
    // ...
  });
  
  it('should restore state after page refresh', async () => {
    // ...
  });
  
  it('should redirect verified artisan to dashboard', async () => {
    // ...
  });
});
```

## Security Considerations

1. **All permissions enforced server-side (RLS)**
   - Frontend guards are UX convenience only
   - Never trust client-side permission checks
   - Supabase RLS policies are authoritative

2. **Profile data validated**
   - Repository layer validates input
   - DB constraints prevent invalid data
   - Sensitive fields (is_verified, is_boosted) protected

3. **No sensitive data in client logs**
   - Console.log statements minimized
   - Email/phone not logged
   - Use correlation IDs for debugging

## Performance Optimizations

1. **Profile Caching**
   - Profile loaded once per session
   - Stored in auth context
   - Manually refreshable via `refreshProfile()`

2. **Lazy Loading**
   - All pages lazy loaded with React.lazy()
   - Reduces initial bundle size

3. **Parallel Queries**
   - Profile, admin status, artisan profile fetched in parallel
   - Minimizes sequential round-trips

4. **Timeout Protection**
   - 4-second timeout prevents infinite loading
   - Fallback to unauthenticated state

## Future Improvements

1. **Add Draft State for Artisan Onboarding**
   - Save form data as draft
   - Allow partial saves
   - Auto-save on field changes

2. **Add Audit Logging**
   - Track all permission changes
   - Log admin actions
   - Compliance requirements

3. **Add Role Transition Flows**
   - User → Merchant upgrade
   - User → Agent verification
   - Proper state transitions

4. **Implement Refresh Tokens**
   - Automatic session refresh
   - Seamless re-authentication

5. **Add Unit Tests**
   - Test all services
   - Test all repositories
   - Test capability checks

## Troubleshooting

### Profile Not Loading

**Symptoms:** Infinite spinner on protected pages

**Check:**
1. Is Supabase configured? (`isSupabaseConfigured`)
2. Does profile exist in DB?
3. Check browser console for errors
4. Check network tab for failed requests

**Solution:**
- Clear local storage
- Refresh page
- Check RLS policies on profiles table

### Redirect Loop

**Symptoms:** Page keeps redirecting

**Check:**
1. Is `profileReady` ever becoming true?
2. Are guards configured correctly?
3. Does user have required capability?

**Solution:**
- Check guard order (Auth → ProfileReady → Capability)
- Verify capability mapping
- Check fallback paths

### Wrong Dashboard Shown

**Symptoms:** User sees admin/artisan dashboard when shouldn't

**Check:**
1. Profile data in auth context
2. Capability checks in components
3. Guard configuration on routes

**Solution:**
- Verify RLS policies
- Check admin/artisan status in DB
- Clear cached profile (`refreshProfile()`)

## Conclusion

This clean architecture implementation provides:

✅ **Single source of truth** for profile data  
✅ **Deterministic routing** without race conditions  
✅ **Resumable artisan onboarding** with DB persistence  
✅ **Centralized permissions** via capabilities model  
✅ **Clear separation** of concerns (UI → Service → Repository → DB)  
✅ **No auto role assignment** - explicit user action required  
✅ **Testable** - business logic separated from UI  

The architecture is **scalable** and **maintainable**, making it easy to add new features and fix bugs without introducing regressions.
