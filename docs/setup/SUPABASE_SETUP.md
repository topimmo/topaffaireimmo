# TopAffaireImmo - Supabase Configuration

## Overview

This document describes the complete Supabase backend setup for TopAffaireImmo, a real estate classifieds platform for Morocco.

## Database Schema

### Core Tables

#### 1. `profiles` - User Management
```sql
- id: UUID (references auth.users)
- email: TEXT
- full_name: TEXT
- phone: TEXT
- user_role: 'admin' | 'real_estate_advertiser' | 'commercial_advertiser'
- advertiser_type: 'owner' | 'agency' (for real_estate_advertiser only)
- Agency-specific fields (name, logo, description, cities, license)
- Commercial-specific fields (company_name, company_website)
- preferred_language: 'fr' | 'ar'
```

#### 2. `properties` - Real Estate Listings (FREE)
```sql
- id: UUID
- owner_id: UUID (references profiles)
- transaction_type: 'sale' | 'rent'
- property_type: 'apartment' | 'house' | 'villa' | 'commercial' | 'land'
- city_id, neighborhood_id: Location references
- price, area, bedrooms, bathrooms
- title_fr, title_ar, description_fr, description_ar (bilingual)
- images: TEXT[]
- status: 'pending' | 'approved' | 'rejected' | 'sold' | 'rented' | 'inactive'
- advertiser_type: 'owner' | 'broker' | 'agency'
```

#### 3. `banner_requests` - Commercial Advertising (REVENUE)
```sql
- id: UUID
- advertiser_id: UUID (references profiles - commercial_advertiser only)
- slot_id: INTEGER (references banner_slots)
- company_name, contact_email, contact_phone
- duration_days, price
- banner_image_url, target_url
- status: 'pending' | 'approved' | 'rejected' | 'active' | 'expired' | 'cancelled'
- start_date, end_date
- impressions, clicks (analytics)
```

### Reference Tables

- `cities` - Moroccan cities (20+ major cities with FR/AR names)
- `neighborhoods` - City neighborhoods (bilingual)
- `property_types` - Property classification
- `banner_slots` - Available ad positions with pricing
- `site_settings` - Dynamic site configuration

## Role-Based Access Control

### User Roles

| Role | Description | Capabilities |
|------|-------------|--------------|
| `admin` | Platform administrator | Full access to all data, moderation, settings |
| `real_estate_advertiser` | Property owners/agencies | Create FREE property listings |
| `commercial_advertiser` | Banner advertisers | Purchase banner ad space |

### Role Separation Rules

- **No role mixing**: A user cannot be both real_estate_advertiser AND commercial_advertiser
- **Real estate is FREE**: No payments for property listings
- **Revenue from ads only**: Commercial advertisers pay for banner placements

## Row Level Security (RLS)

### Properties RLS
- Public can view approved properties
- Owners can view/edit their own properties (any status)
- Admins have full access
- Only real_estate_advertisers can create properties

### Banner Requests RLS
- Active banners are publicly visible
- Advertisers can view/edit their own pending requests
- Only commercial_advertisers can create banner requests
- Admins have full access

### Profiles RLS
- Users can view/edit their own profile
- Agencies (public profiles) are visible to all
- Admins have full access

## Storage Buckets

| Bucket | Access | Purpose |
|--------|--------|---------|
| `property-images` | Public read, owner write | Property photos |
| `banner-images` | Public read, commercial_advertiser write | Banner ads |
| `payment-receipts` | Private (owner + admin only) | Payment proofs |
| `agency-logos` | Public read, agency write | Agency branding |

### File Organization
Files are organized by user ID for RLS enforcement:
```
bucket/
  └── {user_id}/
      └── {filename}
```

## Multilingual Support

All user-facing data includes bilingual fields:
- `name_fr`, `name_ar` for reference data
- `title_fr`, `title_ar` for content
- `description_fr`, `description_ar` for long text

Frontend hooks support language parameter for automatic field selection.

## Frontend Hooks

### Available Hooks

```typescript
// Properties
useProperties(filters?)      // List with filters
useProperty(id)              // Single property
useFeaturedProperties()      // Homepage featured
useLatestProperties()        // Homepage latest
useMyProperties()            // Current user's listings

// Banners
useBannerSlots()             // Available ad slots
useActiveBanners(page?, position?)  // Active ads
useBannerBySlot(slotCode)    // Single slot banner
useMyBannerRequests()        // Advertiser's requests

// Reference Data
useCities()                  // All cities
useNeighborhoods(cityId)     // City neighborhoods
usePropertyTypes()           // Property categories
useSiteSettings(category?)   // Site configuration
```

## Environment Variables

Required in runtime:
- `SUPABASE_URL` / `VITE_SUPABASE_URL`
- `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY` (server-side only)

## Migration Files

```
supabase/migrations/
├── 020_full_rebuild.sql      # Complete schema rebuild
└── 021_storage_buckets.sql   # Storage configuration
```

## Key Business Rules

1. **Property listings are 100% FREE** - No payments for real estate ads
2. **Revenue from commercial banners only** - Paid advertising system
3. **Strict role separation** - Real estate and commercial accounts are isolated
4. **Admin moderation required** - Properties and banners need approval
5. **Bilingual content** - French and Arabic support throughout
