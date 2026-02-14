# 🔍 TopAffaireImmo - Complete System Audit Report

**Date:** February 14, 2026  
**Repository:** topimmo/topaffaireimmo  
**Tech Stack:** React 18 + TypeScript + Vite + Supabase + Vercel

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Route Structure](#route-structure)
3. [Authentication System](#authentication-system)
4. [Role-Based Access Control](#role-based-access-control)
5. [Database Schema](#database-schema)
6. [RLS Policies](#rls-policies)
7. [Monetization System](#monetization-system)
8. [Ads Logic](#ads-logic)
9. [Dashboard Structure](#dashboard-structure)
10. [Admin Panel](#admin-panel)
11. [API Architecture](#api-architecture)
12. [Performance Optimization](#performance-optimization)
13. [Error Handling System](#error-handling-system)
14. [Loading States](#loading-states)
15. [Empty States](#empty-states)
16. [Analytics Tracking](#analytics-tracking)
17. [Notifications System](#notifications-system)
18. [Email System](#email-system)
19. [Logging System](#logging-system)
20. [Supabase Functions](#supabase-functions)
21. [Subscription/Premium System](#subscription-premium-system)

---

## 1. Executive Summary

TopAffaireImmo is a **production-ready**, bilingual (French/Arabic) real estate platform for Morocco with integrated home services marketplace. The platform implements enterprise-grade security with Row-Level Security (RLS), comprehensive monitoring, and a sophisticated role-based access control system.

### Key Metrics
- **11+ database tables** with RLS protection
- **4 user roles** (user, agent, merchant, admin)
- **50+ routes** (public + protected)
- **4 storage buckets** for files
- **3 monetization streams** (listings, ads, services)
- **100% error tracking** with Sentry
- **GA4 analytics** fully integrated

---

## 2. Route Structure

### 2.1 Route Configuration Files
- **Main Router:** `/src/App.tsx`
- **Route Constants:** `/src/routes/paths.ts`
- **Route Guards:** 
  - `/src/components/ProtectedRoute.tsx` (role-based)
  - `/src/components/AdminProtectedRoute.tsx` (admin-only)
  - `/src/core/routing/guards/RequireAuth.tsx`
  - `/src/core/routing/guards/RequireProfileReady.tsx`

### 2.2 Public Routes (No Authentication)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Home | Landing page with featured properties |
| `/search` | SearchResults | Property search with filters |
| `/buy`, `/rent` | SearchResults | Transaction type filters |
| `/property/:id` | PropertyDetails | Property detail page |
| `/about`, `/contact` | About, Contact | Information pages |
| `/privacy`, `/terms` | Privacy, Terms | Legal pages |
| `/agencies` | Agencies | Agency directory |
| `/advertise` | Advertise | Advertising information |
| `/services` | Services | Home services listing |
| `/services/:slug` | ServiceCategoryPage | Service category detail |
| `/guides` | GuidesPage | Property guides index |
| `/guides/:slug` | GuidePage | Individual guide |
| `/login` | Login | Authentication page |
| `/register` | Register | User registration |
| `/reset-password` | ResetPassword | Password reset (PKCE) |
| `/auth/reset` | ResetPassword | Password reset alias |
| `/auth/callback` | AuthCallback | OAuth callback handler |
| `/diagnostics` | Diagnostics | **DEV ONLY** - System diagnostics |
| `/sahara-marocain` | MoroccanSaharaPage | SEO landing page |
| `/:city` | CityPage | Dynamic city pages |
| `/immobilier/:city` | TransactionPage | City transaction pages |

### 2.3 Protected Routes by Role

#### User Role (`allowedRoles: ["user"]`)
- `/dashboard` → Dashboard (property management)
- `/select-role` → SelectRole (role selection for new users)

#### Multi-Role (User, Agent, Merchant, Admin)
- `/add-listing` → AddListing
- `/edit-listing/:id` → EditListing
- `/dashboard/artisan` → ArtisanDashboard
- `/artisan/services` → ArtisanServices
- `/artisan/requests` → ArtisanRequests

#### Agent Only (`allowedRoles: ["agent"]`)
- `/agent` → Dashboard (agent-specific)

#### Merchant Only (`allowedRoles: ["merchant"]`)
- `/merchant` → CommercialDashboard
- `/advertising` → Advertising
- `/advertising/new` → NewAdRequest
- `/commercial-dashboard` → CommercialDashboard (alias)

#### Admin Only (AdminProtectedRoute)
- `/admin/*` → All admin routes (14+ pages)

### 2.4 Authentication Flow Routes
- **PKCE Flow:** Modern code exchange for security
- **Hash-based Flow:** OAuth fallback
- **Token-based Flow:** Legacy support

---

## 3. Authentication System

### 3.1 Architecture Overview

**Hybrid Authentication System:**
- **Primary:** Phone-based OTP via Vonage Verify
- **Secondary:** Email/Password via Supabase Auth
- **OAuth:** Google Sign-In via Supabase Auth
- **Session Management:** Supabase with custom persistence

### 3.2 Supabase Session Handling

**Location:** `/src/lib/supabase.ts`

**Key Features:**
- ✅ Defensive initialization (never throws)
- ✅ Storage detection (handles private browsing)
- ✅ Navigator.locks workaround (prevents iOS Safari crashes)
- ✅ PKCE flow (modern secure auth)
- ✅ Automatic session persistence (`topaffaireimmo-auth-token`)

**Initialization Logic:**
```typescript
// Checks for required environment variables
// Disables navigator.locks before creating client
// Tests localStorage availability
// Falls back to in-memory auth if storage unavailable
// Auto-initializes on module load
```

### 3.3 Auth Context/Provider

**Location:** `/src/contexts/AuthContext.tsx`

**State Management:**
- `user` - Current authenticated user (User | null)
- `session` - Auth session with tokens (Session | null)
- `authState` - 'loading' | 'authenticated' | 'unauthenticated'
- `profileReady` - User profile loaded from DB
- `loading` - Initial hydration in progress

**Key Methods:**
| Method | Purpose |
|--------|---------|
| `signUp(email, password)` | Email-based signup with verification |
| `signIn(email, password)` | Email-based login |
| `signOut()` | Logout & clear state |
| `refreshSession()` | Refresh tokens with retry logic |

**Profile Ready Logic:**
1. Ensures DB profile exists for authenticated users
2. Creates profile with default `user_role` if missing
3. Sets `profileReady` flag before components render
4. Handles permission errors gracefully

### 3.4 Phone OTP Flow

**Location:** `/src/pages/AuthPage.tsx`

**Step 1: Request OTP**
```
User enters phone → validatePhone() → POST /api/auth/otp/start
→ Vonage sends SMS → Returns requestId (stored in localStorage)
```

**Step 2: Verify OTP**
```
User enters 6-digit code → POST /api/auth/otp/check
→ Vonage verifies → Returns JWT token
→ Clear localStorage → Navigate to dashboard
```

**Features:**
- Phone normalization (+212, 06xx, 07xx formats)
- 30-second resend cooldown
- localStorage persistence
- Bilingual errors (FR/AR with RTL)

### 3.5 Session Refresh Mechanisms

**Auto-Refresh Strategy:**
- `detectSessionInUrl`: Enabled if storage available
- `autoRefreshToken`: Enabled if storage available
- Manual refresh with retry logic (2 attempts)

**Hydration Timeout:**
- Initial timeout: 2 seconds
- Retry automatically if auth pending
- Marks as hydrated once session check completes

### 3.6 Auth Guards

#### RequireAuth Guard
```typescript
// Ensures user is authenticated
- If loading: Show spinner (8-second timeout)
- If timeout: Show error with retry
- If not authenticated: Redirect to /login with return path
- If authenticated: Render children
```

#### RequireProfileReady Guard
```typescript
// Wait for DB profile to load
- If !profileReady: Show spinner (10-second timeout)
- If timeout: Show error with retry
- If ready: Render children
```

#### ProtectedRoute Component
```typescript
// Role-based access control
- Checks: authLoading, roleLoading, profileReady
- Validates allowedRoles if specified
- Redirects to appropriate dashboard based on role
```

### 3.7 Security Features

✅ **Session Persistence:** Secure localStorage with PKCE flow  
✅ **Network Error Handling:** Detects offline before token exchange  
✅ **Expired Token Detection:** Pattern matching for error keywords  
✅ **Loop Prevention:** Auth state change tracking with counter reset  
✅ **Sentry Integration:** User context tracking for errors  
✅ **Role-based Guards:** Multiple layers protecting routes  
✅ **Timeout Protection:** All async operations have limits  
✅ **Graceful Degradation:** Works without localStorage

---

## 4. Role-Based Access Control

### 4.1 All User Roles

| Role | Type | Description | Dashboard Path |
|------|------|-------------|----------------|
| **user** | Default | Property owners who haven't selected path | `/select-role` |
| **agent** | Real Estate | Brokers/courtiers (immobilier) | `/agent` |
| **merchant** | Commercial | Agencies and service providers | `/merchant` |
| **admin** | System | Platform administrators | `/admin` |

**Artisan Status** (subset of merchant):
- `artisan_pending` - Merchant with unverified artisan profile
- `artisan_verified` - Merchant with verified artisan profile

### 4.2 Role Storage

**Database:** `profiles` table
- **`user_role`** (TEXT) - Primary field: 'user', 'agent', 'merchant', 'admin'
- **`advertiser_type`** (optional) - 'proprietaire', 'courtier', 'agence'
- **Admin check:** Separate `admins` table (user ID must exist)

### 4.3 Permission Matrix

**Location:** `/src/core/permissions/capabilities.ts`

| Role | Capabilities |
|------|--------------|
| **user** | `can_create_listing`, `can_view_own_listings`, `can_create_service_request` |
| **agent** | Same as user (real estate agents) |
| **merchant** | `can_create_listing`, `can_view_own_listings`, `can_create_service_request` |
| **artisan_verified** | `can_access_artisan_dashboard`, `can_create_artisan_service`, `can_view_artisan_requests`, `can_respond_to_requests` |
| **admin** | All capabilities + user management |

### 4.4 Role Checking Logic

**Key Files:**
- **`useUserRole` hook** - Fetches `profiles.user_role` (single source of truth)
- **`useAdmin` hook** - Checks if user exists in `admins` table
- **`ProtectedRoute` component** - Component-level role enforcement
- **RLS policies** - Server-side enforcement

---

## 5. Database Schema

### 5.1 Core Tables Overview (40+ Tables)

#### Authentication & User Management
- `auth.users` - Supabase auth (external)
- `profiles` - User profiles with role
- `admins` - Admin users table

#### Real Estate Listings
- `properties` - Property listings
- `property_images` - Property photos (up to 10 per listing)
- `property_types` - Property categories
- `cities` - Moroccan cities (40+)
- `neighborhoods` - City neighborhoods

#### Analytics & Leads
- `property_views` - View tracking
- `property_contact_clicks` - Contact interactions
- `property_leads` - Lead submissions
- `analytics_events` - Custom event tracking

#### Commercial Advertising
- `banner_slots` - Ad placement slots
- `banner_requests` - Ad orders
- `payments` - Payment tracking

#### Home Services Module
- `service_categories` - Service types
- `service_subcategories` - Service details
- `artisan_profiles` - Service provider profiles
- `artisan_profile_neighborhoods` - Service coverage
- `artisan_service_zones` - City coverage
- `requests` - Service requests
- `reviews` - Artisan reviews

#### Monetization System
- `wallets` - User wallet balances
- `wallet_transactions` - Transaction audit log
- `contact_access_passes` - Time-limited contact access
- `platform_settings` - Config settings

#### CMS & Site Management
- `site_pages` - Static pages
- `site_categories` - Page categories
- `site_settings` - Global settings

#### Admin & Monitoring
- `admin_audit_logs` - Admin action logs
- `admin_notifications` - Admin notifications
- `admin_whitelist` - Allowed admin emails
- `advertising_inquiries` - Ad inquiries

#### Security & OTP
- `otp_attempts` - SMS/Email OTP tracking
- `push_subscriptions` - PWA subscriptions

#### System Monitoring
- `system_logs` - Application logs
- `performance_metrics` - Performance tracking

### 5.2 Entity Relationships

```
auth.users (Supabase)
    ├─→ profiles (1:1, user details)
    ├─→ admins (1:1, admin status)
    ├─→ properties (1:N, listings owned)
    ├─→ artisan_profiles (1:N, service profiles)
    ├─→ requests (1:N, service requests)
    ├─→ reviews (1:N, reviews written)
    ├─→ wallets (1:1, balance)
    └─→ wallet_transactions (1:N, history)

properties
    ├─→ property_images (1:N)
    ├─→ property_views (1:N)
    ├─→ property_contact_clicks (1:N)
    ├─→ property_leads (1:N)
    ├─→ cities (N:1)
    └─→ neighborhoods (N:1)

artisan_profiles
    ├─→ service_categories (N:1)
    ├─→ artisan_profile_neighborhoods (N:N)
    ├─→ artisan_service_zones (N:N)
    ├─→ requests (1:N, assigned)
    └─→ reviews (1:N, received)

banner_requests
    ├─→ banner_slots (N:1)
    ├─→ profiles (N:1, advertiser)
    └─→ payments (1:N)
```

### 5.3 Storage Buckets

| Bucket | Access | Size Limit | Allowed Types | Purpose |
|--------|--------|------------|---------------|---------|
| `property-images` | Public | 5 MB | JPEG, PNG, WebP | Property photos |
| `banner-images` | Public | 2 MB | JPEG, PNG, GIF, WebP | Ad banners |
| `payment-receipts` | Private | 5 MB | JPEG, PNG, PDF | Payment proofs |
| `agency-logos` | Public | 1 MB | JPEG, PNG, WebP, SVG | Agency branding |

### 5.4 Key Constraints

**Foreign Keys:**
- CASCADE on user deletion (profiles, properties, etc.)
- SET NULL on artisan deletion from requests
- Referential integrity enforced

**Unique Constraints:**
- `artisan_profiles`: UNIQUE(user_id, service_category_id)
- `reviews`: UNIQUE(client_id, artisan_profile_id, request_id)
- `site_pages.slug`: UNIQUE
- `property_types.code`: UNIQUE

### 5.5 Database Triggers & Functions

| Name | Table | Purpose |
|------|-------|---------|
| `handle_new_user()` | auth.users | Auto-create profile on signup |
| `update_updated_at()` | Multiple | Update timestamp on modify |
| `protect_property_status()` | properties | Only admins can change status |
| `update_request_view_status()` | requests | Auto-update status when viewed |
| `get_artisan_rating_stats()` | reviews | Comprehensive rating stats |
| `create_service_request()` | requests | Request with validation |

### 5.6 Performance Indexes

**Properties:**
```sql
idx_properties_owner, idx_properties_city, idx_properties_status,
idx_properties_type, idx_properties_transaction, idx_properties_price,
idx_properties_created, idx_properties_featured
```

**Analytics:**
```sql
idx_property_views_property_id, idx_property_views_created_at,
idx_contact_clicks_property_id, idx_leads_property_id
```

**Home Services:**
```sql
idx_artisan_profiles_active, idx_artisan_profiles_boosted,
idx_requests_artisan, idx_reviews_artisan, idx_reviews_flagged
```

---

## 6. RLS Policies

### 6.1 Tables with RLS Enabled (12+ tables)

✅ All sensitive tables protected

### 6.2 Policy Summary by Table

#### Properties Table
| Policy | Operations | Condition |
|--------|-----------|-----------|
| `properties_select_own` | SELECT | Owner or creator |
| `properties_select_admin` | SELECT | Is admin |
| `properties_insert_own` | INSERT | Owner = auth.uid() + status IN ('draft','pending') |
| `properties_update_own` | UPDATE | Owner + draft/rejected only |
| `properties_update_admin` | UPDATE | Admin (full access) |
| `properties_delete_own` | DELETE | Owner + draft/rejected |
| `properties_delete_admin` | DELETE | Admin |

**Note:** `protect_property_status` trigger enforces admin-only status changes

#### Reviews Table
| Policy | Condition |
|--------|-----------|
| Public view | `is_hidden = FALSE` |
| Artisan view own | Owns artisan profile |
| Client create | `client_id = auth.uid()` |
| Client update own | Within 30 days |
| Client delete own | Within 7 days |
| Artisan respond | Can only update response fields |
| Admin manage all | Full access |

#### Storage (property-images bucket)
| Policy | Operations | Condition |
|--------|-----------|-----------|
| Insert | INSERT | Folder matches auth.uid() |
| Read own | SELECT | Folder matches auth.uid() |
| Read admin | SELECT | Is admin |
| Read public | SELECT | Public access |
| Delete own | DELETE | Own folder |
| Delete admin | DELETE | Is admin |

#### Artisan Profiles
**Critical Security:** Users cannot modify `is_verified`, `is_active`, `is_boosted` (admin-only fields)

### 6.3 Security Patterns

✅ **Admin Function:** All tables use `public.is_admin()` STABLE function (performance)  
✅ **Status Workflow:** Properties status protected by trigger + RLS  
✅ **Monetization Fields:** Protected from user modification via RLS CHECK  
✅ **Time-based Deletion:** Reviews deletable within 7 days only  
✅ **Dual Ownership:** Properties support `created_by` and `owner_id`  

---

## 7. Monetization System

### 7.1 Revenue Streams

**1. Pay-Per-Contact System**
- **Price:** 5 MAD (default, configurable)
- **Purpose:** Reveal artisan phone numbers
- **Scope:** City + service category + optional neighborhoods
- **Duration:** 12 hours (configurable)
- **Implementation:** `RevealPhoneButton.tsx` + RPC `debit_wallet_for_contact()`

**2. Artisan Boost**
- **Price:** 50 MAD (one-time activation fee)
- **Purpose:** Higher ranking in search results
- **Type:** One-time payment (not recurring)
- **Visibility:** Boosted profiles appear first

**3. Banner Advertising**
- **7 days:** 800 MAD
- **15 days:** 1,400 MAD
- **30 days:** 2,500 MAD

### 7.2 Wallet System

**Database Tables:**
- `wallets` - Balance tracking (cannot go negative)
- `wallet_transactions` - Audit trail
- `contact_access_passes` - Time-limited tokens

**Secure Operations (RPC Functions):**
```sql
- ensure_wallet_exists(user_id)
- debit_wallet_for_contact(city_id, service_category_id)
- check_contact_access(user_id, city_id, service_category_id)
- admin_topup_wallet(user_id, amount, reason)
- get_my_wallet_balance()
```

**Security:**
- All debits use SECURITY DEFINER functions
- SQL constraint prevents negative balance
- Row-level security on wallets table
- Admin-only top-ups

### 7.3 Configuration

**Location:** `/admin/monetization`

**Master Settings:**
- **Enabled:** ON/OFF toggle (default: OFF)
- **Pay-per-contact:** Enable/disable + price
- **Pay-to-be-visible:** Enable/disable + price

**Current Limitations:**
- ⚠️ No automated payment gateway (Stripe/PayPal)
- ⚠️ Manual wallet top-ups only
- ⚠️ No self-service customer payment flow

### 7.4 Default State

**⚠️ Monetization is OFF by default** - All features are 100% free until admin enables them.

---

## 8. Ads Logic

### 8.1 Google AdSense Integration

**Component:** `AdSenseBanner.tsx`

**Supported Formats:**
- Auto (responsive)
- Horizontal
- Vertical
- Rectangle

**Features:**
- Fallback CTA when AdSense unavailable
- Production-only display
- Format-based slot selection

### 8.2 Promo Banner System

**Components:**
- `PromoBanner.tsx` - Display component
- `PromoSlot.tsx` - Slot wrapper
- `/admin/promo-banners` - Management panel

**Features:**
- Admin-managed promotional banners
- Position-based slots
- Image upload support
- Active/inactive status

### 8.3 Banner Request System

**Database:** `banner_requests`, `banner_slots`, `payments`

**Workflow:**
1. Merchant selects banner slot
2. Uploads banner image
3. Sets campaign duration
4. Submits payment proof
5. Admin approves/rejects
6. Banner goes live

**Tracking:**
- Impressions counted
- Click tracking
- Campaign analytics

---

## 9. Dashboard Structure

### 9.1 User Dashboard (`/dashboard`)

**Features:**
- Property listing management
- Status tracking (draft, pending, approved, rejected)
- Edit/delete actions
- Add new listings
- Property cards with images, prices, cities

### 9.2 Artisan Dashboard (`/dashboard/artisan`)

**Features:**
- **Profile Status:** Verification tracking
- **Wallet Display:** Balance + monetization features
- **Service Management:** Quick actions
- **Request Tracking:** Assigned requests
- **Boost Toggle:** Profile visibility upgrade
- **Stats Cards:** Active requests, boost points, wallet

**Sub-routes:**
- `/artisan/services` - Service management
- `/artisan/requests` - Request handling
- `/artisan/profile/edit` - Profile customization
- `/artisan/onboarding` - Verification process

### 9.3 Agent Dashboard (`/agent`)

**Features:**
- Reuses standard Dashboard component
- Property listing management
- Agent-specific routing
- Role-based access

### 9.4 Merchant Dashboard (`/merchant`)

**Features:**
- **Banner Advertising:** Create/manage campaigns
- **Payment Tracking:** Upload proofs, track status
- **Campaign Management:** View active/pending ads
- **Advertising Options:** Multiple slots, pricing models

### 9.5 Smart Dashboard Redirect

**Logic:**
- `user` → `/select-role`
- `admin` → `/admin`
- `merchant` → `/merchant`
- `agent` → `/agent`

---

## 10. Admin Panel

### 10.1 Admin Dashboard Overview

**Path:** `/admin`

**Key Metrics (7 stats):**
- Pending listings (Clock icon, yellow)
- Approved listings (Check icon, green)
- Published listings (Globe icon, blue)
- Rejected listings (File icon, red)
- Total listings
- Total users (purple)
- Total agencies (indigo)

**Quick Actions:**
- Review pending listings
- View all listings
- Manage users

### 10.2 Admin Navigation

**14 Main Sections:**

1. **Dashboard** - `/admin` - Overview & stats
2. **Listings** - `/admin/listings` - Property review & moderation
3. **Users** - `/admin/users` - User account management
4. **Agencies** - `/admin/agencies` - Agency management
5. **Locations** - `/admin/locations` - Cities & neighborhoods
6. **Services** - `/admin/services/categories` - Service categorization
7. **Artisans** - `/admin/artisans` - Service provider management
8. **Content** - `/admin/content/pages` - CMS pages & categories
9. **Promo Banners** - `/admin/promo-banners` - Marketing banners
10. **Dummy Properties** - `/admin/dummy-properties` - Test data
11. **Monetization** - `/admin/monetization` - Revenue settings
12. **Settings** - `/admin/settings` - Global configuration
13. **Diagnostics** - `/admin/diagnostics` - System health
14. **Monitoring** - `/admin/monitoring` - Activity tracking

### 10.3 Admin Features

#### Listing Moderation
- Approve/reject properties
- Feature/unfeature listings
- Bulk actions
- Status management
- Detailed view with images

#### User Management
- View all users
- Role assignment
- Account activation/deactivation
- Admin elevation

#### Artisan Management
- Verify artisan profiles
- Approve/reject applications
- Boost management
- Coverage area validation

#### Service Categories
- Create/edit categories
- Manage subcategories
- Icon assignment
- Active/inactive status

#### Monetization Control
- Master toggle
- Feature-specific toggles
- Price configuration
- Wallet top-ups

#### System Monitoring
- Real-time logs
- Performance metrics
- System health status
- Error tracking

---

## 11. API Architecture

### 11.1 Supabase Client API Pattern

**Location:** `/src/lib/supabase.ts`

**Core Operations:**
- `.from(tableName)` - Table queries
- `.auth.*` - Authentication
- `.storage.*` - File operations
- `.rpc()` - PostgreSQL functions

### 11.2 Vercel API Routes (`/api`)

#### Authentication Routes
- **`/api/health`** - Health check
- **`/api/auth/google/start`** - OAuth initiation (PKCE)
- **`/api/auth/google/callback`** - OAuth callback
- **Rate limiting:** 30 req/min per IP

#### OTP Routes (Vonage)
- **`/api/auth/otp/start`** - Send SMS OTP
- **`/api/auth/otp/check`** - Verify OTP code
- **Rate limiting:** 3 OTP/hour per phone
- **Lock mechanism:** 15 min after 5 failed attempts

#### Error Reporting
- **`/api/client-error`** - Client error logging
- **Rate limiting:** 30 req/min per IP
- **Production-only**

### 11.3 Supabase Edge Functions

**Push Notifications** (`send-push-notification`):
- Web Push Protocol (VAPID)
- Admin-only authorization
- Selective/broadcast delivery
- Rate limiting: 10/min per IP+UA

**Phone Reveal** (`reveal-phone`):
- Contact info access
- Rate limiting with SHA-256 hashing
- Monetization tracking
- Returns: phone, WhatsApp, email, business name

**Facebook Webhook** (`send-facebook-webhook`):
- Triggered on listing approval
- Posts to Make.com webhook
- Idempotency check
- Fallback if URL not configured

### 11.4 RPC Functions

| Function | Purpose |
|----------|---------|
| `log_system_event()` | System event logging |
| `track_analytics_event()` | User behavior analytics |
| `track_performance_metric()` | Performance monitoring |
| `check_reveal_rate_limit()` | Phone reveal rate limiting |
| `get_listing_phone()` | Fetch listing contact |
| `get_artisan_phone()` | Fetch artisan contact |
| `debit_wallet_for_contact()` | Payment processing |
| `check_contact_access()` | Access validation |
| `admin_topup_wallet()` | Wallet top-up |

### 11.5 External API Integrations

**Vonage (SMS/OTP):**
- `verify.start()` - Send OTP
- `verify.check()` - Verify code
- `sms.send()` - Send SMS

**Google OAuth:**
- Authorization server
- User info endpoint
- Token exchange (PKCE)

**Make.com:**
- Webhook receiver
- Facebook marketplace automation

**Sentry:**
- Error tracking
- Performance monitoring (10% sample)
- Breadcrumb tracking

### 11.6 Data Flow Architecture

```
Frontend (React)
    ↓
Supabase Client JS
    ├→ .from() - CRUD operations
    ├→ .auth.* - Session management
    ├→ .rpc() - PostgreSQL functions
    └→ .storage.* - File operations
    ↓
Supabase Backend
    ├→ PostgreSQL Database
    ├→ Row-Level Security (RLS)
    ├→ Edge Functions (Deno)
    │   └→ External APIs
    └→ Storage Buckets

API Routes (Vercel)
    ├→ OAuth flows
    ├→ SMS OTP
    └→ Rate limiting
```

---

## 12. Performance Optimization

### 12.1 Current Optimizations

**Code Splitting:**
- ✅ Route-based lazy loading
- ✅ React.lazy() for components
- ✅ Vite automatic chunking

**Image Optimization:**
- ✅ Sharp for OG image generation
- ✅ WebP support
- ✅ Size limits enforced

**Bundle Optimization:**
- ✅ Vite advanced chunking
- ✅ Tree shaking enabled
- ✅ Minification in production

**SEO:**
- ✅ Meta tags
- ✅ Structured data
- ✅ Sitemap generation
- ✅ OG image generation

**Caching:**
- ✅ Browser caching via Vercel
- ✅ `no-cache` for index.html
- ✅ Content hashes in filenames

### 12.2 Performance Monitoring

**Location:** `/src/lib/performance.ts`

**Tracked Metrics:**
- Database queries (threshold: 500ms)
- API calls (threshold: 1000ms)
- Page loads (threshold: 3000ms)
- Image loads (threshold: 2000ms)

**Core Web Vitals:**
- **LCP** - Largest Contentful Paint
- **FID** - First Input Delay
- **CLS** - Cumulative Layout Shift

**Functions:**
```typescript
trackPerformance(metric)
measureSync/Async(type, name, fn)
trackQuery(queryName, queryFn)
trackApiCall(apiName, apiFn)
trackPageLoad(pageName)
monitorWebVitals()
```

### 12.3 Database Performance

**Indexes:**
- Properties: 8 indexes (owner, city, status, type, etc.)
- Analytics: 4 indexes (property_id, created_at, etc.)
- Artisans: 4 indexes (active, boosted, etc.)

**Optimized Queries:**
- `public.is_admin()` - STABLE function (cached)
- Pagination on all list views
- Selective column fetching

---

## 13. Error Handling System

### 13.1 Global Error Boundaries

**Component:** `/src/components/ErrorBoundary.tsx`

**Features:**
- Catches synchronous rendering errors
- User-friendly error UI with refresh
- Dev mode shows error details
- Production hides sensitive info

### 13.2 Global Error Handlers

**Location:** `/src/lib/globalErrorHandlers.ts`

**Catches:**
- Unhandled promise rejections
- Async errors
- Event handler errors

**Features:**
- `unhandledrejection` listener
- Auth error detection with storage cleanup
- Redirect loop prevention (max 3/min)
- Client error reporting (5s timeout)
- Stale token detection

### 13.3 Centralized Error Mapping

**Location:** `/src/lib/authErrors.ts`

**50+ Error Patterns:**
- Email conflicts, validation
- Password requirements
- Token/session expiration
- Rate limiting (429)
- Network errors
- Database/permission errors

**Translation:** `translateAuthError(error, isRTL)` returns bilingual messages

### 13.4 Retry Mechanisms

**Pattern 1: Exponential Backoff**
- Max 3 retries
- 500ms base delay, doubles each retry
- Network error detection

**Pattern 2: Session Polling**
- 5 polling attempts
- 200ms delay between attempts
- Expired token detection

**Pattern 3: Error Recovery**
- One-click page refresh
- Stale token clearing on startup

---

## 14. Loading States

### 14.1 UI Components

**Spinner:** `/src/components/ui/spinner.tsx`
- Animated Loader2Icon
- "Loading" aria-label

**Skeleton:** `/src/components/ui/skeleton.tsx`
- Pulsing placeholders
- Customizable dimensions

**PropertyCardSkeleton:** `/src/components/home/PropertyCardSkeleton.tsx`
- Domain-specific skeleton

### 14.2 Usage Patterns

**Boolean Loading Flags:**
- `loading`, `isLoading`, `authLoading`
- Conditional spinner rendering

**Retry with Backoff:**
- ArtisanDashboard: Max 3 retries, exponential delay
- AuthCallback: Session polling with 5 attempts

**Timeouts:**
- Auth hydration: 2 seconds
- RequireAuth: 8 seconds
- RequireProfileReady: 10 seconds

---

## 15. Empty States

### 15.1 EmptyState Component

**Location:** `/src/components/EmptyState.tsx`

**Pre-configured Types:**
- `no-properties` - Home icon, filter action
- `no-services` - Wrench icon, category exploration
- `no-search-results` - Search icon, reset search
- `no-favorites` - Heart icon, explore properties
- `no-listings` - Document icon, create announcement
- `generic` - Fallback state

**Features:**
- ✅ Bilingual (FR/AR) with RTL
- ✅ Customizable title, message, actions
- ✅ Animated entrance (fade-in, slide-in)
- ✅ Icon with colored background
- ✅ Decorative pulsing dots
- ✅ Primary + secondary CTAs

---

## 16. Analytics Tracking

### 16.1 Google Analytics 4 (GA4)

**Status:** ✅ Fully Implemented

**Measurement ID:** `G-TMY9XWWH6G`

**Implementation:**
- Inline script in `index.html` (immediate init)
- Programmatic fallback in `main.tsx`
- Retry logic (waits 3 seconds)
- Production-only tracking

**Documentation:**
- GA4_QUICK_START.md
- GA4_EXECUTIVE_SUMMARY.md
- GA4_FIX_SUMMARY.md

### 16.2 Custom Analytics Events

**Location:** `/src/lib/analytics.ts`

**Event Types:**
- `listing_view` - Property views
- `profile_view` - Profile visits
- `phone_reveal` - Contact reveals
- `search` - Search queries

**Features:**
- ✅ Anonymous session IDs (sessionStorage)
- ✅ Privacy-first (no PII)
- ✅ Sanitized metadata
- ✅ Database RPC (`track_analytics_event()`)
- ✅ Silent failure (non-blocking)

### 16.3 Lead Tracking

**Location:** `/src/lib/lead-tracking.ts`

**Three Systems:**

**A. Property Views** (`property_views` table)
```typescript
trackPropertyView(propertyId)
```

**B. Contact Clicks** (`property_contact_clicks`)
```typescript
trackContactClick(propertyId, contactType)
// Types: phone, whatsapp, email
```

**C. Lead Submissions** (`property_leads`)
```typescript
submitPropertyLead(leadData)
updateLeadStatus(leadId, status, notes)
```

**Analytics Queries:**
```typescript
getPropertyAnalytics(propertyId)
// Returns: views, clicks, leads, leadsCount

getUniqueVisitors(propertyId)
// Deduplicates by session_id (7 days)
```

### 16.4 Privacy & Security

✅ **Anonymous session IDs** (no user tracking)  
✅ **Sanitized metadata** (no PII)  
✅ **Blocked sensitive fields** (email, phone, password, etc.)  
✅ **Session storage** (cleared on tab close)  
✅ **Silent failures** (doesn't crash app)  

---

## 17. Notifications System

### 17.1 Push Notifications

**Database:** `push_subscriptions` table
- Fields: user_id, endpoint, p256dh, auth, is_active

**Edge Function:** `send-push-notification`
- VAPID key validation
- Admin-only access
- Target specific users or broadcast
- Auto-deactivates invalid subscriptions

**VAPID Keys:**
- Generation: `npm run generate:vapid-keys`
- Public key: Frontend `.env`
- Private key: Supabase secrets

**Status:** ⚠️ Schema ready, UI integration pending

### 17.2 Admin Notifications

**Database:** `admin_notifications` table
- Fields: user_id, title, body, notification_type, link, read_at

**Service:** `/src/lib/notifications.ts`
```typescript
createAdminNotification(input)
fetchUnreadNotifications()
fetchAllNotifications(limit)
markNotificationAsRead(id)
markAllNotificationsAsRead()
countUnreadNotifications()
```

**Real-time Hook:** `useNotifications`
- Subscribes to Postgres changes
- Auto-refreshes on INSERT/UPDATE/DELETE
- Returns: notifications, unreadCount, loading

**UI:** Bell icon with badge in admin dashboard

### 17.3 User Notifications

**Current Status:** Infrastructure ready, service worker registration pending

**Language Strings:** Bilingual (FR/AR) push notification UI text ready

---

## 18. Email System

### 18.1 Supabase Email Templates

**Location:** `/supabase/templates/`

| Template | Purpose | Validity |
|----------|---------|----------|
| `confirmation.html` | Email verification | 24 hours |
| `recovery.html` | Password reset | 1 hour |
| `email_change.html` | Email change | 24 hours |
| `magic_link.html` | Passwordless login | 1 hour |
| `invite.html` | User invitation | 7 days |

**Features:**
- ✅ Bilingual (French/Arabic)
- ✅ Branded header (TopAffaireImmo, #C86A4A)
- ✅ Supabase template variables
- ✅ Responsive HTML design
- ✅ Security notes and footer

### 18.2 Email Configuration

**Managed via:** Supabase Dashboard → Settings → Auth → SMTP

**Environment Variables:**
```
VITE_SITE_URL - Auth redirect base URL
VITE_PRODUCTION_DOMAIN - Password reset domain
```

**Redirect URLs (must be configured in Supabase):**
- Prod: `https://www.topaffaireimmo.com/**`
- Dev: `http://localhost:5173/**`
- Includes: `/reset-password`, `/auth/callback`

### 18.3 Contact Form

**Location:** `/src/pages/Contact.tsx`

**Fields:**
- First/Last Name
- Email, Phone
- Subject, Message

**Bilingual:** FR/AR with success confirmation

---

## 19. Logging System

### 19.1 Logger Implementation

**Location:** `/src/lib/logger.ts`

**Features:**
- ✅ Structured logging with correlation IDs
- ✅ Multiple levels (debug, info, warn, error)
- ✅ Sensitive data sanitization
- ✅ In-memory storage (last 100 logs)
- ✅ Database persistence (warn/error only)

**Methods:**
```typescript
logger.debug(category, message, data?, correlationId?)
logger.info(category, message, data?, correlationId?)
logger.warn(category, message, data?, correlationId?)
logger.error(category, message, error?, correlationId?)
generateCorrelationId()
createCorrelatedLogger(category)
getLogs() / exportLogs() / clearLogs()
```

**Database:** Persists to `system_logs` via RPC `log_system_event()`

### 19.2 Admin Audit Logs

**Location:** `/src/lib/auditLog.ts`

**Actions:** approve, reject, delete, feature, update, create, bulk_action, etc.

**Entities:** property, user, page, category, settings, artisan_profile, etc.

**Functions:**
```typescript
logAdminAction(entry)
fetchAuditLogs(limit?, entityType?)
fetchEntityAuditLogs(entityType, entityId)
```

**Database:** `admin_audit_logs` table

### 19.3 System Event Logging

**Admin Panel:** `/pages/admin/AdminMonitoring.tsx`

**Monitored:**
- System logs (real-time)
- Performance metrics (>500ms)
- System health status
- Recent errors (last 5 min)
- Slow queries count

**Filters:**
- Time range: 1h, 6h, 24h, 7d
- Log level: debug, info, warn, error
- Metric type: query, api, page_load, image_load
- Search by message/category

**Auto-refresh:** Every 30 seconds

### 19.4 Error Tracking (Sentry)

**Location:** `/src/lib/sentry.ts`

**Configuration:**
- Production-only with valid DSN
- 100% error capture
- 10% transaction sampling
- Browser tracing integration

**Functions:**
```typescript
initializeSentry()
setUserContext(user)
clearUserContext()
captureException(error, context)
captureMessage(message, level)
trackSupabaseError(queryName, error)
addBreadcrumb(message, category, data)
```

**Sanitization:**
- Removes: tokens, passwords, API keys, JWTs
- Strips sensitive query parameters
- Redacts headers

**Ignored Errors:**
- Browser extensions
- Network errors
- ResizeObserver errors

### 19.5 Client Error Reporting

**API:** `/api/client-error`

**Features:**
- Production-only (if `ENABLE_ERROR_REPORTING` set)
- Rate limiting: 30 req/min per IP
- Error payload: message, stack, url, userAgent, timestamp
- Safety: Never throws, always returns 200

### 19.6 Debug Mode

**Location:** `/src/components/DebugMode.tsx`

**Access:**
- URL: `?debug=true`
- localStorage: `debug-mode=true`
- Requires authentication

**Displays:**
- Environment info
- Auth state (user, session)
- Real-time logs (refreshes every 5s)
- Actions: Download/clear/refresh logs

---

## 20. Supabase Functions

### 20.1 Edge Functions (3)

**1. send-push-notification**
- **Purpose:** Send web push notifications
- **Auth:** Admin-only (checks `admins` table)
- **Features:** VAPID validation, selective/broadcast delivery
- **Rate limit:** 10/min per IP+UA

**2. reveal-phone**
- **Purpose:** Secure contact info access
- **Auth:** Public (with rate limiting)
- **Features:** SHA-256 hashing, monetization tracking
- **Returns:** phone, WhatsApp, email, business name
- **Rate limit:** IP+User-Agent based

**3. send-facebook-webhook**
- **Purpose:** Facebook marketplace automation
- **Trigger:** Listing approval
- **Endpoint:** Make.com webhook
- **Features:** Idempotency check, fallback handling

### 20.2 Database RPC Functions (10+)

**System Logging:**
- `log_system_event()` - Application logs
- `track_analytics_event()` - User behavior
- `track_performance_metric()` - Performance data

**Rate Limiting:**
- `check_reveal_rate_limit()` - Phone reveal throttling

**Contact Access:**
- `get_listing_phone()` - Property contact
- `get_artisan_phone()` - Artisan contact

**Wallet Operations:**
- `ensure_wallet_exists(user_id)`
- `debit_wallet_for_contact(city_id, service_category_id)`
- `check_contact_access(user_id, city_id, service_category_id)`
- `admin_topup_wallet(user_id, amount, reason)`
- `get_my_wallet_balance()`

**Service Requests:**
- `create_service_request()` - Validation & creation

**Artisan Stats:**
- `get_artisan_rating_stats()` - Comprehensive ratings

**Admin Check:**
- `is_admin()` - STABLE function (cached)

### 20.3 Security Patterns

✅ **SECURITY DEFINER:** Wallet functions run with elevated privileges  
✅ **Rate Limiting:** All public endpoints protected  
✅ **Admin Verification:** Checks `admins` table for sensitive operations  
✅ **Privacy Hashing:** SHA-256 for rate limit tracking  
✅ **Silent Failures:** Non-blocking error handling  

---

## 21. Subscription/Premium System

### 21.1 Current Implementation

**Status:** ⚠️ Partially Implemented

**Monetization Features:**
1. **Pay-Per-Contact** - 5 MAD to reveal phone (12-hour access)
2. **Artisan Boost** - 50 MAD one-time for higher ranking
3. **Banner Ads** - Commercial advertising (800-2,500 MAD)

**NOT Implemented:**
- ❌ Recurring subscriptions
- ❌ Monthly premium plans
- ❌ Feature tiers (basic/pro/premium)
- ❌ Automated payment gateway (Stripe/PayPal)

### 21.2 Wallet System

**Database:**
- `wallets` - Balance in MAD
- `wallet_transactions` - Audit trail
- `contact_access_passes` - Time-limited access

**Operations:**
- ✅ Admin top-ups (manual)
- ✅ Pay-per-contact debits
- ✅ Boost activation debits
- ❌ Self-service deposits
- ❌ Automated billing

### 21.3 Future Plans

**Planned Features:**
- Stripe integration for self-service payments
- Recurring subscription tiers
- Premium listing features (featured, highlighted, etc.)
- Analytics dashboard for monetization
- Automated billing cycles

### 21.4 Configuration

**Admin Panel:** `/admin/monetization`

**Master Toggle:** ON/OFF (default: OFF)

**Per-Feature Toggles:**
- Pay-per-contact (enable/disable + price)
- Pay-to-be-visible (enable/disable + price)

**Default State:** 🆓 All features FREE until admin enables monetization

---

## 🎯 Summary & Recommendations

### ✅ Production-Ready Features

1. **Authentication:** Robust hybrid system (OTP + Email + OAuth)
2. **Authorization:** Complete RLS implementation with role-based access
3. **Database:** Well-structured schema with proper relationships
4. **Security:** Multiple layers (RLS, RPC, sanitization, rate limiting)
5. **Monitoring:** Comprehensive logging, analytics, error tracking
6. **Performance:** Optimized with indexes, caching, code splitting
7. **UX:** Proper error handling, loading states, empty states

### ⚠️ Areas Needing Attention

1. **Monetization:** Manual wallet top-ups only (need payment gateway)
2. **Push Notifications:** Schema ready but service worker integration pending
3. **Subscriptions:** One-time payments only (no recurring billing)
4. **Email:** Templates ready but SMTP must be configured in Supabase

### 🚀 Next Steps

1. **Integrate Payment Gateway** (Stripe/PayPal)
2. **Complete Push Notification Setup** (service worker)
3. **Add Recurring Subscriptions** (if needed)
4. **Configure SMTP** in Supabase for emails
5. **Performance Testing** under load
6. **Security Audit** by third party

---

**Report Generated:** February 14, 2026  
**Status:** ✅ Production-Ready with noted limitations  
**Overall Health:** 🟢 Excellent
