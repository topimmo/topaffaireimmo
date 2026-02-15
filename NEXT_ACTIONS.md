# Next Actions - Supabase Fresh Project Setup

## Overview

This guide provides the **safest and recommended steps** to sync a fresh Supabase project with local migrations.

## Prerequisites

- [ ] You have a fresh Supabase project created
- [ ] You have the Project ID (from Supabase Dashboard)
- [ ] Supabase CLI is installed (`npm install -g supabase` or use `npx`)

---

## Step-by-Step Guide

### 1. Login to Supabase

```bash
npx supabase login
```

This will open a browser for authentication. Sign in with your Supabase account.

### 2. Link to Your Project

```bash
npx supabase link --project-ref YOUR_PROJECT_ID
```

Replace `YOUR_PROJECT_ID` with your actual Supabase project reference ID (found in Supabase Dashboard → Settings → General).

**Example**: If your Supabase URL is `https://abcdefghijk.supabase.co`, your project ID is `abcdefghijk`.

### 3. Check Remote Migration Status (Optional but Recommended)

Before applying migrations, check what's already on the remote:

Go to **Supabase Dashboard → SQL Editor** and run:

```sql
SELECT version, name, executed_at
FROM supabase_migrations.schema_migrations
ORDER BY version;
```

For a fresh project, this should return **0 rows** or only default Supabase migrations.

### 4. Apply All Local Migrations

```bash
npx supabase db push
```

This command will:
- Compare local migrations with remote
- Apply all missing migrations in order
- Show you what it's going to do before applying

**Expected output**: All 113 migrations will be applied (some are empty, which is fine).

### 5. Verify Migrations Applied

Run the same SQL query from step 3:

```sql
SELECT version, name, executed_at
FROM supabase_migrations.schema_migrations
ORDER BY version;
```

You should now see all your migrations listed.

### 6. Check Schema

Verify key tables exist:

```sql
-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check site_settings structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'site_settings'
ORDER BY ordinal_position;
```

**Expected**: You should see tables like `profiles`, `properties`, `site_settings`, `admins`, etc.

### 7. Setup Storage Buckets

Run the storage setup script:

```bash
node scripts/setup-storage-buckets.js
```

Or create buckets manually in **Supabase Dashboard → Storage**:
- `property-images` (public)
- `avatars` (public)
- `banner-images` (public)
- `agency-logos` (public)
- `payment-receipts` (private)

### 8. Configure Environment Variables

Copy the example file:

```bash
cp .env.example .env
```

Edit `.env` and set:

```bash
# Get these from Supabase Dashboard → Settings → API
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Your production domain
VITE_SITE_URL=https://www.topaffaireimmo.com
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com
```

### 9. Configure Supabase Dashboard Settings

#### A. Authentication → URL Configuration

1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Set **Site URL**: `https://www.topaffaireimmo.com`
3. Add **Redirect URLs**:
   - Production:
     - `https://www.topaffaireimmo.com/**`
     - `https://topaffaireimmo.com/**`
   - Development:
     - `http://localhost:5173/**`
     - `http://127.0.0.1:5173/**`

#### B. Authentication → Providers

Enable the auth providers you need:
- [x] Email (enabled by default)
- [ ] Google OAuth (if needed - requires credentials)
- [ ] Phone/SMS (if needed - requires Twilio/Vonage)

### 10. Test the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 and test:

- [ ] User signup (creates profile automatically)
- [ ] User login
- [ ] Property creation
- [ ] Image uploads
- [ ] Admin functions (if you have admin user)

### 11. Create Admin User (Optional)

After signing up with your admin email, run this in **SQL Editor**:

```sql
-- Update profiles table (NOT auth.users!)
UPDATE public.profiles
SET 
  user_role = 'admin',
  is_verified = true,
  is_active = true
WHERE email = 'admin@topaffaireimmo.com';

-- Also add to admins table
INSERT INTO public.admins (user_id, email, role, is_active)
SELECT 
  id,
  email,
  'super_admin',
  true
FROM public.profiles
WHERE email = 'admin@topaffaireimmo.com'
ON CONFLICT (user_id) DO NOTHING;
```

---

## Troubleshooting

### Issue: "migration already exists on remote"

This means some migrations were already applied. Safe to ignore if using `npx supabase db push`.

### Issue: "column does not exist"

**Cause**: Migration 074 had a bug (now fixed) that referenced `description` instead of `description_fr`.

**Solution**: The migration is now fixed in the repository. If you already applied it and got an error:

```sql
-- Manually fix the data
DELETE FROM public.site_settings WHERE key IN ('contact_phone', 'contact_whatsapp');

INSERT INTO public.site_settings (key, value, category, is_public, description_fr)
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
  description_fr = 'Contact email address for the website',
  updated_at = now();
```

### Issue: "permission denied" or "must be owner of relation users"

**Cause**: Trying to modify `auth.users` table directly.

**Solution**: Never modify `auth.users`. Use triggers (already set up in migrations) and modify `public.profiles` instead.

### Issue: RLS blocking queries

**Symptoms**: Queries work in SQL Editor but fail in app with "row-level security policy" error.

**Solution**:
1. Check RLS policies in **Supabase Dashboard → Authentication → Policies**
2. Verify user is authenticated
3. Check that policies allow the operation

---

## Quick Reference Commands

```bash
# Check Supabase CLI status
npx supabase status

# Pull remote schema (to compare)
npx supabase db pull

# Generate TypeScript types
npm run types:supabase

# Run diagnostic script
npx tsx scripts/diagnose-supabase.ts

# Or use bash version
./scripts/diagnose-supabase.sh
```

---

## Safety Notes

### ⚠️ DO NOT Do These in Production

- **DO NOT** run `npx supabase db reset` - it deletes all data!
- **DO NOT** manually alter `auth.users` table
- **DO NOT** disable RLS on public tables
- **DO NOT** commit `.env` file with real credentials

### ✅ DO These

- **DO** backup before major changes
- **DO** test migrations locally first
- **DO** use migration repair for already-applied migrations
- **DO** monitor logs after deployment
- **DO** keep `.env` in `.gitignore`

---

## Additional Resources

- **Full Diagnostic Report**: `DIAGNOSTIC_REPORT.md`
- **Supabase Documentation**: `supabase/README.md`
- **Backend API Reference**: `supabase/BACKEND_DOCUMENTATION.md`
- **Security Policies**: `supabase/SECURITY_POLICIES.md`
- **Deployment Guide**: `supabase/DEPLOYMENT_GUIDE.md`

---

## Success Checklist

- [ ] Supabase CLI linked to project
- [ ] All migrations applied (`npx supabase db push`)
- [ ] Schema verified (tables exist, columns correct)
- [ ] Storage buckets created
- [ ] Environment variables configured
- [ ] Supabase Dashboard settings updated (URL config, providers)
- [ ] Application tested locally
- [ ] Admin user created (if needed)
- [ ] No console errors when using the app

---

**You're ready to go! 🚀**

If you encounter any issues, run the diagnostic script:

```bash
npx tsx scripts/diagnose-supabase.ts
```

Or consult `DIAGNOSTIC_REPORT.md` for detailed troubleshooting.
