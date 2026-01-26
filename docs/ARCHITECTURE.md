# Architecture Overview

TopAffaireImmo follows a modern React SPA architecture with Supabase backend.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Hosting)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │          React SPA (Vite Build)                   │  │
│  │  ┌─────────────┐  ┌──────────────┐              │  │
│  │  │   Public    │  │  Protected   │              │  │
│  │  │   Routes    │  │   Routes     │              │  │
│  │  └─────────────┘  └──────────────┘              │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase (Backend as a Service)            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  PostgreSQL │  │     Auth     │  │   Storage    │  │
│  │    + RLS    │  │  (JWT-based) │  │   (S3-like)  │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Current Folder Structure (To Be Refactored)

```
src/
├── App.tsx                    # Main router component
├── main.tsx                   # Entry point
├── components/
│   ├── home/                  # Homepage-specific components
│   ├── layout/                # Header, Footer, Navigation
│   ├── advertising/           # Banner slot components
│   ├── ui/                    # Shadcn UI components (50+ files)
│   ├── ProtectedRoute.tsx     # Auth guard
│   ├── SEO.tsx                # SEO utilities
│   └── ErrorBoundary.tsx      # Error handling
├── pages/                     # Page components
│   ├── auth/                  # Login, Register, ResetPassword
│   ├── admin/                 # Admin dashboard pages
│   └── [other pages]          # Public pages
├── hooks/                     # Custom React hooks
│   ├── useProperties.ts       # Properties CRUD
│   ├── useReferenceData.ts    # Cities, neighborhoods
│   └── useBanners.ts          # Banner management
├── contexts/                  # Global state
│   ├── AuthContext.tsx        # Authentication state
│   └── LanguageContext.tsx    # i18n (FR/AR)
├── lib/                       # Utilities
│   ├── supabase.ts            # Supabase client
│   ├── storage.ts             # File uploads
│   ├── sanitize.ts            # Input sanitization
│   └── ...
├── types/                     # TypeScript types
│   └── supabase.ts            # Auto-generated from DB
├── constants/
│   └── cities.ts              # Moroccan cities data
└── styles/
    └── index.css              # Global styles
```

## Target Folder Structure (Clean Architecture)

```
src/
├── app/                       # Application setup
│   ├── router.tsx             # Route definitions
│   ├── providers.tsx          # Context providers
│   └── guards/                # Route guards
│       └── ProtectedRoute.tsx
├── pages/                     # Route components (thin)
│   ├── Home.tsx
│   ├── auth/
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── properties/
│   │   ├── PropertyDetails.tsx
│   │   ├── SearchResults.tsx
│   │   └── dashboard/
│   ├── admin/
│   └── advertising/
├── features/                  # Domain logic
│   ├── auth/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── utils/
│   ├── properties/
│   │   ├── hooks/
│   │   ├── components/
│   │   └── utils/
│   ├── banners/
│   └── seo/
├── components/                # Shared UI
│   ├── ui/                    # Shadcn components
│   ├── layout/
│   └── common/
├── lib/                       # Shared utilities
│   ├── supabase/
│   │   ├── client.ts
│   │   └── storage.ts
│   ├── api/
│   └── utils/
├── types/                     # TypeScript types
│   ├── supabase.ts
│   └── domain.ts
└── styles/
    └── index.css
```

## Key Architectural Patterns

### 1. Authentication Flow

```
User Sign Up/Login
     ↓
Supabase Auth (JWT)
     ↓
Database Trigger → Create Profile
     ↓
AuthContext Updates
     ↓
Protected Routes Access
```

**Implementation:**
- `AuthContext.tsx` provides auth state globally
- `ProtectedRoute` component guards routes by role
- Supabase triggers auto-create user profiles
- JWT tokens stored in localStorage

### 2. Data Flow

```
Component
   ↓
Custom Hook (useProperties, useBanners, etc.)
   ↓
Supabase Client
   ↓
PostgreSQL + RLS
```

**Benefits:**
- Separation of concerns
- Reusable data logic
- Type-safe queries
- Automatic RLS enforcement

### 3. File Upload Flow

```
User Selects File
     ↓
Frontend Validation (type, size)
     ↓
lib/storage.ts (uploadFile)
     ↓
Supabase Storage Bucket
     ↓
RLS Policy Check
     ↓
Public URL Returned
```

**Storage Buckets:**
- `property-images` (5MB, images only)
- `banner-images` (2MB, images only)
- `payment-receipts` (5MB, PDF/images)
- `agency-logos` (1MB, images only)

### 4. Route Protection

```typescript
<ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute>
```

**Role Hierarchy:**
- `admin` - Full access
- `real_estate_advertiser` - Property management
- `commercial_advertiser` - Banner ads
- Guest - Public routes only

### 5. Internationalization (i18n)

```
LanguageContext (FR/AR)
     ↓
useLanguage() hook
     ↓
Components render bilingual content
```

**Implementation:**
- Database stores FR and AR fields
- UI switches language
- RTL support for Arabic
- SEO-friendly URLs for both languages

## Database Schema

### Core Tables

1. **profiles** - User profiles with roles
2. **properties** - Real estate listings
3. **property_images** - Property photos
4. **cities** - Moroccan cities (bilingual)
5. **neighborhoods** - City neighborhoods
6. **property_types** - Apartment, villa, etc.
7. **banner_slots** - Ad position templates
8. **banner_requests** - Ad campaigns
9. **payments** - Payment records
10. **site_settings** - CMS key-value store
11. **advertising_inquiries** - Contact forms

### Row Level Security (RLS)

All tables have RLS enabled with policies like:

- **Properties**: Users can only edit their own
- **Admin Tables**: Only admins can access
- **Public Data**: Anyone can read (cities, property types)
- **Storage**: Users can only upload to their folders

## State Management

### Global State (Context)

- **AuthContext**: User, role, session
- **LanguageContext**: FR/AR toggle

### Local State (Hooks)

- **useProperties**: Property CRUD + filtering
- **useBanners**: Banner campaigns
- **useReferenceData**: Cities, neighborhoods, types

### Form State

- React Hook Form + Zod validation
- Type-safe form schemas

## API Integration

### Supabase Client

```typescript
import { supabase } from '@/lib/supabase'

// Query
const { data } = await supabase
  .from('properties')
  .select('*')
  .eq('city', 'Casablanca')

// Insert
const { error } = await supabase
  .from('properties')
  .insert({ ... })
```

### External Integrations

- **Make.com Webhooks**: Auto-post to Facebook
- **Email**: Supabase SMTP for transactional emails

## SEO Strategy

### Dynamic Routes

50+ SEO-optimized landing pages:

```
/immobilier/casablanca
/immobilier/casablanca/maarif
/immobilier/casablanca/maarif/appartement
/acheter-appartement-casablanca
/louer-villa-marrakech
```

### Implementation

- Dynamic meta tags via React Helmet
- Canonical URLs
- Sitemap generation
- Structured data (JSON-LD)

## Build & Deployment

### Vite Build

```bash
npm run build
```

Output: `dist/` folder with optimized SPA

### Vercel Deployment

- SPA rewrite rules in `vercel.json`
- Environment variables via Vercel dashboard
- Automatic HTTPS
- Edge network CDN

## Security

1. **RLS Policies**: Database-level security
2. **Input Sanitization**: DOMPurify for user content
3. **CORS**: Configured in Supabase
4. **Rate Limiting**: Via Supabase auth
5. **Content Security**: HTTP headers in vercel.json

## Performance

1. **Code Splitting**: Vendor chunks (React, Supabase)
2. **Lazy Loading**: Route-based code splitting
3. **Image Optimization**: WebP support
4. **Caching**: Static assets cached for 1 year
5. **CDN**: Vercel edge network

## Error Handling

1. **ErrorBoundary**: Catches React errors
2. **Toast Notifications**: User feedback
3. **Validation**: Form-level and API-level
4. **Logging**: Console errors (TODO: Sentry)

## Testing Strategy

Currently: **No automated tests**

Recommended:
- Unit tests: Vitest
- Integration tests: React Testing Library
- E2E tests: Playwright

## Future Improvements

1. **Refactor to clean architecture** (this task!)
2. Add automated testing
3. Implement proper logging/monitoring
4. Add caching layer
5. Optimize bundle size
6. Add TypeScript strict mode
