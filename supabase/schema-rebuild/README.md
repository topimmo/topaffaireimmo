# TopAffaireImmo Database Schema - Complete Rebuild

This directory contains comprehensive SQL migration files for rebuilding the TopAffaireImmo database from scratch. These files consolidate all schema definitions, security policies, indexes, and seed data into a clean, production-ready format.

## 📁 Migration Files (Execute in Order)

### 02_tables.sql (741 lines)
**Complete Table Schema - 40+ Tables**

Creates all database tables with proper constraints, foreign keys, and comments:

**User & Profile Tables:**
- `profiles` - User profiles extending auth.users
- `admins` - Admin users with role-based access

**Location Tables:**
- `cities` - Moroccan cities (18 cities)
- `neighborhoods` - City neighborhoods with multilingual names

**Property Tables:**
- `properties` - Property listings with full moderation workflow
- `property_images` - Property image metadata

**Service Category Tables:**
- `service_categories` - Home service categories
- `service_subcategories` - Granular service classification

**Artisan Tables:**
- `artisan_profiles` - Service provider profiles
- `artisan_profile_neighborhoods` - Many-to-many mapping
- `artisan_services` - Services offered by artisans

**Service Request Tables:**
- `requests` - Service requests from clients
- `request_status_history` - Audit trail for status changes

**Review Tables:**
- `reviews` - Client reviews with 5-star ratings

**Monetization Tables:**
- `wallets` - User wallet balances (MAD)
- `wallet_transactions` - Transaction audit trail
- `payments` - Payment records
- `boost_plans` - Property boost plans
- `property_boosts` - Active boost subscriptions
- `phone_reveal_events` - Phone reveal analytics
- `contact_access_passes` - Time-limited access passes

**Advertising Tables:**
- `banner_requests` - Banner advertising requests
- `promo_banners` - Promotional banner ads

**CMS Tables:**
- `site_pages` - Static CMS pages
- `site_categories` - Content categories
- `seo_guides` - SEO-optimized guides

**Notification Tables:**
- `notifications` - User notifications
- `push_subscriptions` - Web push subscriptions

**Authentication Tables:**
- `otp_attempts` - OTP verification
- `sms_logs` - SMS notification logs

**Admin Tables:**
- `admin_audit_logs` - Admin action audit trail
- `admin_notifications` - System notifications for admins

**Monitoring Tables:**
- `system_logs` - Centralized logging
- `performance_metrics` - Performance monitoring
- `analytics_events` - Privacy-safe analytics
- `alert_configurations` - Alert settings
- `alert_history` - Triggered alerts log

**Other Tables:**
- `media` - Media file metadata
- `platform_settings` - Platform configuration
- `email_resend_attempts` - Email rate limiting

---

### 03_indexes.sql (256 lines)
**Performance Indexes**

Creates all performance indexes for query optimization:
- Single-column indexes for filtering and sorting
- Composite indexes for common query patterns
- Full-text search indexes using `pg_trgm` for Arabic/French text
- Partial indexes for conditional queries
- GIN indexes for array and JSONB columns

**Key Performance Optimizations:**
- Property search by city, status, price, type
- Artisan search by category, city, rating
- Full-text search on property titles/descriptions
- Admin dashboard queries
- Analytics and monitoring queries

---

### 04_rls.sql (680 lines)
**Row-Level Security Policies**

Comprehensive RLS policies for all 40+ tables ensuring:
- Users can only see their own data
- Public can access approved/published content
- Admins have full access to all data
- Service providers can manage their listings
- Clients can access their requests and reviews

**Security Principles:**
- Defense in depth - multiple policy layers
- Least privilege - minimal access by default
- Admin verification via `admins.is_active = TRUE`
- No direct INSERT/UPDATE on sensitive tables (use RPCs)

---

### 05_triggers.sql (692 lines)
**Triggers and RPC Functions**

**Triggers:**
- `updated_at` auto-update on all tables
- Property status protection (admin-only)
- Artisan service moderation protection
- Request auto-status update on view

**Authorization RPC Functions:**
- `is_admin()` - Check if current user is admin (SINGLE SOURCE OF TRUTH)
- `can_approve_properties()` - Property approval permission
- `can_approve_services()` - Service approval permission
- `has_permission(key)` - Generic permission checker

**Property Moderation RPCs:**
- `approve_property(id)` - Approve property listing
- `reject_property(id, reason)` - Reject with reason

**Artisan Service Moderation RPCs:**
- `approve_artisan_service(id)` - Approve service
- `reject_artisan_service(id, reason)` - Reject with reason

**Analytics RPCs:**
- `track_analytics_event()` - Privacy-safe event tracking
- `get_artisan_rating_stats(id)` - Comprehensive rating statistics

**Notification RPCs:**
- `mark_notification_read(id)` - Mark single notification read
- `mark_all_notifications_read()` - Mark all notifications read

**System Health:**
- `check_system_health()` - Overall system health check

---

### 06_seed.sql (307 lines)
**Seed Reference Data**

**Moroccan Cities (18):**
Casablanca, Rabat, Marrakech, Fes, Tangier, Agadir, Meknes, Oujda, Kenitra, Tetouan, Safi, Mohammedia, Khouribga, El Jadida, Beni Mellal, Nador, Taza, Settat

**Neighborhoods (80+):**
Comprehensive neighborhoods for each major city with French/Arabic names

**Service Categories (12):**
1. Plomberie (Plumbing)
2. Électricité (Electricity)
3. Climatisation (Air Conditioning)
4. Peinture (Painting)
5. Nettoyage (Cleaning)
6. Jardinage (Gardening)
7. Menuiserie (Carpentry)
8. Serrurerie (Locksmith)
9. Maçonnerie (Masonry)
10. Carrelage (Tiling)
11. Déménagement (Moving)
12. Dépannage (Emergency Repair)

**Platform Settings:**
- Monetization: **OFF by default**
- Contact reveal fee: 5 MAD
- Min wallet balance: 50 MAD
- Free reveals per day: 3

**Boost Plans (3):**
- Boost Basique (7 days) - 99 MAD
- Boost Premium (14 days) - 179 MAD
- Boost Ultimate (30 days) - 299 MAD
(All inactive by default)

---

## 🚀 Execution Instructions

### Option 1: Via Supabase Dashboard (Recommended)

1. Log in to Supabase Dashboard
2. Go to SQL Editor
3. Execute files in order (02 → 03 → 04 → 05 → 06)
4. Wait for each to complete before running the next

### Option 2: Via psql CLI

```bash
# Connect to your database
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Execute in order
\i supabase/schema-rebuild/02_tables.sql
\i supabase/schema-rebuild/03_indexes.sql
\i supabase/schema-rebuild/04_rls.sql
\i supabase/schema-rebuild/05_triggers.sql
\i supabase/schema-rebuild/06_seed.sql
```

### Option 3: Single Command

```bash
cat supabase/schema-rebuild/*.sql | psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

---

## ✅ Verification

After running all migrations, verify with:

```sql
-- Check table count (should be 40+)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- Check cities were seeded (should be 18)
SELECT COUNT(*) FROM public.cities;

-- Check service categories (should be 12)
SELECT COUNT(*) FROM public.service_categories;

-- Check platform settings
SELECT * FROM public.platform_settings WHERE key = 'monetization';

-- Test admin function
SELECT public.is_admin();
```

---

## 🔐 First Admin Setup

After migration, create the first admin user:

```sql
-- Replace with your user UUID from auth.users
INSERT INTO public.admins (user_id, is_active, role)
VALUES ('YOUR-USER-UUID-HERE', TRUE, 'super_admin');
```

---

## 📊 Schema Statistics

| Metric | Count |
|--------|-------|
| Total Tables | 40+ |
| Total Indexes | 150+ |
| RLS Policies | 100+ |
| RPC Functions | 15+ |
| Triggers | 20+ |
| Cities | 18 |
| Neighborhoods | 80+ |
| Service Categories | 12 |

---

## 🏗️ Architecture Principles

1. **Multilingual Support**: French/Arabic for all user-facing content
2. **Moderation Workflow**: Pending → Approved/Rejected for properties and services
3. **Admin Single Source of Truth**: Only `admins` table with `is_active = TRUE`
4. **Security by Default**: RLS enabled on all tables
5. **Audit Trail**: Comprehensive logging for admin actions
6. **Performance First**: Indexes on all foreign keys and common filters
7. **Privacy Safe**: Analytics without personal data
8. **Monetization Ready**: Wallet, payments, and boost systems (disabled by default)

---

## 🔧 Maintenance

### Adding a New City

```sql
INSERT INTO public.cities (name_en, name_fr, name_ar)
VALUES ('New City', 'Nouvelle Ville', 'المدينة الجديدة');
```

### Adding a New Service Category

```sql
INSERT INTO public.service_categories 
  (slug, name_fr, name_ar, description_fr, description_ar, icon, sort_order)
VALUES 
  ('new-service', 'Service Name', 'اسم الخدمة', 
   'Description FR', 'الوصف بالعربية', 'icon-name', 13);
```

### Enabling Monetization

```sql
UPDATE public.platform_settings 
SET value = jsonb_set(value, '{monetization_enabled}', 'true'::jsonb)
WHERE key = 'monetization';
```

---

## 📝 Notes

- **Extensions Required**: `pg_trgm`, `unaccent` (auto-installed)
- **PostgreSQL Version**: 14+ recommended
- **Execution Time**: ~30 seconds for complete rebuild
- **Rollback**: Drop schema `public` cascade and re-run
- **Production Safety**: All seed data uses `ON CONFLICT DO NOTHING` (idempotent)

---

## 🔄 Migration from Existing Database

If you have existing data:

1. **Backup first**: `pg_dump` your current database
2. **Export data**: Use `COPY TO` or Supabase dashboard
3. **Run migrations**: Execute these files on fresh database
4. **Import data**: Use `COPY FROM` or insert scripts
5. **Verify**: Check all data migrated correctly

---

## 📚 Related Documentation

- [ARCHITECTURE.md](../../ARCHITECTURE.md) - System architecture
- [DEPLOYMENT_GUIDE.md](../../DEPLOYMENT_GUIDE.md) - Deployment instructions
- [SECURITY_SUMMARY.md](../../SECURITY_SUMMARY.md) - Security overview
- [API Documentation](../../docs/) - API reference

---

## 🆘 Troubleshooting

**Problem: RLS policies blocking inserts**
```sql
-- Temporarily disable RLS (development only!)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

**Problem: Missing extensions**
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
```

**Problem: Permission denied**
```sql
-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

---

**Generated**: February 2024  
**Version**: 1.0.0  
**Database**: PostgreSQL 14+  
**Platform**: Supabase
