# Supabase Migration Repair - Quick Reference

**Quick fix for:** "Found local migration files to be inserted before the last migration on remote database"

## TL;DR - Fast Fix

```bash
# 1. Check what's different
supabase migration list

# 2. For each deprecated/empty migration already in production:
supabase migration repair <version> --status applied

# 3. Verify and push
supabase migration list
supabase db push
```

---

## Common Scenarios

### Scenario: Empty/Deprecated Migration Already Applied

**Problem**: Migration like `024_sample_properties_data.sql` is empty/deprecated but CLI thinks it's missing.

**Solution**:
```bash
# Mark as applied (doesn't execute SQL, just updates tracking)
supabase migration repair 024_sample_properties_data --status applied
```

### Scenario: Multiple Deprecated Migrations

**Problem**: Several empty migrations (022, 023, 024) need to be marked as applied.

**Solution**:
```bash
# Repair each one
supabase migration repair 022_sample_properties --status applied
supabase migration repair 023_sample_properties --status applied  
supabase migration repair 024_sample_properties_data --status applied

# Or use a loop
for version in 022_sample_properties 023_sample_properties 024_sample_properties_data; do
  supabase migration repair $version --status applied
done
```

---

## What Each Command Does

| Command | What It Does | Safe? |
|---------|--------------|-------|
| `supabase migration repair --status applied` | Marks migration as applied locally (no SQL execution) | ✅ Yes |
| `supabase db push` | Applies pending migrations to database | ⚠️ Test first |
| `supabase db push --include-all` | Reapplies skipped migrations (can cause duplicates) | ❌ No, avoid |
| `supabase db pull` | Generates migrations from database schema | ⚠️ Can overwrite local |

---

## DO's and DON'Ts

### ✅ DO

- Use `migration repair` for already-applied migrations
- Keep empty migrations in filesystem for sequence continuity
- Test in staging before production
- Backup production before any migration changes
- Add deprecation comments to empty migration files

### ❌ DON'T

- Use `--include-all` in production without understanding consequences
- Delete applied migrations from filesystem
- Edit migrations that have already been applied
- Make manual schema changes in production (use migrations instead)

---

## Verification

### Check if Migration is Applied in Production

```sql
SELECT * FROM supabase_migrations.schema_migrations 
WHERE version LIKE '%024_sample_properties%';
```

### Count Total Applied Migrations

```sql
SELECT COUNT(*) FROM supabase_migrations.schema_migrations;
```

### List All Applied Migrations

```sql
SELECT version, name, inserted_at 
FROM supabase_migrations.schema_migrations 
ORDER BY version;
```

---

## Troubleshooting

### "Migration already applied"
→ Good! Use `migration repair --status applied` to sync local state

### "Migration file not found"  
→ Check exact filename: `ls supabase/migrations/ | grep 024`

### "No migrations to repair"
→ You're already synced, or not in project directory

### "Failed to connect to database"
→ Run `supabase link --project-ref your-project-ref` first

---

## For This Project (TopAffaireImmo)

### Known Deprecated Migrations

These migrations are empty/deprecated and safe to mark as applied:

- `022_sample_properties.sql` - Empty (data moved to seed)
- `023_sample_properties.sql` - Empty (data moved to seed)
- `024_sample_properties.sql` - Empty (data moved to seed)
- `024_sample_properties_data.sql` - Deprecated (contains comment explaining data moved to seed)
- `032_final_cleanup.sql` - Empty (cleanup completed)

### Quick Fix Command for This Project

```bash
# If these show as "missing" but are in production:
supabase migration repair 022_sample_properties --status applied
supabase migration repair 023_sample_properties --status applied
supabase migration repair 024_sample_properties --status applied
supabase migration repair 024_sample_properties_data --status applied
supabase migration repair 032_final_cleanup --status applied
```

---

## When to Use Migration Repair

**Use it when:**
- ✅ Migration is already applied in production database
- ✅ Migration is empty/no-op but needed for sequence
- ✅ You need to align local state with remote
- ✅ Manual changes were made in production (as a last resort)

**Don't use it when:**
- ❌ You have a new migration that needs to execute
- ❌ The migration has real schema changes that haven't been applied
- ❌ You're not sure if the migration ran in production

---

## Complete Workflow Example

```bash
# 1. Check current state
supabase migration list
# Shows: 024_sample_properties_data (pending locally, applied remotely)

# 2. Verify it's truly applied in production
# Connect to production and run:
# SELECT * FROM supabase_migrations.schema_migrations WHERE version = '024_sample_properties_data';

# 3. Check the migration content
cat supabase/migrations/024_sample_properties_data.sql
# Contains: "-- DEPRECATED" comments, no actual SQL

# 4. Repair the migration
supabase migration repair 024_sample_properties_data --status applied

# 5. Verify repair worked
supabase migration list
# Shows: 024_sample_properties_data (applied)

# 6. Now push any NEW migrations
supabase db push
# Success! No warnings about skipped migrations
```

---

## Safety Checklist

Before running any migration commands in production:

- [ ] Backup database (`supabase db dump -f backup.sql`)
- [ ] Test in staging environment first
- [ ] Verify what will execute (`cat migration_file.sql`)
- [ ] Check migration is already applied if using repair
- [ ] Have rollback plan ready
- [ ] Know how to restore from backup

---

## Related Documentation

- **Comprehensive Guide**: `docs/SUPABASE_MIGRATION_REPAIR_GUIDE.md` (detailed explanations)
- **Schema Documentation**: `supabase/README.md` (database schema overview)
- **Migration Diagnostic Tool**: `MIGRATION_DIAGNOSTIC_TOOL.md` (automated checking)
- **Supabase CLI Docs**: https://supabase.com/docs/reference/cli/introduction

---

**Need Help?**

1. Read the comprehensive guide: `docs/SUPABASE_MIGRATION_REPAIR_GUIDE.md`
2. Check migration diagnostic tool: `npm run check:migrations`
3. Review migration history: `supabase migration list`
4. Verify production state: Query `supabase_migrations.schema_migrations`

---

**Last Updated**: 2026-02-06
