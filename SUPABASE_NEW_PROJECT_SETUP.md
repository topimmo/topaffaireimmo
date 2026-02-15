# Supabase New Project Setup Guide

## 📋 Overview

This guide provides step-by-step instructions for setting up a **new** Supabase project from scratch using the existing schema and migrations in this repository.

---

## 1️⃣ Locate Supabase Schema Storage

### Migration Files Location

**Primary Source of Truth**: `/supabase/migrations/`

The repository contains **114 migration files** (001 through 114) that define the complete database schema.

#### Migration File Structure:

```
/supabase/migrations/
├── 001_initial_schema.sql              # Initial database schema
├── 002_banner_advertising.sql          # Banner advertising tables
├── 003-009_*.sql                       # Early iterations
├── 010_full_rebuild.sql                # First major rebuild
├── 020_full_rebuild.sql                # Second major rebuild
├── 021-082_*.sql                       # Incremental schema updates
├── 083-113_*.sql                       # Features: SEO, OTP, Services, Security
└── 114_complete_backend_features.sql   # Final production-ready features
```

#### Key Migrations by Number:
- **001-010**: Initial schema and early iterations
- **020-024**: Full rebuild (024 files are deprecated - data moved to seed)
- **025-032**: Profile trigger fixes and RLS policies
- **033-052**: Admin system, security fixes, advertising
- **053-082**: CMS, featured properties, contact privacy
- **083-113**: SEO guides, OTP, Google OAuth, Services module, Security hardening, Performance indexes
- **114**: Complete backend features (notifications, boosts, search)

#### Deprecated/Empty Migrations:
These are safe no-ops but kept for sequence continuity:
- `022_sample_properties.sql` - Empty
- `023_sample_properties.sql` - Empty
- `024_sample_properties.sql` - Empty (458 bytes, placeholder)
- `024_sample_properties_data.sql` - Deprecated (464 bytes)
- `032_final_cleanup.sql` - Empty

### Seed Data Location

**Location**: `/supabase/seed/seed_demo_data.sql`

⚠️ **IMPORTANT**: Seed data is for **local development only**. DO NOT run in production.

Contains:
- 1 demo admin profile
- 8 sample property listings

### Edge Functions Location

**Location**: `/supabase/functions/`

Functions available:
- `reveal-phone/` - Phone number reveal system
- `send-facebook-webhook/` - Facebook integration
- `send-push-notification/` - Push notifications
- `stripe-webhook/` - Stripe payment webhooks

### Email Templates Location

**Location**: `/supabase/templates/`

Templates:
- `confirmation.html` - Email confirmation
- `email_change.html` - Email change notification
- `invite.html` - User invitation
- `magic_link.html` - Magic link login
- `recovery.html` - Password recovery

### Database Schema Summary

**Total**: 23,075 lines of SQL across 114 migrations

Key tables created:
- User Management: `profiles`, `admins`, `admin_audit_logs`
- Real Estate: `properties`, `property_images`, `cities`, `neighborhoods`, `property_types`
- Advertising: `banner_slots`, `banner_requests`, `payments`
- Services: `artisan_profiles`, `service_categories`, `service_requests`, `reviews`
- CMS: `site_settings`, `site_pages`, `site_categories`, `promo_banners`
- Features: `notifications`, `boost_plans`, `property_boosts`, `phone_reveal_events`, `push_subscriptions`
- Security: `otp_attempts`, `admin_notifications`

---

## 2️⃣ Clean Old Supabase Linkage/Config

### Files to Check/Clean

#### ✅ No Old Config Files Found

Good news! The repository is already clean:
- ✅ No `.supabase/` directory (would contain old project linkage)
- ✅ No `config.toml` in root (Supabase CLI config)
- ✅ No hardcoded project refs in code
- ✅ `.env` is in `.gitignore` (so no old credentials committed)

#### Files That Reference Supabase (Safe - Use Env Vars)

These files correctly use environment variables:
- `.env.example` - Template for environment variables
- Source code files use `import.meta.env.VITE_SUPABASE_URL`

#### What You Need to Do

1. **DO NOT commit `.env` file** (already in `.gitignore`)
2. **DO NOT create `.supabase/` directory** (will be created by CLI automatically)
3. **Ensure you have no local `.env` file** with old project credentials:
   ```bash
   # Check if .env exists
   ls -la .env
   
   # If it exists and has old credentials, delete it
   rm .env
   ```

---

## 3️⃣ Prepare the Minimal "NOW" Package

### Exact Files to Apply to New Project

#### Step 1: Schema Migrations (Required)

**Apply in order**: All 114 migration files from `/supabase/migrations/`

```bash
# These will be applied automatically by: npx supabase db push
/supabase/migrations/001_initial_schema.sql
/supabase/migrations/002_banner_advertising.sql
...
/supabase/migrations/114_complete_backend_features.sql
```

**Total**: 114 files, 23,075 lines of SQL

#### Step 2: Seed Data (Optional - Local Dev Only)

**File**: `/supabase/seed/seed_demo_data.sql`

⚠️ **Only for local development/testing** - DO NOT run in production

#### Step 3: Edge Functions (Optional)

**Deploy separately** after schema is set up:

```bash
npx supabase functions deploy reveal-phone
npx supabase functions deploy send-facebook-webhook
npx supabase functions deploy send-push-notification
npx supabase functions deploy stripe-webhook
```

### What Gets Applied

When you run `npx supabase db push`, it will create:

1. **Extensions**:
   - `pgcrypto` (UUIDs and encryption)
   - `pg_trgm` (text search)
   - `unaccent` (search normalization)

2. **Tables** (30+ tables including):
   - User management
   - Properties and listings
   - Advertising and banners
   - Services and artisans
   - CMS and site settings
   - Notifications and monitoring

3. **Functions** (40+ SQL functions including):
   - `handle_new_user()` - Auto-create profiles
   - `check_user_role()` - Role-based access
   - `search_properties()` - Full-text search
   - `approve_property()` - Property moderation
   - `mark_notification_read()` - Notification management
   - And many more...

4. **Triggers**:
   - Profile creation on signup
   - Updated_at timestamps
   - Facebook webhook notifications

5. **RLS Policies** (100+ policies):
   - All tables have Row Level Security enabled
   - Policies for users, admins, and public access

6. **Indexes** (50+ indexes):
   - Performance optimization
   - Search optimization
   - Foreign key indexes

7. **Storage Buckets**:
   - `property-images` (public)
   - `avatars` (public)
   - `payment-receipts` (private)
   - `banner-images` (public)
   - `agency-logos` (public)

---

## 4️⃣ Command Sequence for Codespaces

### Prerequisites

1. You have a **new Supabase project** created at https://app.supabase.com
2. You are in **GitHub Codespaces** (or any Linux environment)
3. You have this repository cloned

### Step-by-Step Commands

Copy and paste these commands exactly:

#### Step 1: Install Supabase CLI

```bash
# Using npx (no installation needed)
npx supabase --version

# Expected output: CLI version number (e.g., 1.x.x)
```

#### Step 2: Login to Supabase

```bash
# Login via access token (recommended for Codespaces)
npx supabase login

# This will output:
# "You can generate an access token from https://app.supabase.com/account/tokens"
# "Enter your access token:"
```

**What to do**:
1. Open https://app.supabase.com/account/tokens in a new browser tab
2. Click **"Generate new token"**
3. Give it a name (e.g., "Codespaces")
4. Copy the token
5. Paste it into the terminal (it won't show as you type)
6. Press Enter

**Expected output**:
```
Finished supabase login.
```

#### Step 3: Link to Your New Project

```bash
# Link to project (interactive)
npx supabase link

# This will:
# 1. List all your Supabase projects
# 2. Ask you to select one (use arrow keys)
# 3. Ask for database password (from your project settings)
```

**What to do**:
1. Use **arrow keys** to select your new project
2. Press **Enter**
3. Enter your database password when prompted
   - Find it in: Supabase Dashboard → Settings → Database → Database password
   - Or reset it if you don't have it

**Expected output**:
```
Finished supabase link.
Local config differs from linked project. Try updating supabase/config.toml
```

**Alternative - Link with project ref** (if interactive doesn't work):

```bash
# Find your project ref at: https://app.supabase.com/project/YOUR_PROJECT/settings/general
# It looks like: abcdefghijklmnop

npx supabase link --project-ref YOUR_PROJECT_REF

# Then enter database password when prompted
```

#### Step 4: Push Schema to New Project

```bash
# Push all migrations to the new project
npx supabase db push

# This will:
# 1. Show you which migrations will be applied
# 2. Ask for confirmation
# 3. Apply all 114 migrations in order
# 4. Create all tables, functions, policies, etc.
```

**Expected output**:
```
Applying migration 001_initial_schema.sql...
Applying migration 002_banner_advertising.sql...
...
Applying migration 114_complete_backend_features.sql...
Finished supabase db push.
```

**⏱️ Time**: 2-5 minutes depending on connection speed

**⚠️ If you get errors**:
- Read the error message carefully
- Most common issue: migration already applied (safe to ignore)
- Use `npx supabase migration list` to check status

#### Step 5: Verify Deployment

**Option A: Check via CLI**

```bash
# List all tables
npx supabase db remote --table-list

# Expected output: List of 30+ tables
```

**Option B: Check via SQL**

```bash
# Run a verification query
echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | npx supabase db execute

# Expected output: Should show ~30+ tables
```

**Option C: Check via Dashboard** (Recommended)

1. Open your Supabase Dashboard: https://app.supabase.com/project/YOUR_PROJECT
2. Go to **Table Editor** → Should see all tables
3. Go to **SQL Editor** → Run this query:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should return ~30+ tables including:
-- admins, admin_audit_logs, artisan_profiles, banner_requests,
-- cities, neighborhoods, notifications, properties, etc.
```

4. Go to **Storage** → Should see 5 buckets:
   - `property-images`
   - `avatars`
   - `payment-receipts`
   - `banner-images`
   - `agency-logos`

#### Step 6: Create First Admin User (Optional)

1. Sign up a user via your app or Supabase Dashboard
2. Go to **SQL Editor** in Dashboard
3. Run:

```sql
-- Get your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Add to admins table (replace with your user ID)
INSERT INTO public.admins (user_id, is_active, role)
VALUES ('YOUR_USER_ID_HERE', true, 'super_admin');

-- Verify
SELECT a.user_id, p.email, a.role, a.is_active
FROM public.admins a
JOIN public.profiles p ON p.id = a.user_id;
```

#### Step 7: Deploy Edge Functions (Optional)

```bash
# Set environment variables first (in Supabase Dashboard)
# Settings → Edge Functions → Add secret

# Then deploy functions
npx supabase functions deploy reveal-phone
npx supabase functions deploy stripe-webhook
npx supabase functions deploy send-facebook-webhook
npx supabase functions deploy send-push-notification

# Expected output for each:
# Deploying function...
# Deployed function successfully
```

#### Step 8: Configure Frontend Environment Variables

Create a `.env` file in your project root:

```bash
# Copy from example
cp .env.example .env

# Edit .env with your new project details
nano .env
```

Add your new Supabase project credentials:

```bash
# Get these from: https://app.supabase.com/project/YOUR_PROJECT/settings/api

VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_new_anon_key_here

# Other required vars
VITE_SITE_URL=https://www.topaffaireimmo.com
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com

# Optional: Sentry, analytics, etc. (see .env.example)
```

---

## 5️⃣ Verification Steps

### Database Verification

```sql
-- Run in Supabase SQL Editor

-- 1. Check total tables
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Expected: ~30+

-- 2. Check RLS is enabled
SELECT COUNT(*) as tables_without_rls
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;
-- Expected: 0 (all should have RLS)

-- 3. Check storage buckets
SELECT id, name, public 
FROM storage.buckets
ORDER BY name;
-- Expected: 5 buckets

-- 4. Check functions exist
SELECT COUNT(*) as total_functions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';
-- Expected: 40+

-- 5. Check extensions
SELECT extname, extversion
FROM pg_extension
WHERE extname IN ('pgcrypto', 'pg_trgm', 'unaccent');
-- Expected: All 3 extensions
```

### Application Verification

1. **Test Authentication**:
   - Try signing up a new user
   - Check if profile is auto-created
   - Verify in: Table Editor → profiles

2. **Test Property Creation**:
   - Create a test property via your app
   - Check in: Table Editor → properties
   - Verify RLS is working (can't see other users' drafts)

3. **Test Storage**:
   - Upload a test image
   - Check in: Storage → property-images
   - Verify public access works

---

## 6️⃣ Troubleshooting

### Issue: "Found local migration files to be inserted before..."

**Cause**: Migrations are already applied to the database

**Solution 1**: Fresh start (recommended for new project)
```bash
# This should NOT happen with a brand new project
# If it does, verify you linked to the correct project
npx supabase link --project-ref YOUR_PROJECT_REF
```

**Solution 2**: Mark migrations as applied
```bash
# Only if migrations are actually already in the database
npx supabase migration repair 001_initial_schema --status applied
npx supabase migration repair 002_banner_advertising --status applied
# ... etc
```

### Issue: "permission denied for schema public"

**Cause**: Database user doesn't have permissions

**Solution**: Reset database password and try again
1. Go to: Dashboard → Settings → Database
2. Click **"Reset database password"**
3. Copy new password
4. Run `npx supabase link` again with new password

### Issue: Migration fails with SQL error

**Cause**: Specific migration has an issue

**Solution**:
1. Read the error message carefully
2. Check which migration failed
3. Check if objects already exist
4. Apply migrations one by one to isolate the issue

```bash
# Apply single migration
cat supabase/migrations/001_initial_schema.sql | npx supabase db execute
```

### Issue: Edge function deployment fails

**Cause**: Missing Deno runtime or function code issues

**Solution**:
1. Ensure you have the latest Supabase CLI
2. Check function code for syntax errors
3. Test function locally first:

```bash
npx supabase functions serve reveal-phone
```

---

## 7️⃣ Production Checklist

Before going live with the new project:

- [ ] All 114 migrations applied successfully
- [ ] All tables exist (verify with SQL)
- [ ] RLS enabled on all tables
- [ ] Storage buckets created and configured
- [ ] Edge functions deployed
- [ ] Environment variables set (SMTP, Stripe, etc.)
- [ ] Admin user created
- [ ] Authentication tested (signup, login, reset password)
- [ ] Email delivery tested
- [ ] Storage upload/download tested
- [ ] Property creation tested
- [ ] Payment webhook tested (if using Stripe)
- [ ] Database backup scheduled (Supabase Dashboard → Settings → Database → Backups)

---

## 8️⃣ Summary

### Single Source of Truth

**`/supabase/migrations/`** = Complete database schema (114 files, 23,075 lines)

### Quick Setup Commands

```bash
# 1. Login
npx supabase login

# 2. Link to new project
npx supabase link

# 3. Push schema
npx supabase db push

# 4. Verify
echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | npx supabase db execute

# 5. Configure .env
cp .env.example .env
# Then edit .env with your new project credentials
```

### What You Get

- ✅ 30+ tables with complete schema
- ✅ 40+ SQL functions
- ✅ 100+ RLS policies
- ✅ 50+ performance indexes
- ✅ 5 storage buckets
- ✅ Full-text search
- ✅ User authentication
- ✅ Property management
- ✅ Admin system
- ✅ Services marketplace
- ✅ Notifications
- ✅ Payment integration ready

---

## 9️⃣ Additional Resources

### Documentation in This Repo

- **Main README**: `/supabase/README.md`
- **Backend Docs**: `/supabase/BACKEND_DOCUMENTATION.md`
- **Security Policies**: `/supabase/SECURITY_POLICIES.md`
- **Deployment Guide**: `/supabase/DEPLOYMENT_GUIDE.md`
- **Edge Functions**: `/supabase/functions/README.md`

### External Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🎉 You're Done!

Your new Supabase project is now set up with the complete TopAffaireImmo schema.

**Next steps**:
1. Update your frontend `.env` with the new project credentials
2. Deploy your frontend to Vercel/hosting
3. Test all features
4. Configure SMTP for production emails
5. Set up monitoring and alerts

**Questions?** Check the documentation or create an issue in the repository.
