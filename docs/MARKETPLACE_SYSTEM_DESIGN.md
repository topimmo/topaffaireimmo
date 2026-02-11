# Marketplace System Design - TopAffaireImmo

## Section A: High-Level Architecture

### Overview

TopAffaireImmo is a comprehensive marketplace platform connecting **Clients** with **Artisans/Service Providers** for home services. The platform includes an **Admin** moderation system to ensure quality and trust.

### Technology Stack

- **Frontend**: Next.js with TypeScript (migrating from Vite+React)
- **Backend**: Supabase (PostgreSQL + Authentication + Row-Level Security)
- **Database**: PostgreSQL 14+ with PostGIS support
- **Authentication**: Supabase Auth with email, phone (SMS OTP), and OAuth
- **Storage**: Supabase Storage for profile images and documents
- **API**: Server Actions / API Routes (Next.js pattern)
- **Validation**: Zod schemas

### User Roles

1. **Client** (Default)
   - Browse artisan profiles
   - Send service requests
   - Review and rate artisans
   - Manage their requests

2. **Artisan/Provider**
   - Create and manage professional profile
   - Select service categories
   - Define service areas (city + neighborhoods)
   - Receive and respond to client requests
   - Build reputation through reviews

3. **Admin**
   - Verify artisan profiles
   - Moderate content
   - Manage service categories
   - Handle disputes
   - View analytics

### Core Features

#### For Clients
- Search artisans by service category, city, and neighborhood
- View verified artisan profiles
- Send service requests with details
- Track request status
- Leave reviews and ratings
- Receive notifications

#### For Artisans
- Complete onboarding with business details
- Select multiple service categories
- Define service coverage areas
- Receive request notifications
- Manage profile and availability
- Respond to reviews
- Optional profile boosting (premium)

#### For Admins
- Approve/reject artisan profiles
- Monitor platform activity
- Manage reference data (cities, neighborhoods, categories)
- Handle user reports
- Analytics dashboard

### System Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                     Presentation Layer                   │
│  (Next.js Pages, Components, Forms, UI)                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
│  (Server Actions, API Routes, Business Logic)           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Data Access Layer                      │
│  (Supabase Client, Database Queries, Type Safety)       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                      Database Layer                      │
│  (PostgreSQL + RLS, Triggers, Functions, Constraints)   │
└─────────────────────────────────────────────────────────┘
```

### Data Flow - Onboarding Journey

```
User Registration/Login
        ↓
Role Selection (Client vs Artisan)
        ↓
[If Artisan] Create Artisan Profile
        ↓
Select Service Category
        ↓
Choose City
        ↓
Select Multiple Neighborhoods (Join Table)
        ↓
Add Business Details (name, description, contact)
        ↓
Submit for Verification (is_verified = false)
        ↓
[Admin] Reviews and Approves (is_verified = true, is_active = true)
        ↓
Profile Published and Searchable
        ↓
Receive Client Requests
```

### Security Model

- **Row-Level Security (RLS)**: All tables protected with RLS policies
- **Authentication**: Required for all write operations
- **Authorization**: Role-based access control (RBAC)
- **Data Validation**: Zod schemas + database constraints
- **SQL Injection Prevention**: Parameterized queries only
- **CSRF Protection**: Next.js built-in protection

### Performance Considerations

- **Indexes**: Strategic indexes on foreign keys, search fields, and frequently queried columns
- **Connection Pooling**: Supabase automatic pooling
- **Query Optimization**: Use of CTEs, proper joins, covering indexes
- **Caching**: Next.js static generation + ISR where applicable
- **CDN**: Vercel Edge Network for static assets
- **Image Optimization**: Next.js Image component + Supabase storage transformations

---

## Section B: ERD Relationships

### Entity Relationship Diagram (Textual)

```
auth.users (Supabase managed)
    ↓ 1:1
profiles (public user info, role)
    ↓ 1:N
artisan_profiles (provider-specific data)
    ↓ N:1
service_categories (plumbing, electrical, etc.)

artisan_profiles
    ↓ N:1
cities (Casablanca, Rabat, etc.)

artisan_profiles
    ↓ N:M (via artisan_profile_neighborhoods)
neighborhoods (belongs to city)

clients (via profiles)
    ↓ 1:N
requests (service requests sent to artisans)
    ↓ N:1
artisan_profiles (request recipient)

requests
    ↓ 1:N
request_status_history (status change audit trail)

clients + artisan_profiles
    ↓ 1:N
reviews (ratings and feedback)
    ↓ N:1
artisan_profiles (review recipient)

artisan_profiles
    ↓ 1:N
media/images (profile photos, work samples)
```

### Table Relationships Details

#### Core Identity Tables

**auth.users** → **profiles** (1:1)
- Foreign Key: `profiles.id` → `auth.users.id`
- On Delete: CASCADE
- Purpose: Map Supabase auth to public profile

**profiles** → **artisan_profiles** (1:N)
- Foreign Key: `artisan_profiles.user_id` → `profiles.id` (auth.users.id)
- On Delete: CASCADE
- Purpose: One user can have multiple artisan profiles (different service categories)
- Note: In practice, typically 1:1, but allows flexibility

#### Reference Data

**service_categories** → **artisan_profiles** (1:N)
- Foreign Key: `artisan_profiles.service_category_id` → `service_categories.id`
- On Delete: RESTRICT
- Purpose: Each artisan profile is for ONE service category

**cities** → **neighborhoods** (1:N)
- Foreign Key: `neighborhoods.city_id` → `cities.id`
- On Delete: RESTRICT
- Purpose: Neighborhoods belong to exactly one city

**cities** → **artisan_profiles** (1:N)
- Foreign Key: `artisan_profiles.city_id` → `cities.id`
- On Delete: RESTRICT
- Purpose: Each artisan operates in ONE primary city

#### Many-to-Many Relationships

**artisan_profiles** ↔ **neighborhoods** (N:M via artisan_profile_neighborhoods)
- Junction Table: `artisan_profile_neighborhoods`
- Foreign Keys:
  - `artisan_profile_id` → `artisan_profiles.id` (ON DELETE CASCADE)
  - `neighborhood_id` → `neighborhoods.id` (ON DELETE CASCADE)
- Unique Constraint: `(artisan_profile_id, neighborhood_id)`
- Purpose: Artisan can serve multiple neighborhoods within their city

#### Request System

**requests** → **profiles** (client_id)
- Foreign Key: `requests.client_id` → `profiles.id` (auth.users.id)
- On Delete: CASCADE
- Purpose: Track which client sent the request

**requests** → **artisan_profiles** (N:1)
- Foreign Key: `requests.artisan_profile_id` → `artisan_profiles.id`
- On Delete: SET NULL (preserve request history)
- Purpose: Which artisan received the request

**requests** → **request_status_history** (1:N)
- Foreign Key: `request_status_history.request_id` → `requests.id`
- On Delete: CASCADE
- Purpose: Audit trail of status changes

#### Review System

**reviews** → **profiles** (client_id)
- Foreign Key: `reviews.client_id` → `profiles.id` (auth.users.id)
- On Delete: CASCADE
- Purpose: Who left the review

**reviews** → **artisan_profiles** (N:1)
- Foreign Key: `reviews.artisan_profile_id` → `artisan_profiles.id`
- On Delete: CASCADE
- Purpose: Which artisan was reviewed

#### Media System

**media** → **artisan_profiles** (N:1)
- Foreign Key: `media.artisan_profile_id` → `artisan_profiles.id`
- On Delete: CASCADE
- Purpose: Profile images, work samples, certifications

### Cardinality Summary

| Relationship | Type | Notes |
|---|---|---|
| auth.users → profiles | 1:1 | Auto-created on signup |
| profiles → artisan_profiles | 1:N | Can have profiles for different services |
| service_categories → artisan_profiles | 1:N | Each profile for ONE category |
| cities → artisan_profiles | 1:N | Primary city of operation |
| cities → neighborhoods | 1:N | Neighborhoods in a city |
| artisan_profiles ↔ neighborhoods | N:M | Via junction table |
| profiles(client) → requests | 1:N | Clients send multiple requests |
| artisan_profiles → requests | 1:N | Artisans receive requests |
| requests → request_status_history | 1:N | Status change tracking |
| artisan_profiles → reviews | 1:N | Multiple reviews per artisan |
| profiles(client) → reviews | 1:N | Client can review multiple artisans |
| artisan_profiles → media | 1:N | Multiple photos per profile |

---

## Section C: SQL Migrations

See separate migration files in `/supabase/migrations/`:

1. `093_create_artisan_profile_neighborhoods_join_table.sql` - Junction table for neighborhoods
2. `094_create_requests_table.sql` - Service requests
3. `095_create_request_status_history.sql` - Request audit trail
4. `096_create_reviews_table.sql` - Reviews and ratings
5. `097_create_media_table.sql` - Profile media
6. `098_add_boosting_columns.sql` - Premium features
7. `099_add_all_indexes.sql` - Performance indexes
8. `100_create_all_triggers.sql` - Updated_at triggers

### Migration Order

Migrations **must** be applied in this exact order:

1. **Reference data** (cities, neighborhoods, service_categories) - Already exists
2. **Core profiles** (profiles, artisan_profiles) - Already exists
3. **Junction tables** (artisan_profile_neighborhoods) - NEW
4. **Request system** (requests, request_status_history) - NEW
5. **Review system** (reviews) - NEW
6. **Media system** (media) - NEW
7. **Indexes** - NEW
8. **Triggers** - NEW
9. **RLS Policies** - UPDATE

### Key Schema Changes

**IMPORTANT**: The problem statement requires moving from `neighborhood_ids INTEGER[]` (array column) to a proper join table. This migration must:

1. Create new `artisan_profile_neighborhoods` junction table
2. Migrate existing data from `neighborhood_ids` array to junction table
3. Mark old column as deprecated (keep for rollback safety)
4. Update all queries to use JOIN instead of array operators

---

## Section D: RLS Policies

### Design Principles

1. **Secure by Default**: All tables have RLS enabled, deny by default
2. **Least Privilege**: Users only access what they need
3. **Performance**: Policies use indexes, avoid complex subqueries
4. **Auditability**: Admin actions are always allowed for oversight

### Policy Categories

#### 1. Public Read Policies
- service_categories (active only)
- cities (active only)
- neighborhoods (active only)
- artisan_profiles (verified + active only)

#### 2. Authenticated User Policies
- profiles (read own, update own non-role fields)
- artisan_profiles (create own, update own, read all verified)
- artisan_profile_neighborhoods (manage own)
- requests (create, read own sent/received)
- reviews (create own, read all)
- media (manage own)

#### 3. Admin Policies
- Full access to all tables
- Can verify artisan_profiles
- Can moderate reviews
- Can manage reference data

See `/supabase/migrations/101_create_rls_policies.sql` for complete policy definitions.

---

## Section E: Onboarding Workflow + API Endpoints

### Complete Onboarding Flow

#### Step 1: User Registration/Login

**UI**: `/auth/signup` or `/auth/login`

**Actions**:
- Email + Password signup
- Phone (SMS OTP) signup
- Google OAuth signup

**API**: Supabase Auth (`supabase.auth.signUp`)

**Result**: 
- Creates `auth.users` record
- Trigger auto-creates `profiles` record with default role `client`

#### Step 2: Role Selection

**UI**: `/onboarding/role-selection`

**Form Fields**:
```typescript
{
  role: 'client' | 'artisan'
}
```

**API**: Server action `updateUserRole`

**Validation**:
```typescript
const RoleSchema = z.object({
  role: z.enum(['client', 'artisan'])
});
```

**Database Update**:
```sql
UPDATE profiles 
SET user_role = $1 
WHERE id = auth.uid()
```

#### Step 3: Create Artisan Profile (if role = artisan)

**UI**: `/onboarding/artisan/profile`

**Form Fields**:
```typescript
{
  business_name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  description_fr?: string;
  description_ar?: string;
  service_category_id: UUID;
  city_id: INTEGER;
}
```

**API**: Server action `createArtisanProfile`

**Validation**:
```typescript
const ArtisanProfileSchema = z.object({
  business_name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+212[0-9]{9}$/),
  whatsapp: z.string().regex(/^\+212[0-9]{9}$/).optional(),
  email: z.string().email().optional(),
  description_fr: z.string().max(500).optional(),
  description_ar: z.string().max(500).optional(),
  service_category_id: z.string().uuid(),
  city_id: z.number().int().positive(),
});
```

**RPC Function**: `create_my_artisan_profile` (already exists in migration 091)

#### Step 4: Select Neighborhoods

**UI**: `/onboarding/artisan/neighborhoods`

**Form Fields**:
```typescript
{
  artisan_profile_id: UUID;
  neighborhood_ids: number[];
}
```

**API**: Server action `updateArtisanNeighborhoods`

**Validation**:
```typescript
const NeighborhoodsSchema = z.object({
  artisan_profile_id: z.string().uuid(),
  neighborhood_ids: z.array(z.number().int().positive()).min(1).max(20),
});
```

**Database Operations**:
```sql
-- Delete existing
DELETE FROM artisan_profile_neighborhoods 
WHERE artisan_profile_id = $1;

-- Insert new (batch)
INSERT INTO artisan_profile_neighborhoods (artisan_profile_id, neighborhood_id)
SELECT $1, unnest($2::INTEGER[]);
```

#### Step 5: Mark Profile as Pending Verification

**Automatically done** when profile is created with `is_verified = FALSE`

**UI**: Show "Your profile is pending admin verification" message

**Email Notification**: Send to admins about new profile to verify

#### Step 6: Admin Verification

**UI**: `/admin/artisans/pending`

**Actions**:
- Review profile details
- Verify phone/business legitimacy
- Approve or reject

**API**: Server action `verifyArtisanProfile`

**Validation**:
```typescript
const VerifySchema = z.object({
  artisan_profile_id: z.string().uuid(),
  is_verified: z.boolean(),
  is_active: z.boolean(),
  rejection_reason: z.string().optional(),
});
```

**Database Update**:
```sql
UPDATE artisan_profiles
SET is_verified = $2,
    is_active = $3,
    verified_at = CASE WHEN $2 = TRUE THEN NOW() ELSE NULL END,
    verified_by = CASE WHEN $2 = TRUE THEN auth.uid() ELSE NULL END
WHERE id = $1
AND auth.uid() IN (SELECT user_id FROM admins)
```

**Notification**: Email/SMS to artisan about approval/rejection

#### Step 7: Profile Published

Once verified, profile appears in search results.

**Searchable by**:
- Service category
- City
- Neighborhoods (via JOIN on artisan_profile_neighborhoods)
- Boosted profiles appear first (optional premium feature)

### API Endpoints / Server Actions

#### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

#### Profiles
- `PATCH /api/profiles/me` - Update own profile
- `GET /api/profiles/:id` - Get public profile

#### Artisan Profiles
- `POST /api/artisans` - Create artisan profile
- `PATCH /api/artisans/:id` - Update own artisan profile
- `GET /api/artisans/:id` - Get artisan profile
- `GET /api/artisans?city=&category=&neighborhoods=` - Search artisans

#### Artisan Neighborhoods
- `POST /api/artisans/:id/neighborhoods` - Add neighborhoods
- `DELETE /api/artisans/:id/neighborhoods` - Remove neighborhoods
- `GET /api/artisans/:id/neighborhoods` - Get artisan neighborhoods

#### Requests
- `POST /api/requests` - Create service request
- `GET /api/requests` - Get my requests (client or artisan)
- `PATCH /api/requests/:id/status` - Update request status
- `GET /api/requests/:id` - Get request details

#### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews?artisan_profile_id=` - Get artisan reviews
- `PATCH /api/reviews/:id` - Update own review

#### Admin
- `GET /api/admin/artisans/pending` - Get pending verifications
- `PATCH /api/admin/artisans/:id/verify` - Verify artisan profile
- `GET /api/admin/stats` - Platform statistics

---

## Section F: Next.js Code Structure

### Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes group
│   │   ├── login/
│   │   ├── signup/
│   │   └── layout.tsx
│   ├── (dashboard)/              # Protected routes
│   │   ├── onboarding/
│   │   │   ├── role-selection/
│   │   │   └── artisan/
│   │   │       ├── profile/
│   │   │       └── neighborhoods/
│   │   ├── client/
│   │   ├── artisan/
│   │   └── admin/
│   ├── api/                      # API routes (if needed)
│   │   ├── artisans/
│   │   ├── requests/
│   │   └── reviews/
│   └── layout.tsx
├── components/
│   ├── ui/                       # Shadcn components
│   ├── forms/                    # Form components
│   │   ├── ArtisanProfileForm.tsx
│   │   ├── NeighborhoodSelector.tsx
│   │   └── RequestForm.tsx
│   └── layouts/
├── lib/
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Client-side
│   │   ├── server.ts             # Server-side
│   │   └── admin.ts              # Admin client
│   ├── db/                       # Data access layer
│   │   ├── artisans.ts
│   │   ├── requests.ts
│   │   ├── reviews.ts
│   │   └── neighborhoods.ts
│   ├── validations/              # Zod schemas
│   │   ├── artisan.ts
│   │   ├── request.ts
│   │   └── review.ts
│   └── actions/                  # Server actions
│       ├── artisan-actions.ts
│       ├── request-actions.ts
│       └── review-actions.ts
├── types/
│   ├── supabase.ts               # Auto-generated DB types
│   ├── database.ts               # Extended types
│   └── api.ts                    # API types
└── hooks/
    ├── useArtisans.ts
    ├── useRequests.ts
    └── useAuth.ts
```

### Database Types (TypeScript)

```typescript
// types/database.ts
import { Database } from './supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type ArtisanProfile = Database['public']['Tables']['artisan_profiles']['Row'];
export type ArtisanProfileInsert = Database['public']['Tables']['artisan_profiles']['Insert'];
export type ArtisanProfileUpdate = Database['public']['Tables']['artisan_profiles']['Update'];

export type ServiceCategory = Database['public']['Tables']['service_categories']['Row'];
export type City = Database['public']['Tables']['cities']['Row'];
export type Neighborhood = Database['public']['Tables']['neighborhoods']['Row'];

export type ArtisanProfileNeighborhood = Database['public']['Tables']['artisan_profile_neighborhoods']['Row'];

export type Request = Database['public']['Tables']['requests']['Row'];
export type RequestInsert = Database['public']['Tables']['requests']['Insert'];
export type RequestUpdate = Database['public']['Tables']['requests']['Update'];

export type Review = Database['public']['Tables']['reviews']['Row'];
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];

// Extended types with relations
export interface ArtisanProfileWithRelations extends ArtisanProfile {
  service_category: ServiceCategory;
  city: City;
  neighborhoods: Neighborhood[];
  avg_rating?: number;
  total_reviews?: number;
}

export interface RequestWithRelations extends Request {
  client: Profile;
  artisan_profile: ArtisanProfileWithRelations;
  status_history: RequestStatusHistory[];
}
```

### Data Access Layer

```typescript
// lib/db/artisans.ts
import { createServerClient } from '@/lib/supabase/server';
import type { ArtisanProfileWithRelations } from '@/types/database';

export async function getArtisanProfile(id: string): Promise<ArtisanProfileWithRelations | null> {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('artisan_profiles')
    .select(`
      *,
      service_category:service_categories(*),
      city:cities(*),
      neighborhoods:artisan_profile_neighborhoods(
        neighborhood:neighborhoods(*)
      ),
      reviews:reviews(rating)
    `)
    .eq('id', id)
    .eq('is_verified', true)
    .eq('is_active', true)
    .single();
  
  if (error || !data) return null;
  
  // Calculate avg rating
  const avgRating = data.reviews.length > 0
    ? data.reviews.reduce((sum, r) => sum + r.rating, 0) / data.reviews.length
    : 0;
  
  return {
    ...data,
    neighborhoods: data.neighborhoods.map(n => n.neighborhood),
    avg_rating: avgRating,
    total_reviews: data.reviews.length,
  };
}

export async function searchArtisans(params: {
  city_id?: number;
  service_category_id?: string;
  neighborhood_ids?: number[];
  page?: number;
  limit?: number;
}) {
  const supabase = createServerClient();
  const { city_id, service_category_id, neighborhood_ids, page = 1, limit = 20 } = params;
  
  let query = supabase
    .from('artisan_profiles')
    .select(`
      *,
      service_category:service_categories(*),
      city:cities(*),
      neighborhoods:artisan_profile_neighborhoods(
        neighborhood:neighborhoods(*)
      ),
      reviews:reviews(rating)
    `, { count: 'exact' })
    .eq('is_verified', true)
    .eq('is_active', true);
  
  if (city_id) {
    query = query.eq('city_id', city_id);
  }
  
  if (service_category_id) {
    query = query.eq('service_category_id', service_category_id);
  }
  
  // Filter by neighborhoods if specified
  if (neighborhood_ids && neighborhood_ids.length > 0) {
    query = query.in(
      'id',
      supabase
        .from('artisan_profile_neighborhoods')
        .select('artisan_profile_id')
        .in('neighborhood_id', neighborhood_ids)
    );
  }
  
  // Order: boosted first, then by created date
  query = query
    .order('is_boosted', { ascending: false })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  
  const { data, error, count } = await query;
  
  if (error) throw error;
  
  return {
    artisans: data || [],
    total: count || 0,
    page,
    limit,
  };
}
```

### Validation Schemas (Zod)

```typescript
// lib/validations/artisan.ts
import { z } from 'zod';

export const CreateArtisanProfileSchema = z.object({
  business_name: z.string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must be less than 100 characters'),
  phone: z.string()
    .regex(/^\+212[0-9]{9}$/, 'Phone must be a valid Moroccan number (+212XXXXXXXXX)'),
  whatsapp: z.string()
    .regex(/^\+212[0-9]{9}$/, 'WhatsApp must be a valid Moroccan number')
    .optional(),
  email: z.string()
    .email('Invalid email address')
    .optional(),
  description_fr: z.string()
    .max(500, 'French description must be less than 500 characters')
    .optional(),
  description_ar: z.string()
    .max(500, 'Arabic description must be less than 500 characters')
    .optional(),
  service_category_id: z.string()
    .uuid('Invalid service category'),
  city_id: z.number()
    .int()
    .positive('Invalid city'),
});

export const UpdateNeighborhoodsSchema = z.object({
  artisan_profile_id: z.string().uuid(),
  neighborhood_ids: z.array(z.number().int().positive())
    .min(1, 'Select at least one neighborhood')
    .max(20, 'Maximum 20 neighborhoods allowed'),
});

export const VerifyArtisanSchema = z.object({
  artisan_profile_id: z.string().uuid(),
  is_verified: z.boolean(),
  is_active: z.boolean(),
  rejection_reason: z.string().optional(),
});
```

### Server Actions

```typescript
// lib/actions/artisan-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { CreateArtisanProfileSchema, UpdateNeighborhoodsSchema } from '@/lib/validations/artisan';

export async function createArtisanProfile(formData: FormData) {
  const supabase = createServerClient();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Not authenticated' };
  }
  
  // Parse and validate form data
  const rawData = {
    business_name: formData.get('business_name'),
    phone: formData.get('phone'),
    whatsapp: formData.get('whatsapp'),
    email: formData.get('email'),
    description_fr: formData.get('description_fr'),
    description_ar: formData.get('description_ar'),
    service_category_id: formData.get('service_category_id'),
    city_id: parseInt(formData.get('city_id') as string),
  };
  
  const validated = CreateArtisanProfileSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }
  
  // Call RPC function
  const { data, error } = await supabase.rpc('create_my_artisan_profile', {
    p_service_category_id: validated.data.service_category_id,
    p_business_name: validated.data.business_name,
    p_description_fr: validated.data.description_fr,
    p_description_ar: validated.data.description_ar,
    p_city_id: validated.data.city_id,
    p_neighborhood_ids: [], // Will be set in next step
    p_phone: validated.data.phone,
    p_whatsapp: validated.data.whatsapp,
    p_email: validated.data.email,
  });
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath('/artisan/profile');
  return { success: true, data };
}

export async function updateArtisanNeighborhoods(
  artisanProfileId: string,
  neighborhoodIds: number[]
) {
  const supabase = createServerClient();
  
  // Validate
  const validated = UpdateNeighborhoodsSchema.safeParse({
    artisan_profile_id: artisanProfileId,
    neighborhood_ids: neighborhoodIds,
  });
  
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Not authenticated' };
  }
  
  // Verify ownership
  const { data: profile } = await supabase
    .from('artisan_profiles')
    .select('user_id')
    .eq('id', artisanProfileId)
    .single();
  
  if (!profile || profile.user_id !== user.id) {
    return { error: 'Not authorized' };
  }
  
  // Delete existing neighborhoods
  const { error: deleteError } = await supabase
    .from('artisan_profile_neighborhoods')
    .delete()
    .eq('artisan_profile_id', artisanProfileId);
  
  if (deleteError) {
    return { error: deleteError.message };
  }
  
  // Insert new neighborhoods (batch)
  const neighborhoodRecords = neighborhoodIds.map(nid => ({
    artisan_profile_id: artisanProfileId,
    neighborhood_id: nid,
  }));
  
  const { error: insertError } = await supabase
    .from('artisan_profile_neighborhoods')
    .insert(neighborhoodRecords);
  
  if (insertError) {
    return { error: insertError.message };
  }
  
  revalidatePath(`/artisan/${artisanProfileId}`);
  return { success: true };
}
```

---

## Section G: Seeding + Performance Notes

### Seed Data Strategy

#### 1. Service Categories (088_create_service_categories.sql)
Already seeded in migration with:
- Plumbing, Electrical, HVAC, Painting, Cleaning, Gardening, etc.
- Bilingual (FR/AR)
- Proper sort order

#### 2. Cities (existing migrations)
Already seeded with major Moroccan cities:
- Casablanca, Rabat, Marrakech, Fes, Tangier, etc.

#### 3. Neighborhoods (existing migrations)
Already seeded with neighborhoods for major cities.

**To add more neighborhoods**:
```sql
INSERT INTO neighborhoods (city_id, name_fr, name_ar, slug)
VALUES 
  ((SELECT id FROM cities WHERE name_fr = 'Casablanca'), 'Maarif', 'المعاريف', 'maarif'),
  ((SELECT id FROM cities WHERE name_fr = 'Casablanca'), 'Ain Diab', 'عين الذئاب', 'ain-diab');
```

#### 4. Test Data Script

Create `scripts/seed-artisan-test-data.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Admin key
);

async function seedTestData() {
  // Create test artisan users
  const testArtisans = [
    { email: 'plumber1@test.com', password: 'Test123456', businessName: 'Plomberie Hassan' },
    { email: 'electrician1@test.com', password: 'Test123456', businessName: 'Électricité Mohammed' },
  ];
  
  for (const artisan of testArtisans) {
    // Create auth user
    const { data: user, error } = await supabase.auth.admin.createUser({
      email: artisan.email,
      password: artisan.password,
      email_confirm: true,
    });
    
    if (error || !user) {
      console.error(`Failed to create ${artisan.email}:`, error);
      continue;
    }
    
    // Profile is auto-created by trigger
    
    // Create artisan profile
    const { error: profileError } = await supabase
      .from('artisan_profiles')
      .insert({
        user_id: user.id,
        business_name: artisan.businessName,
        phone: '+212600000000',
        description_fr: 'Test description',
        service_category_id: '...', // Get from service_categories
        city_id: 1, // Casablanca
        is_verified: true,
        is_active: true,
      });
    
    if (profileError) {
      console.error(`Failed to create profile for ${artisan.email}:`, profileError);
    }
  }
  
  console.log('Test data seeded successfully');
}

seedTestData();
```

### Performance Indexes

#### Essential Indexes (in migration 099)

```sql
-- Artisan profiles search
CREATE INDEX idx_artisan_profiles_search 
  ON artisan_profiles(city_id, service_category_id, is_boosted, is_verified, is_active)
  WHERE is_verified = TRUE AND is_active = TRUE;

-- Junction table lookups
CREATE INDEX idx_artisan_neighborhoods_artisan 
  ON artisan_profile_neighborhoods(artisan_profile_id);
CREATE INDEX idx_artisan_neighborhoods_neighborhood 
  ON artisan_profile_neighborhoods(neighborhood_id);

-- Request queries
CREATE INDEX idx_requests_client ON requests(client_id, status, created_at DESC);
CREATE INDEX idx_requests_artisan ON requests(artisan_profile_id, status, created_at DESC);

-- Review aggregation
CREATE INDEX idx_reviews_artisan ON reviews(artisan_profile_id, created_at DESC);
CREATE INDEX idx_reviews_rating ON reviews(artisan_profile_id, rating);
```

#### Query Optimization Tips

1. **Use covering indexes** for frequently accessed columns
2. **Avoid SELECT *** - specify needed columns
3. **Use CTEs** for complex queries
4. **Limit results** with pagination
5. **Use prepared statements** to benefit from query plan caching

### Common Pitfalls

#### 1. Type Mismatch: UUID vs INTEGER

**Problem**: `artisan_profiles.id` is UUID, but `neighborhoods.id` is INTEGER

**Solution**: Junction table must use correct types:
```sql
CREATE TABLE artisan_profile_neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_profile_id UUID REFERENCES artisan_profiles(id),  -- UUID
  neighborhood_id INTEGER REFERENCES neighborhoods(id)       -- INTEGER
);
```

#### 2. Orphaned Rows

**Problem**: Deleting artisan profile leaves orphaned junction table records

**Solution**: Use ON DELETE CASCADE:
```sql
artisan_profile_id UUID REFERENCES artisan_profiles(id) ON DELETE CASCADE
```

#### 3. NOT NULL Issues During Migration

**Problem**: Adding NOT NULL column to existing table with data

**Solution**: Two-step migration:
```sql
-- Step 1: Add column as nullable
ALTER TABLE artisan_profiles ADD COLUMN city_id INTEGER REFERENCES cities(id);

-- Step 2: Backfill data
UPDATE artisan_profiles SET city_id = 1 WHERE city_id IS NULL;

-- Step 3: Make NOT NULL
ALTER TABLE artisan_profiles ALTER COLUMN city_id SET NOT NULL;
```

#### 4. Array vs Join Table Performance

**Problem**: Using `neighborhood_ids INTEGER[]` with GIN index seems faster

**Reality**: Join table is better for:
- Referential integrity (FK constraints)
- Cascading deletes
- Standard SQL joins
- Future extensibility (e.g., adding `is_primary` flag)

**Performance**: Both are fast with proper indexes, but join table is more maintainable

#### 5. RLS Policy Performance

**Problem**: Complex RLS policies slow down queries

**Solution**: 
- Keep policies simple
- Use indexed columns in policies
- Consider materialized views for complex access patterns
- Test with `EXPLAIN ANALYZE`

#### 6. Forgotten Indexes

**Problem**: Queries on foreign keys without indexes

**Solution**: ALWAYS index foreign key columns:
```sql
CREATE INDEX idx_requests_client_id ON requests(client_id);
CREATE INDEX idx_requests_artisan_profile_id ON requests(artisan_profile_id);
```

### Monitoring & Maintenance

1. **Monitor slow queries**: Enable pg_stat_statements
2. **Analyze query plans**: Use EXPLAIN ANALYZE
3. **Vacuum regularly**: Supabase handles this, but check VACUUM ANALYZE output
4. **Update statistics**: Run ANALYZE after bulk inserts
5. **Monitor index usage**: Check pg_stat_user_indexes

---

## Implementation Checklist

### Pre-Implementation
- [ ] Review all existing migrations
- [ ] Backup production database (if applicable)
- [ ] Set up local development environment

### Phase 1: Database Schema (Migrations)
- [ ] Create artisan_profile_neighborhoods junction table
- [ ] Create requests table
- [ ] Create request_status_history table
- [ ] Create reviews table
- [ ] Create media table
- [ ] Add boosting columns if not exist
- [ ] Create all indexes
- [ ] Create all triggers
- [ ] Update RLS policies

### Phase 2: Backend (Server Actions & DB Layer)
- [ ] Generate TypeScript types from Supabase schema
- [ ] Create data access layer functions
- [ ] Create Zod validation schemas
- [ ] Implement server actions for artisans
- [ ] Implement server actions for requests
- [ ] Implement server actions for reviews
- [ ] Write unit tests for server actions

### Phase 3: Frontend (UI Components & Pages)
- [ ] Create onboarding flow pages
- [ ] Create artisan profile form
- [ ] Create neighborhood selector component
- [ ] Create request form
- [ ] Create review form
- [ ] Create admin verification interface
- [ ] Add loading states and error handling

### Phase 4: Testing
- [ ] Test user registration flow
- [ ] Test artisan onboarding flow
- [ ] Test neighborhood selection (join table)
- [ ] Test request creation
- [ ] Test review creation
- [ ] Test admin verification
- [ ] Test RLS policies (as different users)
- [ ] Performance testing (search queries)

### Phase 5: Documentation
- [ ] API documentation
- [ ] Component documentation
- [ ] Deployment guide updates
- [ ] User guide for artisans
- [ ] Admin guide

---

## Test Plan

### Test 1: User Registration
**Steps**:
1. Visit `/auth/signup`
2. Enter email + password
3. Verify email
4. Login

**Expected**: User created in auth.users, profile auto-created with role 'client'

### Test 2: Artisan Onboarding
**Steps**:
1. Login as client
2. Navigate to `/onboarding/role-selection`
3. Select "Artisan"
4. Fill out artisan profile form
5. Select city and neighborhoods
6. Submit

**Expected**: 
- artisan_profiles record created with is_verified = false
- artisan_profile_neighborhoods records created for each selected neighborhood
- User sees "Pending verification" message

### Test 3: Admin Verification
**Steps**:
1. Login as admin
2. Navigate to `/admin/artisans/pending`
3. Review artisan profile
4. Approve

**Expected**:
- artisan_profiles.is_verified = true
- artisan_profiles.is_active = true
- Artisan receives notification

### Test 4: Artisan Search
**Steps**:
1. As client, search for artisans
2. Filter by city, service category, and neighborhood

**Expected**:
- Only verified+active artisans shown
- Correct filtering by city and category
- Neighborhood filter uses JOIN on artisan_profile_neighborhoods
- Boosted profiles appear first

### Test 5: Request Creation
**Steps**:
1. As client, find an artisan
2. Click "Send Request"
3. Fill out request form
4. Submit

**Expected**:
- Request created with status 'pending'
- Artisan receives notification
- Client can view request in their dashboard

### Test 6: RLS Policy Testing
**Tests**:
- [ ] Unauthenticated users can view verified artisan profiles
- [ ] Unauthenticated users CANNOT view unverified profiles
- [ ] Artisans can update own profile
- [ ] Artisans CANNOT change is_verified or is_active
- [ ] Clients can create requests
- [ ] Clients can view own sent requests
- [ ] Artisans can view requests sent to them
- [ ] Admins can view all requests

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Author**: TopAffaireImmo Development Team
