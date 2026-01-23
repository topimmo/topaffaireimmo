# Quick Setup Guide - TopAffaireImmo

## 1. Prerequisites
- [ ] Node.js 18+ installed
- [ ] Supabase account created
- [ ] Git repository cloned

## 2. Supabase Project Setup

### Create Project
1. Go to https://app.supabase.com
2. Click "New Project"
3. Set project name: `topaffaireimmo`
4. Set database password (save it!)
5. Select region closest to Morocco (EU-West recommended)
6. Click "Create new project"
7. Wait 2-3 minutes for provisioning

### Get Credentials
1. Go to Project Settings → API
2. Copy "Project URL" → This is your `VITE_SUPABASE_URL`
3. Copy "anon public" key → This is your `VITE_SUPABASE_ANON_KEY`

## 3. Run Migrations (IN ORDER!)

**Important**: Run these in the SQL Editor one at a time, in this exact order:

```sql
-- Step 1: Core schema (REQUIRED)
-- Run: supabase/migrations/020_full_rebuild.sql

-- Step 2: Storage buckets (REQUIRED)
-- Run: supabase/migrations/021_storage_buckets.sql

-- Step 3: Admin setup (REQUIRED)
-- Run: supabase/migrations/029_admin_user_setup.sql

-- Step 4: RLS policies fix (REQUIRED)
-- Run: supabase/migrations/031_fix_policies_final.sql

-- Step 5: Final fixes (REQUIRED)
-- Run: supabase/migrations/033_final_fixes.sql

-- Step 6: Advertising inquiries (RECOMMENDED)
-- Run: supabase/migrations/033_advertising_inquiries.sql

-- Step 7: Schema compatibility (REQUIRED)
-- Run: supabase/migrations/034_fix_schema_mismatches.sql
```

**Verify**: After each migration, check for "Success" message in SQL Editor.

## 4. Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env

# 3. Edit .env with your credentials
# VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
# VITE_SUPABASE_ANON_KEY=your_anon_key_here

# 4. Build (verify no errors)
npm run build

# 5. Start dev server
npm run dev
```

## 5. Create First Admin User

**Option A: Via SQL Editor** (Recommended)
```sql
-- Create admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@topaffaireimmo.com',
  crypt('ChangeMe123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User","user_role":"admin"}',
  false
);

-- Make them admin (trigger creates profile, just update it)
UPDATE public.profiles 
SET is_admin = true, user_role = 'admin'
WHERE email = 'admin@topaffaireimmo.com';
```

**Option B: Via App Signup**
1. Register normally via app
2. After registration, run this SQL to make admin:
```sql
UPDATE public.profiles 
SET is_admin = true, user_role = 'admin'
WHERE email = 'your@email.com';
```

## 6. Test Basic Flows

### Test 1: Signup ✅
1. Go to http://localhost:5173
2. Click "S'inscrire"
3. Fill form and submit
4. Should redirect to dashboard

### Test 2: Add Listing ✅
1. Login as real estate advertiser
2. Click "Publier une annonce"
3. Fill required fields (type, city, price)
4. Submit
5. Should see success message

### Test 3: Admin Panel ✅
1. Login as admin user
2. Go to /admin-panel
3. See pending properties
4. Approve a property
5. Property status changes to "approved"

## 7. Common Issues & Fixes

### "Configuration Supabase manquante"
→ Check `.env` file exists and has correct values  
→ Restart dev server: `npm run dev`

### "permission denied for table properties"
→ Check migrations applied in correct order  
→ Verify RLS policies exist: `SELECT * FROM pg_policies WHERE tablename = 'properties';`

### "column does not exist"
→ Migration 034 not applied  
→ Go back to step 3 and run migration 034

### Build fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 8. Production Deployment

Before deploying:
- [ ] All migrations applied to production Supabase
- [ ] Production `.env` configured
- [ ] Admin user created
- [ ] Storage buckets created
- [ ] Auth settings configured (email, redirects)
- [ ] All tests from TESTING_GUIDE.md passed

Deploy command:
```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## 9. Next Steps

1. Configure Auth settings in Supabase dashboard:
   - Email templates (password reset, confirmation)
   - Redirect URLs (add your domain)
   - Session settings

2. Configure Storage:
   - Review bucket policies
   - Set file size limits
   - Configure allowed MIME types

3. Add sample data for testing:
   - Cities (already seeded)
   - Neighborhoods (already seeded)
   - Property types (already seeded)

4. Customize settings:
   - Site name
   - Contact info
   - Social media links

## Need Help?

1. Check TESTING_GUIDE.md for detailed testing steps
2. Review AUDIT_REPORT.md for known issues
3. Read FINAL_SUMMARY.md for complete documentation
4. Check Supabase logs in dashboard for errors
5. Review migration files for schema details

---

**Estimated Setup Time**: 15-20 minutes  
**Difficulty**: Beginner-friendly  

Good luck! 🚀
