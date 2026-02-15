# TopAffaireImmo - Complete Backend Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Security & RLS Policies](#security--rls-policies)
4. [RPC Functions](#rpc-functions)
5. [Storage Buckets](#storage-buckets)
6. [Role Permissions Matrix](#role-permissions-matrix)
7. [API Usage Examples](#api-usage-examples)
8. [Monitoring & Audit](#monitoring--audit)

---

## Overview

TopAffaireImmo is a comprehensive real estate and home services platform built on Supabase. The backend supports:

- **Real Estate Listings**: Full CRUD with moderation workflow
- **Home Services**: Artisan profiles, service requests, and monetization
- **Notifications**: Real-time user notifications
- **Boost System**: Featured listings with payment integration
- **Contact Reveals**: Analytics-tracked phone number reveals
- **Advanced Search**: Text similarity search with filters
- **Audit Logging**: Complete admin action tracking

---

## Database Schema

### Core Tables

#### **profiles**
User profiles with role-based access control.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (references auth.users) |
| email | TEXT | User email |
| full_name | TEXT | Display name |
| phone | TEXT | Contact phone |
| user_role | TEXT | `admin`, `real_estate_advertiser`, `commercial_advertiser` |
| advertiser_type | TEXT | `owner`, `agency` (for real estate) |
| is_verified | BOOLEAN | Account verification status |
| is_active | BOOLEAN | Account active status |

#### **properties**
Real estate listings with multilingual support.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| owner_id | UUID | References profiles |
| transaction_type | TEXT | `sale`, `rent` |
| property_type | TEXT | `apartment`, `house`, `villa`, `commercial`, `land` |
| city_id | INTEGER | References cities |
| price | DECIMAL | Property price |
| title_fr | TEXT | French title |
| title_ar | TEXT | Arabic title |
| status | TEXT | `pending`, `approved`, `rejected`, `sold`, `rented`, `inactive` |
| featured | BOOLEAN | Boost status |
| moderated_at | TIMESTAMPTZ | When moderated |
| moderated_by | UUID | Admin who moderated |
| rejection_reason | TEXT | Rejection explanation |

#### **property_images**
Property image management.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| property_id | UUID | References properties |
| url | TEXT | Image URL |
| storage_path | TEXT | Supabase storage path |
| is_primary | BOOLEAN | Main image flag |
| display_order | INTEGER | Sort order |

### Notification System

#### **notifications**
User notification center (NEW in migration 114).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Recipient user |
| type | TEXT | `property_status`, `lead`, `payment`, `system`, `artisan_verification`, `boost` |
| title | TEXT | Notification title |
| body | TEXT | Notification message |
| data | JSONB | Additional metadata |
| is_read | BOOLEAN | Read status |
| created_at | TIMESTAMPTZ | Creation time |

### Boost & Monetization

#### **boost_plans**
Available boost packages (NEW in migration 114).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Plan name |
| description | TEXT | Plan description |
| price | DECIMAL | Price in MAD |
| duration_days | INTEGER | Boost duration |
| features | JSONB | Feature list |
| is_active | BOOLEAN | Active status |

**Default Plans:**
1. **Basic Boost** - 99 MAD / 7 days
2. **Premium Boost** - 179 MAD / 14 days
3. **Ultimate Boost** - 299 MAD / 30 days

#### **property_boosts**
Active property boost subscriptions (NEW in migration 114).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| property_id | UUID | Boosted property |
| plan_id | UUID | Selected boost plan |
| payment_id | UUID | Payment reference |
| starts_at | TIMESTAMPTZ | Boost start |
| ends_at | TIMESTAMPTZ | Boost expiry |
| status | TEXT | `pending`, `active`, `expired`, `cancelled` |

#### **payments**
Payment processing records.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Payer |
| amount | DECIMAL | Amount |
| currency | TEXT | Default: MAD |
| payment_method | TEXT | Payment provider |
| payment_reference | TEXT | External reference |
| status | TEXT | Payment status |

### Contact & Analytics

#### **phone_reveal_events** / **contact_reveals** (view)
Phone number reveal tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| entity_type | TEXT | `listing`, `service` |
| entity_id | UUID | Property or artisan ID |
| ip_hash | TEXT | Privacy-safe IP tracking |
| user_agent_hash | TEXT | Browser fingerprint |
| success | BOOLEAN | Reveal success |
| blocked | BOOLEAN | Rate limit flag |

### Home Services

#### **artisan_profiles**
Service provider profiles.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users |
| service_category_id | UUID | Service type |
| business_name | TEXT | Company name |
| phone | TEXT | Contact phone |
| cities | INTEGER[] | Service coverage areas |
| is_verified | BOOLEAN | Admin verification |
| is_active | BOOLEAN | Active status |

#### **service_categories** & **service_subcategories**
Service taxonomy.

#### **requests**
Service requests from users to artisans.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Requester |
| artisan_id | UUID | Service provider |
| status | TEXT | Request status |
| description | TEXT | Request details |

### Admin & Audit

#### **admins**
Admin user list with permissions.

| Column | Type | Description |
|--------|------|-------------|
| user_id | UUID | Admin user ID |
| is_active | BOOLEAN | Admin status |

#### **admin_audit_logs**
Complete admin action trail.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| admin_id | UUID | Admin who acted |
| action_type | TEXT | Action performed |
| target_type | TEXT | Entity type |
| target_id | UUID | Entity ID |
| metadata | JSONB | Additional context |
| created_at | TIMESTAMPTZ | Action time |

### Monitoring & System Health

#### **system_logs** (migration 113)
Centralized application logging.

#### **performance_metrics** (migration 113)
API performance tracking.

#### **analytics_events** (migration 113)
Privacy-safe usage analytics.

#### **sms_logs** (NEW in migration 114)
SMS notification tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Recipient |
| phone | TEXT | Phone number |
| message | TEXT | SMS content |
| provider | TEXT | `vonage`, `twilio`, `other` |
| status | TEXT | Delivery status |

---

## Security & RLS Policies

### Role Hierarchy

1. **Public** (unauthenticated)
   - Read approved properties
   - Read active artisan profiles
   - Read boost plans
   - Read cities/neighborhoods

2. **User** (authenticated)
   - All public permissions
   - Read own notifications
   - Mark own notifications as read
   - Create properties
   - Update own profile

3. **Advertiser** (real_estate_advertiser)
   - All user permissions
   - CRUD own properties
   - Submit properties for review
   - Purchase property boosts

4. **Artisan**
   - All user permissions
   - CRUD own artisan profile
   - Manage service requests

5. **Admin**
   - All permissions
   - Moderate properties (approve/reject)
   - Verify artisan profiles
   - Manage boost plans
   - View audit logs
   - View analytics

### RLS Policy Examples

#### Properties Table

```sql
-- Public can read approved properties
CREATE POLICY "Public can read approved properties"
  ON public.properties
  FOR SELECT
  USING (status = 'approved');

-- Owners can CRUD their own properties
CREATE POLICY "Owners can manage own properties"
  ON public.properties
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Admins can manage all properties
CREATE POLICY "Admins can manage all properties"
  ON public.properties
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));
```

#### Notifications Table

```sql
-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## RPC Functions

### Property Moderation

#### `submit_property_for_review(property_id UUID)`
Submit a property for admin approval.

**Security**: DEFINER (runs as owner)
**Access**: Property owner only

**Returns**: BOOLEAN (success)

**Example**:
```javascript
const { data, error } = await supabase.rpc('submit_property_for_review', {
  property_id: 'uuid-here'
});
```

#### `approve_property(property_id UUID)`
Approve a pending property (admin only).

**Security**: DEFINER
**Access**: Admins only

**Side Effects**:
- Updates property status to 'approved'
- Creates notification for owner
- Logs to audit trail

**Example**:
```javascript
const { data, error } = await supabase.rpc('approve_property', {
  property_id: 'uuid-here'
});
```

#### `reject_property(property_id UUID, reason TEXT)`
Reject a property with reason (admin only).

**Security**: DEFINER
**Access**: Admins only

**Validation**: Reason must be at least 10 characters

**Side Effects**:
- Updates property status to 'rejected'
- Stores rejection reason
- Creates notification for owner
- Logs to audit trail

**Example**:
```javascript
const { data, error } = await supabase.rpc('reject_property', {
  property_id: 'uuid-here',
  reason: 'Images do not meet quality standards'
});
```

### Notifications

#### `mark_notification_read(notification_id UUID)`
Mark a single notification as read.

**Security**: DEFINER
**Access**: Notification owner only

**Returns**: BOOLEAN (true if notification was found and updated)

**Example**:
```javascript
const { data, error } = await supabase.rpc('mark_notification_read', {
  notification_id: 'uuid-here'
});
```

#### `mark_all_notifications_read()`
Mark all user notifications as read.

**Security**: DEFINER
**Access**: Authenticated users

**Returns**: INTEGER (count of notifications marked as read)

**Example**:
```javascript
const { data, error } = await supabase.rpc('mark_all_notifications_read');
// data returns the count of notifications updated
```

### Search

#### `search_properties()`
Advanced property search with filters and pagination.

**Security**: DEFINER (stable)
**Access**: Public

**Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| query | TEXT | NULL | Search text (uses pg_trgm similarity) |
| city_filter | INTEGER | NULL | Filter by city ID |
| min_price | DECIMAL | NULL | Minimum price |
| max_price | DECIMAL | NULL | Maximum price |
| property_type_filter | TEXT | NULL | Property type |
| transaction_type_filter | TEXT | NULL | 'sale' or 'rent' |
| bedrooms_filter | INTEGER | NULL | Minimum bedrooms |
| page_number | INTEGER | 1 | Page number (1-indexed) |
| page_size | INTEGER | 20 | Results per page |

**Returns**: Table with properties and relevance score

**Example**:
```javascript
const { data, error } = await supabase.rpc('search_properties', {
  query: 'villa piscine',
  city_filter: 1, // Casablanca
  min_price: 1000000,
  max_price: 5000000,
  transaction_type_filter: 'sale',
  page_number: 1,
  page_size: 20
});
```

### Contact Reveals

#### `get_listing_phone(listing_id UUID, ...)`
Reveal property contact information (migration 105).

**Security**: Service role (called via Edge Function)
**Access**: Public (with rate limiting)

**Side Effects**:
- Logs reveal to phone_reveal_events
- Checks rate limits
- Returns phone number

#### `get_artisan_phone(artisan_id UUID, ...)`
Reveal artisan contact information (migration 105).

**Security**: Service role (called via Edge Function)
**Access**: Public (with rate limiting)

### Email & Authentication

#### `resend_email_confirmation()`
Resend email confirmation to user.

**Security**: DEFINER
**Access**: Authenticated users

**Rate Limit**: 3 attempts per hour

**Returns**: JSONB with success status

**Example**:
```javascript
const { data, error } = await supabase.rpc('resend_email_confirmation');
// data: { success: true, message: "Confirmation email sent to...", email: "..." }
```

### Audit Logging

#### `log_audit_event(action_type, target_type, target_id, metadata)`
Log admin actions to audit trail.

**Security**: DEFINER
**Access**: Admins only

**Example**:
```javascript
const { data, error } = await supabase.rpc('log_audit_event', {
  action_type_param: 'verify',
  target_type_param: 'artisan',
  target_id_param: 'uuid-here',
  metadata_param: { notes: 'Verified after document review' }
});
```

---

## Storage Buckets

### Configuration

| Bucket | Public | Max Size | MIME Types | RLS |
|--------|--------|----------|------------|-----|
| **property-images** | Yes | 5MB | JPEG, PNG, WebP | User-scoped folders |
| **banner-images** | Yes | 2MB | JPEG, PNG, GIF, WebP | Admin only |
| **payment-receipts** | No | 5MB | JPEG, PNG, PDF | User-scoped |
| **agency-logos** | Yes | 1MB | JPEG, PNG, WebP, SVG | User-scoped |
| **avatars** | Yes | 2MB | JPEG, PNG, WebP | User-scoped |

### Upload Patterns

#### Property Images
```javascript
// Upload path: {user_id}/{property_id}/{filename}
const filePath = `${userId}/${propertyId}/${file.name}`;

const { data, error } = await supabase.storage
  .from('property-images')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
  });

// Get public URL
const { data: urlData } = supabase.storage
  .from('property-images')
  .getPublicUrl(filePath);
```

#### User Avatars
```javascript
// Upload path: {user_id}/avatar.{ext}
const filePath = `${userId}/avatar.${fileExtension}`;

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: true // Allow replacing existing avatar
  });
```

### RLS Policies

All storage buckets use user-scoped folder policies:

```sql
-- Users can upload to their own folder
CREATE POLICY "Users can upload own files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'property-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can manage all files
CREATE POLICY "Admins can manage all files"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'property-images'
    AND auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE)
  );
```

---

## Role Permissions Matrix

### Properties

| Action | Public | User | Advertiser | Artisan | Admin |
|--------|--------|------|------------|---------|-------|
| Read approved | ✅ | ✅ | ✅ | ✅ | ✅ |
| Read own (all statuses) | ❌ | ❌ | ✅ | ❌ | ✅ |
| Create | ❌ | ❌ | ✅ | ❌ | ✅ |
| Update own | ❌ | ❌ | ✅ | ❌ | ✅ |
| Delete own | ❌ | ❌ | ✅ | ❌ | ✅ |
| Submit for review | ❌ | ❌ | ✅ | ❌ | ✅ |
| Approve/Reject | ❌ | ❌ | ❌ | ❌ | ✅ |
| Change owner | ❌ | ❌ | ❌ | ❌ | ✅ |

### Notifications

| Action | Public | User | Advertiser | Artisan | Admin |
|--------|--------|------|------------|---------|-------|
| Read own | ❌ | ✅ | ✅ | ✅ | ✅ |
| Mark as read | ❌ | ✅ | ✅ | ✅ | ✅ |
| Create | ❌ | ❌ | ❌ | ❌ | ✅ (system) |
| Delete | ❌ | ❌ | ❌ | ❌ | ✅ |

### Boost Plans

| Action | Public | User | Advertiser | Artisan | Admin |
|--------|--------|------|------------|---------|-------|
| Read active | ✅ | ✅ | ✅ | ✅ | ✅ |
| Purchase | ❌ | ❌ | ✅ | ❌ | ✅ |
| Create/Update | ❌ | ❌ | ❌ | ❌ | ✅ |
| Delete | ❌ | ❌ | ❌ | ❌ | ✅ |

### Artisan Profiles

| Action | Public | User | Advertiser | Artisan | Admin |
|--------|--------|------|------------|---------|-------|
| Read verified | ✅ | ✅ | ✅ | ✅ | ✅ |
| Read own (all) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Create own | ❌ | ✅ | ✅ | ✅ | ✅ |
| Update own | ❌ | ❌ | ❌ | ✅ | ✅ |
| Verify | ❌ | ❌ | ❌ | ❌ | ✅ |

### Admin Functions

| Action | Public | User | Advertiser | Artisan | Admin |
|--------|--------|------|------------|---------|-------|
| View audit logs | ❌ | ❌ | ❌ | ❌ | ✅ |
| View system logs | ❌ | ❌ | ❌ | ❌ | ✅ |
| Moderate content | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ❌ | ✅ |
| Configure platform | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## API Usage Examples

### Property Management Workflow

#### 1. Create Property (Advertiser)
```javascript
const { data, error } = await supabase
  .from('properties')
  .insert({
    owner_id: user.id,
    transaction_type: 'sale',
    property_type: 'apartment',
    city_id: 1,
    price: 1500000,
    title_fr: 'Appartement moderne au Maarif',
    title_ar: 'شقة عصرية في المعاريف',
    description_fr: 'Bel appartement de 120m²...',
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    status: 'draft' // Start as draft
  })
  .select()
  .single();
```

#### 2. Upload Images
```javascript
// Upload each image
for (const file of imageFiles) {
  const filePath = `${user.id}/${propertyId}/${file.name}`;
  
  await supabase.storage
    .from('property-images')
    .upload(filePath, file);
    
  // Add to property_images table
  await supabase
    .from('property_images')
    .insert({
      property_id: propertyId,
      url: `property-images/${filePath}`,
      storage_path: filePath,
      is_primary: index === 0,
      display_order: index
    });
}
```

#### 3. Submit for Review
```javascript
const { data, error } = await supabase.rpc('submit_property_for_review', {
  property_id: propertyId
});

if (data) {
  console.log('Property submitted for review');
}
```

#### 4. Admin Approval
```javascript
// Admin approves
const { data, error } = await supabase.rpc('approve_property', {
  property_id: propertyId
});

// Or admin rejects
const { data, error } = await supabase.rpc('reject_property', {
  property_id: propertyId,
  reason: 'Images are not clear enough. Please upload higher quality photos.'
});
```

#### 5. Check Notifications
```javascript
// User checks notifications
const { data: notifications } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', user.id)
  .eq('is_read', false)
  .order('created_at', { ascending: false });

// Mark as read
await supabase.rpc('mark_notification_read', {
  notification_id: notifications[0].id
});
```

### Boost Purchase Workflow

#### 1. List Available Plans
```javascript
const { data: plans } = await supabase
  .from('boost_plans')
  .select('*')
  .eq('is_active', true)
  .order('display_order');
```

#### 2. Create Payment
```javascript
// In production, integrate with Stripe
const { data: payment } = await supabase
  .from('payments')
  .insert({
    user_id: user.id,
    amount: plan.price,
    currency: 'MAD',
    payment_method: 'stripe',
    status: 'pending'
  })
  .select()
  .single();

// Process payment via Stripe (Edge Function)
const response = await fetch('/api/create-payment-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    payment_id: payment.id,
    amount: plan.price
  })
});
```

#### 3. Activate Boost (After Payment Success)
```javascript
const { data: boost } = await supabase
  .from('property_boosts')
  .insert({
    property_id: propertyId,
    plan_id: plan.id,
    payment_id: payment.id,
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active'
  })
  .select()
  .single();

// Update property featured status
await supabase
  .from('properties')
  .update({ featured: true })
  .eq('id', propertyId);
```

### Search Properties

```javascript
const { data: results } = await supabase.rpc('search_properties', {
  query: 'villa avec piscine',
  city_filter: 3, // Marrakech
  min_price: 2000000,
  max_price: 8000000,
  property_type_filter: 'villa',
  transaction_type_filter: 'sale',
  bedrooms_filter: 4,
  page_number: 1,
  page_size: 20
});

// Results are ordered by:
// 1. Featured properties first
// 2. Text relevance score
// 3. Creation date (newest first)
```

### Contact Reveals

```javascript
// Via Edge Function (handles rate limiting)
const response = await fetch('/functions/v1/reveal-phone', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Real-IP': clientIP,
    'User-Agent': navigator.userAgent
  },
  body: JSON.stringify({
    entity_type: 'listing',
    entity_id: propertyId,
    referrer: document.referrer,
    page_url: window.location.href
  })
});

const data = await response.json();
// data: { phone: "+212...", success: true }
```

---

## Monitoring & Audit

### System Logs (Migration 113)

```javascript
// Log application events
await supabase.rpc('log_system_event', {
  level_param: 'error',
  source_param: 'property-upload',
  message_param: 'Failed to upload image',
  metadata_param: { property_id: '...', error: '...' }
});

// Query logs (admin only)
const { data: logs } = await supabase
  .from('system_logs')
  .select('*')
  .eq('level', 'error')
  .gte('created_at', '2024-01-01')
  .order('created_at', { ascending: false })
  .limit(100);
```

### Performance Metrics (Migration 113)

```javascript
// Track API performance
await supabase.rpc('track_performance_metric', {
  metric_type_param: 'api_request',
  value_param: 245.5, // milliseconds
  metadata_param: {
    endpoint: '/api/properties',
    method: 'GET',
    status: 200
  }
});
```

### Analytics Events (Migration 113)

```javascript
// Privacy-safe analytics
await supabase.rpc('track_analytics_event', {
  event_type_param: 'property_view',
  metadata_param: {
    property_id: '...',
    city: 'Casablanca',
    property_type: 'apartment'
  }
});
```

### Audit Trail

```javascript
// Admin actions are automatically logged via RPC functions
// Query audit logs (admin only)
const { data: auditLogs } = await supabase
  .from('admin_audit_logs')
  .select(`
    *,
    admin:admins!inner(user_id, profiles!inner(full_name, email))
  `)
  .eq('target_type', 'property')
  .gte('created_at', '2024-01-01')
  .order('created_at', { ascending: false });

// Example log entry:
// {
//   admin_id: 'uuid',
//   action_type: 'approve',
//   target_type: 'property',
//   target_id: 'property-uuid',
//   metadata: { previous_status: 'pending' },
//   created_at: '2024-02-15T10:30:00Z'
// }
```

---

## Production Deployment Checklist

### Security

- [ ] Enable RLS on all tables
- [ ] Review and test all RLS policies
- [ ] Set strong JWT secret
- [ ] Configure email templates
- [ ] Set up SMTP provider
- [ ] Configure Stripe webhook secret
- [ ] Set phone reveal hash salt (Vault)
- [ ] Enable rate limiting on Edge Functions
- [ ] Configure CORS policies

### Storage

- [ ] Configure storage bucket limits
- [ ] Set up CDN for images
- [ ] Configure image optimization
- [ ] Test file upload limits
- [ ] Set up automatic cleanup for orphaned files

### Monitoring

- [ ] Enable Supabase monitoring dashboard
- [ ] Set up alerts for error rates
- [ ] Configure performance metric thresholds
- [ ] Set up log retention policies
- [ ] Enable audit log archiving

### Payments

- [ ] Test Stripe integration in sandbox
- [ ] Configure production Stripe keys
- [ ] Set up webhook endpoint
- [ ] Test payment failure scenarios
- [ ] Configure automatic boost expiry

### Email & SMS

- [ ] Configure production SMTP
- [ ] Set up SMS provider (Vonage/Twilio)
- [ ] Test notification delivery
- [ ] Configure rate limiting
- [ ] Set up unsubscribe handling

---

## Support & Maintenance

For issues or questions:
1. Check system logs: `system_logs` table
2. Review audit trail: `admin_audit_logs` table
3. Monitor performance: `performance_metrics` table
4. Verify RLS policies with test queries

Last Updated: February 2024
Migration Version: 114
