# Marketplace System Implementation - Complete Guide

## Overview

This repository now includes a complete marketplace system for connecting **Clients** with **Artisans/Service Providers** for home services in Morocco.

## Documentation Index

### Core Documentation
1. **[System Design](./MARKETPLACE_SYSTEM_DESIGN.md)** - Complete system architecture, ERD, and technical specifications
2. **[Testing Guide](./MARKETPLACE_TESTING_GUIDE.md)** - Comprehensive test plan and validation procedures

### Quick Links by Section

#### Section A: High-Level Architecture
- User roles (Client, Artisan, Admin)
- Technology stack (Next.js, Supabase, PostgreSQL)
- Data flow and onboarding journey
- Security model

#### Section B: ERD Relationships
- Entity relationship diagram (textual)
- Table cardinality and foreign key relationships
- Junction table patterns

#### Section C: SQL Migrations
Located in `/supabase/migrations/`:
- `093_create_artisan_profile_neighborhoods_join_table.sql` - N:M neighborhood relationship
- `094_create_requests_table.sql` - Service request system
- `095_create_request_status_history.sql` - Request audit trail
- `096_create_reviews_table.sql` - Reviews and ratings
- `097_create_media_table.sql` - Profile media management

#### Section D: RLS Policies
Included in each migration file. Key policies:
- Public read for verified profiles
- Authenticated insert/update for own data
- Admin full access

#### Section E: Onboarding Workflow
Complete step-by-step flows:
1. User registration → Role selection
2. Artisan profile creation → Category selection
3. City and neighborhood selection
4. Admin verification → Profile publication

#### Section F: Next.js Code Structure
- **Validation Schemas**: `/src/lib/validations/marketplace.ts`
- **Database Access**: `/src/lib/db/artisan.ts` (example)
- **Type Definitions**: Auto-generated from Supabase schema

#### Section G: Seeding & Performance
- Seed data strategy for categories, cities, neighborhoods
- Index recommendations
- Common pitfalls and solutions

---

## Quick Start

### 1. Database Setup

Run migrations in order:

```bash
# Using Supabase CLI
supabase db push

# Or manually via SQL editor
# Run each migration file in numerical order (093-097)
```

### 2. Generate TypeScript Types

```bash
npm run types:supabase
```

This generates `/src/types/supabase.ts` with all database types.

### 3. Install Dependencies

```bash
npm install zod @supabase/supabase-js
```

### 4. Use in Your Application

```typescript
import { supabase } from '@/lib/supabase';
import { searchArtisans } from '@/lib/db/artisans';
import { CreateArtisanProfileSchema } from '@/lib/validations/marketplace';

// Search artisans
const results = await searchArtisans(supabase, {
  city_id: 1,
  service_category_id: '...',
  page: 1,
  limit: 20,
});

// Validate form data
const validated = CreateArtisanProfileSchema.safeParse(formData);
if (!validated.success) {
  console.error(validated.error);
}
```

---

## Key Features Implemented

### 1. Junction Table Pattern ✅
- Replaced `neighborhood_ids INTEGER[]` with `artisan_profile_neighborhoods` join table
- Proper foreign key constraints
- Type-safe (UUID for artisan_profile_id, INTEGER for neighborhood_id)

### 2. Request Management System ✅
- Full lifecycle tracking (pending → viewed → accepted → completed)
- Status history audit trail
- Auto-status updates via triggers
- RLS policies for client/artisan/admin access

### 3. Review and Rating System ✅
- 5-star rating with optional detailed ratings
- Review response capability for artisans
- Moderation features (flagging, hiding)
- Rating statistics calculation

### 4. Media Management ✅
- Support for images, videos, documents, certificates
- Categorization (profile photo, work samples, etc.)
- Display ordering
- Public/private visibility control

### 5. Comprehensive Validation ✅
- Zod schemas for all entities
- Moroccan phone number validation
- Budget constraints
- Rating ranges (1-5)

---

## Database Schema Summary

### Core Tables

**auth.users** (Supabase managed)
↓ 1:1
**profiles** - User profiles with role
↓ 1:N
**artisan_profiles** - Provider profiles
↓ N:M via **artisan_profile_neighborhoods**
**neighborhoods** - Service areas

**artisan_profiles** → **requests** ← **profiles** (client)
**artisan_profiles** → **reviews** ← **profiles** (client)
**artisan_profiles** → **media**

### Junction Tables

| Table | Purpose | Foreign Keys |
|---|---|---|
| `artisan_profile_neighborhoods` | Artisan service areas | artisan_profile_id (UUID), neighborhood_id (INTEGER) |

### Audit Tables

| Table | Purpose |
|---|---|
| `request_status_history` | Track request status changes |

---

## Migration Order (CRITICAL)

Run in this exact order:

1. ✅ Existing migrations (001-092) - Already applied
2. **093** - Create artisan_profile_neighborhoods junction table
3. **094** - Create requests table
4. **095** - Create request_status_history table
5. **096** - Create reviews table
6. **097** - Create media table

### Rollback Safety

Each migration includes:
- Idempotent operations (CREATE IF NOT EXISTS)
- Comments for documentation
- Verification queries at the end

To rollback:
```sql
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS request_status_history CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS artisan_profile_neighborhoods CASCADE;
```

---

## Security (RLS Policies)

All tables are protected with Row-Level Security:

### Public Access
- ✅ Service categories (active only)
- ✅ Cities (active only)
- ✅ Neighborhoods (all)
- ✅ Artisan profiles (verified + active only)
- ✅ Reviews (non-hidden only)

### Authenticated Access
- ✅ Create artisan profile
- ✅ Update own profile (except is_verified, is_active)
- ✅ Manage own neighborhoods
- ✅ Create service requests
- ✅ View own requests (sent or received)
- ✅ Create reviews
- ✅ Respond to reviews (artisans only)

### Admin Access
- ✅ Full access to all tables
- ✅ Verify artisan profiles
- ✅ Moderate reviews

---

## Performance Considerations

### Indexes Created

```sql
-- Artisan search (most common query)
idx_artisan_profiles_search (city_id, service_category_id, is_boosted, is_verified, is_active)

-- Junction table lookups
idx_apn_artisan_id (artisan_profile_id)
idx_apn_neighborhood_id (neighborhood_id)

-- Request queries
idx_requests_client (client_id, created_at DESC)
idx_requests_artisan (artisan_profile_id, status, created_at DESC)

-- Review queries
idx_reviews_artisan (artisan_profile_id, created_at DESC)
idx_reviews_rating (artisan_profile_id, rating DESC)
```

### Query Optimization Tips

1. **Use indexes** - All foreign keys are indexed
2. **Limit results** - Always paginate
3. **Avoid N+1** - Use `select()` with joins
4. **Cache aggressively** - Rating stats can be cached

---

## Common Pitfalls & Solutions

### 1. UUID vs INTEGER Type Mismatch

**Problem**: `artisan_profiles.id` is UUID, but `neighborhoods.id` is INTEGER

**Solution**: Junction table uses correct types:
```sql
CREATE TABLE artisan_profile_neighborhoods (
  artisan_profile_id UUID,  -- Matches artisan_profiles.id
  neighborhood_id INTEGER    -- Matches neighborhoods.id
);
```

### 2. Neighborhood-City Consistency

**Problem**: Can assign neighborhoods from wrong city

**Solution**: Validation trigger enforces city match:
```sql
CREATE TRIGGER validate_artisan_neighborhoods_trigger
  BEFORE INSERT OR UPDATE ON artisan_profile_neighborhoods
  FOR EACH ROW EXECUTE FUNCTION validate_artisan_neighborhoods();
```

### 3. Self-Verification Prevention

**Problem**: Artisan could mark own profile as verified

**Solution**: RLS policy prevents changing `is_verified` and `is_active`:
```sql
WITH CHECK (
  NEW.is_verified = OLD.is_verified AND
  NEW.is_active = OLD.is_active
)
```

### 4. Orphaned Records on Delete

**Problem**: Deleting artisan leaves orphaned neighborhoods

**Solution**: ON DELETE CASCADE on junction table:
```sql
artisan_profile_id UUID REFERENCES artisan_profiles(id) ON DELETE CASCADE
```

---

## Testing Checklist

See [MARKETPLACE_TESTING_GUIDE.md](./MARKETPLACE_TESTING_GUIDE.md) for detailed tests.

### Pre-Deployment
- [ ] All migrations run without errors
- [ ] Types generated successfully
- [ ] Sample data seeded

### Functional Tests
- [ ] Artisan onboarding flow works end-to-end
- [ ] Request creation and response works
- [ ] Review creation and display works
- [ ] Neighborhood selection with junction table works

### Security Tests
- [ ] RLS policies block unauthorized access
- [ ] Artisans cannot self-verify
- [ ] Clients cannot see others' requests

### Performance Tests
- [ ] Search queries use indexes
- [ ] Pagination works efficiently
- [ ] JOIN on junction table is fast

---

## API Examples

### Create Artisan Profile

```typescript
const { data, error } = await supabase.rpc('create_my_artisan_profile', {
  p_service_category_id: categoryId,
  p_business_name: 'Hassan Plumbing',
  p_phone: '+212600000001',
  p_city_id: 1,
  p_neighborhood_ids: [],
  p_description_fr: 'Professional plumbing services',
});
```

### Update Neighborhoods

```typescript
import { updateArtisanNeighborhoods } from '@/lib/db/artisans';

const result = await updateArtisanNeighborhoods(
  supabase,
  artisanProfileId,
  [1, 2, 3, 4, 5] // neighborhood IDs
);
```

### Search Artisans

```typescript
import { searchArtisans } from '@/lib/db/artisans';

const { artisans, total, totalPages } = await searchArtisans(supabase, {
  city_id: 1,
  service_category_id: categoryId,
  neighborhood_ids: [1, 2],
  page: 1,
  limit: 20,
});
```

### Create Request

```typescript
const { data, error } = await supabase.rpc('create_service_request', {
  p_artisan_profile_id: artisanId,
  p_title: 'Need plumbing repair',
  p_description: 'Leaking pipe in kitchen',
  p_client_phone: '+212600000002',
  p_urgency: 'high',
});
```

### Create Review

```typescript
const { data, error } = await supabase
  .from('reviews')
  .insert({
    artisan_profile_id: artisanId,
    rating: 5,
    review_text: 'Excellent service, very professional!',
    quality_rating: 5,
    professionalism_rating: 5,
    would_recommend: true,
  });
```

---

## Deployment

### Production Checklist

- [ ] Run all migrations on production database
- [ ] Verify RLS policies are enabled
- [ ] Test with real user accounts
- [ ] Monitor slow queries
- [ ] Set up error tracking (Sentry)
- [ ] Configure backup strategy

### Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# For server-side operations (keep secret!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Support & Troubleshooting

### Common Issues

**Issue**: Migration fails with "relation already exists"  
**Solution**: Migration is idempotent, safe to re-run

**Issue**: RLS policies blocking queries  
**Solution**: Check user authentication and role

**Issue**: Slow search queries  
**Solution**: Verify indexes exist, use EXPLAIN ANALYZE

**Issue**: Type errors in TypeScript  
**Solution**: Regenerate types with `npm run types:supabase`

### Getting Help

1. Check the [System Design Doc](./MARKETPLACE_SYSTEM_DESIGN.md)
2. Review [Testing Guide](./MARKETPLACE_TESTING_GUIDE.md)
3. Examine migration files for SQL examples
4. Look at validation schemas for data requirements

---

## Roadmap

### Completed ✅
- Junction table for neighborhoods
- Request management system
- Review and rating system
- Media management
- RLS policies
- Validation schemas
- Database access layer

### Future Enhancements 🚀
- Real-time notifications
- Advanced search (Elasticsearch)
- Messaging system between clients and artisans
- Payment integration
- Booking calendar
- Multi-language support (beyond FR/AR)
- Mobile app (React Native)

---

## License

Private - All rights reserved

---

**Last Updated**: February 2024  
**Version**: 1.0.0  
**Maintainer**: TopAffaireImmo Development Team
