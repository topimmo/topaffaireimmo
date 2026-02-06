# Supabase Migration Repair Guide

## Overview

This guide explains how to safely resolve Supabase migration conflicts in production when the CLI detects "missing" migrations that are actually deprecated, empty, or already applied.

## Table of Contents

1. [Understanding the Issue](#understanding-the-issue)
2. [Why This Happens](#why-this-happens)
3. [The Correct Solution](#the-correct-solution)
4. [Step-by-Step Workflow](#step-by-step-workflow)
5. [Best Practices](#best-practices)
6. [Common Scenarios](#common-scenarios)
7. [Troubleshooting](#troubleshooting)

---

## Understanding the Issue

### The Problem

When running `supabase db push` against a production database, you may encounter:

```bash
Found local migration files to be inserted before the last migration on remote database
Rerun the command with --include-all to apply skipped migrations.
```

This typically occurs when:
- Your production database has migrations already marked as applied
- Your local migration files contain deprecated/no-op migrations
- There's a mismatch between local filesystem and remote `supabase_migrations.schema_migrations` table

### What NOT to Do

❌ **DO NOT** use `--include-all` in production without understanding the consequences:
- It can reapply migrations that were already executed
- It may cause duplicate data or constraint violations
- It doesn't actually solve the underlying synchronization issue

---

## Why This Happens

### Supabase Migration Tracking

Supabase tracks applied migrations in the `supabase_migrations.schema_migrations` table:

```sql
-- Check what's recorded as applied
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version;
```

Each row contains:
- `version`: Migration filename (e.g., `20240101000000_initial_schema`)
- `name`: Human-readable name
- `statements`: SQL statements that were applied

### Common Causes

1. **Deprecated Migrations**: Files marked as deprecated but still in the filesystem
   - Example: `024_sample_properties_data.sql` (empty/no-op)

2. **Manual Database Changes**: Schema changes made directly in production that weren't captured in migrations

3. **Migration Renaming**: Migration files renamed after being applied

4. **Timestamp Conflicts**: Migrations with timestamps that suggest they should run before the last applied migration

---

## The Correct Solution

Use the **`supabase migration repair`** command to synchronize your local state with production.

### What `migration repair` Does

The repair command:
✅ Marks specific migrations as "applied" in your local tracking  
✅ Aligns local state with remote database  
✅ Does NOT execute any SQL  
✅ Does NOT modify the database schema  
✅ Safe to run - it only updates metadata  

### When to Use It

Use `supabase migration repair` when:
- Migrations are already applied in production
- You need to align local migration history with remote
- You want to skip deprecated/no-op migrations
- Manual schema changes were made in production

---

## Step-by-Step Workflow

### Step 1: Identify the Mismatch

First, understand what's different between local and remote:

```bash
# Check your local migrations
ls -1 supabase/migrations/*.sql | wc -l

# Connect to production and check applied migrations
supabase db pull --dry-run
```

Or query production directly:

```sql
-- Count applied migrations in production
SELECT COUNT(*) FROM supabase_migrations.schema_migrations;

-- List all applied migrations
SELECT version, name 
FROM supabase_migrations.schema_migrations 
ORDER BY version;
```

### Step 2: Verify Which Migrations Are Missing

Compare local files with remote records:

```bash
# List local migration files
ls -1 supabase/migrations/

# Example output showing deprecated files:
# 022_sample_properties.sql         (empty)
# 023_sample_properties.sql         (empty)
# 024_sample_properties.sql         (empty/deprecated)
# 024_sample_properties_data.sql    (deprecated - see comments)
```

Check each "missing" migration:

```bash
# View contents of suspected migrations
cat supabase/migrations/024_sample_properties_data.sql
```

If it contains only comments or is empty, it's safe to mark as applied.

### Step 3: Use Migration Repair

For each deprecated/no-op migration that's already applied in production:

```bash
# Repair a single migration
supabase migration repair <version> --status applied

# Example:
supabase migration repair 20231201120000 --status applied
```

**Important**: Use the full timestamp version from the filename, not the short name.

To find the timestamp format:

```bash
# Supabase uses timestamps in migration filenames
# Format: YYYYMMDDHHMMSS_description.sql
# Example: 20240115103045_sample_properties_data.sql

# If your migrations use sequential numbers instead:
# You may need to create timestamp-based migrations first
# See "Migrating from Sequential to Timestamp Format" below
```

### Step 4: Verify the Repair

After running repair, verify:

```bash
# Check local status
supabase migration list

# Should show repaired migrations as "applied" locally
```

### Step 5: Push New Migrations

Now you can safely push new migrations:

```bash
# This should now work without the error
supabase db push
```

---

## Best Practices

### 1. Keep Production Schema Unchanged

**Golden Rule**: Never modify production schema directly unless absolutely necessary.

✅ **Do**:
- Create migrations for all schema changes
- Test migrations in staging first
- Use `migration repair` to align state

❌ **Don't**:
- Make manual schema changes in production
- Use `--include-all` without understanding consequences
- Delete applied migrations from filesystem

### 2. Handle Deprecated Migrations Properly

When you want to deprecate a migration:

**Option A: Keep Empty Migration (Recommended)**

```sql
-- supabase/migrations/024_sample_properties_data.sql
-- =====================================================
-- Migration 024_sample_properties_data: (DEPRECATED)
-- =====================================================
-- This migration previously contained demo/seed data.
-- All demo data has been moved to: supabase/seed/seed_demo_data.sql
-- 
-- This file is kept empty to maintain migration numbering.
-- This is a no-op migration and is safe to apply.
-- =====================================================
```

**Why**: 
- Maintains migration sequence
- Safe to apply (no-op)
- Documents the history
- Won't cause issues in fresh deployments

**Option B: Mark as Applied via Repair**

If the migration is already applied in production but you want to clean up locally:

```bash
# Mark as applied without executing
supabase migration repair <version> --status applied
```

### 3. Separate Schema from Data

✅ **Migrations**: Schema changes only (tables, columns, indexes, RLS, functions)  
✅ **Seed Files**: Demo/test data only  

**Example Structure**:

```
supabase/
├── migrations/           # Schema only
│   ├── 001_initial_schema.sql
│   ├── 024_sample_properties.sql         (empty - deprecated)
│   └── 082_latest_feature.sql
└── seed/                 # Data only
    └── seed_demo_data.sql
```

### 4. Document Migration Purpose

Always add comments to migrations:

```sql
-- =====================================================
-- Migration: Add Contact Visibility Features
-- Purpose: Allows advertisers to hide phone/WhatsApp
-- Dependencies: Requires properties table
-- =====================================================

ALTER TABLE properties 
ADD COLUMN contact_visibility JSONB DEFAULT '{"phone": true, "whatsapp": true}'::jsonb;

-- RLS policies...
```

### 5. Version Control Best Practices

```bash
# Always commit migrations
git add supabase/migrations/
git commit -m "feat: add contact visibility migration"

# Never edit applied migrations
# Instead, create a new migration to fix issues
```

### 6. Testing Workflow

```bash
# 1. Test locally first
supabase db reset           # Fresh start
supabase db push            # Apply all migrations

# 2. Test in staging
supabase link --project-ref staging-project-id
supabase db push

# 3. Apply to production only after successful staging tests
supabase link --project-ref production-project-id
supabase db push
```

---

## Common Scenarios

### Scenario 1: Empty/No-Op Migrations Already Applied

**Situation**: 
- Production has `024_sample_properties_data.sql` marked as applied
- Local file is empty or contains only comments
- CLI says migration is "missing"

**Solution**:

```bash
# 1. Verify the migration is truly empty
cat supabase/migrations/024_sample_properties_data.sql

# 2. If it's a no-op, mark as applied locally
supabase migration repair 024_sample_properties_data --status applied

# 3. Verify
supabase migration list
```

### Scenario 2: Deprecated Seed Data Migrations

**Situation**: 
- Old migrations contained INSERT statements for demo data
- Data has been moved to `supabase/seed/` directory
- Migrations are now empty but still needed for sequence

**Solution**:

```bash
# 1. Keep the empty migration files
# They maintain the sequence and are safe to apply

# 2. If already applied in production, use repair
supabase migration repair 022_sample_properties --status applied
supabase migration repair 023_sample_properties --status applied
supabase migration repair 024_sample_properties --status applied

# 3. Document in the file that it's deprecated
```

Example empty migration:

```sql
-- This migration is deprecated
-- Demo data moved to supabase/seed/seed_demo_data.sql
-- Kept for migration sequence continuity
```

### Scenario 3: Multiple Migrations Out of Sync

**Situation**: 
- Several migrations show as "missing" or "pending"
- They're all already applied in production
- You need to sync them all at once

**Solution**:

```bash
# 1. Get list of applied migrations from production
supabase db remote commit

# This creates local migration files for everything in production

# 2. Or manually repair each one
for migration in 022 023 024; do
  supabase migration repair "${migration}_sample_properties" --status applied
done
```

### Scenario 4: Fresh Database vs Production

**Situation**: 
- You want migrations to work for both fresh installations and production updates
- Some migrations are no-ops in production but needed for fresh installs

**Solution**:

Use idempotent migrations:

```sql
-- Safe to run multiple times
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS contact_visibility JSONB 
DEFAULT '{"phone": true, "whatsapp": true}'::jsonb;

-- Check if already exists before creating
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_properties_status'
  ) THEN
    CREATE INDEX idx_properties_status ON properties(status);
  END IF;
END
$$;
```

---

## Troubleshooting

### Issue: "Migration already applied"

**Error**:
```bash
Error: migration "024_sample_properties" is already applied
```

**Solution**:
```bash
# The migration is already in the database
# Use repair to mark as applied locally
supabase migration repair 024_sample_properties --status applied
```

### Issue: "Migration file not found"

**Error**:
```bash
Error: migration file "024_sample_properties.sql" not found
```

**Solution**:
```bash
# Verify the file exists
ls supabase/migrations/024_sample_properties.sql

# Check the exact filename (case-sensitive)
ls -1 supabase/migrations/ | grep 024

# Use the exact filename with extension
supabase migration repair 024_sample_properties.sql --status applied
```

### Issue: Timestamp Format Mismatch

**Error**:
```bash
Error: migration version must be in format YYYYMMDDHHMMSS
```

**Solution**:

This project uses sequential numbering (`001_`, `024_`, etc.) instead of timestamps.

If Supabase CLI requires timestamps, you may need to check the actual migration tracking:

```sql
-- Check how migrations are tracked in your database
SELECT version, name FROM supabase_migrations.schema_migrations LIMIT 5;

-- If they use timestamps, you'll see:
-- version: 20240115103045
-- name: sample_properties_data

-- If they use sequential numbers, you'll see:
-- version: 024
-- name: sample_properties_data
```

Then use the correct format:
```bash
# If timestamps are required
supabase migration repair 20240115103045 --status applied

# If sequential numbers are used
supabase migration repair 024_sample_properties_data --status applied
```

### Issue: "No migrations to repair"

**Error**:
```bash
No pending migrations found
```

**Cause**: 
- Local and remote are already synchronized
- OR you're not in the correct directory
- OR Supabase isn't linked to the project

**Solution**:
```bash
# 1. Ensure you're in the project root
cd /path/to/project

# 2. Verify Supabase is linked
supabase link --project-ref your-project-ref

# 3. Check status
supabase migration list
```

### Issue: Cannot Connect to Production

**Error**:
```bash
Error: failed to connect to database
```

**Solution**:
```bash
# 1. Verify your .env or environment variables
echo $SUPABASE_DB_PASSWORD

# 2. Check your supabase/config.toml
cat supabase/config.toml | grep db_url

# 3. Link explicitly with connection string
supabase link --project-ref your-project-ref
supabase db push --db-url "postgresql://user:pass@host:5432/postgres"
```

---

## Migration Repair Command Reference

### Basic Syntax

```bash
supabase migration repair <version> [flags]
```

### Common Flags

- `--status applied`: Mark migration as applied (most common)
- `--status reverted`: Mark migration as reverted (rarely used)
- `--db-url`: Specify database connection string
- `--password`: Database password (if not in env)

### Examples

```bash
# Mark single migration as applied
supabase migration repair 20240115103045 --status applied

# Mark multiple migrations
supabase migration repair 20240115103045 --status applied
supabase migration repair 20240115103046 --status applied

# Repair with explicit database URL
supabase migration repair 20240115103045 \
  --status applied \
  --db-url "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

---

## Validation Queries

After repairing migrations, use these queries to validate:

### Check Applied Migrations

```sql
-- List all applied migrations
SELECT 
  version,
  name,
  inserted_at
FROM supabase_migrations.schema_migrations
ORDER BY version;
```

### Count Migrations

```sql
-- Compare counts
SELECT 
  'Database' as location,
  COUNT(*) as migration_count
FROM supabase_migrations.schema_migrations
UNION ALL
SELECT 
  'Expected' as location,
  82 as migration_count;  -- Update with your total count
```

### Find Missing Migrations

This would need to be done programmatically, but you can check specific versions:

```sql
-- Check if specific migration is applied
SELECT EXISTS(
  SELECT 1 
  FROM supabase_migrations.schema_migrations 
  WHERE version = '024_sample_properties_data'
) as is_applied;
```

### Verify Schema Integrity

```sql
-- Check that expected tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify RLS is enabled on all public tables
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## Production Deployment Checklist

Before deploying migrations to production:

- [ ] **Backup Database**
  ```bash
  # Via Supabase Dashboard or CLI
  supabase db dump -f backup_$(date +%Y%m%d).sql
  ```

- [ ] **Test in Staging**
  ```bash
  supabase link --project-ref staging-ref
  supabase db push
  # Verify application works correctly
  ```

- [ ] **Review Migration Content**
  ```bash
  # Check what will be executed
  cat supabase/migrations/latest_migration.sql
  ```

- [ ] **Check for Deprecated Migrations**
  ```bash
  # Look for empty or commented-out migrations
  for f in supabase/migrations/*.sql; do
    if [ ! -s "$f" ] || grep -q "DEPRECATED" "$f"; then
      echo "Deprecated: $f"
    fi
  done
  ```

- [ ] **Verify No Conflicts**
  ```bash
  supabase db push --dry-run
  ```

- [ ] **Apply to Production**
  ```bash
  supabase link --project-ref production-ref
  supabase db push
  ```

- [ ] **Validate Deployment**
  ```bash
  # Run validation queries
  # Test critical application features
  ```

- [ ] **Document Any Issues**
  ```bash
  # Note any migrations that required repair
  # Update this documentation if needed
  ```

---

## Summary

### Key Takeaways

1. ✅ Use `supabase migration repair` to align local state with production
2. ✅ Keep deprecated migrations as empty files for sequence continuity
3. ✅ Never use `--include-all` without understanding the implications
4. ✅ Separate schema (migrations) from data (seed files)
5. ✅ Test migrations in staging before production
6. ✅ Always backup before applying migrations
7. ✅ Document deprecated migrations clearly

### Quick Reference

```bash
# Identify mismatch
supabase migration list

# Check production state
supabase db pull --dry-run

# Repair deprecated migration
supabase migration repair 024_sample_properties_data --status applied

# Verify repair
supabase migration list

# Push new migrations
supabase db push
```

---

## Additional Resources

- [Supabase Migration Documentation](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [Migration Best Practices](https://supabase.com/docs/guides/cli/managing-environments)
- Project-specific: See `supabase/README.md` for schema documentation
- Project-specific: See `MIGRATION_DIAGNOSTIC_TOOL.md` for diagnostic utilities

---

**Last Updated**: 2026-02-06  
**Applies to**: Supabase CLI v1.x, TopAffaireImmo project  
**Maintainer**: Development Team  
