# 🔍 SUPABASE DIAGNOSTIC REPORT
## TopAffaireImmo - Complete Configuration Analysis

**Generated:** 2026-01-30  
**Purpose:** Identify what MUST exist in Supabase for the application to work correctly  
**Scope:** Repository analysis only - no Supabase access

---

## 📋 TABLE OF CONTENTS
1. [Database Schema Requirements](#1-database-schema-requirements)
2. [Storage Buckets Configuration](#2-storage-buckets-configuration)
3. [RLS Policies Required](#3-rls-policies-required)
4. [Edge Functions Setup](#4-edge-functions-setup)
5. [Environment Variables](#5-environment-variables)
6. [Missing/Risk Analysis](#6-missingrisk-analysis)
7. [Human Actions Required](#7-human-actions-required)

---

## 1. DATABASE SCHEMA REQUIREMENTS

### 1.1 Required Tables

The application expects these **9 tables** to exist in Supabase:

| # | Table Name | Purpose | Source Migration |
|---|------------|---------|------------------|
| 1 | `profiles` | User profile information | Multiple migrations |
| 2 | `properties` | Real estate listings | Multiple migrations |
| 3 | `property_images` | Image-property tracking | Migration 052 |
| 4 | `cities` | City reference data | Multiple migrations |
| 5 | `neighborhoods` | Neighborhood reference data | Multiple migrations |
| 6 | `banner_slots` | Advertising slot definitions | Migration 002 |
| 7 | `banner_requests` | Advertising campaign requests | Migration 002 |
| 8 | `advertising_inquiries` | Contact form submissions | Migration 033 |
| 9 | `admins` | Admin user identification | Migration 050 |

---

### 1.2 Critical Columns by Table

#### **Table: `profiles`**
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  user_role TEXT NOT NULL DEFAULT 'real_estate_advertiser',
  advertiser_type TEXT, -- 'proprietaire' | 'courtier' | 'agence'
  agency_name TEXT,
  agency_logo TEXT,
  agency_description_ar TEXT,
  agency_description_fr TEXT,
  agency_license TEXT,
  agency_cities TEXT[],
  company_name TEXT,
  company_website TEXT,
  preferred_language TEXT DEFAULT 'fr',
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE, -- DEPRECATED: Use admins table instead
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Foreign Keys:**
- `id` → `auth.users(id)` ON DELETE CASCADE

**Indexes Required:**
- Primary key on `id`
- Unique index on `email`

**IMPORTANT NOTES:**
- `is_admin` column is DEPRECATED - use `admins` table instead
- `advertiser_type` is for French compatibility (proprietaire, courtier, agence)

---

#### **Table: `properties`**
```sql
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  
  -- Property Details
  transaction_type TEXT NOT NULL, -- 'sale' | 'rent'
  property_type TEXT NOT NULL, -- 'apartment' | 'house' | 'villa' | 'land' | 'commercial'
  property_type_id INTEGER,
  
  -- Location
  city_id INTEGER NOT NULL REFERENCES cities(id),
  neighborhood_id INTEGER REFERENCES neighborhoods(id),
  custom_neighborhood TEXT,
  address TEXT,
  
  -- Physical Details
  price NUMERIC,
  area NUMERIC, -- in m²
  bedrooms INTEGER,
  bathrooms INTEGER,
  floor_number INTEGER,
  total_floors INTEGER,
  year_built INTEGER,
  
  -- Contact Information (CRITICAL - Recently Added)
  contact_phone TEXT, -- Moroccan format: +212 6XX XX XX XX
  contact_email TEXT,
  contact_whatsapp TEXT,
  
  -- Descriptions
  title_fr TEXT,
  title_ar TEXT,
  description_fr TEXT,
  description_ar TEXT,
  
  -- Media
  images TEXT[], -- Array of image URLs
  
  -- Features
  features JSONB,
  amenities JSONB,
  
  -- Status & Moderation
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'inactive')),
  advertiser_type TEXT CHECK (advertiser_type IN ('proprietaire', 'courtier', 'agence')),
  moderated_at TIMESTAMPTZ,
  moderated_by UUID,
  rejection_reason TEXT,
  
  -- Facebook Auto-Posting (Migration 036)
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  published_at TIMESTAMPTZ,
  facebook_posted BOOLEAN NOT NULL DEFAULT FALSE,
  facebook_posted_at TIMESTAMPTZ,
  facebook_post_id TEXT,
  facebook_post_error TEXT,
  share_token TEXT,
  
  -- Meta
  featured BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Foreign Keys:**
- `owner_id` → `auth.users(id)` (NOT profiles - changed in migration 050)
- `city_id` → `cities(id)`
- `neighborhood_id` → `neighborhoods(id)`
- `approved_by` → `profiles(id)`

**Indexes Required:**
- `idx_properties_owner_id` on `owner_id`
- `idx_properties_status` on `status`
- `idx_properties_city_id` on `city_id`
- `idx_properties_facebook_posted` on `facebook_posted`
- `idx_properties_approved_at` on `approved_at`

**CRITICAL RECENT ADDITIONS:**
- `contact_phone`, `contact_email`, `contact_whatsapp` - MUST exist
- Facebook posting fields (`facebook_posted`, `facebook_post_id`, etc.)

---

#### **Table: `property_images`**
```sql
CREATE TABLE public.property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL, -- Storage path: userId/filename.jpg
  image_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Track which images belong to which properties for RLS enforcement  
**Added:** Migration 052  
**Foreign Keys:**
- `property_id` → `properties(id)` ON DELETE CASCADE

**Indexes Required:**
- `idx_property_images_property_id` on `property_id`
- `idx_property_images_image_path` on `image_path`
- `idx_property_images_property_path` on `(property_id, image_path)`

---

#### **Table: `cities`**
```sql
CREATE TABLE public.cities (
  id SERIAL PRIMARY KEY,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  region_fr TEXT,
  region_ar TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Required Data:** Morocco cities (Casablanca, Rabat, Marrakech, Fès, Tanger, etc.)

---

#### **Table: `neighborhoods`**
```sql
CREATE TABLE public.neighborhoods (
  id SERIAL PRIMARY KEY,
  city_id INTEGER NOT NULL REFERENCES cities(id),
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Foreign Keys:**
- `city_id` → `cities(id)`
- `created_by` → `auth.users(id)`

---

#### **Table: `banner_slots`**
```sql
CREATE TABLE public.banner_slots (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  page TEXT NOT NULL, -- 'home' | 'search' | 'listing-detail'
  position TEXT NOT NULL, -- 'header' | 'sidebar' | 'footer'
  size TEXT NOT NULL, -- '728x90' | '300x250' | '160x600'
  price_per_day NUMERIC NOT NULL,
  price_per_week NUMERIC,
  price_per_month NUMERIC,
  allowed_formats TEXT[], -- ['image/jpeg', 'image/png', 'image/gif']
  max_file_size INTEGER, -- in bytes
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### **Table: `banner_requests`**
```sql
CREATE TABLE public.banner_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES profiles(id),
  slot_id INTEGER NOT NULL REFERENCES banner_slots(id),
  
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  
  banner_image_url TEXT NOT NULL,
  target_url TEXT,
  alt_text_fr TEXT,
  alt_text_ar TEXT,
  
  duration_days INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  
  payment_method TEXT,
  payment_reference TEXT,
  payment_proof_url TEXT,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Foreign Keys:**
- `advertiser_id` → `profiles(id)`
- `slot_id` → `banner_slots(id)`
- `approved_by` → `profiles(id)`

---

#### **Table: `advertising_inquiries`**
```sql
CREATE TABLE public.advertising_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Contact form submissions for advertising inquiries  
**Added:** Migration 033

---

#### **Table: `admins`**
```sql
CREATE TABLE public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Identify admin users (replaces `profiles.is_admin`)  
**Added:** Migration 050  
**Foreign Keys:**
- `user_id` → `auth.users(id)` ON DELETE CASCADE

**CRITICAL:** First admin MUST be created manually using SQL or service role key

---

### 1.3 Database Triggers & Functions

#### **Trigger: `handle_new_user()`**
**Purpose:** Auto-create profile when user signs up  
**Trigger:** `on_auth_user_created` ON `auth.users`  
**Source:** Multiple migrations (latest: 047, 048)

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, user_role)
  VALUES (NEW.id, NEW.email, 'real_estate_advertiser')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

#### **Trigger: `protect_property_status()`**
**Purpose:** Prevent non-admin users from changing property status  
**Trigger:** `protect_property_status_trigger` ON `properties`  
**Source:** Migration 050

```sql
CREATE OR REPLACE FUNCTION public.protect_property_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) THEN
      NEW.status := OLD.status;
      RAISE NOTICE 'Status change prevented: Only admins can change property status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER protect_property_status_trigger
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.protect_property_status();
```

---

#### **Helper Function: `is_admin(user_id UUID)`**
**Purpose:** Check if a user is an admin  
**Source:** Migration 050

```sql
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins WHERE admins.user_id = is_admin.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

---

#### **Helper Function: `can_access_property_image(image_path TEXT)`**
**Purpose:** Check if user can access a property image  
**Source:** Migration 052

```sql
CREATE OR REPLACE FUNCTION public.can_access_property_image(image_path TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  owner_id_from_path UUID;
  requesting_user_id UUID;
  is_user_admin BOOLEAN;
  has_approved_property BOOLEAN;
BEGIN
  requesting_user_id := auth.uid();
  owner_id_from_path := (regexp_split_to_array(image_path, '/'))[1]::UUID;
  
  is_user_admin := EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = requesting_user_id
  );
  
  IF is_user_admin THEN RETURN TRUE; END IF;
  IF requesting_user_id = owner_id_from_path THEN RETURN TRUE; END IF;
  
  has_approved_property := EXISTS (
    SELECT 1 FROM public.property_images pi
    JOIN public.properties p ON pi.property_id = p.id
    WHERE pi.image_path = image_path AND p.status = 'approved'
  );
  
  IF NOT has_approved_property THEN
    has_approved_property := EXISTS (
      SELECT 1 FROM public.properties
      WHERE owner_id = owner_id_from_path AND status = 'approved'
      LIMIT 1
    );
  END IF;
  
  RETURN has_approved_property;
EXCEPTION
  WHEN OTHERS THEN RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

---

## 2. STORAGE BUCKETS CONFIGURATION

### 2.1 Required Buckets

The application expects **4 storage buckets**:

| Bucket Name | Public | Max Size | Allowed MIME Types | Purpose |
|-------------|--------|----------|-------------------|---------|
| `property-images` | ✅ Yes | 5MB | image/jpeg, image/png, image/webp | Property listing photos |
| `banner-images` | ✅ Yes | 2MB | image/jpeg, image/png, image/gif, image/webp | Banner advertisements |
| `payment-receipts` | ❌ No | 5MB | image/jpeg, image/png, application/pdf | Payment proof uploads |
| `agency-logos` | ✅ Yes | 1MB | image/jpeg, image/png, image/webp, image/svg+xml | Agency branding |

**Source:** Migrations 011, 021, 052

---

### 2.2 Bucket Policies (RLS for Storage)

#### **Bucket: `property-images`**

**INSERT Policy:**
```sql
CREATE POLICY "property_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```
**Meaning:** Users can upload images to their own folder (`userId/filename.jpg`)

---

**SELECT/READ Policies:**
```sql
-- 1. Users read their own images
CREATE POLICY "property_images_read_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2. Admins read all images
CREATE POLICY "property_images_read_admin" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'property-images' AND
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- 3. Public read (TRANSITIONAL - Migration 052)
CREATE POLICY "property_images_read_approved_owners_only" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'property-images' AND (
      auth.uid() IN (SELECT user_id FROM public.admins) OR
      (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text) OR
      TRUE -- ⚠️ PUBLIC ACCESS for backward compatibility
    )
  );
```

**⚠️ SECURITY ISSUE:** Currently ALL images are publicly accessible (the `TRUE` clause). Migration 052 added infrastructure for status-based access but kept public access for backward compatibility.

---

**DELETE Policies:**
```sql
-- 1. Users delete their own images
CREATE POLICY "property_images_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2. Admins delete all images
CREATE POLICY "property_images_delete_admin" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-images' AND
    auth.uid() IN (SELECT user_id FROM public.admins)
  );
```

---

#### **Bucket: `banner-images`**

Similar RLS policies:
- Users upload to their folder
- Public read access (banners are publicly visible)
- Users delete their own, admins delete all

---

#### **Bucket: `payment-receipts`**

**PRIVATE BUCKET:**
- Users upload to their folder
- Users read only their own receipts
- Admins read all receipts
- No public access

---

#### **Bucket: `agency-logos`**

Similar to `property-images`:
- Users upload to their folder
- Public read access
- Users delete their own, admins delete all

---

## 3. RLS POLICIES REQUIRED

### 3.1 Table: `profiles`

**SELECT:**
- Users read their own profile
- Admins read all profiles
- Public reads basic info (for property owner display)

**INSERT:**
- Created automatically via trigger (no manual inserts by users)

**UPDATE:**
- Users update their own profile
- Admins update any profile

---

### 3.2 Table: `properties`

**INSERT:**
```sql
CREATE POLICY "properties_insert_authenticated" ON public.properties
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND owner_id = auth.uid()
  );
```

**SELECT:**
```sql
-- 1. Users read their own listings
CREATE POLICY "properties_select_own" ON public.properties
  FOR SELECT USING (owner_id = auth.uid());

-- 2. Admins read ALL listings
CREATE POLICY "properties_select_admin" ON public.properties
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- 3. Public reads approved listings
CREATE POLICY "properties_select_public" ON public.properties
  FOR SELECT USING (status = 'approved');
```

**UPDATE:**
```sql
-- 1. Users update their own listings
CREATE POLICY "properties_update_own" ON public.properties
  FOR UPDATE USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- 2. Admins update ALL listings
CREATE POLICY "properties_update_admin" ON public.properties
  FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));
```

**DELETE:**
```sql
-- 1. Users delete their own listings
CREATE POLICY "properties_delete_own" ON public.properties
  FOR DELETE USING (owner_id = auth.uid());

-- 2. Admins delete ALL listings
CREATE POLICY "properties_delete_admin" ON public.properties
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );
```

---

### 3.3 Table: `property_images`

**INSERT:**
```sql
CREATE POLICY "property_images_insert_own" ON public.property_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = property_id AND owner_id = auth.uid()
    )
  );
```

**SELECT:**
```sql
-- 1. Users view their own property images
CREATE POLICY "property_images_select_own" ON public.property_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = property_id AND owner_id = auth.uid()
    )
  );

-- 2. Admins view all images
CREATE POLICY "property_images_select_admin" ON public.property_images
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- 3. Public views images of approved properties
CREATE POLICY "property_images_select_public" ON public.property_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = property_id AND status = 'approved'
    )
  );
```

**DELETE:**
```sql
-- 1. Users delete their own property images
CREATE POLICY "property_images_delete_own" ON public.property_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = property_id AND owner_id = auth.uid()
    )
  );

-- 2. Admins delete any images
CREATE POLICY "property_images_delete_admin" ON public.property_images
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );
```

---

### 3.4 Table: `admins`

**SELECT:**
```sql
CREATE POLICY "admins_select_admin_only" ON public.admins
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );
```

**INSERT:**
```sql
CREATE POLICY "admins_insert_admin_only" ON public.admins
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );
```
**⚠️ CHICKEN-EGG PROBLEM:** First admin must be created via service role or before RLS is enabled.

**DELETE:**
```sql
CREATE POLICY "admins_delete_admin_only" ON public.admins
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );
```

---

### 3.5 Table: `banner_requests`

Similar to properties:
- Advertisers create/update/delete their own requests
- Admins manage all requests
- No public read access

---

### 3.6 Table: `cities` & `neighborhoods`

**Public read access** (reference data)  
**Admin-only write access**

---

### 3.7 Table: `banner_slots`

**Public read access** (for pricing display)  
**Admin-only write access**

---

### 3.8 Table: `advertising_inquiries`

**INSERT:** Anyone (contact form)  
**SELECT/UPDATE/DELETE:** Admin only

---

## 4. EDGE FUNCTIONS SETUP

### 4.1 Function: `send-facebook-webhook`

**Purpose:** Send approved listings to Make.com for Facebook auto-posting  
**Location:** `supabase/functions/send-facebook-webhook/index.ts`  
**Trigger:** Called by admin UI after approving a listing

---

#### **Required Environment Variables (Supabase Secrets)**

Set via Supabase CLI:
```bash
supabase secrets set MAKE_WEBHOOK_URL=https://hook.eu1.make.com/YOUR_WEBHOOK_ID
```

**Auto-provided by Supabase:**
- `SUPABASE_URL` - Your project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin access

**Optional:**
- `VITE_PRODUCTION_DOMAIN` - Domain for public listing URLs (default: https://topaffaireimmo.vercel.app)

---

#### **Deployment Command**

```bash
supabase functions deploy send-facebook-webhook
```

---

#### **Request Format**

**Method:** POST  
**Endpoint:** `https://YOUR_PROJECT.supabase.co/functions/v1/send-facebook-webhook`  
**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Body:**
```json
{
  "listing_id": "uuid-of-approved-listing"
}
```

---

#### **What It Does**

1. Validates listing exists and hasn't been posted before (`facebook_posted` flag)
2. Fetches listing data with city/neighborhood names
3. Sends webhook to Make with this payload:
```json
{
  "listing_id": "uuid",
  "title": "Property title (French)",
  "price": "1500000",
  "city": "Casablanca",
  "neighborhood": "Maarif",
  "category": "sale - apartment",
  "condition": "apartment",
  "public_url": "https://domain/listing/uuid",
  "image_url": "https://storage.supabase.co/.../image.jpg",
  "approved_at": "2024-01-25T10:30:00Z",
  "approved_by": "admin-uuid"
}
```
4. Updates listing: `facebook_posted = true`, `facebook_posted_at = NOW()`
5. Stores Facebook post ID if Make returns it

---

#### **Error Handling**

- If `MAKE_WEBHOOK_URL` not configured: Sets `facebook_post_error`, returns `skipped: true`
- If webhook fails: Sets `facebook_post_error`, does NOT set `facebook_posted`
- If already posted: Returns `already_posted: true` (idempotency)

---

#### **Database Dependencies**

Function queries these columns from `properties`:
- `id`, `title_fr`, `title_ar`, `price`, `property_type`, `transaction_type`
- `images`, `approved_at`, `approved_by`, `facebook_posted`
- `city:cities(name_fr, name_ar)`
- `neighborhood:neighborhoods(name_fr, name_ar)`

Function updates these columns:
- `facebook_posted`, `facebook_posted_at`, `facebook_post_id`, `facebook_post_error`

**CRITICAL:** These columns MUST exist or the Edge Function will fail.

---

## 5. ENVIRONMENT VARIABLES

### 5.1 Application Environment Variables (.env)

**Required in Vercel/Production:**

```env
# Supabase Connection (CRITICAL)
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Production Domain (CRITICAL for auth redirects)
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com
VITE_SITE_URL=https://www.topaffaireimmo.com
```

**Where to get these:**
- Login to Supabase Dashboard
- Go to Settings → API
- Copy "Project URL" and "anon public" key

---

### 5.2 Supabase Dashboard Configuration

#### **Auth URL Configuration**

**Location:** Supabase Dashboard → Authentication → URL Configuration

**Site URL:**
```
https://www.topaffaireimmo.com
```

**Redirect URLs (Allowed):**
```
https://www.topaffaireimmo.com/**
https://www.topaffaireimmo.com/
https://www.topaffaireimmo.com/auth/callback
http://localhost:5173/auth/callback
```

**⚠️ WHY THIS MATTERS:**
- Email confirmation links use the Site URL
- Wrong URL = broken confirmation links
- Users won't be able to verify their email

---

#### **SMTP Configuration**

**Location:** Supabase Dashboard → Settings → Auth → SMTP Settings

**Required Settings:**
```
Host: smtp.hostinger.com
Port: 465
Encryption: SSL
Sender Email: noreply@topaffaireimmo.com
Sender Name: TopAffaireImmo
Username: noreply@topaffaireimmo.com
Password: [Get from Hostinger]
```

**⚠️ WHY THIS MATTERS:**
- Without SMTP: Emails won't send (users can't sign up/reset password)
- Wrong settings: Emails go to spam or fail silently

---

#### **Email Templates**

**Location:** Supabase Dashboard → Authentication → Email Templates

**Templates to Upload:**
- `supabase/templates/confirmation.html` - Email confirmation
- `supabase/templates/recovery.html` - Password reset
- `supabase/templates/magic_link.html` - Magic link login
- `supabase/templates/invite.html` - User invites
- `supabase/templates/email_change.html` - Email change confirmation

**Variables Available in Templates:**
- `{{ .ConfirmationURL }}` - Confirmation link
- `{{ .Token }}` - Token for manual entry
- `{{ .Email }}` - User's email
- `{{ .SiteURL }}` - Site URL from settings

---

### 5.3 Supabase Secrets (Edge Functions)

**Set via Supabase CLI:**

```bash
# Make.com webhook for Facebook auto-posting
supabase secrets set MAKE_WEBHOOK_URL=https://hook.eu1.make.com/YOUR_WEBHOOK_ID
```

**⚠️ NOT in .env:** Edge Function secrets are server-side only, NOT client environment variables.

---

## 6. MISSING/RISK ANALYSIS

### 6.1 Common Breaking Points

#### ❌ **LIKELY ISSUE #1: No Data in Tables**

**Problem:**
- Migrations create table structure
- They DON'T populate reference data
- App expects cities/neighborhoods to exist

**Symptoms:**
- Property creation fails (no cities in dropdown)
- Search page is empty
- "Select a city" dropdown is blank

**Fix:**
```sql
-- Check if cities exist
SELECT COUNT(*) FROM public.cities;

-- If 0, you need to populate cities data
-- See section 7.2 for SQL script
```

---

#### ❌ **LIKELY ISSUE #2: No Admin User**

**Problem:**
- `admins` table is empty
- Admin panel is inaccessible
- Property approval doesn't work

**Symptoms:**
- `/admin` route redirects to home
- Can't approve/reject listings
- Admin UI shows "Access Denied"

**Fix:**
```sql
-- Check if admins exist
SELECT COUNT(*) FROM public.admins;

-- If 0, create first admin manually
-- See section 7.1 for exact SQL
```

---

#### ❌ **LIKELY ISSUE #3: Missing Contact Columns**

**Problem:**
- Migration 036 added `contact_phone`, `contact_email`, `contact_whatsapp`
- If migrations weren't run in order, these might be missing
- Frontend expects these columns

**Symptoms:**
- Property creation form fails silently
- API errors: "column does not exist"
- Images upload but property not created

**Check:**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'properties' 
  AND column_name IN ('contact_phone', 'contact_email', 'contact_whatsapp');
```

**Expected:** 3 rows  
**If 0 rows:** Run `supabase/migrations/036_facebook_posting_fields.sql`

---

#### ❌ **LIKELY ISSUE #4: Missing Facebook Posting Columns**

**Problem:**
- Edge Function expects `facebook_posted`, `facebook_post_id`, etc.
- If missing, webhook will fail

**Check:**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'properties' 
  AND column_name LIKE 'facebook_%';
```

**Expected:** 5 columns (facebook_posted, facebook_posted_at, facebook_post_id, facebook_post_error, approved_at)  
**If missing:** Run `supabase/migrations/036_facebook_posting_fields.sql`

---

#### ❌ **LIKELY ISSUE #5: RLS Blocking Everything**

**Problem:**
- RLS policies are too strict
- Users can't read/write data
- Admin can't access admin panel

**Symptoms:**
- Properties page is empty (even for logged-in users)
- "No properties found" despite database having data
- API returns empty arrays

**Check:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('properties', 'profiles', 'admins')
ORDER BY tablename, policyname;
```

**Fix:**
- Ensure policies from migration 050 are applied
- Verify admin user exists in `admins` table
- Check `auth.uid()` is not null (user is logged in)

---

#### ❌ **LIKELY ISSUE #6: Storage Bucket Doesn't Exist**

**Problem:**
- Buckets not created manually
- Image upload fails

**Symptoms:**
- "Bucket not found" error
- Images don't upload
- Upload button doesn't work

**Check:**
```sql
-- Via Supabase Dashboard → Storage
-- OR via SQL:
SELECT name, public FROM storage.buckets;
```

**Expected:** 4 buckets (property-images, banner-images, payment-receipts, agency-logos)  
**Fix:** See section 7.3

---

#### ❌ **LIKELY ISSUE #7: Wrong SMTP Configuration**

**Problem:**
- SMTP not configured or wrong credentials
- Emails don't send

**Symptoms:**
- Users sign up but never get confirmation email
- Password reset doesn't work
- Check spam folder - no emails there either

**Check:**
- Supabase Dashboard → Settings → Auth → SMTP Settings
- Test by triggering a password reset

**Fix:**
- Configure SMTP (see section 5.2)
- Use correct Hostinger credentials
- Enable "Custom SMTP" toggle

---

#### ❌ **LIKELY ISSUE #8: Wrong Auth Redirect URL**

**Problem:**
- Site URL doesn't match production domain
- Email links redirect to wrong domain

**Symptoms:**
- Email confirmation links go to localhost or vercel.app
- "Invalid redirect URL" error after clicking email link
- Users can't complete signup

**Check:**
- Supabase Dashboard → Authentication → URL Configuration
- Site URL should be `https://www.topaffaireimmo.com`

**Fix:**
- Update Site URL
- Add redirect URLs (see section 5.2)
- Redeploy app with correct `VITE_SITE_URL`

---

#### ❌ **LIKELY ISSUE #9: Edge Function Not Deployed**

**Problem:**
- Function code exists in repo
- Not deployed to Supabase

**Symptoms:**
- Approving listing doesn't trigger Facebook post
- "Function not found" error
- Webhook never fires

**Check:**
```bash
supabase functions list
```

**Expected:** `send-facebook-webhook`  
**Fix:**
```bash
supabase functions deploy send-facebook-webhook
supabase secrets set MAKE_WEBHOOK_URL=https://hook.eu1.make.com/YOUR_ID
```

---

#### ❌ **LIKELY ISSUE #10: Missing property_images Table**

**Problem:**
- Migration 052 creates this table
- May not be applied yet

**Symptoms:**
- Image access control doesn't work
- `can_access_property_image()` function fails
- Images still publicly accessible (security issue)

**Check:**
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'property_images'
);
```

**Expected:** `true`  
**If false:** Run `supabase/migrations/052_fix_storage_security.sql`

---

### 6.2 Why Fixes Don't Appear on Live Site

#### **Reason #1: Migration Not Applied**

**Problem:**
- SQL run locally or in wrong project
- Production database doesn't have the changes

**Solution:**
- Run migrations in PRODUCTION Supabase project
- Use Supabase Dashboard → SQL Editor
- Or use `supabase db push` (if using Supabase CLI)

---

#### **Reason #2: Environment Variables Not Set in Vercel**

**Problem:**
- Updated .env locally
- Forgot to update Vercel environment variables

**Solution:**
- Go to Vercel Dashboard → Project → Settings → Environment Variables
- Update `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, etc.
- **Redeploy** the app (environment variable changes don't auto-deploy)

---

#### **Reason #3: Cached Build**

**Problem:**
- Vercel serves cached version
- Changes not rebuilt

**Solution:**
- Trigger manual redeploy in Vercel
- Or push a commit to trigger auto-deploy

---

#### **Reason #4: RLS Still Blocking**

**Problem:**
- Updated table structure
- RLS policies weren't updated

**Solution:**
- Check policies in production database
- Ensure migration 050 policies are applied
- Test with admin user (admin should see everything)

---

#### **Reason #5: Browser Cache**

**Problem:**
- Old JavaScript/API responses cached in browser

**Solution:**
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Test in incognito/private window

---

## 7. HUMAN ACTIONS REQUIRED

### 7.1 Create First Admin User

**⚠️ CRITICAL:** Must be done manually in Supabase Dashboard

**Step 1:** Find your user UUID

```sql
-- Replace with your email
SELECT id, email FROM auth.users 
WHERE email = 'your-email@example.com';
```

**Step 2:** Insert into admins table

```sql
-- Replace with UUID from Step 1
INSERT INTO public.admins (user_id) 
VALUES ('paste-uuid-here')
ON CONFLICT (user_id) DO NOTHING;
```

**Step 3:** Verify

```sql
SELECT u.email, u.created_at as user_created, a.created_at as admin_created
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id;
```

**Expected Output:** Your email with both timestamps

**✅ Can be fixed with SQL**

---

### 7.2 Populate Cities & Neighborhoods

**⚠️ REQUIRED:** App won't work without city data

**Cities SQL:**
```sql
INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active) VALUES
('Casablanca', 'الدار البيضاء', 'Grand Casablanca', 'الدار البيضاء الكبرى', 1, true),
('Rabat', 'الرباط', 'Rabat-Salé-Kénitra', 'الرباط-سلا-القنيطرة', 2, true),
('Marrakech', 'مراكش', 'Marrakech-Safi', 'مراكش-آسفي', 3, true),
('Fès', 'فاس', 'Fès-Meknès', 'فاس-مكناس', 4, true),
('Tanger', 'طنجة', 'Tanger-Tétouan-Al Hoceïma', 'طنجة-تطوان-الحسيمة', 5, true),
('Agadir', 'أكادير', 'Souss-Massa', 'سوس-ماسة', 6, true),
('Meknès', 'مكناس', 'Fès-Meknès', 'فاس-مكناس', 7, true),
('Oujda', 'وجدة', 'Oriental', 'الشرق', 8, true),
('Kenitra', 'القنيطرة', 'Rabat-Salé-Kénitra', 'الرباط-سلا-القنيطرة', 9, true),
('Tétouan', 'تطوان', 'Tanger-Tétouan-Al Hoceïma', 'طنجة-تطوان-الحسيمة', 10, true),
('Salé', 'سلا', 'Rabat-Salé-Kénitra', 'الرباط-سلا-القنيطرة', 11, true),
('Temara', 'تمارة', 'Rabat-Salé-Kénitra', 'الرباط-سلا-القنيطرة', 12, true),
('El Jadida', 'الجديدة', 'Casablanca-Settat', 'الدار البيضاء-سطات', 13, true),
('Mohammedia', 'المحمدية', 'Casablanca-Settat', 'الدار البيضاء-سطات', 14, true),
('Béni Mellal', 'بني ملال', 'Béni Mellal-Khénifra', 'بني ملال-خنيفرة', 15, true)
ON CONFLICT (name_fr, name_ar) DO NOTHING;
```

**Neighborhoods SQL (Example for Casablanca):**
```sql
-- Get city_id first
SELECT id FROM public.cities WHERE name_fr = 'Casablanca';

-- Insert neighborhoods (replace 1 with actual city_id)
INSERT INTO public.neighborhoods (city_id, name_fr, name_ar) VALUES
(1, 'Maarif', 'المعاريف'),
(1, 'Anfa', 'أنفا'),
(1, 'Californie', 'كاليفورنيا'),
(1, 'Bourgogne', 'بورغوني'),
(1, 'Ain Diab', 'عين الدياب'),
(1, 'Hay Hassani', 'الحي الحسني'),
(1, 'Sidi Bernoussi', 'سيدي برنوصي'),
(1, 'Derb Sultan', 'درب السلطان'),
(1, 'Gauthier', 'غوتييه'),
(1, 'Racine', 'راسين')
ON CONFLICT DO NOTHING;
```

**✅ Can be fixed with SQL**

**📌 Note:** Repeat for other major cities (Rabat, Marrakech, etc.)

---

### 7.3 Create Storage Buckets

**⚠️ MUST be done in Supabase Dashboard**

**Location:** Supabase Dashboard → Storage

**Bucket 1: property-images**
- Name: `property-images`
- Public: ✅ Yes
- File size limit: 5242880 bytes (5MB)
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

**Bucket 2: banner-images**
- Name: `banner-images`
- Public: ✅ Yes
- File size limit: 2097152 bytes (2MB)
- Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`

**Bucket 3: payment-receipts**
- Name: `payment-receipts`
- Public: ❌ No
- File size limit: 5242880 bytes (5MB)
- Allowed MIME types: `image/jpeg`, `image/png`, `application/pdf`

**Bucket 4: agency-logos**
- Name: `agency-logos`
- Public: ✅ Yes
- File size limit: 1048576 bytes (1MB)
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`

**❌ This requires Supabase Dashboard configuration**

**After creating buckets, apply RLS policies from migration 050/052**

---

### 7.4 Configure Auth Settings

**⚠️ MUST be done in Supabase Dashboard**

**Location:** Supabase Dashboard → Authentication → URL Configuration

**Site URL:**
```
https://www.topaffaireimmo.com
```

**Redirect URLs:**
```
https://www.topaffaireimmo.com/**
https://www.topaffaireimmo.com/
https://www.topaffaireimmo.com/auth/callback
http://localhost:5173/auth/callback
```

**❌ This requires Supabase Dashboard configuration**

---

### 7.5 Configure SMTP (Email)

**⚠️ MUST be done in Supabase Dashboard**

**Location:** Supabase Dashboard → Settings → Auth → SMTP Settings

1. Enable "Custom SMTP"
2. Fill in:
   - Host: `smtp.hostinger.com`
   - Port: `465`
   - Encryption: `SSL`
   - Sender Email: `noreply@topaffaireimmo.com`
   - Sender Name: `TopAffaireImmo`
   - Username: `noreply@topaffaireimmo.com`
   - Password: `[Get from Hostinger control panel]`
3. Click "Save"

**Test:** Trigger a password reset to verify emails send

**❌ This requires Supabase Dashboard configuration**

---

### 7.6 Upload Email Templates

**⚠️ MUST be done in Supabase Dashboard**

**Location:** Supabase Dashboard → Authentication → Email Templates

**Templates to upload:**
1. **Confirmation** - `supabase/templates/confirmation.html`
2. **Recovery** - `supabase/templates/recovery.html`
3. **Magic Link** - `supabase/templates/magic_link.html`
4. **Invite** - `supabase/templates/invite.html`
5. **Email Change** - `supabase/templates/email_change.html`

**For each template:**
1. Click the template name
2. Paste the HTML content from the file
3. Update subject line if needed
4. Click "Save"

**❌ This requires Supabase Dashboard configuration**

---

### 7.7 Deploy Edge Function

**⚠️ MUST be done via Supabase CLI**

**Prerequisites:**
- Supabase CLI installed
- Logged in to Supabase CLI

**Commands:**
```bash
# 1. Deploy function
supabase functions deploy send-facebook-webhook

# 2. Set webhook URL secret
supabase secrets set MAKE_WEBHOOK_URL=https://hook.eu1.make.com/YOUR_WEBHOOK_ID

# 3. Verify deployment
supabase functions list

# 4. View logs (optional)
supabase functions logs send-facebook-webhook
```

**Get MAKE_WEBHOOK_URL:**
- Login to Make.com
- Create/open Facebook auto-post scenario
- Copy webhook URL from webhook trigger module

**❌ This requires Supabase CLI and Make.com setup**

---

### 7.8 Set Vercel Environment Variables

**⚠️ MUST be done in Vercel Dashboard**

**Location:** Vercel Dashboard → Project → Settings → Environment Variables

**Required Variables:**
```
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com
VITE_SITE_URL=https://www.topaffaireimmo.com
```

**After adding:**
1. Click "Save"
2. Trigger a redeploy (Deployments → ... → Redeploy)

**❌ This requires Vercel Dashboard access**

---

### 7.9 Apply Migrations (Complete)

**⚠️ MUST be done in Supabase Dashboard or CLI**

**Option A: Supabase Dashboard (Recommended)**

1. Go to SQL Editor
2. For each migration file (in order):
   - Open file from `supabase/migrations/`
   - Copy entire SQL content
   - Paste in SQL Editor
   - Click "Run"
   - Check for errors

**Critical Migrations (Must Run):**
- `050_create_admins_table_and_rls.sql` - Admin system
- `052_fix_storage_security.sql` - Image tracking
- `036_facebook_posting_fields.sql` - Facebook auto-post

**Option B: Supabase CLI**

```bash
supabase db push
```

**Verify All Tables Exist:**
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected:** 9 tables (admins, advertising_inquiries, banner_requests, banner_slots, cities, neighborhoods, profiles, properties, property_images)

**✅ Can be fixed with SQL**

---

### 7.10 Populate Banner Slots (Optional)

**⚠️ REQUIRED if using banner advertising feature**

**Example SQL:**
```sql
INSERT INTO public.banner_slots (code, name_fr, name_ar, page, position, size, price_per_day, price_per_week, price_per_month, is_active) VALUES
('home-header-728x90', 'Bannière en-tête accueil', 'لافتة رأس الصفحة الرئيسية', 'home', 'header', '728x90', 15, 90, 300, true),
('search-sidebar-300x250', 'Bannière latérale recherche', 'لافتة جانبية البحث', 'search', 'sidebar', '300x250', 10, 60, 200, true),
('listing-sidebar-160x600', 'Bannière latérale annonce', 'لافتة جانبية الإعلان', 'listing-detail', 'sidebar', '160x600', 12, 70, 250, true)
ON CONFLICT (code) DO NOTHING;
```

**✅ Can be fixed with SQL**

---

## 8. QUICK DIAGNOSTIC CHECKLIST

Use this checklist to verify your Supabase setup:

### Database
- [ ] All 9 tables exist
- [ ] `properties` has contact columns (contact_phone, contact_email, contact_whatsapp)
- [ ] `properties` has Facebook columns (facebook_posted, facebook_post_id, etc.)
- [ ] `property_images` table exists
- [ ] `admins` table exists
- [ ] Cities table has data (at least 10 cities)
- [ ] Neighborhoods table has data
- [ ] All RLS policies applied (check pg_policies)
- [ ] All triggers exist (handle_new_user, protect_property_status)
- [ ] All functions exist (is_admin, can_access_property_image)

### Storage
- [ ] `property-images` bucket exists (public, 5MB limit)
- [ ] `banner-images` bucket exists (public, 2MB limit)
- [ ] `payment-receipts` bucket exists (private, 5MB limit)
- [ ] `agency-logos` bucket exists (public, 1MB limit)
- [ ] Storage policies applied

### Auth
- [ ] Site URL = `https://www.topaffaireimmo.com`
- [ ] Redirect URLs include production domains
- [ ] SMTP configured (test by sending password reset)
- [ ] Email templates uploaded

### Admin
- [ ] At least one admin user exists in `admins` table
- [ ] Admin can access `/admin` route
- [ ] Admin can approve/reject properties

### Edge Functions
- [ ] `send-facebook-webhook` deployed
- [ ] `MAKE_WEBHOOK_URL` secret set
- [ ] Function logs show no errors

### Environment Variables
- [ ] `VITE_SUPABASE_URL` set in Vercel
- [ ] `VITE_SUPABASE_ANON_KEY` set in Vercel
- [ ] `VITE_PRODUCTION_DOMAIN` set in Vercel
- [ ] `VITE_SITE_URL` set in Vercel

---

## 9. COMMON ERROR MESSAGES & FIXES

### Error: "Bucket not found"
**Cause:** Storage bucket doesn't exist  
**Fix:** Create bucket in Supabase Dashboard → Storage (see section 7.3)

---

### Error: "column 'contact_phone' does not exist"
**Cause:** Migration 036 not applied  
**Fix:** Run migration 036 SQL in Supabase Dashboard → SQL Editor

---

### Error: "permission denied for table properties"
**Cause:** RLS blocking access  
**Fix:** 
1. Check user is logged in (auth.uid() not null)
2. Verify RLS policies applied (see section 3.2)
3. For admin: Verify user in `admins` table

---

### Error: "Access Denied" on /admin route
**Cause:** User not in `admins` table  
**Fix:** Add user to admins table (see section 7.1)

---

### Error: "Email not sent" or "SMTP error"
**Cause:** SMTP not configured or wrong credentials  
**Fix:** Configure SMTP in Supabase Dashboard (see section 7.5)

---

### Error: "Invalid redirect URL" after email link click
**Cause:** Site URL doesn't match redirect URL  
**Fix:** Update Auth URLs in Supabase Dashboard (see section 7.4)

---

### Error: "Function not found: send-facebook-webhook"
**Cause:** Edge Function not deployed  
**Fix:** Deploy function via Supabase CLI (see section 7.7)

---

### Error: Properties page is empty but database has data
**Cause:** RLS policies too strict  
**Fix:** 
1. Verify policies applied (run migration 050)
2. Check user owns properties (owner_id = auth.uid())
3. For admin: Verify user in admins table
4. Test with SQL: `SELECT * FROM properties WHERE owner_id = auth.uid();`

---

## 10. SUMMARY

### What MUST Exist in Supabase

**Database:**
- 9 tables with correct schema
- RLS policies on all tables
- Triggers: handle_new_user, protect_property_status
- Functions: is_admin, can_access_property_image
- Data: Cities, neighborhoods, at least one admin user

**Storage:**
- 4 buckets with correct settings
- RLS policies on storage.objects

**Auth:**
- Site URL configured
- Redirect URLs configured
- SMTP configured
- Email templates uploaded

**Edge Functions:**
- send-facebook-webhook deployed
- MAKE_WEBHOOK_URL secret set

**Environment:**
- Vercel environment variables set
- Supabase credentials correct

### Common Mistakes

1. **Not creating first admin user** → Admin panel doesn't work
2. **Not populating cities** → Can't create properties
3. **Not creating storage buckets** → Image upload fails
4. **Wrong SMTP config** → Users can't sign up
5. **Wrong auth URLs** → Email links broken
6. **Not applying migrations** → Missing columns/tables
7. **Not deploying Edge Function** → Facebook auto-post doesn't work
8. **RLS policies missing** → Can't read/write data

### Verification Steps

After setup, test these:
1. ✅ Sign up new user → Should receive confirmation email
2. ✅ Login → Should redirect to dashboard
3. ✅ Create property → Should work with city dropdown
4. ✅ Upload image → Should upload successfully
5. ✅ Admin user → Should access /admin panel
6. ✅ Approve property → Should trigger Facebook webhook (if configured)

---

## APPENDIX A: SQL Verification Queries

```sql
-- Check all tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check properties columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties' 
ORDER BY ordinal_position;

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check triggers
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgisinternal = false;

-- Check functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Check admin users
SELECT u.email, a.created_at 
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id;

-- Check cities count
SELECT COUNT(*) FROM public.cities;

-- Check storage buckets
SELECT name, public FROM storage.buckets;
```

---

## APPENDIX B: Complete Migration Order

Run migrations in this exact order:

1. `001_initial_schema.sql`
2. `002_banner_advertising.sql`
3. `003_profile_trigger.sql`
4. ...
48. `048_remove_profile_trigger_logic.sql`
49. `049_remove_profile_dependency_from_rls.sql`
50. ✅ **`050_create_admins_table_and_rls.sql`** (CRITICAL)
51. `051_create_admin_user_helper.sql`
52. ✅ **`052_fix_storage_security.sql`** (CRITICAL)

**Most Important:**
- Migration 050: Creates admins table, updates RLS
- Migration 052: Creates property_images table
- Migration 036: Adds Facebook posting fields

---

**END OF REPORT**
