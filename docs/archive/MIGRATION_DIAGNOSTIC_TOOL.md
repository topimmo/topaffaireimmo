# Migration Diagnostic Tool

## Overview

The Migration Diagnostic Tool is a comprehensive utility for analyzing and validating Supabase database migrations. It helps identify:

- **Pending migrations**: Migrations present in the filesystem but not yet applied to the database
- **Missing migrations**: Migrations recorded in the database but missing from the filesystem
- **Skipped migrations**: Gaps in the migration sequence that might indicate problems
- **Order issues**: Timestamp inconsistencies that could cause migrations to be applied in the wrong order

## Features

✅ **Read-only operation** - No destructive actions, safe to run anytime  
✅ **Detailed impact analysis** - Automatically analyzes SQL to determine what each migration does  
✅ **Color-coded output** - Easy-to-read terminal output with visual indicators  
✅ **Actionable recommendations** - Provides guidance on how to resolve any issues found  
✅ **Comprehensive reporting** - Shows detailed breakdown of all migration statuses  

## Installation

No additional installation required! The tool uses existing dependencies from the project.

## Usage

### Basic Usage

```bash
npm run check:migrations
```

Or run directly with tsx:

```bash
npx tsx scripts/check-migrations.ts
```

### Environment Requirements

The tool requires at least one of the following environment variables in your `.env` file:

```env
# Supabase URL (required)
VITE_SUPABASE_URL=https://your-project.supabase.co
# or
SUPABASE_URL=https://your-project.supabase.co

# At least one authentication key (required)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# or
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Note**: The service role key is recommended as it provides full access to query migration status.

## Output Examples

### Healthy Database (All Clear)

```
================================================================================
🔍 Supabase Migration Diagnostic Tool
================================================================================

⚙️ Configuration
--------------------------------------------------------------------------------
✓ Supabase URL: https://abcdefghijk.supabase.co...
✓ Service Key: ✓ Available
✓ Anon Key: ✓ Available

📁 Reading Filesystem Migrations
--------------------------------------------------------------------------------
✓ Found 71 migration files

🗄️ Querying Applied Migrations
--------------------------------------------------------------------------------
✓ Found 71 applied migrations

🔬 Analyzing Migrations
--------------------------------------------------------------------------------
✓ Analysis complete

📊 Summary
--------------------------------------------------------------------------------
Total migrations in filesystem: 71
Total migrations applied: 71
Pending migrations: 0
Missing migrations: 0
Order issues: 0

✅ Status
--------------------------------------------------------------------------------
✓ Database migrations are healthy!
   - All 71 migrations are applied
   - No missing or skipped migrations
   - No timestamp ordering issues
```

### Database with Pending Migrations

```
⏳ Pending Migrations (Not Yet Applied)
--------------------------------------------------------------------------------

1. 078_create_lead_tracking_tables.sql
   Version: 078
   Impact:
     - Creates 2 table(s)
     - Creates 4 RLS polic(y|ies)
     - Creates 2 index(es)

2. 079_add_user_preferences.sql
   Version: 079
   Impact:
     - Adds 3 column(s)
     - Creates 1 function(s)

💡 Recommendations for Pending Migrations
--------------------------------------------------------------------------------
ℹ To apply pending migrations, use Supabase CLI:
   supabase db push

   Or apply them manually via the Supabase dashboard SQL editor.
```

### Database with Issues

```
❌ Missing Migrations (Applied but not in filesystem)
--------------------------------------------------------------------------------
✗ The following migrations are recorded in the database but not found in filesystem:
   1. Version: 055

💡 Recommendations for Missing Migrations
--------------------------------------------------------------------------------
⚠ Missing migration files can indicate:
   - Files were deleted from the repository
   - Working with a different branch
   - Database was migrated from another source
ℹ Actions:
   - Restore missing migration files from git history
   - Or verify this is expected (e.g., working on a feature branch)

⚠️ Order Issues (Timestamp Inconsistencies)
--------------------------------------------------------------------------------
⚠ The following migrations have timestamp ordering issues:
   1. Migration 056_fix.sql (056) comes after 060_add_field.sql (060) but has an earlier timestamp

💡 Recommendations for Order Issues
--------------------------------------------------------------------------------
⚠ Timestamp order issues can cause problems when:
   - Migrations are applied in the wrong order
   - Different team members have different migration states
ℹ Actions:
   - Rename migration files to fix timestamp order
   - Ensure migrations are applied in the correct sequence
```

## Impact Analysis

The tool automatically analyzes each migration to determine its impact:

| Detection Pattern | Impact Description |
|-------------------|-------------------|
| `CREATE TABLE` | Creates new table(s) |
| `ALTER TABLE` | Modifies existing table(s) |
| `DROP TABLE` | ⚠️ Drops table(s) (destructive) |
| `ADD COLUMN` | Adds new column(s) |
| `DROP COLUMN` | Drops column(s) (potentially destructive) |
| `CREATE INDEX` | Creates index(es) for performance |
| `CREATE POLICY` | Creates RLS security policies |
| `CREATE TRIGGER` | Creates database triggers |
| `CREATE FUNCTION` | Creates stored procedures/functions |
| `INSERT INTO` | Inserts data |
| `UPDATE` | Updates existing data |
| `DELETE FROM` | ⚠️ Deletes data (destructive) |
| `ADD CONSTRAINT` | Adds constraints (foreign keys, checks, etc.) |
| Storage buckets | Creates file storage buckets |

## Understanding the Results

### Exit Codes

- `0`: All migrations are applied, no issues found
- `1`: Issues detected (pending, missing, or order problems)

### Color Coding

- 🟢 **Green**: Success, healthy state
- 🟡 **Yellow**: Warning, requires attention
- 🔴 **Red**: Error or critical issue

### Issue Types

#### Pending Migrations
Migrations exist in your `supabase/migrations/` directory but haven't been applied to the database yet. This is normal during development.

**Action**: Apply migrations using `supabase db push` or the Supabase dashboard.

#### Missing Migrations
Migrations are recorded as applied in the database but the files don't exist in your local repository.

**Possible causes**:
- Migration files were deleted
- Working on a different branch
- Database was migrated from a different source

**Action**: 
- Check git history to restore deleted files
- Verify you're on the correct branch
- Document expected differences if working with a shared database

#### Order Issues
Migration files have timestamps that don't match their intended sequence.

**Example**: `050_feature.sql` comes after `060_bugfix.sql` in the directory

**Action**: Rename migration files to ensure correct timestamp order

## Best Practices

1. **Run before deployment**: Always run the diagnostic before deploying to production
2. **Include in CI/CD**: Add to your continuous integration pipeline
3. **Review pending migrations**: Carefully review impact analysis before applying
4. **Watch for destructive operations**: Pay special attention to DROP and DELETE operations
5. **Team coordination**: Ensure all team members have the same migration state
6. **Version control**: Keep all migration files in version control
7. **Sequential naming**: Use sequential numbering (001, 002, 003...) for clarity

## Troubleshooting

### "Missing VITE_SUPABASE_URL"

Ensure you have a `.env` file with the Supabase URL:

```bash
cp .env.example .env
# Edit .env and set VITE_SUPABASE_URL
```

### "Could not retrieve applied migrations"

This can happen if:
- The `schema_migrations` table doesn't exist (fresh database)
- You don't have permission to query the table
- Using anon key instead of service role key

**Solution**: Use the service role key in `.env`:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Tool shows pending migrations but database is current

This might indicate:
- Migrations were applied manually without being recorded
- Using a different Supabase project/environment
- The schema_migrations table is out of sync

**Solution**: Verify your Supabase URL matches the intended database

## Advanced Usage

### Using with Different Environments

You can use different `.env` files for different environments:

```bash
# Development
cp .env.example .env.development
npm run check:migrations

# Production (be careful!)
cp .env.example .env.production
VITE_SUPABASE_URL=$PROD_URL SUPABASE_SERVICE_ROLE_KEY=$PROD_KEY npm run check:migrations
```

### Integration with CI/CD

Add to your GitHub Actions workflow:

```yaml
- name: Check Database Migrations
  run: npm run check:migrations
  env:
    VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### Scripting

Use in shell scripts:

```bash
#!/bin/bash
npm run check:migrations
if [ $? -eq 0 ]; then
  echo "Migrations are up to date"
else
  echo "Migration issues detected - check output above"
  exit 1
fi
```

## Related Documentation

- [Supabase Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli/introduction)
- Project migrations directory: `supabase/migrations/`

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review existing migration files in `supabase/migrations/`
3. Consult Supabase documentation
4. Contact the development team

## License

This tool is part of the TopAffaireImmo project and follows the same license.
