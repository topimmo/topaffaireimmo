# Supabase Migration Checklist

This checklist ensures all database migrations are applied correctly.

## ✅ Pre-Migration Checklist

- [ ] Supabase project created and active
- [ ] SQL Editor open in Supabase dashboard
- [ ] Repository migrations folder accessible
- [ ] Database backup taken (if existing data)

## 📝 Migration Order

Apply these migrations in the Supabase SQL Editor **in this exact order**:

### 1. Core Schema (REQUIRED)
```
File: supabase/migrations/020_full_rebuild.sql
Status: [ ]
Description: Creates all tables, indexes, and base RLS policies
Estimated time: ~2 seconds
```

**Verify**: Run this query to check tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'properties', 'cities', 'neighborhoods', 'property_types');
-- Should return 5 rows
```

---

### 2. Storage Buckets (REQUIRED)
```
File: supabase/migrations/021_storage_buckets.sql
Status: [ ]
Description: Creates storage buckets and policies
Estimated time: ~1 second
```

**Verify**: Check buckets exist in Storage section of Supabase dashboard, or run:
```sql
SELECT id, name FROM storage.buckets;
-- Should show: property-images, banner-images, payment-receipts
```

---

### 3. Admin Setup (REQUIRED)
```
File: supabase/migrations/029_admin_user_setup.sql
Status: [ ]
Description: Adds is_admin column and admin RLS policies
Estimated time: ~1 second
```

**Verify**: Check column exists:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'is_admin';
-- Should return 1 row: is_admin | boolean
```

---

### 4. RLS Policies Fix (REQUIRED)
```
File: supabase/migrations/031_fix_policies_final.sql
Status: [ ]
Description: Fixes and optimizes all RLS policies
Estimated time: ~2 seconds
```

**Verify**: Check policies exist:
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'properties';
-- Should return multiple policies including:
-- - public_view_approved
-- - owner_view_own
-- - realtor_insert
-- - owner_update
-- - owner_delete
```

---

### 5. Final Fixes (REQUIRED)
```
File: supabase/migrations/033_final_fixes.sql
Status: [ ]
Description: Storage policies, trigger improvements, banner slots
Estimated time: ~2 seconds
```

**Verify**: Check trigger exists:
```sql
SELECT tgname FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass 
AND tgname = 'on_auth_user_created';
-- Should return 1 row
```

---

### 6. Advertising Inquiries (RECOMMENDED)
```
File: supabase/migrations/033_advertising_inquiries.sql
Status: [ ]
Description: Creates advertising_inquiries table for contact form
Estimated time: ~1 second
```

**Verify**: Check table exists:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'advertising_inquiries';
-- Should return 1 row
```

---

### 7. Schema Compatibility (REQUIRED)
```
File: supabase/migrations/034_fix_schema_mismatches.sql
Status: [ ]
Description: Adds title_en, description_en, phone columns and optimizes RLS
Estimated time: ~2 seconds
```

**Verify**: Check new columns exist:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('title_en', 'description_en', 'phone');
-- Should return 3 rows
```

**Verify**: Check helper function exists:
```sql
SELECT proname FROM pg_proc WHERE proname = 'can_insert_property';
-- Should return 1 row
```

---

## ✅ Post-Migration Verification

After all migrations are applied, run these verification queries:

### 1. All Tables Created
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected tables:**
- advertising_inquiries
- banner_requests
- banner_slots
- cities
- neighborhoods
- payments
- profiles
- properties
- property_images
- property_types
- site_settings

---

### 2. All Functions Created
```sql
SELECT proname FROM pg_proc 
WHERE proname IN (
  'handle_new_user', 
  'check_user_role', 
  'is_admin',
  'can_insert_property'
)
ORDER BY proname;
```

**Expected functions:** All 4 should be present

---

### 3. RLS Enabled on All Tables
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Expected**: rowsecurity = true for all tables

---

### 4. Sample Data Seeded
```sql
-- Check cities
SELECT COUNT(*) as city_count FROM cities;
-- Should be ~20 cities

-- Check property types
SELECT COUNT(*) as type_count FROM property_types;
-- Should be 5 types

-- Check neighborhoods
SELECT COUNT(*) as neighborhood_count FROM neighborhoods;
-- Should be ~20+ neighborhoods

-- Check banner slots
SELECT COUNT(*) as slot_count FROM banner_slots;
-- Should be 4-6 slots
```

---

### 5. Storage Buckets & Policies
```sql
-- Check buckets
SELECT id, name, public FROM storage.buckets;

-- Check storage policies
SELECT policyname FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';
```

**Expected buckets:**
- property-images (public: true)
- banner-images (public: true)  
- payment-receipts (public: true)

**Expected policies:**
- storage_read_v2
- storage_insert_v2
- storage_update_v2
- storage_delete_v2

---

## 🔧 Rollback (If Needed)

If a migration fails:

1. Check the error message in SQL Editor
2. Fix the issue (usually a constraint or type mismatch)
3. Re-run the migration
4. If data corruption occurs, restore from backup

**Common issues:**
- "relation already exists" → Migration partially applied, safe to continue
- "column already exists" → Migration partially applied, safe to continue
- "permission denied" → Check you're using the correct Supabase credentials
- "syntax error" → Copy migration file carefully, check for truncation

---

## 📊 Final Status

After completing all migrations:

- [ ] All 7 migrations applied successfully
- [ ] All verification queries passed
- [ ] No errors in Supabase logs
- [ ] Storage buckets visible in dashboard
- [ ] Sample data (cities, types, neighborhoods) present
- [ ] Ready to create admin user (see QUICK_SETUP.md)
- [ ] Ready to test application (see TESTING_GUIDE.md)

---

## 🎯 Next Steps

1. Create admin user (QUICK_SETUP.md step 5)
2. Configure `.env` file locally
3. Test signup/login/publishing (TESTING_GUIDE.md)
4. Deploy to production

---

**Estimated Total Time**: 5-10 minutes  
**Difficulty**: Easy (copy-paste SQL)

Need help? Check AUDIT_REPORT.md for troubleshooting.
