# TopAffaireImmo - Quick Fix Validation Guide

## 🎯 Quick Status Check

Run these commands to quickly verify the fixes:

### 1. Check Environment Configuration
```bash
# Verify .env file exists
ls -la .env

# Check if Supabase variables are set (should see values, not just placeholders)
grep VITE_SUPABASE .env
```

**Expected output**:
```
VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Check Database Migration Status
Run this in **Supabase SQL Editor**:

```sql
-- Check if artisan_profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'artisan_profiles'
) AS artisan_profiles_exists,

EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'service_categories'
) AS service_categories_exists,

EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'cities'
) AS cities_exists;
```

**Expected result**: All three should return `true`

### 3. Verify RLS Policies
```sql
-- Check artisan_profiles RLS policies
SELECT 
  policyname,
  cmd as permission_type
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'artisan_profiles'
ORDER BY policyname;
```

**Expected policies** (should have at least 5):
- `Admins can manage all artisan profiles` (ALL)
- `Artisans can create own profiles` (INSERT)
- `Artisans can read own profiles` (SELECT)
- `Artisans can update own profiles` (UPDATE)
- `Public can read active artisan profiles` (SELECT)

### 4. Test Application Startup
```bash
npm run dev
```

**Check browser console for**:
```
🔧 Supabase Client Initialization
  - Is Configured: true
  - Storage Available: true
```

**Should NOT see**:
- ❌ CRITICAL: Missing Supabase environment variables
- ❌ Could not find the table 'public.artisan_profiles'

## 🔘 Button Functionality Tests

### Test 1: "View All Services" Button
1. Navigate to: `http://localhost:5173`
2. Scroll to **Services** section
3. Click **"Voir tous les services →"**
4. ✅ **Expected**: Navigate to `/artisans` page

### Test 2: Avatar Upload Button
1. Login as artisan user
2. Navigate to: Dashboard → Profile
3. Click camera icon on avatar
4. Select image file (JPEG/PNG/WebP, max 2MB)
5. ✅ **Expected**: 
   - File picker opens
   - Upload progress indicator
   - Success toast: "Photo de profil mise à jour avec succès"
   - Avatar updates with new image

## 🚨 Common Issues & Quick Fixes

### Issue: "Table artisan_profiles not found"
```bash
# Quick fix: Apply migrations
npx supabase db push
```

### Issue: "Missing environment variables"
```bash
# Quick fix: Create .env from example
cp .env.example .env
# Then edit .env with your Supabase credentials
```

### Issue: "Bucket artisan-avatars not found"
**Fix in Supabase Dashboard**:
1. Go to Storage
2. Create new bucket: `artisan-avatars`
3. Set as Public
4. Max file size: 2MB

Or run migration:
```bash
npx supabase db push
```

### Issue: "Permission denied" on avatar upload
**Check**:
1. User is logged in (check browser console)
2. User has artisan profile created
3. Storage RLS policies exist (run migration 106)

## 📊 Database Health Check Script

Save as `check_db.sql` and run in Supabase SQL Editor:

```sql
-- ============================================
-- DATABASE HEALTH CHECK
-- ============================================

-- 1. Check critical tables exist
SELECT 
  'artisan_profiles' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'artisan_profiles'
  ) as exists
UNION ALL
SELECT 
  'service_categories',
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'service_categories'
  )
UNION ALL
SELECT 
  'cities',
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'cities'
  )
UNION ALL
SELECT 
  'artisan_services',
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'artisan_services'
  );

-- 2. Check RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('artisan_profiles', 'service_categories', 'cities')
ORDER BY tablename;

-- 3. Check storage buckets
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets
WHERE name IN ('artisan-avatars', 'property-images', 'banner-images')
ORDER BY name;

-- 4. Count artisan profiles
SELECT 
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE is_verified = true) as verified_profiles,
  COUNT(*) FILTER (WHERE is_active = true) as active_profiles
FROM artisan_profiles;

-- 5. Check last migration applied
SELECT 
  version,
  name,
  executed_at
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 5;
```

**All checks should pass** ✅

## 🎉 Success Indicators

Your setup is complete when you see:

### ✅ In Browser Console:
- `🔧 Supabase Client Initialization - Is Configured: true`
- No errors about missing tables
- No errors about missing environment variables

### ✅ In Supabase Dashboard:
- `artisan_profiles` table visible in Table Editor
- RLS policies active (5+ policies)
- `artisan-avatars` bucket exists in Storage

### ✅ In Application:
- Home page loads without errors
- "View All Services" button navigates correctly
- Avatar upload works for artisan users
- No console errors

## 🔄 If Something Still Doesn't Work

1. **Clear browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Restart dev server**: Stop and run `npm run dev` again
3. **Re-run migrations**: `npx supabase db push`
4. **Check logs**: 
   - Browser console (F12)
   - Supabase Dashboard → Logs
5. **Run diagnostic**: `npm run diagnose:supabase`

## 📞 Need More Help?

Refer to the detailed guides:
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Complete setup instructions
- [DIAGNOSTIC_FINDINGS.md](./DIAGNOSTIC_FINDINGS.md) - Detailed diagnostic report
- `/tmp/test-artisan-profiles.sql` - SQL diagnostic script

---

**Last Updated**: 2026-02-15  
**Fixes Applied**: 
- ✅ Added navigation handler to "View All Services" button
- ✅ Added avatar upload handler with file validation
- ✅ Documented all setup and verification steps
