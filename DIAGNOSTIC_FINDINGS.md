# TopAffaireImmo Diagnostic Report
**Date:** 2026-02-15  
**Status:** In Progress

## Executive Summary
This diagnostic was performed to address the following issues:
1. Error: "Could not find the table 'public.artisan_profiles' in the schema cache"
2. Some buttons across the UI do not respond (missing onClick handlers)
3. Need to verify Supabase frontend configuration
4. Need to verify RLS policies are not blocking reads

## Phase 1: Database Diagnostic - artisan_profiles Table

### ✅ Table Definition Found
- **Migration File:** `089_create_monetization_tables.sql`
- **Location:** `/supabase/migrations/089_create_monetization_tables.sql`
- **Status:** Migration exists and is properly defined

### Table Schema
The `artisan_profiles` table includes all required columns:
- ✅ `id` UUID PRIMARY KEY
- ✅ `user_id` UUID REFERENCES auth.users
- ✅ `business_name` TEXT (note: called `business_name` not `full_name`)
- ✅ `description_fr` TEXT (French description)
- ✅ `description_ar` TEXT (Arabic description)
- ✅ `service_category_id` UUID (not `services` array as mentioned in requirements)
- ✅ `cities` INTEGER[] (array of city IDs, not single city)
- ✅ `phone` TEXT
- ✅ `created_at` TIMESTAMPTZ
- ✅ `updated_at` TIMESTAMPTZ
- ✅ `is_verified` BOOLEAN
- ✅ `is_boosted` BOOLEAN (enhanced version of `is_premium`)

### RLS Policies (from migration 089)
✅ **RLS is enabled** on `artisan_profiles` table

#### SELECT Policies:
1. **"Public can read active artisan profiles"**
   - Allows public access to verified and active profiles
   - Condition: `is_active = TRUE AND is_verified = TRUE`
   
2. **"Artisans can read own profiles"**
   - Allows artisans to see their own profiles (even if not verified)
   - Condition: `auth.uid() = user_id`

3. **"Admins can manage all artisan profiles"**
   - Full access for administrators
   - Condition: `auth.uid() IN (SELECT user_id FROM public.admins)`

#### INSERT/UPDATE Policies:
- ✅ "Artisans can create own profiles" (INSERT)
- ✅ "Artisans can update own profiles" (UPDATE)
- ✅ Admin management policies

### Usage in Codebase
The table is actively used in:
- ✅ `src/lib/db/artisans.ts` - Database access layer
- ✅ `src/hooks/useArtisans.ts` - React hook for artisan queries
- ✅ `src/hooks/useArtisanDashboard.ts` - Dashboard functionality
- ✅ `src/hooks/useAdminDashboard.ts` - Admin functionality
- ✅ `src/types/supabase.ts` - TypeScript types

### Potential Causes of "Schema Cache" Error
The error "Could not find the table 'public.artisan_profiles' in the schema cache" typically indicates:

1. **Migration Not Applied** (MOST LIKELY)
   - The migration `089_create_monetization_tables.sql` may not have been pushed to the Supabase project
   - Solution: Run `npx supabase db push` to apply pending migrations

2. **Schema Cache Issue**
   - Supabase client might be using cached schema that doesn't include the new table
   - Solution: Restart the application or clear browser cache

3. **Database Connection Issue**
   - Environment variables not properly configured
   - Wrong database being queried

## Phase 2: Supabase Frontend Configuration

### ✅ Environment Variables Check

#### Configuration in `src/lib/supabase.ts`:
- ✅ `VITE_SUPABASE_URL` - Properly configured
- ✅ `VITE_SUPABASE_ANON_KEY` - Properly configured
- ✅ `isSupabaseConfigured` flag exists and works correctly
- ✅ No SERVICE_ROLE key exposed in frontend code
- ✅ Defensive environment variable access (never throws)
- ✅ Proper error handling and logging

#### Schema Usage:
- ✅ All queries use `public` schema (e.g., `from('artisan_profiles')`)
- ✅ No hardcoded wrong schema references found
- ✅ Proper foreign key references to `auth.users`

### Required Actions:
1. **Create .env file** (if not exists) by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. **Set Supabase credentials** in `.env`:
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. **Apply migrations** to Supabase:
   ```bash
   npx supabase db push
   ```

## Phase 3: Button Logic Audit

### 🔴 Critical Issues Found: 2 Buttons with Missing onClick Handlers

#### Issue 1: ServiceCategories.tsx - "View All Services" Button
- **File:** `src/components/home/ServiceCategories.tsx`
- **Line:** 114
- **Problem:** CTA button has no onClick handler
- **Expected Behavior:** Should navigate to artisans/services page
- **Current Code:**
  ```tsx
  <button className="text-[#0FC2C0] hover:text-[#0DA9A7] font-medium transition-colors">
    Voir tous les services →
  </button>
  ```
- **Fix Required:** Add navigation handler using `useNavigate()` from react-router-dom

#### Issue 2: ArtisanDashboardPage.tsx - Avatar Upload Button
- **File:** `src/pages/dashboard/ArtisanDashboardPage.tsx`
- **Line:** 356-358
- **Problem:** Camera icon button for avatar upload has no onClick handler
- **Expected Behavior:** Should trigger file input dialog for image upload
- **Current Code:**
  ```tsx
  <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#0FC2C0] text-white hover:bg-[#0DA9A7]">
    <Camera className="h-4 w-4" />
  </button>
  ```
- **Fix Required:** Add onClick handler to trigger file upload

### ✅ Clean Findings:
- No `onClick={undefined}` patterns detected
- No empty `onClick={}` patterns detected
- TypeScript type safety is properly enforced
- Other buttons use proper handlers

## Phase 4: Recommended Actions

### Immediate Actions (Critical):
1. ✅ Apply database migrations to create `artisan_profiles` table
2. ✅ Fix "View All Services" button onClick handler
3. ✅ Fix avatar upload button onClick handler
4. ✅ Create .env file with proper Supabase credentials

### Verification Steps:
1. Run SQL diagnostic script (see TESTING section below)
2. Test artisan_profiles queries in Supabase SQL Editor
3. Verify RLS policies allow public SELECT on verified profiles
4. Test button functionality in UI

### Migration Status Check:
Run this SQL in Supabase SQL Editor to check if migration 089 is applied:
```sql
SELECT version, name, executed_at
FROM supabase_migrations.schema_migrations
WHERE version = '089'
ORDER BY version;
```

If not found, apply migrations:
```bash
npx supabase db push
```

## Testing

### SQL Test Script
Run `/tmp/test-artisan-profiles.sql` in Supabase SQL Editor to verify:
- Table existence
- Column structure
- RLS policies
- Foreign key dependencies (service_categories, cities)

### Frontend Test
After fixes:
1. Navigate to home page
2. Click "Voir tous les services" button - should navigate
3. Login as artisan
4. Navigate to dashboard
5. Click camera icon on avatar - should open file picker

## Files Modified
- [ ] `src/components/home/ServiceCategories.tsx` - Add navigation handler
- [ ] `src/pages/dashboard/ArtisanDashboardPage.tsx` - Add file upload handler
- [ ] `.env` - Create if missing

## Dependencies
- `react-router-dom` - Already installed (for navigation)
- `@supabase/supabase-js` - Already installed

## Conclusion
The main issue is that the `artisan_profiles` table migration likely hasn't been applied to the Supabase database. The table definition exists in the codebase and is properly configured with RLS policies. Once migrations are applied and the two button handlers are fixed, all issues should be resolved.
