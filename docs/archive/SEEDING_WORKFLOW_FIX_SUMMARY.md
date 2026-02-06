# Seeding Workflow Fix - Root Cause Analysis and Solution

## Problem Statement

The "Seed Sample Listings" GitHub Actions workflow was running successfully (showing green checkmark), but the `public.properties` table in Supabase remained empty with 0 rows.

## Root Cause Analysis

### Primary Issue: Environment Variable Name Mismatch

**The Problem:**
- GitHub repository secrets were named: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- The seed workflow (`.github/workflows/seed-sample-listings.yml`) was passing: `SUPABASE_URL=${{ secrets.SUPABASE_URL }}`
- Secret `SUPABASE_URL` **does not exist** in GitHub repository secrets
- Result: The seed script received an **empty string** for the Supabase URL

**Why This Happened:**
1. The frontend code uses Vite, which requires `VITE_` prefixed environment variables
2. The GitHub secrets were correctly named with the `VITE_` prefix
3. The seed workflow was incorrectly referencing a non-existent secret without the prefix
4. The script has validation that exits early if required env vars are empty
5. However, the workflow didn't fail loudly - it just showed the script's error output

### Secondary Issue: Missing Error Detection

The workflow didn't have a pre-flight validation step, so when the seed script failed during env var validation:
- The script exited with error code 1
- GitHub Actions logged the error
- But the workflow overall wasn't properly marked as failed
- This made it appear as if the workflow "succeeded" when it actually failed silently

### Tertiary Issue: Same Problem in Fix-Listings Workflow

The `fix-listings.yml` workflow had an optional seed step that suffered from the same issues:
- Missing `SUPABASE_URL` env var mapping
- Missing `FORCE_SEED=true` flag
- Missing `PEXELS_API_KEY` mapping

## The Solution

### 1. Fixed Seed Workflow (`.github/workflows/seed-sample-listings.yml`)

**Changes:**
```yaml
# BEFORE (incorrect):
env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}  # ❌ Secret doesn't exist!
  
# AFTER (correct):
env:
  VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}  # ✅ Correct secret name
  SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}       # ✅ Also pass as SUPABASE_URL for compatibility
```

**Added Pre-Flight Validation:**
```yaml
- name: Validate environment variables
  run: |
    echo "Validating required environment variables..."
    if [ -z "$VITE_SUPABASE_URL" ]; then
      echo "❌ ERROR: VITE_SUPABASE_URL secret is not set"
      exit 1
    fi
    # ... more validation
```

This ensures the workflow **fails loudly** if secrets are not configured.

### 2. Enhanced Seed Script (`scripts/seed-sample-listings.ts`)

**Accept Both Variable Names:**
```typescript
// Support both SUPABASE_URL and VITE_SUPABASE_URL for flexibility
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
```

**Better Error Messages:**
```typescript
console.error('Environment variable sources checked:');
console.error('  - SUPABASE_URL:', process.env.SUPABASE_URL ? `✓ (${process.env.SUPABASE_URL.slice(0, 30)}...)` : '✗');
console.error('  - VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? `✓ (${process.env.VITE_SUPABASE_URL.slice(0, 30)}...)` : '✗');
```

**Explicit Schema and Table Logging:**
```typescript
console.log(`   - Target schema: public`);
console.log(`   - Target table: properties`);
```

**Enhanced Insert Error Logging:**
```typescript
if (insertError) {
  console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, insertError);
  console.error(`   - Error code: ${insertError.code}`);
  console.error(`   - Error message: ${insertError.message}`);
  console.error(`   - Error details:`, insertError.details);
  console.error(`   - Error hint:`, insertError.hint);
}
```

**Post-Insert Verification:**
```typescript
// Verify the insert by querying the database
const { count: verifyCount, error: verifyError } = await supabase
  .from('properties')
  .select('*', { count: 'exact', head: true })
  .eq('is_sample', true);

console.log(`✓ Verification complete: ${verifyCount} sample listings found in database`);
```

### 3. Fixed Fix-Listings Workflow (`.github/workflows/fix-listings.yml`)

Added missing environment variables to both steps:
```yaml
- name: Run fix:listings
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}  # ✅ Added
    # ... rest

- name: Optional seed (if requested)
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}      # ✅ Added
    FORCE_SEED: true                                     # ✅ Added
    PEXELS_API_KEY: ${{ secrets.PEXELS_API_KEY }}       # ✅ Added
```

### 4. Updated Documentation (`.env.example`)

Added clarification about the dual variable names:
```bash
# Supabase URL - Can use either SUPABASE_URL or VITE_SUPABASE_URL
# The script will check both and use whichever is set
# In CI/CD (GitHub Actions), use VITE_SUPABASE_URL to match other workflows
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
```

## Verification Checklist

After running the fixed workflow, you should see:

1. **Pre-flight validation passes:**
   ```
   ✅ All required environment variables are set
      - VITE_SUPABASE_URL: https://xxxx.supabase.co...
      - SUPABASE_SERVICE_ROLE_KEY: ✓ (hidden)
   ```

2. **Seed script starts with correct config:**
   ```
   🌱 Starting Sample Listings Seed Script
   📊 Configuration:
      - Target schema: public
      - Target table: properties
   ```

3. **Successful inserts:**
   ```
   💾 Inserting listings into database...
      - Schema: public
      - Table: properties
      Inserted 10/50 listings...
      Inserted 20/50 listings...
      ...
   ```

4. **Post-insert verification:**
   ```
   🔍 Verifying inserted data...
   ✓ Verification complete: 50 sample listings found in database
   ✓ Published listings: 50/50
   ```

5. **Check in Supabase:**
   ```sql
   SELECT COUNT(*) FROM public.properties WHERE is_sample = true;
   -- Should return 50 (or your LISTINGS_COUNT value)
   
   SELECT COUNT(*) FROM public.properties WHERE status = 'published';
   -- Should return 50 (all sample listings are published)
   ```

## Key Learnings

1. **Environment variable naming consistency is critical** - Always use the same naming convention across workflows
2. **Pre-flight validation prevents silent failures** - Validate env vars before running scripts
3. **Detailed logging aids debugging** - Log schema, table, env var sources, and full error objects
4. **Post-execution verification is valuable** - Query database to confirm operations succeeded
5. **Flexibility in env var names helps** - Supporting multiple names makes scripts more robust

## Files Modified

- `.github/workflows/seed-sample-listings.yml` - Fixed env var mapping, added validation
- `.github/workflows/fix-listings.yml` - Fixed env var mapping in both steps
- `scripts/seed-sample-listings.ts` - Enhanced with dual var support, better logging, verification
- `.env.example` - Documented the dual variable name support

## Security Scan Results

✅ **CodeQL Analysis**: No security vulnerabilities found
- Scanned: GitHub Actions workflows, JavaScript/TypeScript code
- Result: 0 alerts

## Next Steps

1. **Test the fix**: Run the "Seed Sample Listings" workflow from GitHub Actions
2. **Verify data**: Check Supabase Table Editor to confirm properties table has rows
3. **Check frontend**: Visit the website and confirm listings are displayed
4. **Monitor logs**: Review GitHub Actions logs to ensure all validation steps pass

## Rollback Plan (if needed)

If this fix causes issues, you can:
1. Revert the workflow files to use the old env var names
2. Update GitHub secrets to use `SUPABASE_URL` instead of `VITE_SUPABASE_URL`
3. Or, keep the new workflow and just ensure secrets match the expected names

However, this fix should be safe as it's **backward compatible** - the script accepts both variable names.
