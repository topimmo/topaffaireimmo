# Schema Verification & Migration Safety System

## Executive Summary

This document describes the automated schema verification system implemented to prevent production errors caused by schema mismatches between code and database.

## Problem Statement

### Issues Fixed

1. **ERROR 42P01: relation "public.listings" does not exist**
   - Production code attempted to query a table named `listings` 
   - The actual table is named `properties`
   - Caused production crashes

2. **ERROR 42703: column "city" does not exist**
   - Migrations attempted to create indexes on a `city` column in `artisan_services`
   - The column doesn't exist in the production schema
   - Caused migration failures and query errors

### Root Causes

- **Environment mismatches**: Development/production databases had different schemas
- **Incomplete migrations**: Some migrations referenced columns that were never created
- **No automated validation**: Schema mismatches weren't detected until runtime
- **No pre-deployment checks**: Dangerous patterns weren't caught before merging code

## Solution Overview

We implemented a **3-layer defense system** to prevent schema mismatches:

### Layer 1: SQL Verification Script
**File**: `supabase/SCHEMA_VERIFICATION.sql`

A comprehensive SQL script that validates database schema state:

```sql
-- Checks performed:
✅ Properties table exists (NOT listings)
✅ Listings table does NOT exist 
✅ Artisan services table exists
✅ Admins table exists
✅ Required columns exist in artisan_services (14 columns verified)
✅ City column does NOT exist in artisan_services
✅ Required columns exist in properties (8 essential columns)
✅ No RPC functions reference listings table
✅ No views reference listings table
✅ No invalid indexes on artisan_services (city column)
✅ Indexes exist for created_at sorting
✅ Migrations are up to date (version ≥ 121)
```

**Usage**:
1. Open Supabase Dashboard → SQL Editor
2. Paste the entire script
3. Run (Ctrl+Enter)
4. Review results - all should show ✅ PASS

**When to use**:
- Before deploying to production
- After applying migrations
- When investigating schema-related errors
- During environment setup/verification

### Layer 2: Health Check Script
**File**: `scripts/health-check-schema.ts`

A TypeScript script that performs runtime schema validation:

```bash
npm run health-check:schema
```

**Checks performed**:
- ✅ Properties table exists
- ✅ Listings table does NOT exist
- ✅ Artisan services table exists
- ✅ Admins table exists
- ✅ Properties has required columns
- ✅ Artisan services has required columns (without city)
- ✅ City column does NOT exist in artisan_services

**Exit codes**:
- `0` = All checks passed ✅
- `1` = One or more checks failed ❌

**When to use**:
- In deployment pipelines (before/after deploy)
- As part of CI/CD validation
- For production health monitoring
- During troubleshooting

### Layer 3: Code Safety Verification
**File**: `scripts/verify-schema-safety.ts`

Scans codebase for dangerous patterns:

```bash
npm run verify:schema
```

**Patterns detected**:

| Pattern | Severity | Description |
|---------|----------|-------------|
| `from("listings")` | ERROR | Reference to deprecated listings table |
| `public.listings` | ERROR | Direct SQL reference to listings |
| `/api/listings` | ERROR | API endpoint reference |
| `city` in artisan_services | WARNING | Reference to non-existent column |

**Features**:
- Smart whitelisting (excludes documentation, comments)
- Severity levels (errors block deployment, warnings inform)
- File/line number reporting
- Integration with ripgrep/grep

**When to use**:
- Before committing code changes
- In pre-commit hooks
- In CI/CD pipelines (automated)
- During code reviews

### Layer 4: GitHub Actions Workflow
**File**: `.github/workflows/schema-safety.yml`

Automated CI/CD checks that run on every pull request:

**Triggers**:
- Pull requests to `main` or `develop`
- Pushes to `main`

**Checks performed**:
1. ✅ Run schema safety verification script
2. ✅ Search for `listings` table references
3. ✅ Search for `/api/listings` endpoint
4. ✅ Search for `city` column in artisan_services (warning)
5. ✅ Verify SQL verification script exists
6. ✅ Verify health check script exists
7. ✅ Verify created_at sorting is used

**Behavior**:
- ❌ **Blocks merge** if errors found
- ⚠️  Shows warnings but allows merge
- ✅ Green checkmark if all pass

## Implementation Details

### Required Table Structure

#### public.properties
Essential columns verified:
- `id` (UUID)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `title_fr` (TEXT)
- `status` (TEXT)
- `owner_id` (UUID)
- `city_id` (UUID)
- `property_type` (TEXT)

**Sorting**: MUST use `created_at DESC` for pagination

#### public.artisan_services
Required columns:
- `id` (UUID)
- `artisan_id` (UUID)
- `category_id` (UUID)
- `subcategory_id` (UUID)
- `price_type` (TEXT)
- `price_from` (NUMERIC)
- `price_to` (NUMERIC)
- `description_fr` (TEXT)
- `description_ar` (TEXT)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `artisan_profile_id` (UUID)
- `service_subcategory_id` (UUID)

**Important**: Does NOT have `city` column (deprecated)

#### public.admins
Must exist with basic admin functionality

### Forbidden Patterns

The following patterns are **BLOCKED** in code:

```typescript
// ❌ FORBIDDEN
supabase.from('listings')
supabase.from(`listings`)

// ✅ CORRECT
supabase.from('properties')
```

```typescript
// ❌ FORBIDDEN
fetch('/api/listings')

// ✅ CORRECT  
fetch('/api/properties')
```

```sql
-- ❌ FORBIDDEN
SELECT * FROM public.listings

-- ✅ CORRECT
SELECT * FROM public.properties
```

```typescript
// ⚠️  WARNING (if targeting artisan_services)
.select('city')

// ✅ CORRECT
// Don't select city from artisan_services
```

### Migration Safety

All migrations MUST:
1. Use `CREATE TABLE IF NOT EXISTS` for idempotency
2. Use `DROP INDEX IF EXISTS` before creating indexes
3. Verify columns exist before creating indexes on them
4. NOT reference `city` column in artisan_services
5. NOT reference `listings` table

Example from migration 121:
```sql
-- ✅ GOOD: Drops invalid index
DROP INDEX IF EXISTS public.idx_artisan_services_status_city;

-- ✅ GOOD: Creates valid replacement
CREATE INDEX IF NOT EXISTS idx_artisan_services_status_created 
  ON public.artisan_services(status, created_at) 
  WHERE status = 'approved';
```

## Usage Guide

### For Developers

#### Before Committing
```bash
# Run schema safety check
npm run verify:schema

# If errors found, fix them before committing
```

#### When Adding Database Queries
1. Always use `properties` table, never `listings`
2. Never reference `city` column in artisan_services
3. Use `created_at DESC` for sorting properties
4. Verify your query works with health check

#### When Creating Migrations
1. Test locally first
2. Run schema verification after applying
3. Ensure idempotency (IF NOT EXISTS, IF EXISTS)
4. Don't create indexes on non-existent columns

### For DevOps/Deployment

#### Before Production Deploy
```bash
# 1. Run health check against staging
VITE_SUPABASE_URL=<staging-url> \
SUPABASE_SERVICE_ROLE_KEY=<staging-key> \
npm run health-check:schema

# 2. If pass, run against production
VITE_SUPABASE_URL=<prod-url> \
SUPABASE_SERVICE_ROLE_KEY=<prod-key> \
npm run health-check:schema

# 3. If pass, deploy
```

#### In Production (Post-Deploy)
```sql
-- Run in Supabase Dashboard SQL Editor
\i supabase/SCHEMA_VERIFICATION.sql
-- Review results, all should show ✅
```

#### In CI/CD Pipeline
The GitHub Actions workflow runs automatically. Just:
1. Create PR
2. Wait for checks
3. Fix any errors reported
4. Merge when ✅ green

### For Database Admins

#### Verifying Production Schema
```sql
-- 1. Login to Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Run SCHEMA_VERIFICATION.sql
-- 4. Verify all checks pass

-- If any fail:
-- - Check you're on correct project
-- - Apply missing migrations
-- - Fix schema mismatches
```

#### Troubleshooting

**Symptom**: `ERROR 42P01: relation "public.listings" does not exist`

**Diagnosis**:
1. Run SCHEMA_VERIFICATION.sql
2. Check if `properties` table exists
3. Verify environment variables point to correct DB

**Fix**:
- Update code to use `properties` instead of `listings`
- Verify VITE_SUPABASE_URL in deployment environment

---

**Symptom**: `ERROR 42703: column "city" does not exist`

**Diagnosis**:
1. Run SCHEMA_VERIFICATION.sql
2. Check if artisan_services has city column (should NOT)
3. Check for indexes referencing city

**Fix**:
- Apply migration 121 which drops invalid indexes
- Update code to not reference city column
- Use artisan location via artisan_profiles table instead

## Maintenance

### Adding New Checks

To add a new schema validation:

1. **Update SCHEMA_VERIFICATION.sql**:
```sql
-- CHECK X: Your new check
DO $$
BEGIN
  RAISE NOTICE 'CHECK X: Your description';
END $$;

SELECT 
  CASE 
    WHEN condition THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as result
FROM your_verification_query;
```

2. **Update health-check-schema.ts**:
```typescript
async function checkNewThing(): Promise<CheckResult> {
  // Your check logic
  return {
    name: 'New check',
    passed: true/false,
    message: '✅ or ❌ message'
  };
}

// Add to runHealthCheck():
checks.push(await checkNewThing());
```

3. **Update verify-schema-safety.ts** (if needed):
```typescript
const DANGEROUS_PATTERNS: DangerousPattern[] = [
  // ... existing patterns
  {
    pattern: 'your-regex-pattern',
    description: 'What this catches',
    severity: 'error' // or 'warning'
  }
];
```

4. **Update schema-safety.yml** (if needed):
```yaml
- name: Your new check
  run: |
    echo "Running new check..."
    # Your check command
```

### Updating for Schema Changes

When adding a new required table/column:

1. Add to SCHEMA_VERIFICATION.sql required columns list
2. Add check in health-check-schema.ts
3. Update this documentation
4. Test locally before merging

## Monitoring & Alerts

### Recommended Setup

1. **Post-Deploy Health Check**:
   Add to deployment script:
   ```bash
   npm run health-check:schema || rollback_deployment
   ```

2. **Scheduled Checks** (optional):
   Set up cron job to run health check daily:
   ```bash
   0 2 * * * cd /app && npm run health-check:schema
   ```

3. **Alerting** (optional):
   Integrate with monitoring:
   ```bash
   npm run health-check:schema || send_alert "Schema mismatch detected"
   ```

## Migration History

### Fixed Issues

#### Migration 121
- ✅ Dropped invalid index `idx_artisan_services_status_city`
- ✅ Created replacement index on `(status, created_at)`
- ✅ Fixed RPC functions to not reference city column
- ✅ Verified schema consistency

#### Previous Issues
- Migration 100: Created artisan_services with city column (since removed)
- Migration 116: Attempted to create index on city (failed in production)
- Multiple migrations referenced listings table (all fixed)

## Testing

### Local Testing

```bash
# 1. Install dependencies
npm install

# 2. Run verification locally
npm run verify:schema

# 3. Run health check (requires Supabase creds)
npm run health-check:schema

# 4. Test SQL script in Supabase Dashboard
# Copy/paste SCHEMA_VERIFICATION.sql and run
```

### CI/CD Testing

```bash
# Create a PR and verify workflow runs
# Check Actions tab in GitHub
# All checks should pass ✅
```

## Best Practices

1. **Always verify schema before deploying**
   - Run health check script
   - Run SQL verification
   - Review migration status

2. **Use type-safe queries**
   - Generate types: `npm run types:supabase`
   - TypeScript will catch column mismatches

3. **Test migrations locally first**
   - Apply to local Supabase
   - Run verification scripts
   - Verify queries still work

4. **Keep documentation updated**
   - Update this doc when adding checks
   - Document schema changes
   - Note migration dependencies

5. **Monitor production**
   - Run health checks regularly
   - Alert on schema mismatches
   - Review logs for SQL errors

## Troubleshooting

### Common Errors

**"Table does not exist"**
- Verify migrations applied
- Check environment variables
- Confirm correct Supabase project

**"Column does not exist"**
- Check migration order
- Verify column names in queries
- Run SCHEMA_VERIFICATION.sql

**"Schema verification failed"**
- Review error details
- Check migration status
- Verify environment setup

**"CI check failed"**
- Review GitHub Actions logs
- Fix reported issues
- Re-run verification locally
- Push fixes and re-check

## Summary

This automated schema verification system provides:

✅ **Prevention**: Catches schema mismatches before deployment  
✅ **Detection**: Identifies dangerous patterns in code  
✅ **Validation**: Verifies database state matches expectations  
✅ **Automation**: Runs checks in CI/CD pipeline  
✅ **Documentation**: Clear guidance for developers  

### Key Files Created

1. `supabase/SCHEMA_VERIFICATION.sql` - SQL verification script
2. `scripts/health-check-schema.ts` - Runtime health check
3. `scripts/verify-schema-safety.ts` - Code pattern scanner
4. `.github/workflows/schema-safety.yml` - CI/CD automation
5. `SCHEMA_VERIFICATION_SYSTEM.md` - This documentation

### Impact

**Before**: Schema mismatches caused production crashes  
**After**: Automated checks prevent deployment of problematic code  

**Before**: Manual schema verification (error-prone)  
**After**: Automated verification on every PR  

**Before**: No visibility into schema state  
**After**: Clear reporting and documentation  

---

**Last Updated**: 2026-02-18  
**Version**: 1.0  
**Status**: ✅ Production Ready
