# SQL Commands - Quick Reference

This file contains all SQL commands needed for deployment, in order of execution.

## Pre-Deployment Checks

### 1. Verify Admin Profile
```sql
-- Check if admin profile exists and has is_admin = true
SELECT id, email, is_admin, user_role 
FROM public.profiles 
WHERE email = 'contact@topaffaireimmo.com';
```

**Expected Result:** 1 row with `is_admin = true`

**If is_admin is false, run:**
```sql
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'contact@topaffaireimmo.com';
```

### 2. Check Current State
```sql
-- Check properties count BEFORE seeding
SELECT COUNT(*) as total_properties FROM public.properties;
SELECT COUNT(*) as published_properties FROM public.properties WHERE status = 'published';
SELECT COUNT(*) as sample_properties FROM public.properties WHERE is_sample = true;
```

**Expected:** 0 or very low numbers

---

## Migration: Fix Contact Fields

### Run This Migration
```sql
-- Migration 074: Fix site_settings contact fields
BEGIN;

-- Step 1: Delete contact_phone and contact_whatsapp from site_settings
DELETE FROM public.site_settings
WHERE key IN ('contact_phone', 'contact_whatsapp');

-- Step 2: Upsert contact_email with proper JSONB format
INSERT INTO public.site_settings (key, value, category, is_public, description)
VALUES (
  'contact_email',
  to_jsonb('contact@topaffaireimmo.com'::text),
  'contact',
  true,
  'Contact email address for the website'
)
ON CONFLICT (key)
DO UPDATE SET
  value = to_jsonb('contact@topaffaireimmo.com'::text),
  category = 'contact',
  is_public = true,
  description = 'Contact email address for the website',
  updated_at = now();

COMMIT;
```

### Verify Migration
```sql
-- Should return only contact_email
SELECT key, value, category, is_public 
FROM public.site_settings 
WHERE key LIKE 'contact_%'
ORDER BY key;
```

**Expected Result:**
```
key           | value                              | category | is_public
--------------|-----------------------------------|----------|----------
contact_email | "contact@topaffaireimmo.com"      | contact  | true
```

---

## Post-Deployment Verification

### 1. Check Properties After Seeding
```sql
-- Should show 50 after running workflow
SELECT COUNT(*) as total_properties FROM public.properties;
SELECT COUNT(*) as published_properties FROM public.properties WHERE status = 'published';
SELECT COUNT(*) as sample_properties FROM public.properties WHERE is_sample = true;
```

**Expected Result:**
- total_properties: 50
- published_properties: 50  
- sample_properties: 50

### 2. Verify Property Ownership
```sql
-- All sample properties should be owned by admin
SELECT DISTINCT 
  p.owner_id, 
  pr.email, 
  pr.is_admin,
  COUNT(*) as property_count
FROM public.properties p
JOIN public.profiles pr ON p.owner_id = pr.id
WHERE p.is_sample = true
GROUP BY p.owner_id, pr.email, pr.is_admin;
```

**Expected Result:**
- owner_id: <admin_uuid>
- email: contact@topaffaireimmo.com
- is_admin: true
- property_count: 50

### 3. View Sample Listings
```sql
-- Preview some sample listings
SELECT 
  id, 
  title_fr, 
  city_id, 
  status, 
  is_sample,
  owner_id,
  created_at
FROM public.properties
WHERE is_sample = true
ORDER BY created_at DESC
LIMIT 10;
```

### 4. Check Property Status Distribution
```sql
-- All should be published
SELECT 
  status, 
  COUNT(*) as count
FROM public.properties
WHERE is_sample = true
GROUP BY status;
```

**Expected Result:**
```
status    | count
----------|------
published | 50
```

### 5. Verify Contact Settings (Final Check)
```sql
-- Verify contact_email is correct
SELECT 
  key,
  value,
  category,
  is_public,
  created_at,
  updated_at
FROM public.site_settings
WHERE key = 'contact_email';
```

**Expected Result:**
- key: contact_email
- value: "contact@topaffaireimmo.com" (JSONB)
- category: contact
- is_public: true

---

## Troubleshooting Queries

### If Properties Not Showing

```sql
-- Check RLS policies on properties table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'properties'
ORDER BY policyname;
```

### Check for Insert Errors

```sql
-- Look for properties that failed to publish
SELECT 
  id,
  title_fr,
  status,
  is_sample,
  created_at
FROM public.properties
WHERE is_sample = true
  AND status != 'published'
ORDER BY created_at DESC;
```

### Check Cities Data

```sql
-- Verify cities exist for seeding
SELECT 
  id,
  name_fr,
  name_ar,
  is_active
FROM public.cities
WHERE is_active = true
ORDER BY display_order;
```

---

## Cleanup (Optional)

### Remove Sample Listings

**Only run this when you want to remove sample data:**

```sql
-- Remove all sample listings
BEGIN;

DELETE FROM public.properties
WHERE is_sample = true;

COMMIT;
```

**Verify deletion:**
```sql
SELECT COUNT(*) FROM public.properties WHERE is_sample = true;
-- Should return 0
```

---

## Rollback (Emergency Only)

### If You Need to Rollback Contact Settings

**Only if migration needs to be reversed:**

```sql
BEGIN;

-- Remove the email setting
DELETE FROM public.site_settings
WHERE key = 'contact_email';

-- Restore old settings (adjust values as needed)
INSERT INTO public.site_settings (key, value, category, is_public)
VALUES 
  ('contact_phone', to_jsonb('+212 6XX XXX XXX'::text), 'contact', true),
  ('contact_whatsapp', to_jsonb('+212 6XX XXX XXX'::text), 'contact', true),
  ('contact_email', to_jsonb('contact@topaffaireimmo.com'::text), 'contact', true);

COMMIT;
```

---

## Summary of SQL Execution Order

1. ✅ Check admin profile exists
2. ✅ Check current properties count
3. ✅ Run contact fields migration
4. ✅ Verify migration succeeded
5. ⏳ Deploy code and run workflow
6. ✅ Verify properties created
7. ✅ Verify ownership
8. ✅ Check final state

---

## Notes

- All SQL uses `public.` schema explicitly for clarity
- JSONB values use `to_jsonb('text'::text)` format
- Always use BEGIN/COMMIT for data modifications
- Verify each step before proceeding to next
- Keep a record of counts before/after for comparison

---

## Quick Copy-Paste Versions

### Just the Migration (Most Common)

```sql
BEGIN;
DELETE FROM public.site_settings WHERE key IN ('contact_phone', 'contact_whatsapp');
INSERT INTO public.site_settings (key, value, category, is_public, description)
VALUES ('contact_email', to_jsonb('contact@topaffaireimmo.com'::text), 'contact', true, 'Contact email address for the website')
ON CONFLICT (key) DO UPDATE SET value = to_jsonb('contact@topaffaireimmo.com'::text), category = 'contact', is_public = true, updated_at = now();
COMMIT;
```

### Verify Admin

```sql
SELECT id, email, is_admin FROM public.profiles WHERE email = 'contact@topaffaireimmo.com';
```

### Post-Deployment Check

```sql
SELECT COUNT(*) FROM public.properties WHERE status = 'published';
```
