# Supabase Migration Repair - Example Scenarios

This document provides real-world examples of using the migration repair workflow documented in the comprehensive guide.

## Scenario 1: Deprecated Migrations in Production

### Situation

You're trying to deploy to production and encounter:

```bash
$ supabase db push

Error: Found local migration files to be inserted before the last migration on remote database
Migrations to be inserted:
  - 024_sample_properties_data.sql
  
Rerun the command with --include-all to apply skipped migrations.
```

### Investigation

**Step 1**: Check what's in the migration file

```bash
$ cat supabase/migrations/024_sample_properties_data.sql
```

Output:
```sql
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

**Step 2**: Check if it's already applied in production

```sql
-- Connect to production database and run:
SELECT * FROM supabase_migrations.schema_migrations 
WHERE version LIKE '%024_sample_properties_data%';
```

Result: ✅ Migration is already applied (shows in results)

### Solution

Since the migration is:
- Already applied in production ✅
- Empty/deprecated (no-op) ✅
- Only needed for migration sequence continuity ✅

Use `migration repair`:

```bash
# Mark as applied locally (does NOT execute SQL)
supabase migration repair 024_sample_properties_data --status applied

# Verify
supabase migration list

# Now push works without error
supabase db push
```

### Why This Works

- `migration repair` updates local tracking metadata only
- Does NOT execute any SQL statements
- Aligns local state with production reality
- Safe to use for deprecated/no-op migrations

---

## Scenario 2: Multiple Empty Migrations

### Situation

Running diagnostic tool shows several empty migrations:

```bash
$ npm run check:migrations

Pending Migrations (Not Yet Applied)
----------------------------------------------------

1. 022_sample_properties.sql
   Version: 022_sample_properties
   Impact:
     - Empty migration (no changes)

2. 023_sample_properties.sql
   Version: 023_sample_properties
   Impact:
     - Empty migration (no changes)

3. 024_sample_properties.sql
   Version: 024_sample_properties
   Impact:
     - Empty migration (no changes)
```

### Investigation

**Check production status**:

```sql
SELECT version, name, inserted_at 
FROM supabase_migrations.schema_migrations 
WHERE version IN ('022_sample_properties', '023_sample_properties', '024_sample_properties')
ORDER BY version;
```

Result: All three are already applied ✅

### Solution

Repair all three at once:

```bash
# Option 1: Repair each individually
supabase migration repair 022_sample_properties --status applied
supabase migration repair 023_sample_properties --status applied
supabase migration repair 024_sample_properties --status applied

# Option 2: Use a loop (bash)
for version in 022_sample_properties 023_sample_properties 024_sample_properties; do
  supabase migration repair $version --status applied
done

# Verify all are now marked as applied
supabase migration list
```

---

## Scenario 3: Fresh Database vs Production Mismatch

### Situation

- Local development uses fresh database resets
- Production has all migrations applied
- Some old migrations are deprecated
- Want to ensure both work correctly

### Goal

- Fresh `supabase db reset` should work ✅
- Production `supabase db push` should work ✅
- No manual intervention needed ✅

### Solution

**Keep deprecated migrations as empty files**:

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

**Why this works**:

1. **Fresh database**: Empty migration applies instantly (no-op) ✅
2. **Production**: Migration is already applied, use repair once ✅
3. **Future deployments**: Everything in sync, no issues ✅

**One-time production setup**:

```bash
# Only needed once per production database
supabase migration repair 024_sample_properties_data --status applied
```

**Ongoing development**:

```bash
# Works perfectly with deprecated migrations
supabase db reset  # Fresh start, all migrations apply
supabase db push   # Works in production too
```

---

## Scenario 4: Avoiding --include-all

### Situation

Supabase CLI suggests using `--include-all`:

```bash
Error: Found local migration files to be inserted before the last migration on remote database
Rerun the command with --include-all to apply skipped migrations.
```

### Why NOT to Use --include-all

❌ **Problems with --include-all**:

1. **Reapplies migrations**: Can cause duplicate data
2. **Destructive**: May run DROP/DELETE statements again
3. **Constraint violations**: Attempting to recreate existing objects
4. **Not the real solution**: Doesn't fix the sync issue

### What --include-all Actually Does

```bash
# --include-all forces ALL pending migrations to run
# Including ones that might be "skipped" (before last applied)
# This can include migrations that were manually applied
# Or migrations that were applied in a different order
```

### The Correct Solution

```bash
# 1. Identify which migrations are "missing"
supabase migration list

# 2. Check if they're already applied in production
# (via SQL query or Supabase dashboard)

# 3. If already applied, use repair
supabase migration repair <version> --status applied

# 4. If NOT applied, they need to run
# But investigate WHY they weren't applied first
# May need manual application with review
```

---

## Scenario 5: Manual Production Change (Emergency)

### Situation

- Production issue required immediate hotfix
- Schema change made directly in production
- Now local migrations are out of sync
- Need to align without losing the fix

### What Happened

```sql
-- Emergency fix applied directly in production:
ALTER TABLE properties ADD COLUMN emergency_contact TEXT;
```

### Investigation

**Check production state**:

```sql
-- Verify column exists in production
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'emergency_contact';
```

Result: Column exists ✅

**Check local migrations**:

```bash
# No migration file for this change yet
ls supabase/migrations/*emergency*
# Not found
```

### Solution

**Step 1**: Create migration from production state

```bash
# Pull current production schema
supabase db pull

# This creates a new migration with the change
# File: supabase/migrations/20260206120000_remote_commit.sql
```

**Step 2**: Review and rename

```bash
# Review the generated migration
cat supabase/migrations/20260206120000_remote_commit.sql

# Rename to something meaningful
mv supabase/migrations/20260206120000_remote_commit.sql \
   supabase/migrations/083_add_emergency_contact.sql
```

**Step 3**: Mark as applied in production

```bash
# Since it's already in production, use repair
supabase migration repair 083_add_emergency_contact --status applied
```

**Step 4**: Commit to repository

```bash
git add supabase/migrations/083_add_emergency_contact.sql
git commit -m "feat: add emergency_contact column (from production hotfix)"
git push
```

### Lessons Learned

✅ **DO**: Document hotfixes as migrations immediately  
✅ **DO**: Use `supabase db pull` to capture production state  
✅ **DO**: Use `migration repair` for changes already in production  
❌ **DON'T**: Make schema changes in production without documenting  
❌ **DON'T**: Leave production and local state out of sync  

---

## Scenario 6: Migration Sequence Validation

### Situation

Want to ensure migrations are correctly ordered and nothing is missing.

### Using the Diagnostic Tool

```bash
# Run comprehensive migration check
npm run check:migrations
```

### Expected Output (Healthy)

```
================================================================================
🔍 Supabase Migration Diagnostic Tool
================================================================================

📊 Summary
--------------------------------------------------------------------------------
Total migrations in filesystem: 82
Total migrations applied: 82
Pending migrations: 0
Missing migrations: 0
Order issues: 0

✅ Status
--------------------------------------------------------------------------------
✓ Database migrations are healthy!
   - All 82 migrations are applied
   - No missing or skipped migrations
   - No timestamp ordering issues
```

### Output with Issues

```
📊 Summary
--------------------------------------------------------------------------------
Total migrations in filesystem: 82
Total migrations applied: 79
Pending migrations: 3
Missing migrations: 0
Order issues: 0

⏳ Pending Migrations (Not Yet Applied)
--------------------------------------------------------------------------------

1. 024_sample_properties_data.sql
   Version: 024_sample_properties_data
   Impact:
     - ⚠ Marked as DEPRECATED or NO-OP
     - Empty migration (no changes)

💡 Recommendations for Pending Migrations
--------------------------------------------------------------------------------
⚠ Found 1 deprecated/empty migrations that are pending.

If these migrations are already applied in production:
Use supabase migration repair to mark them as applied locally:

   supabase migration repair 024_sample_properties_data --status applied

This will:
   ✓ Mark the migration as applied locally
   ✓ NOT execute any SQL (safe operation)
   ✓ Align local state with production database

See documentation:
   - Quick Reference: /SUPABASE_MIGRATION_REPAIR_QUICK_REFERENCE.md
   - Comprehensive Guide: /docs/SUPABASE_MIGRATION_REPAIR_GUIDE.md
```

---

## Scenario 7: Complete Workflow - New Feature to Production

### Development Phase

```bash
# 1. Create new feature migration
supabase migration new add_featured_properties

# 2. Edit the migration
# Add your schema changes to the generated file

# 3. Test locally
supabase db reset  # Fresh start
# Verify application works

# 4. Commit
git add supabase/migrations/
git commit -m "feat: add featured properties support"
```

### Staging Deployment

```bash
# 1. Link to staging
supabase link --project-ref staging-project-ref

# 2. Push migrations
supabase db push

# 3. Verify
npm run check:migrations

# 4. Test application
# Ensure feature works in staging
```

### Production Deployment

```bash
# 1. Link to production
supabase link --project-ref production-project-ref

# 2. Backup first!
supabase db dump -f backup_$(date +%Y%m%d).sql

# 3. Check status
npm run check:migrations

# 4. If there are deprecated migrations showing:
# Use repair for ones already applied in production
supabase migration repair 024_sample_properties_data --status applied

# 5. Push new migrations
supabase db push

# 6. Verify
npm run check:migrations

# 7. Test application
# Ensure feature works in production
```

---

## Common Commands Reference

```bash
# Check migration status
supabase migration list
npm run check:migrations

# Mark migration as applied (no SQL execution)
supabase migration repair <version> --status applied

# Apply pending migrations
supabase db push

# Pull production schema
supabase db pull

# Backup database
supabase db dump -f backup.sql

# Reset local database
supabase db reset

# Check production migrations (SQL)
SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;
```

---

## Troubleshooting Quick Fixes

### "Migration already applied"

```bash
# This is GOOD - means production has it
# Use repair to sync local state
supabase migration repair <version> --status applied
```

### "Found local migration files to be inserted"

```bash
# Check if deprecated/already applied
cat supabase/migrations/<file>.sql
# If deprecated or empty, use repair
supabase migration repair <version> --status applied
```

### "Migration file not found"

```bash
# Check exact filename
ls supabase/migrations/ | grep <version>
# Use exact name with .sql extension
supabase migration repair <exact_filename_without_sql> --status applied
```

### Can't connect to database

```bash
# Link to project first
supabase link --project-ref your-project-ref

# Or provide explicit connection
supabase db push --db-url "postgresql://..."
```

---

## Best Practices Summary

✅ **DO**:
- Keep deprecated migrations as empty files with comments
- Use `migration repair` for already-applied migrations
- Test in staging before production
- Backup before migrations
- Run `npm run check:migrations` regularly
- Document why migrations are deprecated

❌ **DON'T**:
- Use `--include-all` without understanding consequences
- Delete applied migrations from filesystem
- Make manual schema changes in production
- Skip testing migrations in staging
- Ignore deprecated migration warnings

---

## Related Documentation

- **Quick Reference**: `/SUPABASE_MIGRATION_REPAIR_QUICK_REFERENCE.md`
- **Comprehensive Guide**: `/docs/SUPABASE_MIGRATION_REPAIR_GUIDE.md`
- **Supabase Setup**: `/supabase/README.md`
- **Migration Diagnostic Tool**: `/MIGRATION_DIAGNOSTIC_TOOL.md`

---

**Last Updated**: 2026-02-06
