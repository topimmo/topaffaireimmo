# Migration Diagnostic Quick Reference

## One-Line Command

```bash
npm run check:migrations
```

## What It Does

✅ Compares filesystem migrations with database  
✅ Detects pending, missing, and out-of-order migrations  
✅ Analyzes impact of each migration (CREATE, ALTER, DROP, etc.)  
✅ Provides actionable recommendations  
✅ **Read-only** - Safe to run anytime  

## Output Legend

### Status Icons
- ✓ Success / OK
- ⚠ Warning / Attention needed
- ✗ Error / Critical issue
- ℹ Information

### Color Coding
- 🟢 Green: Healthy state
- 🟡 Yellow: Warning
- 🔴 Red: Error/Critical

## Quick Interpretation Guide

### Exit Code 0
```
✓ Database migrations are healthy!
```
✅ All migrations applied  
✅ No missing files  
✅ No order issues  
**Action**: None needed

### Exit Code 1 - Pending Migrations
```
⏳ Pending Migrations (Not Yet Applied)
1. 078_new_feature.sql
```
⚠️ Migrations exist but not applied  
**Action**: Review and apply with `supabase db push`

### Exit Code 1 - Missing Migrations
```
❌ Missing Migrations (Applied but not in filesystem)
1. Version: 055
```
🔴 Files recorded in DB but deleted from filesystem  
**Action**: Restore from git or verify branch

### Exit Code 1 - Order Issues
```
⚠️ Order Issues (Timestamp Inconsistencies)
```
🔴 Migration timestamps out of sequence  
**Action**: Rename files to fix order

## Impact Analysis Legend

| Icon/Text | Meaning | Severity |
|-----------|---------|----------|
| Creates N table(s) | New tables | Low |
| Modifies N table(s) | ALTER TABLE | Medium |
| ⚠ Drops N table(s) | DROP TABLE | **HIGH** |
| Adds N column(s) | New columns | Low |
| Drops N column(s) | Remove columns | Medium |
| Creates N index(es) | Performance indexes | Low |
| Creates N RLS polic(y|ies) | Security policies | Low |
| Creates N trigger(s) | Database triggers | Medium |
| Creates N function(s) | Stored procedures | Low |
| Inserts data | INSERT statements | Low |
| Updates existing data | UPDATE statements | Medium |
| ⚠ Deletes data | DELETE statements | **HIGH** |
| Creates storage bucket(s) | File storage | Low |
| Adds N constraint(s) | Foreign keys, checks | Medium |
| Empty migration | No changes | Info |

## Common Workflows

### Pre-Deployment Check
```bash
npm run check:migrations
# Review output
# Apply if safe: supabase db push
npm run check:migrations  # Verify
```

### Troubleshooting Database Issues
```bash
npm run check:migrations
# Check for unapplied migrations
# Review impact analysis
# Apply selectively if needed
```

### Team Sync Check
```bash
git pull
npm run check:migrations
# Ensure local DB matches repo
```

## Environment Setup

Required in `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Troubleshooting

### "Missing environment variables"
→ Create `.env` file with required vars

### "Could not retrieve applied migrations"
→ Use service role key, not anon key

### Shows 0 applied migrations
→ Database might be fresh or schema_migrations table missing

## Related Commands

```bash
# Apply migrations
supabase db push

# Check Supabase status
supabase status

# View migration history
supabase migration list
```

## Full Documentation

📚 See `MIGRATION_DIAGNOSTIC_TOOL.md` for complete guide

---

**Quick Tip**: Run before every deployment to catch migration issues early! 🚀
