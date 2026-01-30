# 🔍 COMPLETE SUPABASE AUDIT REPORT
# TopAffaireImmo Project

**Date:** January 30, 2026  
**Version:** Based on Migration 052  
**Auditor:** Automated Supabase Configuration Analysis

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [What is Correctly Configured](#what-is-correctly-configured)
3. [What is Missing or Incomplete](#what-is-missing-or-incomplete)
4. [Manual Actions Required in Supabase Dashboard](#manual-actions-required)
5. [SQL Commands to Fix Database Issues](#sql-commands-to-fix)
6. [Storage Configuration Checklist](#storage-configuration)
7. [What Must Be Provided Manually](#must-be-provided-manually)
8. [Verification Steps](#verification-steps)

---

## 🎯 EXECUTIVE SUMMARY

### Project Overview
TopAffaireImmo is a multilingual (French/English/Arabic) real estate listing platform for Morocco, featuring:
- Property listings with admin approval workflow
- Banner advertising system
- Facebook auto-posting integration via Make.com
- Role-based access control (Users, Admins)

### Overall Status
- ✅ **Database Schema:** Mostly complete
- ⚠️ **RLS Policies:** Partially configured, some inconsistencies
- ⚠️ **Storage:** Buckets created but policies have security issues
- ✅ **Auth:** Email/password configured
- ⚠️ **Edge Functions:** Configured but requires environment variables
- ❌ **Critical Issues:** Storage security, admin setup, missing columns

---

## ✅ WHAT IS CORRECTLY CONFIGURED

### 1. Database Tables (Complete)

#### ✅ Core Tables Created
| Table | Purpose | Status |
|-------|---------|--------|
| `profiles` | User profiles linked to auth.users | ✅ Complete |
| `properties` | Real estate listings | ✅ Complete |
| `cities` | 8 Moroccan cities with multilingual names | ✅ Complete |
| `neighborhoods` | 25+ neighborhoods, supports custom | ✅ Complete |
| `admins` | Admin user identification | ✅ Complete |
| `banner_slots` | 7 advertising positions | ✅ Complete |
| `banner_requests` | Banner campaign requests | ✅ Complete |
| `advertising_inquiries` | Contact form submissions | ✅ Complete |
| `property_images` | Image-property relationship tracking | ✅ Complete |

#### ✅ Properties Table - Correct Columns
```
id (UUID, PK)
owner_id (UUID, FK → profiles.id)
transaction_type (sale/rent)
property_type (apartment/house/villa/commercial/land)
city_id (INT, FK → cities.id)
neighborhood_id (INT, FK → neighborhoods.id)
custom_neighborhood (TEXT)
address (TEXT)
price (DECIMAL 15,2)
area (DECIMAL 10,2)
bedrooms (INTEGER)
bathrooms (INTEGER)
title_en, title_fr, title_ar (TEXT)
description_en, description_fr, description_ar (TEXT)
images (TEXT[])
status (pending/approved/rejected/inactive)
featured (BOOLEAN)
phone (TEXT)
announcer_type (proprietaire/courtier/agence)
approved_at, approved_by, published_at (TIMESTAMPTZ)
facebook_posted, facebook_posted_at, facebook_post_id, facebook_post_error (Facebook integration)
share_token (TEXT)
created_at, updated_at (TIMESTAMPTZ)
```

#### ✅ Profiles Table - Correct Columns
```
id (UUID, PK → auth.users.id)
email (TEXT)
full_name (TEXT)
phone (TEXT)
user_type (advertiser/agency)
agency_name, agency_logo (TEXT)
agency_description_fr, agency_description_ar (TEXT)
agency_cities (TEXT[])
is_admin (BOOLEAN) - Legacy, use admins table instead
created_at, updated_at (TIMESTAMPTZ)
```

### 2. Row Level Security (RLS)

#### ✅ Properties Table - Correct Policies
```sql
✅ properties_insert_authenticated - Users can create listings (owner_id = auth.uid())
✅ properties_select_own - Users read their own listings
✅ properties_select_admin - Admins read ALL listings
✅ properties_select_public - Public reads approved listings
✅ properties_update_own - Users update own listings
✅ properties_update_admin - Admins update all listings
✅ properties_delete_own - Users delete own listings
✅ properties_delete_admin - Admins delete all listings
```

#### ✅ Admins Table - Correct Policies
```sql
✅ admins_select_admin_only - Only admins can view admin list
✅ admins_insert_admin_only - Only admins can add new admins
✅ admins_delete_admin_only - Only admins can remove admins
```

#### ✅ Advertising Inquiries - Correct Policies
```sql
✅ Anyone can submit advertising inquiries (public INSERT)
✅ Admins can view advertising inquiries
✅ Admins can update advertising inquiries
```

### 3. Triggers & Functions

#### ✅ Security Functions
```sql
✅ protect_property_status() - Prevents non-admins from changing status
✅ is_admin(UUID) - Helper to check admin status
✅ can_access_property_image(TEXT) - Image access control helper
```

### 4. Storage Buckets

#### ✅ Buckets Created
| Bucket | Public | Size Limit | MIME Types | Status |
|--------|--------|-----------|------------|--------|
| property-images | ❌ Private* | 5 MB | JPEG, PNG, WebP | ⚠️ See issues |
| banner-images | ✅ Public | 1 MB** | JPEG, PNG, GIF, WebP | ⚠️ See issues |
| payment-receipts | ❌ Private | 5 MB | JPEG, PNG, PDF | ✅ Correct |
| agency-logos | ✅ Public | 512 KB*** | JPEG, PNG, WebP | ✅ Correct |

*Migration 021 sets as public (true), but should be private  
**Migration 021 sets 2MB, config.toml shows 1MB  
***Migration 021 sets 1MB, config.toml shows 512KB

### 5. Edge Functions

#### ✅ send-facebook-webhook
- **Status:** ✅ Correctly configured
- **Trigger:** Manual POST request with `listing_id`
- **Purpose:** Send approved listings to Make.com for Facebook posting
- **Features:** Idempotency check (won't repost), error handling
- **Required Env Vars:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MAKE_WEBHOOK_URL`

### 6. Indexes (Performance)

#### ✅ Correctly Created
```sql
✅ idx_properties_owner - Fast owner queries
✅ idx_properties_city - Fast city filtering
✅ idx_properties_status - Fast status filtering
✅ idx_neighborhoods_city - Fast neighborhood lookups
✅ idx_properties_facebook_posted - Facebook posting queries
✅ idx_properties_approved_at - Approval tracking
✅ idx_property_images_property_id - Image lookups
✅ idx_property_images_image_path - Path lookups
```

---

## ⚠️ WHAT IS MISSING OR INCOMPLETE

### 1. ❌ Storage Security Issues (CRITICAL)

#### Issue 1.1: Property Images - Public Access Despite Private Flag
**Problem:**  
Migration 052 policy `property_images_read_approved_owners_only` has a `TRUE` clause that makes ALL images publicly accessible regardless of property status.

**Location:** `supabase/migrations/052_fix_storage_security.sql:123`

**Impact:** 🔴 **HIGH SECURITY RISK**
- Unapproved/rejected property images are visible to anyone who knows the URL
- No property status enforcement on image access

**Current Policy:**
```sql
CREATE POLICY "property_images_read_approved_owners_only" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'property-images' AND (
      auth.uid() IN (SELECT user_id FROM public.admins) OR
      (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text) OR
      TRUE -- ⚠️ SECURITY ISSUE: Makes all images public
    )
  );
```

#### Issue 1.2: Storage Policies Reference Deleted Columns
**Problem:**  
Migration 021 storage policies reference `profiles.user_role` and `profiles.advertiser_type` columns that were later removed in migration 048.

**Affected Policies:**
- `property_images_auth_insert` - Checks `user_role IN ('real_estate_advertiser', 'admin')`
- `banner_images_commercial_insert` - Checks `user_role IN ('commercial_advertiser', 'admin')`
- `agency_logos_agency_insert` - Checks `user_role = 'real_estate_advertiser' AND advertiser_type = 'agency'`

**Impact:** 🔴 **HIGH - Upload will FAIL**
- Users cannot upload images because policies reference non-existent columns
- Database will throw error on upload attempts

#### Issue 1.3: Bucket Size Limits Inconsistency
**Discrepancy between migration files and config.toml:**

| Bucket | Migration 021 | Config.toml | Status |
|--------|---------------|-------------|--------|
| property-images | 5 MB ✅ | 50 MB | Use 5MB (migration) |
| banner-images | 2 MB | 1 MB | ⚠️ Inconsistent |
| payment-receipts | 5 MB ✅ | N/A | OK |
| agency-logos | 1 MB | 512 KB | ⚠️ Inconsistent |

### 2. ❌ Missing Admin User Setup

**Problem:**  
The `admins` table was created in migration 050, but NO admin users have been added.

**Impact:** 🔴 **CRITICAL**
- Cannot approve/reject listings
- Cannot manage banner requests
- Admin panel is inaccessible
- First admin must be created via SQL console using service role

**Required Action:**
You MUST manually create the first admin via Supabase SQL Editor:
```sql
INSERT INTO public.admins (user_id) VALUES ('UUID-OF-FIRST-ADMIN-USER');
```

### 3. ⚠️ Missing or Inconsistent RLS Policies

#### Issue 3.1: Banner Requests - No RLS Policies
**Table:** `banner_requests`  
**Status:** ❌ RLS NOT ENABLED  
**Impact:** 🟡 **MEDIUM**

**Missing Policies:**
- Users should be able to view their own banner requests
- Users should be able to insert banner requests
- Admins should be able to view/update all banner requests
- Public should NOT be able to read banner requests

#### Issue 3.2: Banner Slots - No RLS Policies
**Table:** `banner_slots`  
**Status:** ❌ RLS NOT ENABLED  
**Impact:** 🟢 **LOW** (Reference data, mostly static)

**Recommendation:**
- Public SELECT for frontend to display available slots
- Admin-only INSERT/UPDATE/DELETE

#### Issue 3.3: Property Images - Missing Policies
**Table:** `property_images`  
**Status:** ✅ RLS ENABLED with policies  
**Issue:** Table exists but is NOT populated by frontend

**Impact:** 🟡 **MEDIUM**
- `can_access_property_image()` function cannot enforce status-based access
- Falls back to checking if owner has ANY approved property (not specific)

### 4. ❌ Missing Database Triggers

#### Issue 4.1: No Auto-Update for updated_at
**Tables Affected:** `properties`, `profiles`, `banner_requests`

**Current State:**
- `updated_at` column exists
- No trigger to auto-update on row changes

**Impact:** 🟢 **LOW**
- Manual timestamp updates required in application code
- Inconsistent `updated_at` values

#### Issue 4.2: No Facebook Webhook Trigger
**Current State:**
- Edge function `send-facebook-webhook` must be called manually
- No database trigger on `properties.status` change

**Impact:** 🟡 **MEDIUM**
- Admin must manually trigger webhook after approval
- Risk of forgetting to post to Facebook

### 5. ⚠️ Missing or Incomplete Columns

#### Issue 5.1: Properties Table - Missing Display Columns
**Potentially Useful Columns:**
- `view_count` - Track property views (analytics)
- `contact_count` - Track contact button clicks
- `last_bumped_at` - For paid "bump to top" feature
- `expiry_date` - Auto-archive old listings

**Impact:** 🟢 **LOW** - Future features, not critical

#### Issue 5.2: Profiles Table - Incomplete User Metadata
**Missing Columns:**
- `last_login_at` - Track user activity
- `email_verified_at` - Separate from Supabase auth
- `whatsapp_number` - Separate from phone (common in Morocco)
- `preferred_language` - Was added in migration 030 but may not exist

### 6. ⚠️ Auth Configuration Gaps

#### Issue 6.1: Email Templates - Not Customized
**Location:** `supabase/templates/`

**Files Expected:**
- `invite.html`
- `confirmation.html`
- `recovery.html`
- `magic_link.html`
- `email_change.html`

**Status:** ❌ **NOT CHECKED** (need to verify if files exist)

**Impact:** 🟡 **MEDIUM**
- Default Supabase email templates (English only)
- Not branded for TopAffaireImmo
- No French/Arabic support

#### Issue 6.2: Site URL and Redirect URLs
**Required in Supabase Dashboard → Authentication → URL Configuration:**

**Site URL:**
- ❌ NOT SET (must be configured manually)
- Should be: `https://www.topaffaireimmo.com` (production)

**Allowed Redirect URLs:**
- ❌ NOT SET (must be configured manually)
- Should include:
  - `https://www.topaffaireimmo.com/**`
  - `https://www.topaffaireimmo.com/auth/callback`
  - `https://topaffaireimmo.com/**` (if www redirect exists)
  - `http://localhost:5173/**` (development)

**Impact:** 🔴 **CRITICAL for Production**
- Email confirmation links will fail
- Password reset will fail
- Users cannot complete signup

#### Issue 6.3: SMTP Configuration
**Location:** Supabase Dashboard → Settings → Auth → SMTP Settings

**Required Settings (from config.toml):**
- SMTP Host: `smtp.hostinger.com`
- Port: `465`
- Encryption: `SSL`
- Sender Email: `noreply@topaffaireimmo.com`
- Sender Name: `TopAffaireImmo`
- SMTP Username: `noreply@topaffaireimmo.com`
- SMTP Password: ❌ **MUST BE PROVIDED** (not in repo)

**Status:** ❌ NOT CONFIGURED (requires manual setup)

**Impact:** 🔴 **CRITICAL**
- No emails will be sent (signup, password reset)
- Users cannot verify accounts
- Authentication is broken

### 7. ⚠️ Edge Function Configuration

#### Issue 7.1: Missing Environment Variables
**Function:** `send-facebook-webhook`

**Required Secrets (not in .env):**
- `SUPABASE_URL` - ✅ Auto-provided by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - ✅ Auto-provided by Supabase
- `MAKE_WEBHOOK_URL` - ❌ **MUST BE SET MANUALLY**
- `VITE_PRODUCTION_DOMAIN` - ⚠️ NOT SET (defaults to vercel.app)

**How to Set:**
```bash
# Via Supabase CLI
supabase secrets set MAKE_WEBHOOK_URL=https://hook.eu1.make.com/xxxxxx
supabase secrets set VITE_PRODUCTION_DOMAIN=https://www.topaffaireimmo.com

# Or via Dashboard → Edge Functions → Secrets
```

**Impact:** 🟡 **MEDIUM**
- Facebook auto-posting will NOT work
- Edge function logs will show "MAKE_WEBHOOK_URL not configured"

#### Issue 7.2: No Trigger for Webhook
**Current Flow:**
1. Admin approves listing (status → 'approved')
2. Admin must manually call edge function via HTTP request

**Missing:**
- Database trigger to auto-call edge function
- Supabase has no native "trigger edge function on UPDATE" feature

**Workaround Needed:**
- Use Database Webhook (Supabase Dashboard → Database → Webhooks)
- Configure to call edge function URL when `properties.status` changes

---

## 🔧 MANUAL ACTIONS REQUIRED IN SUPABASE DASHBOARD

### Priority 1: CRITICAL (Must Fix Before Production)

#### Action 1.1: Create First Admin User
**Where:** Supabase Dashboard → SQL Editor

**What:**
1. Click "SQL Editor" in left sidebar
2. Click "+ New query"
3. Run this SQL (replace UUID with actual user ID):
```sql
-- First, find your user UUID by email
SELECT id, email FROM auth.users WHERE email = 'your-admin-email@example.com';

-- Then insert into admins table
INSERT INTO public.admins (user_id) VALUES ('UUID-FROM-ABOVE-QUERY');
```

**Verify:**
```sql
-- Check admin was created
SELECT a.user_id, u.email 
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id;
```

**Result:** Admin user can now access admin panel and approve listings.

---

#### Action 1.2: Configure SMTP Settings
**Where:** Supabase Dashboard → Settings → Auth → SMTP Settings

**What:**
1. Click "Settings" in left sidebar
2. Click "Auth" tab
3. Scroll to "SMTP Settings"
4. Click "Enable Custom SMTP"
5. Fill in:
   - **SMTP Host:** `smtp.hostinger.com`
   - **SMTP Port:** `465`
   - **SMTP User:** `noreply@topaffaireimmo.com`
   - **SMTP Password:** `[GET FROM HOSTINGER ACCOUNT]`
   - **Sender Email:** `noreply@topaffaireimmo.com`
   - **Sender Name:** `TopAffaireImmo`
6. Click "Save"

**Verify:**
1. Go to Authentication → Users
2. Click "Invite user"
3. Enter test email
4. Check if email is received

**Result:** Email authentication works (signup, password reset).

---

#### Action 1.3: Configure Auth URLs
**Where:** Supabase Dashboard → Authentication → URL Configuration

**What:**
1. Click "Authentication" in left sidebar
2. Click "URL Configuration" tab
3. Set **Site URL:** `https://www.topaffaireimmo.com`
4. Add **Redirect URLs:**
   ```
   https://www.topaffaireimmo.com/**
   https://www.topaffaireimmo.com/auth/callback
   https://topaffaireimmo.com/**
   http://localhost:5173/**
   http://localhost:5173/auth/callback
   ```
5. Click "Save"

**Verify:**
1. Try password reset in production
2. Check email link redirects to correct domain

**Result:** Email links work correctly in production.

---

#### Action 1.4: Fix Storage Bucket Settings
**Where:** Supabase Dashboard → Storage

**What:**

**Step 1: Fix property-images bucket**
1. Click "Storage" in left sidebar
2. Click "property-images" bucket
3. Click bucket settings (gear icon)
4. Set:
   - **Public:** `false` (CRITICAL)
   - **File size limit:** `5242880` (5 MB)
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp`
5. Click "Save"

**Step 2: Fix banner-images bucket**
1. Click "banner-images" bucket
2. Set:
   - **Public:** `true`
   - **File size limit:** `2097152` (2 MB)
   - **Allowed MIME types:** `image/jpeg, image/png, image/gif, image/webp`
3. Click "Save"

**Step 3: Fix agency-logos bucket**
1. Click "agency-logos" bucket
2. Set:
   - **Public:** `true`
   - **File size limit:** `1048576` (1 MB)
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp, image/svg+xml`
3. Click "Save"

**Verify:**
```sql
-- Check bucket settings
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets;
```

**Result:** Bucket settings match intended configuration.

---

#### Action 1.5: Set Edge Function Secrets
**Where:** Supabase Dashboard → Edge Functions → Secrets

**What:**
1. Click "Edge Functions" in left sidebar
2. Click "send-facebook-webhook" function
3. Click "Secrets" tab
4. Add secrets:
   - **Key:** `MAKE_WEBHOOK_URL`  
     **Value:** `https://hook.eu1.make.com/[YOUR-WEBHOOK-ID]` (get from Make.com)
   - **Key:** `VITE_PRODUCTION_DOMAIN`  
     **Value:** `https://www.topaffaireimmo.com`
5. Click "Save"

**Verify:**
1. Click "Invoke" in function settings
2. Send test payload: `{"listing_id": "test-uuid"}`
3. Check logs for webhook URL

**Result:** Facebook auto-posting is configured.

---

### Priority 2: HIGH (Fix for Full Functionality)

#### Action 2.1: Enable RLS on Banner Tables
**Where:** Supabase Dashboard → SQL Editor

**What:** Run this SQL:
```sql
-- Enable RLS on banner_slots
ALTER TABLE public.banner_slots ENABLE ROW LEVEL SECURITY;

-- Enable RLS on banner_requests
ALTER TABLE public.banner_requests ENABLE ROW LEVEL SECURITY;
```

**Note:** Policies will be created via SQL commands (see next section).

---

#### Action 2.2: Create Database Webhook for Facebook Posting
**Where:** Supabase Dashboard → Database → Webhooks

**What:**
1. Click "Database" in left sidebar
2. Click "Webhooks" tab
3. Click "Enable Webhooks"
4. Click "Create a new hook"
5. Fill in:
   - **Name:** `post-to-facebook-on-approval`
   - **Table:** `properties`
   - **Events:** `UPDATE`
   - **Type:** `HTTP Request`
   - **Method:** `POST`
   - **URL:** `https://[PROJECT-REF].supabase.co/functions/v1/send-facebook-webhook`
   - **Headers:** `Authorization: Bearer [ANON-KEY]`
   - **Payload:** 
     ```json
     {
       "listing_id": "{{ record.id }}"
     }
     ```
   - **Condition (SQL):**
     ```sql
     OLD.status != 'approved' AND NEW.status = 'approved'
     ```
6. Click "Create webhook"

**Verify:**
1. Approve a listing
2. Check Edge Function logs
3. Verify `facebook_posted = true`

**Result:** Listings auto-post to Facebook when approved.

---

### Priority 3: MEDIUM (Recommended)

#### Action 3.1: Customize Email Templates
**Where:** Supabase Dashboard → Authentication → Email Templates

**What:**
1. Click "Authentication" → "Email Templates"
2. For each template (Confirm signup, Magic Link, Reset Password):
   - Click "Edit"
   - Customize HTML with TopAffaireImmo branding
   - Add French/Arabic versions (use `{{ .Locale }}` variable)
   - Update subject lines
3. Click "Save" for each

**Example Subject:**
```
EN: Confirm your TopAffaireImmo account
FR: Confirmez votre compte TopAffaireImmo
AR: تأكيد حسابك في TopAffaireImmo
```

**Verify:**
1. Trigger test email
2. Check branding and language

---

#### Action 3.2: Monitor Storage Usage
**Where:** Supabase Dashboard → Storage → Settings

**What:**
1. Click "Storage" → "Settings"
2. Review storage limits
3. Set up alerts if available
4. Consider upgrade plan if needed

**Current Limits (Free Tier):**
- Total storage: 1 GB
- Bandwidth: 2 GB/month

**Estimate for TopAffaireImmo:**
- Property images: ~2 MB per listing × 100 listings = 200 MB
- Banner images: ~500 KB × 50 banners = 25 MB
- Total: ~225 MB (within free tier)

---

## 💻 SQL COMMANDS TO FIX DATABASE ISSUES

### Fix 1: Update Storage Policies (Remove Broken References)

#### Fix 1.1: Property Images - Remove user_role Check
```sql
-- Drop broken policy
DROP POLICY IF EXISTS "property_images_auth_insert" ON storage.objects;

-- Create new policy without user_role check
CREATE POLICY "property_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

#### Fix 1.2: Banner Images - Remove user_role Check
```sql
-- Drop broken policy
DROP POLICY IF EXISTS "banner_images_commercial_insert" ON storage.objects;

-- Create new policy without user_role check
CREATE POLICY "banner_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'banner-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

#### Fix 1.3: Agency Logos - Remove user_role and advertiser_type Check
```sql
-- Drop broken policy
DROP POLICY IF EXISTS "agency_logos_agency_insert" ON storage.objects;

-- Create new policy - only agencies (user_type = 'agency') can upload
CREATE POLICY "agency_logos_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'agency-logos' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_type = 'agency'
    )
  );
```

#### Fix 1.4: Property Images - Remove Public Access (CRITICAL SECURITY FIX)
```sql
-- Drop insecure policy
DROP POLICY IF EXISTS "property_images_read_approved_owners_only" ON storage.objects;

-- OPTION A: Strict Security (Recommended for Production)
-- Only owners, admins, and viewers of approved properties can access
CREATE POLICY "property_images_select_strict" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'property-images' AND (
      -- Admin can see all
      auth.uid() IN (SELECT user_id FROM public.admins) OR
      -- Owner can see their own
      (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text) OR
      -- Public can see if image belongs to approved property
      EXISTS (
        SELECT 1 
        FROM public.property_images pi
        JOIN public.properties p ON pi.property_id = p.id
        WHERE pi.image_path = name 
          AND p.status = 'approved'
      )
    )
  );

-- OPTION B: Keep Public Access (Current State, Less Secure)
-- Use this if you're not ready to populate property_images table
CREATE POLICY "property_images_select_public" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'property-images'
  );

-- RECOMMENDATION: Use Option A and populate property_images table in frontend
```

---

### Fix 2: Add RLS Policies for Banner Tables

#### Fix 2.1: Banner Slots Policies
```sql
-- Enable RLS
ALTER TABLE public.banner_slots ENABLE ROW LEVEL SECURITY;

-- Public can read banner slots (to see available options)
CREATE POLICY "banner_slots_select_public" ON public.banner_slots
  FOR SELECT USING (is_active = true);

-- Only admins can insert/update/delete banner slots
CREATE POLICY "banner_slots_insert_admin" ON public.banner_slots
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

CREATE POLICY "banner_slots_update_admin" ON public.banner_slots
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

CREATE POLICY "banner_slots_delete_admin" ON public.banner_slots
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );
```

#### Fix 2.2: Banner Requests Policies
```sql
-- Enable RLS
ALTER TABLE public.banner_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own banner requests
CREATE POLICY "banner_requests_insert_own" ON public.banner_requests
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    advertiser_id = auth.uid()
  );

-- Users can view their own banner requests
CREATE POLICY "banner_requests_select_own" ON public.banner_requests
  FOR SELECT USING (
    advertiser_id = auth.uid()
  );

-- Admins can view all banner requests
CREATE POLICY "banner_requests_select_admin" ON public.banner_requests
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Users can update their own pending requests only
CREATE POLICY "banner_requests_update_own" ON public.banner_requests
  FOR UPDATE 
  USING (advertiser_id = auth.uid() AND status = 'pending')
  WITH CHECK (advertiser_id = auth.uid() AND status = 'pending');

-- Admins can update any banner request (status changes)
CREATE POLICY "banner_requests_update_admin" ON public.banner_requests
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Users can delete their own pending requests
CREATE POLICY "banner_requests_delete_own" ON public.banner_requests
  FOR DELETE USING (
    advertiser_id = auth.uid() AND status = 'pending'
  );

-- Admins can delete any banner request
CREATE POLICY "banner_requests_delete_admin" ON public.banner_requests
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );
```

---

### Fix 3: Add Auto-Update Triggers for updated_at

```sql
-- Create generic function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to properties table
DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger to profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger to banner_requests table
DROP TRIGGER IF EXISTS update_banner_requests_updated_at ON public.banner_requests;
CREATE TRIGGER update_banner_requests_updated_at
  BEFORE UPDATE ON public.banner_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

---

### Fix 4: Add Missing Columns (Optional Enhancements)

```sql
-- Add analytics columns to properties table
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contact_count INTEGER DEFAULT 0;

-- Add whatsapp to profiles (common in Morocco)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Add preferred language if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE public.profiles 
      ADD COLUMN preferred_language TEXT DEFAULT 'fr'
      CHECK (preferred_language IN ('fr', 'en', 'ar'));
  END IF;
END $$;
```

---

### Fix 5: Verify and Clean Up Legacy Columns

```sql
-- Check if profiles.user_role exists (should be deleted in migration 048)
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name IN ('user_role', 'advertiser_type');

-- If they exist, drop them (migration 048 should have done this)
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS user_role;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS advertiser_type;

-- Verify is_admin column exists (added in multiple migrations)
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'is_admin';
```

---

## 📦 STORAGE CONFIGURATION CHECKLIST

### Bucket Configuration Summary

| Bucket | Public | Size | MIME Types | Policies Status |
|--------|--------|------|-----------|----------------|
| property-images | ❌ No | 5 MB | JPEG, PNG, WebP | ⚠️ NEEDS FIX |
| banner-images | ✅ Yes | 2 MB | JPEG, PNG, GIF, WebP | ⚠️ NEEDS FIX |
| payment-receipts | ❌ No | 5 MB | JPEG, PNG, PDF | ✅ OK |
| agency-logos | ✅ Yes | 1 MB | JPEG, PNG, WebP, SVG | ⚠️ NEEDS FIX |

### Required Storage Policies (After Fixes)

#### Property Images Bucket
```
✅ property_images_insert - Authenticated users, own folder
✅ property_images_read_own - Users read own images
✅ property_images_read_admin - Admins read all images
⚠️ property_images_read_public - REMOVE or restrict to approved properties
✅ property_images_delete_own - Users delete own images
✅ property_images_delete_admin - Admins delete any images
```

#### Banner Images Bucket
```
✅ banner_images_public_read - Public read access
⚠️ banner_images_insert - NEEDS FIX (remove user_role check)
✅ banner_images_owner_update - Owner or admin can update
✅ banner_images_owner_delete - Owner or admin can delete
```

#### Payment Receipts Bucket
```
✅ payment_receipts_owner_read - Owner or admin only
✅ payment_receipts_auth_insert - Authenticated users, own folder
✅ payment_receipts_owner_delete - Owner or admin can delete
```

#### Agency Logos Bucket
```
✅ agency_logos_public_read - Public read access
⚠️ agency_logos_insert - NEEDS FIX (remove user_role, check user_type)
✅ agency_logos_owner_update - Owner or admin can update
✅ agency_logos_owner_delete - Owner or admin can delete
```

---

## 🔐 WHAT MUST BE PROVIDED MANUALLY (CANNOT BE AUTOMATED)

### 1. Supabase Project Credentials

#### Environment Variables (.env file)
```bash
# Required for frontend
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_PRODUCTION_DOMAIN=https://www.topaffaireimmo.com
```

**Where to Get:**
- Supabase Dashboard → Settings → API
- Copy "Project URL" → `VITE_SUPABASE_URL`
- Copy "anon public" key → `VITE_SUPABASE_ANON_KEY`

---

### 2. SMTP Credentials

#### Hostinger Email Password
```bash
# NOT stored in code - must be entered in Supabase Dashboard
SMTP_PASSWORD=[GET FROM HOSTINGER CONTROL PANEL]
```

**Where to Get:**
1. Login to Hostinger account
2. Go to Email → Email Accounts
3. Find `noreply@topaffaireimmo.com`
4. View/reset password
5. Copy password to Supabase SMTP settings

---

### 3. Make.com Webhook URL

#### Facebook Auto-Post Integration
```bash
# Edge Function secret
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/xxxxxxxxxxxx
```

**Where to Get:**
1. Login to Make.com
2. Go to Scenarios
3. Create/edit Facebook posting scenario
4. Copy webhook URL from trigger module
5. Add to Supabase Edge Function secrets

---

### 4. First Admin User UUID

#### Manual SQL Insert Required
```sql
-- Step 1: Find your user UUID
SELECT id, email FROM auth.users WHERE email = 'admin@topaffaireimmo.com';

-- Step 2: Insert into admins table
INSERT INTO public.admins (user_id) VALUES ('uuid-from-step-1');
```

**Why Manual:**
- Cannot automate without knowing which user should be admin
- Security best practice: explicit admin designation
- RLS policies prevent non-admins from creating admins

---

### 5. Production Domain URLs

#### Auth Redirect URLs
```
# Must be set in Supabase Dashboard → Authentication → URL Configuration
https://www.topaffaireimmo.com/**
https://www.topaffaireimmo.com/auth/callback
https://topaffaireimmo.com/**
http://localhost:5173/**
```

**Why Manual:**
- Production domain may change
- Requires Supabase Dashboard access
- Cannot be set via SQL or API

---

### 6. Storage Bucket Settings

#### File Size Limits (Dashboard Only)
```
# Set in Dashboard → Storage → [Bucket] → Settings
property-images: 5 MB (5242880 bytes)
banner-images: 2 MB (2097152 bytes)
payment-receipts: 5 MB (5242880 bytes)
agency-logos: 1 MB (1048576 bytes)
```

**Why Manual:**
- Storage bucket settings are managed via Dashboard
- Cannot be modified via SQL after creation

---

## ✅ VERIFICATION STEPS

### 1. Database Schema Verification

#### Check All Tables Exist
```sql
-- List all tables
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected output:
-- admins
-- advertising_inquiries
-- banner_requests
-- banner_slots
-- cities
-- neighborhoods
-- profiles
-- properties
-- property_images
```

#### Verify Critical Columns
```sql
-- Properties table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'properties'
ORDER BY ordinal_position;

-- Check for required columns:
-- ✅ id, owner_id, status, announcer_type
-- ✅ facebook_posted, facebook_posted_at, facebook_post_error
-- ✅ approved_at, approved_by
```

#### Check Indexes
```sql
-- List all indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Expected:
-- ✅ idx_properties_owner
-- ✅ idx_properties_status
-- ✅ idx_properties_facebook_posted
```

---

### 2. RLS Policies Verification

#### Check RLS Status
```sql
-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- All tables should have rowsecurity = TRUE
```

#### List All Policies
```sql
-- Properties table policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'properties'
ORDER BY policyname;

-- Expected 8 policies:
-- ✅ properties_insert_authenticated
-- ✅ properties_select_own
-- ✅ properties_select_admin
-- ✅ properties_select_public
-- ✅ properties_update_own
-- ✅ properties_update_admin
-- ✅ properties_delete_own
-- ✅ properties_delete_admin
```

#### Test RLS Policies (as User)
```sql
-- Test as authenticated user (not admin)
-- Should only see own listings
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-uuid-here"}';

SELECT id, status, owner_id 
FROM public.properties
LIMIT 5;

-- Should only return rows where owner_id = 'user-uuid-here' OR status = 'approved'

RESET ROLE;
```

#### Test Admin Policies
```sql
-- Create test admin (if not exists)
INSERT INTO public.admins (user_id) 
VALUES ('admin-uuid-here')
ON CONFLICT DO NOTHING;

-- Test as admin
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "admin-uuid-here"}';

SELECT COUNT(*) FROM public.properties;
-- Should return ALL properties (not filtered by owner)

RESET ROLE;
```

---

### 3. Storage Verification

#### Check Bucket Configuration
```sql
-- List all buckets
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets;

-- Verify:
-- ✅ property-images: public = false, limit = 5MB
-- ✅ banner-images: public = true, limit = 2MB
-- ✅ payment-receipts: public = false, limit = 5MB
-- ✅ agency-logos: public = true, limit = 1MB
```

#### Check Storage Policies
```sql
-- List all storage policies
SELECT policyname, bucket_id, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;

-- Verify policies exist for each bucket
```

#### Test Image Upload (Frontend)
1. Login as regular user
2. Go to "Add Listing"
3. Upload property image
4. Check browser console for errors
5. Verify file appears in Storage → property-images → [user-id]/

**Expected:** Upload succeeds without errors

#### Test Image Access (Frontend)
1. Upload property image
2. Copy image URL from network tab
3. Open URL in incognito window (not logged in)
4. **Expected:**
   - **If using strict security:** Image should NOT load (403 error)
   - **If using public access:** Image loads (current state)

---

### 4. Authentication Verification

#### Check SMTP Configuration
**Dashboard Check:**
1. Go to Settings → Auth → SMTP Settings
2. Verify:
   - ✅ Enable Custom SMTP = ON
   - ✅ Host = smtp.hostinger.com
   - ✅ Port = 465
   - ✅ Sender Email = noreply@topaffaireimmo.com

#### Test Email Sending
1. Dashboard → Authentication → Users
2. Click "Invite user"
3. Enter test email address
4. Click "Send invitation"
5. Check email inbox
6. **Expected:** Email received from noreply@topaffaireimmo.com

#### Check Auth URLs
**Dashboard Check:**
1. Go to Authentication → URL Configuration
2. Verify:
   - ✅ Site URL = https://www.topaffaireimmo.com
   - ✅ Redirect URLs include production and localhost

#### Test Signup Flow
1. Open app in browser: https://www.topaffaireimmo.com
2. Click "Sign Up"
3. Fill form and submit
4. Check email for confirmation link
5. Click confirmation link
6. **Expected:** Redirect to app with user logged in

#### Test Password Reset
1. Click "Forgot Password"
2. Enter email
3. Check email for reset link
4. Click reset link
5. **Expected:** Redirect to password reset page (correct domain)

---

### 5. Edge Functions Verification

#### Check Function Deployment
```bash
# Via Supabase CLI
supabase functions list

# Expected output:
# send-facebook-webhook - deployed
```

**Dashboard Check:**
1. Go to Edge Functions
2. Verify "send-facebook-webhook" shows "Active"

#### Check Function Secrets
```bash
# Via Supabase CLI
supabase secrets list

# Expected:
# MAKE_WEBHOOK_URL
# VITE_PRODUCTION_DOMAIN
```

**Dashboard Check:**
1. Go to Edge Functions → send-facebook-webhook → Secrets
2. Verify secrets are set

#### Test Function Manually
**Via Dashboard:**
1. Go to Edge Functions → send-facebook-webhook
2. Click "Invoke"
3. Send test payload:
```json
{
  "listing_id": "test-uuid-here"
}
```
4. Check response
5. **Expected:** Error "Listing not found" (OK) or success if listing exists

**Via API:**
```bash
curl -X POST \
  https://[PROJECT-REF].supabase.co/functions/v1/send-facebook-webhook \
  -H "Authorization: Bearer [ANON-KEY]" \
  -H "Content-Type: application/json" \
  -d '{"listing_id": "real-property-uuid"}'
```

#### Test Webhook Integration
1. Create test property (status = 'pending')
2. Login as admin
3. Approve property (change status → 'approved')
4. Wait 5 seconds
5. Check Edge Function logs:
   - Dashboard → Edge Functions → send-facebook-webhook → Logs
6. **Expected:** Log entry showing webhook sent to Make.com

---

### 6. Admin Panel Verification

#### Check Admin User Exists
```sql
-- List all admin users
SELECT a.user_id, u.email, u.created_at
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id;

-- Should return at least 1 admin user
```

#### Test Admin Dashboard Access
1. Login as admin user
2. Navigate to `/admin`
3. **Expected:** Admin dashboard loads (no 403 error)

#### Test Listing Approval
1. Login as regular user
2. Create test property
3. Logout
4. Login as admin
5. Go to Admin Dashboard → Listings
6. Find test property (status = 'pending')
7. Click "Approve"
8. **Expected:**
   - Status changes to 'approved'
   - `approved_at` and `approved_by` are set
   - Property appears on public homepage

#### Test Admin Permissions
```sql
-- Verify admin can see all properties
-- Run as admin user in frontend
const { data } = await supabase
  .from('properties')
  .select('*');
  
console.log(data.length);
// Should return ALL properties, not just admin's own
```

---

### 7. Frontend Behavior Verification

#### Test Property Listing Flow
1. **Create Listing (User):**
   - Login as regular user
   - Add property with images
   - **Expected:** Property saved with status = 'pending'
2. **Approve Listing (Admin):**
   - Login as admin
   - Approve the property
   - **Expected:** Status changes to 'approved'
3. **View on Homepage (Public):**
   - Logout (or incognito)
   - Go to homepage
   - **Expected:** Approved property is visible

#### Test Image Upload Flow
1. Create property
2. Upload 3 images
3. Check network tab for upload requests
4. **Expected:** All uploads succeed (200 status)
5. Check Storage bucket in Dashboard
6. **Expected:** 3 files in `property-images/[user-id]/`

#### Test Search and Filters
1. Go to Search page
2. Select city: Casablanca
3. Select property type: Apartment
4. **Expected:** Results show only Casablanca apartments with status = 'approved'

---

### 8. Facebook Auto-Post Verification

#### Check Database Fields
```sql
-- Verify Facebook fields exist
SELECT 
  id, 
  status, 
  facebook_posted, 
  facebook_posted_at, 
  facebook_post_id, 
  facebook_post_error
FROM public.properties
WHERE status = 'approved'
LIMIT 5;
```

#### Test Auto-Post on Approval
1. Create test property
2. Admin approves property
3. Wait 10 seconds
4. Check property record:
```sql
SELECT 
  facebook_posted, 
  facebook_posted_at, 
  facebook_post_error
FROM public.properties
WHERE id = 'property-uuid';
```
5. **Expected:**
   - `facebook_posted = true`
   - `facebook_posted_at` is set
   - `facebook_post_error = null`

#### Check Make.com Logs
1. Login to Make.com
2. Go to Scenarios → Facebook Posting
3. Click "History"
4. **Expected:** Log entry with property data

---

### 9. Security Verification

#### Test Unauthorized Access
1. **Try to access admin panel without login:**
   - Go to `/admin` (not logged in)
   - **Expected:** Redirect to login
2. **Try to approve listing as regular user:**
   - Login as non-admin
   - Try to change property status via API
   - **Expected:** Status does NOT change (trigger prevents it)
3. **Try to view other users' properties:**
   - Login as User A
   - Try to query User B's pending property
   - **Expected:** Query returns empty (RLS blocks it)

#### Test Image Access Control
1. **Upload image as User A**
2. **Try to access User A's image as User B:**
   - Get image URL from User A's property
   - Login as User B
   - Open image URL
   - **Expected (Strict):** 403 Forbidden
   - **Expected (Current):** Image loads (public access)

---

### 10. Performance Verification

#### Check Query Performance
```sql
-- Test property search query (common operation)
EXPLAIN ANALYZE
SELECT * FROM public.properties
WHERE city_id = 1 
  AND status = 'approved'
  AND transaction_type = 'sale'
ORDER BY created_at DESC
LIMIT 20;

-- Should use indexes (idx_properties_city, idx_properties_status)
-- Execution time should be < 50ms
```

#### Check Image Load Times
1. Open property details page
2. Open browser DevTools → Network
3. Check image load times
4. **Expected:** Images load in < 2 seconds (from Supabase CDN)

---

## 📊 SUMMARY CHECKLIST

### Critical Issues (Must Fix)
- [ ] Create first admin user via SQL
- [ ] Configure SMTP settings in Dashboard
- [ ] Set Auth Site URL and Redirect URLs
- [ ] Fix storage bucket public/private settings
- [ ] Fix storage policies (remove broken user_role checks)
- [ ] Fix property-images public access (security issue)
- [ ] Set Edge Function secrets (MAKE_WEBHOOK_URL)

### High Priority Issues (Should Fix)
- [ ] Add RLS policies to banner_slots table
- [ ] Add RLS policies to banner_requests table
- [ ] Create database webhook for Facebook auto-posting
- [ ] Add auto-update triggers for updated_at columns

### Medium Priority Issues (Nice to Have)
- [ ] Customize email templates
- [ ] Add analytics columns (view_count, contact_count)
- [ ] Add whatsapp_number to profiles
- [ ] Verify preferred_language column exists

### Verification Tasks
- [ ] Test signup and email confirmation
- [ ] Test password reset flow
- [ ] Test property creation and image upload
- [ ] Test admin approval workflow
- [ ] Test Facebook auto-posting
- [ ] Test RLS policies with different user roles
- [ ] Test image access control

---

## 🔗 REFERENCES

### Supabase Documentation
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage](https://supabase.com/docs/guides/storage)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [SMTP Setup](https://supabase.com/docs/guides/auth/auth-smtp)

### Project Files
- `.env.example` - Environment variables guide
- `supabase/config.toml` - Local Supabase configuration
- `supabase/migrations/` - Database schema evolution
- `src/lib/supabase.ts` - Frontend Supabase client

---

**END OF AUDIT REPORT**

*Generated: January 30, 2026*  
*Next Audit Recommended: After implementing critical fixes*
