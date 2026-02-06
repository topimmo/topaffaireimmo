# Supabase Migration Documentation Index

Central hub for all Supabase migration documentation and troubleshooting guides.

## 📖 Quick Navigation

### I Need To...

**Fix "Found local migration files" Error**
→ [Quick Reference: Migration Repair](../SUPABASE_MIGRATION_REPAIR_QUICK_REFERENCE.md) (5 min read)

**Understand Migration Repair in Detail**
→ [Comprehensive Guide: Migration Repair](SUPABASE_MIGRATION_REPAIR_GUIDE.md) (20 min read)

**See Real Examples**
→ [Example Scenarios](SUPABASE_MIGRATION_REPAIR_EXAMPLES.md) (15 min read)

**Check Migration Status**
→ Run `npm run check:migrations` or see [Migration Diagnostic Tool](../MIGRATION_DIAGNOSTIC_TOOL.md)

**Set Up Supabase from Scratch**
→ [Supabase Setup Guide](../supabase/README.md)

**Deploy to Production**
→ [Deployment Guide](DEPLOYMENT.md)

---

## 📚 Documentation Structure

### Level 1: Quick Fixes (5-10 minutes)

Perfect for when you know what's wrong and need a fast solution.

- **[SUPABASE_MIGRATION_REPAIR_QUICK_REFERENCE.md](../SUPABASE_MIGRATION_REPAIR_QUICK_REFERENCE.md)**
  - TL;DR commands
  - Common scenarios with solutions
  - DO's and DON'Ts
  - Quick troubleshooting

### Level 2: Comprehensive Guides (20-30 minutes)

For understanding the full picture and learning best practices.

- **[SUPABASE_MIGRATION_REPAIR_GUIDE.md](SUPABASE_MIGRATION_REPAIR_GUIDE.md)**
  - Why migration conflicts happen
  - Complete workflow explanations
  - Production best practices
  - Safety checklists
  - Validation queries

### Level 3: Examples & Scenarios (15-20 minutes)

Real-world examples showing how to apply the concepts.

- **[SUPABASE_MIGRATION_REPAIR_EXAMPLES.md](SUPABASE_MIGRATION_REPAIR_EXAMPLES.md)**
  - 7 complete scenarios
  - Step-by-step walkthroughs
  - Expected outputs
  - Common pitfalls

### Level 4: Reference Documentation

In-depth technical documentation for specific topics.

- **[supabase/README.md](../supabase/README.md)** - Database schema, tables, RLS policies
- **[MIGRATION_DIAGNOSTIC_TOOL.md](../MIGRATION_DIAGNOSTIC_TOOL.md)** - Diagnostic tool details

---

## 🎯 Common Problems & Solutions

### Problem: "Found local migration files to be inserted before the last migration"

**Quick Fix**:
```bash
# Mark deprecated migration as applied
supabase migration repair 024_sample_properties_data --status applied
```

**Learn More**: 
- [Quick Reference](../SUPABASE_MIGRATION_REPAIR_QUICK_REFERENCE.md)
- [Scenario 1: Deprecated Migrations](SUPABASE_MIGRATION_REPAIR_EXAMPLES.md#scenario-1-deprecated-migrations-in-production)

---

### Problem: Multiple empty/deprecated migrations showing as pending

**Quick Fix**:
```bash
# Repair all deprecated migrations
for version in 022_sample_properties 023_sample_properties 024_sample_properties_data; do
  supabase migration repair $version --status applied
done
```

**Learn More**:
- [Scenario 2: Multiple Empty Migrations](SUPABASE_MIGRATION_REPAIR_EXAMPLES.md#scenario-2-multiple-empty-migrations)

---

### Problem: CLI suggests using --include-all

**Quick Fix**:
```bash
# DON'T use --include-all!
# Instead, identify which migrations are already applied
npm run check:migrations
# Then use repair for deprecated ones
```

**Learn More**:
- [Why NOT to use --include-all](SUPABASE_MIGRATION_REPAIR_EXAMPLES.md#scenario-4-avoiding---include-all)
- [Comprehensive Guide](SUPABASE_MIGRATION_REPAIR_GUIDE.md#what-not-to-do)

---

### Problem: Made emergency schema change directly in production

**Quick Fix**:
```bash
# Pull production state
supabase db pull
# Review and rename the generated migration
# Mark as applied since it's already in production
supabase migration repair <version> --status applied
```

**Learn More**:
- [Scenario 5: Manual Production Change](SUPABASE_MIGRATION_REPAIR_EXAMPLES.md#scenario-5-manual-production-change-emergency)

---

### Problem: Unsure if migrations are in sync

**Quick Fix**:
```bash
# Run diagnostic tool
npm run check:migrations
# It will tell you exactly what's wrong and how to fix it
```

**Learn More**:
- [Migration Diagnostic Tool](../MIGRATION_DIAGNOSTIC_TOOL.md)

---

## 🛠 Tools & Commands

### Diagnostic Tools

```bash
# Comprehensive migration check (recommended)
npm run check:migrations

# Manual check via Supabase CLI
supabase migration list

# Query production database
# SELECT * FROM supabase_migrations.schema_migrations;
```

### Repair Commands

```bash
# Mark single migration as applied
supabase migration repair <version> --status applied

# Check if it worked
supabase migration list

# Apply new migrations
supabase db push
```

### Database Management

```bash
# Backup before changes
supabase db dump -f backup.sql

# Pull production schema
supabase db pull

# Reset local database (dev only)
supabase db reset

# Link to project
supabase link --project-ref your-project-ref
```

---

## 📋 Checklists

### Before Production Deployment

- [ ] Backup production database
- [ ] Test migrations in staging
- [ ] Run `npm run check:migrations`
- [ ] Review migration file contents
- [ ] Use `migration repair` for deprecated migrations
- [ ] Verify no destructive operations
- [ ] Have rollback plan ready

### When Migration Fails

- [ ] Read the full error message
- [ ] Run `npm run check:migrations`
- [ ] Check migration file contents
- [ ] Query production database state
- [ ] Review this documentation
- [ ] Use `migration repair` if appropriate
- [ ] Never use `--include-all` without understanding

### After Migration Success

- [ ] Verify application works
- [ ] Check `npm run check:migrations` shows healthy
- [ ] Monitor for errors
- [ ] Document any issues encountered
- [ ] Update team on changes

---

## 🎓 Learning Path

### New to Supabase Migrations?

1. **Start**: [Supabase Setup Guide](../supabase/README.md) (30 min)
2. **Understand**: [Migration Basics](SUPABASE_MIGRATION_REPAIR_GUIDE.md#understanding-the-issue) (10 min)
3. **Practice**: [Example Scenario 7](SUPABASE_MIGRATION_REPAIR_EXAMPLES.md#scenario-7-complete-workflow---new-feature-to-production) (15 min)
4. **Reference**: Bookmark [Quick Reference](../SUPABASE_MIGRATION_REPAIR_QUICK_REFERENCE.md)

### Experienced but Hit a Problem?

1. **Quick Fix**: [Quick Reference](../SUPABASE_MIGRATION_REPAIR_QUICK_REFERENCE.md) (5 min)
2. **Understand Why**: [Comprehensive Guide - Why This Happens](SUPABASE_MIGRATION_REPAIR_GUIDE.md#why-this-happens) (5 min)
3. **See Example**: [Find matching scenario](SUPABASE_MIGRATION_REPAIR_EXAMPLES.md) (5 min)

### Setting Up Production?

1. **Prepare**: [Production Best Practices](SUPABASE_MIGRATION_REPAIR_GUIDE.md#best-practices) (10 min)
2. **Deploy**: [Deployment Checklist](SUPABASE_MIGRATION_REPAIR_GUIDE.md#production-deployment-checklist) (5 min)
3. **Verify**: Run `npm run check:migrations`

---

## 🔗 External Resources

- [Supabase Migration Docs](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## 📝 Contributing

Found an issue or have a question?

1. Check if it's covered in the documentation above
2. Run `npm run check:migrations` for diagnostic info
3. Review [Example Scenarios](SUPABASE_MIGRATION_REPAIR_EXAMPLES.md)
4. If still stuck, ask with the output from the diagnostic tool

---

## 🏷️ Document Versions

- **Migration Repair Quick Reference**: v1.0 (2026-02-06)
- **Migration Repair Guide**: v1.0 (2026-02-06)
- **Migration Repair Examples**: v1.0 (2026-02-06)
- **Migration Diagnostic Tool**: Enhanced (2026-02-06)

---

**Last Updated**: 2026-02-06
