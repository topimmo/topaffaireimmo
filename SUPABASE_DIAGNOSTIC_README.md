# Supabase Diagnostic & Repair Guide

**Quick Start for Fresh Supabase Project Setup**

---

## 🚀 Quick Setup (5 minutes)

If you just created a fresh Supabase project and need to apply migrations:

```bash
# 1. Run diagnostic (optional but recommended)
npm run diagnose:supabase

# 2. Link to your project
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_ID

# 3. Apply all migrations
npx supabase db push

# 4. Setup environment
cp .env.example .env
# Edit .env with your Supabase credentials

# 5. Start development
npm install
npm run dev
```

**Done!** Your Supabase backend is now configured.

---

## 📚 Documentation

This repository includes comprehensive Supabase diagnostic tools:

### Core Documents

1. **[DIAGNOSTIC_REPORT.md](./DIAGNOSTIC_REPORT.md)** (26KB)
   - Complete analysis of all 113 migrations
   - Schema drift checks
   - RLS/Auth/Permissions verification
   - Storage buckets checklist
   - Environment variable requirements
   - Known issues and fixes

2. **[NEXT_ACTIONS.md](./NEXT_ACTIONS.md)** (8KB)
   - Step-by-step setup guide for fresh projects
   - Troubleshooting common issues
   - Quick reference commands
   - Success checklist

### Diagnostic Tools

#### TypeScript Diagnostic (Recommended)

```bash
npm run diagnose:supabase
# or
npx tsx scripts/diagnose-supabase.ts
```

**Features**:
- Lists all local migrations (113 files)
- Detects duplicate versions and gaps
- Searches for known issues
- Generates SQL queries to check remote state
- Provides actionable next steps

**Output**: Colored terminal output with warnings and recommendations.

#### Bash Diagnostic (Simpler)

```bash
./scripts/diagnose-supabase.sh
```

**Features**:
- Quick migration count
- Checks for known issues (site_settings, auth.users)
- Environment variable validation
- Essential SQL queries

**Use when**: You prefer a simpler shell script or don't have Node.js/TypeScript setup.

---

## 🔧 What Was Fixed

### Issue 1: site_settings "description" Column

**Problem**: Migration `074_fix_site_settings_contact_fields.sql` referenced a `description` column that doesn't exist. The table actually has `description_fr` and `description_ar`.

**Error**: 
```
ERROR: column "description" does not exist in table "site_settings"
```

**Solution**: ✅ Fixed in this PR
- Changed migration 074 to use `description_fr` instead of `description`
- Migration now applies successfully

**Files Changed**:
- `supabase/migrations/074_fix_site_settings_contact_fields.sql`

### Issue 2: Missing Diagnostic Tools

**Problem**: No easy way to diagnose migration issues, schema drift, or configuration problems.

**Solution**: ✅ Added in this PR
- Created comprehensive diagnostic report
- Implemented TypeScript diagnostic script
- Implemented Bash diagnostic script
- Added npm script: `npm run diagnose:supabase`

**Files Added**:
- `DIAGNOSTIC_REPORT.md`
- `NEXT_ACTIONS.md`
- `scripts/diagnose-supabase.ts`
- `scripts/diagnose-supabase.sh`
- `package.json` (added script)

---

## 📊 Migration Overview

### Statistics

- **Total Migrations**: 113 SQL files
- **Version Range**: 001 to 114
- **Empty Migrations**: 3 (deprecated, kept for continuity)
- **Duplicate Versions**: 9 version numbers with multiple files
- **Version Gaps**: 12 numbers (6-9, 12-19) - expected from consolidation

### Key Migrations

- **001-010**: Initial schema and early iterations
- **020**: Full rebuild (main schema creation)
- **021**: Storage buckets
- **050**: Admins table and RLS
- **074**: Site settings contact fields (**now fixed**)
- **086**: OTP attempts (phone auth)
- **087**: Google OAuth support
- **088-107**: Services module (artisans, requests, reviews)
- **108-114**: Security hardening, performance indexes, monitoring

### Duplicate Versions

The following version numbers have multiple files (generally safe with `npx supabase db push`):

- Version 033: 3 files (advertising_inquiries, final_fixes, profile_trigger_rls)
- Version 042: 2 files (advertiser_type_default, production_fixes)
- Version 043: 2 files (image_upload_permissions, security_definer_functions)
- Version 079: 3 files (rollback, security_remediation, validation_queries)
- Version 089: 2 files (monetization_tables, home_services_zones)
- Version 093: 2 files (artisan_neighborhoods_join, migrate_to_join)
- Version 109: 2 files (performance_indexes, verification_tests)
- Version 112: 2 files (missing_indexes, verify_indexes)

---

## 🛡️ Safety Checklist

Before applying migrations to production:

- [ ] Backup your database first
- [ ] Run diagnostic script locally
- [ ] Review `DIAGNOSTIC_REPORT.md`
- [ ] Test migrations on a staging/test project
- [ ] Never use `npx supabase db reset` in production (deletes all data!)
- [ ] Use migration repair for already-applied migrations
- [ ] Monitor Supabase logs after deployment

---

## 🧪 Testing

After applying migrations, verify:

### Database Schema
```sql
-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Check site_settings columns (should have description_fr, description_ar)
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'site_settings'
ORDER BY ordinal_position;
```

### RLS Status
```sql
-- All tables should have RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' ORDER BY tablename;
```

### Applied Migrations
```sql
-- Check what migrations were applied
SELECT version, name, executed_at 
FROM supabase_migrations.schema_migrations
ORDER BY version;
```

---

## 📖 Additional Resources

### In This Repository

- `supabase/README.md` - Complete Supabase setup guide
- `supabase/BACKEND_DOCUMENTATION.md` - API reference and RPC functions
- `supabase/SECURITY_POLICIES.md` - RLS policies and permissions
- `supabase/DEPLOYMENT_GUIDE.md` - Production deployment steps

### Official Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🆘 Troubleshooting

### Common Issues

**"migration already exists on remote"**
- Safe to ignore when using `npx supabase db push`
- Or use: `npx supabase migration repair <version> --status applied`

**"column does not exist"**
- ✅ Fixed: Migration 074 now uses correct column names
- Run diagnostic to check for other issues: `npm run diagnose:supabase`

**"permission denied" / "must be owner of relation users"**
- Never modify `auth.users` table directly
- Use triggers (already set up) and modify `public.profiles` instead

**"row-level security policy" errors in app**
- Check RLS policies in Supabase Dashboard
- Verify user is authenticated
- Review policies for the affected table

**Storage upload failures**
- Verify buckets exist: Supabase Dashboard → Storage
- Check storage policies on `storage.objects`
- Run: `node scripts/setup-storage-buckets.js`

---

## 🎯 Success Indicators

You'll know everything is working when:

- ✅ `npm run diagnose:supabase` shows no critical errors
- ✅ All 113 migrations applied successfully
- ✅ Schema checks pass (tables exist with correct columns)
- ✅ User signup creates profile automatically
- ✅ Properties can be created and viewed
- ✅ Image uploads work
- ✅ No console errors in browser
- ✅ No permission denied errors in Supabase logs

---

## 💡 Quick Tips

### For Development

```bash
# Always run diagnostic before making changes
npm run diagnose:supabase

# Generate TypeScript types after schema changes
npm run types:supabase

# Check migrations locally before pushing
npx supabase db diff

# View local database
npx supabase db push --dry-run
```

### For Production

```bash
# ALWAYS backup first
npx supabase db dump -f backup-$(date +%Y%m%d).sql

# Check what will be applied
npx supabase db push --dry-run

# Apply migrations
npx supabase db push

# Verify in Supabase Dashboard
# → SQL Editor → Run verification queries from DIAGNOSTIC_REPORT.md
```

---

## 🎉 Ready to Go!

Your Supabase project is now diagnosed and ready for a fresh setup. Follow the steps in [NEXT_ACTIONS.md](./NEXT_ACTIONS.md) for detailed instructions.

For comprehensive analysis, see [DIAGNOSTIC_REPORT.md](./DIAGNOSTIC_REPORT.md).

**Need Help?**
- Run: `npm run diagnose:supabase`
- Check: `DIAGNOSTIC_REPORT.md` → Section G (Troubleshooting)
- Read: `NEXT_ACTIONS.md` → Troubleshooting section
