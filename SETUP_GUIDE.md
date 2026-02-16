# TopAffaireImmo Setup Guide
**Complete guide to fixing the artisan_profiles table issue and configuring Supabase**

## 🎯 Overview
This guide will help you:
1. Fix the "Could not find the table 'public.artisan_profiles' in the schema cache" error
2. Configure Supabase environment variables
3. Apply database migrations
4. Verify everything works correctly

## 📋 Prerequisites
- A Supabase project created at [supabase.com](https://supabase.com)
- Node.js and npm installed
- Supabase CLI installed (`npm install -g supabase`)
- Project cloned locally

## 🚀 Step-by-Step Setup

### Step 1: Get Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the following values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbGc...`)

> ⚠️ **IMPORTANT**: Never use the `service_role` key in frontend code!

### Step 2: Configure Environment Variables

1. **Create `.env` file** from the example:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env`** and set your Supabase credentials:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...your_anon_key_here
   
   # Site Configuration
   VITE_SITE_URL=http://localhost:5173
   VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com
   ```

3. **Verify configuration**:
   ```bash
   npm run dev
   ```
   
   Check the browser console - you should see:
   ```
   🔧 Supabase Client Initialization
     - URL configured: ✅ Set
     - Anon Key configured: ✅ Set
     - Is Configured: true
   ```

### Step 3: Link to Supabase Project

1. **Login to Supabase CLI**:
   ```bash
   npx supabase login
   ```
   
   This will open a browser window. Follow the prompts to authenticate.

2. **Link your local project** to your Supabase project:
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_ID
   ```
   
   You can find your project ID in the Supabase Dashboard URL:
   `https://app.supabase.com/project/YOUR_PROJECT_ID`

### Step 4: Check Current Migration Status

1. **Check remote migrations** by running this SQL in Supabase SQL Editor:
   ```sql
   SELECT version, name, executed_at
   FROM supabase_migrations.schema_migrations
   ORDER BY version DESC
   LIMIT 10;
   ```

2. **Check if artisan_profiles table exists**:
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name = 'artisan_profiles'
   ) AS table_exists;
   ```
   
   - If returns `true` → Table exists, skip to Step 6
   - If returns `false` → Table doesn't exist, continue to Step 5

### Step 5: Apply Database Migrations

> ⚠️ **WARNING**: For production databases with existing data, always backup first!

#### Option A: Fresh Database (Recommended for Development)

If you have a fresh Supabase project with no important data:

```bash
# Push all local migrations to Supabase
npx supabase db push
```

This will apply all 114 migrations in order, including:
- Migration 089: Creates `artisan_profiles` table with RLS policies
- Migration 100: Creates `artisan_services` table
- All dependencies (service_categories, cities, etc.)

#### Option B: Production Database (Existing Data)

If you have a production database with existing data:

1. **Backup your database first**:
   ```bash
   npx supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Check which migrations are already applied**:
   ```sql
   SELECT version, name 
   FROM supabase_migrations.schema_migrations
   WHERE version >= '089'
   ORDER BY version;
   ```

3. **Mark already-applied migrations as complete** (if needed):
   ```bash
   # Example: If migration 089 was applied manually
   npx supabase migration repair 089 --status applied
   ```

4. **Apply remaining migrations**:
   ```bash
   npx supabase db push
   ```

### Step 6: Verify Migration Success

1. **Run the diagnostic SQL script**:
   
   Copy and paste `/tmp/test-artisan-profiles.sql` into Supabase SQL Editor and run it.
   
   Expected results:
   - `table_exists`: `true`
   - Column list should show: id, user_id, business_name, description_fr, description_ar, phone, etc.
   - `rls_enabled`: `true`
   - At least 5 RLS policies should be listed

2. **Verify foreign key dependencies**:
   ```sql
   -- Should all return true
   SELECT 'service_categories' as table_name, EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_name = 'service_categories'
   ) as exists
   UNION ALL
   SELECT 'cities', EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_name = 'cities'
   );
   ```

3. **Test a simple query**:
   ```sql
   -- This should work without errors (may return 0 rows if no data)
   SELECT COUNT(*) as total_artisans
   FROM public.artisan_profiles;
   ```

### Step 7: Configure Supabase Auth (Important!)

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**

2. Set **Site URL**:
   - Development: `http://localhost:5173`
   - Production: `https://topaffaireimmo.com`

3. Add **Redirect URLs** (Allowed):
   ```
   http://localhost:5173/**
   http://localhost:5173/auth/callback
   http://localhost:5173/reset-password
   https://topaffaireimmo.com/**
   https://topaffaireimmo.com/auth/callback
   https://www.topaffaireimmo.com/**
   https://www.topaffaireimmo.com/auth/callback
   ```

### Step 8: Verify Storage Buckets

The avatar upload functionality requires the `artisan-avatars` storage bucket.

1. **Check if bucket exists**:
   ```sql
   SELECT id, name, public 
   FROM storage.buckets 
   WHERE name = 'artisan-avatars';
   ```

2. **If bucket doesn't exist**, run migration:
   ```bash
   # Migration 106 creates the artisan-avatars bucket
   npx supabase db push
   ```
   
   Or create manually in **Supabase Dashboard** → **Storage**:
   - Name: `artisan-avatars`
   - Public: ✅ Yes
   - File size limit: 2MB
   - Allowed MIME types: `image/jpeg,image/png,image/webp`

3. **Verify RLS policies** for storage:
   ```sql
   SELECT policyname, cmd
   FROM pg_policies
   WHERE schemaname = 'storage'
     AND tablename = 'objects'
     AND policyname LIKE '%artisan%';
   ```

## ✅ Testing

### Test 1: Database Queries
Open your browser console and run:
```javascript
// In browser console
const { data, error } = await window.supabase
  .from('artisan_profiles')
  .select('*')
  .limit(1);
  
console.log('Query result:', data, error);
```

Expected: No error, returns empty array or data.

### Test 2: Navigation Button
1. Start the dev server: `npm run dev`
2. Navigate to home page
3. Scroll to "Services" section
4. Click **"Voir tous les services →"** button
5. ✅ Should navigate to `/artisans` page

### Test 3: Avatar Upload Button
1. Login as an artisan user
2. Navigate to Dashboard → Profile section
3. Click the camera icon on the avatar
4. Select an image file (JPEG, PNG, or WebP, max 2MB)
5. ✅ Should upload and display success toast

## 🐛 Troubleshooting

### Error: "Could not find the table 'public.artisan_profiles'"
**Cause**: Migration 089 not applied to database  
**Solution**: Run `npx supabase db push` (see Step 5)

### Error: "Missing Supabase environment variables"
**Cause**: `.env` file not configured  
**Solution**: Follow Step 2 to create and configure `.env`

### Error: "Bucket 'artisan-avatars' not found"
**Cause**: Storage bucket doesn't exist  
**Solution**: See Step 8 to create the bucket

### Error: "Permission denied" when uploading avatar
**Cause**: RLS policies not configured or user not authenticated  
**Solution**:
1. Verify user is logged in
2. Check storage RLS policies in migration `106_add_artisan_avatar_support.sql`
3. Ensure user has an artisan profile

### Button clicks don't work
**Cause**: JavaScript errors or build issues  
**Solution**:
1. Check browser console for errors
2. Clear browser cache
3. Restart dev server: `npm run dev`

## 📊 Migration Details

### Migration 089: artisan_profiles Table
**File**: `supabase/migrations/089_create_monetization_tables.sql`

Creates tables:
- `platform_settings` - Platform configuration
- `artisan_profiles` - Artisan service provider profiles
- `wallets` - User wallet balances
- `wallet_transactions` - Transaction history
- `contact_access_passes` - Contact reveal system

RLS Policies:
- ✅ Public can read verified profiles
- ✅ Artisans can manage their own profiles
- ✅ Admins have full access

### Migration 100: artisan_services Table
**File**: `supabase/migrations/100_create_service_subcategories_and_artisan_services.sql`

Creates:
- `service_subcategories` - Detailed service types
- `artisan_services` - Junction table for artisan-service relationships

### Migration 106: artisan-avatars Bucket
**File**: `supabase/migrations/106_add_artisan_avatar_support.sql`

Creates:
- `artisan-avatars` storage bucket
- RLS policies for avatar uploads
- Adds `avatar_url` column support

## 📝 Next Steps

After completing setup:

1. **Test artisan profile creation**:
   - Register as a new user
   - Create an artisan profile
   - Upload avatar
   - Add services

2. **Verify search functionality**:
   - Search for artisans by service category
   - Filter by city
   - Check that verified profiles appear

3. **Review security**:
   - Verify RLS policies are enforced
   - Test that users can only edit their own profiles
   - Confirm public can only see verified artisans

## 🔗 Related Documentation

- [DIAGNOSTIC_FINDINGS.md](./DIAGNOSTIC_FINDINGS.md) - Detailed diagnostic report
- [.env.example](./.env.example) - Environment variable template
- [/supabase/migrations/](./supabase/migrations/) - All database migrations
- [Supabase Documentation](https://supabase.com/docs) - Official Supabase docs

## 🆘 Getting Help

If you encounter issues not covered in this guide:

1. Check the [DIAGNOSTIC_FINDINGS.md](./DIAGNOSTIC_FINDINGS.md) for known issues
2. Review migration files in `/supabase/migrations/`
3. Check Supabase logs in Dashboard → Logs
4. Run diagnostic script: `npm run diagnose:supabase`

## ✅ Success Checklist

- [ ] `.env` file created with correct credentials
- [ ] Supabase project linked (`npx supabase link`)
- [ ] Migrations applied successfully (`npx supabase db push`)
- [ ] `artisan_profiles` table exists and is queryable
- [ ] RLS policies are active (run diagnostic SQL)
- [ ] Storage buckets created (especially `artisan-avatars`)
- [ ] Auth redirect URLs configured in Supabase Dashboard
- [ ] Navigation button works (home → artisans page)
- [ ] Avatar upload button works (profile → camera icon)
- [ ] No console errors in browser

Once all items are checked, your TopAffaireImmo application is ready! 🎉
