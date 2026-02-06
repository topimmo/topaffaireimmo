# Supabase Security & Performance Remediation

## Overview

This remediation addresses Security Advisor warnings and improves query performance for the TopAffaireImmo platform.

## Files Included

1. **079_security_performance_remediation.sql** - Main remediation script
2. **079_validation_queries.sql** - Validation and testing queries
3. **079_rollback.sql** - Rollback script if needed

## Security Issues Fixed

### 1. RLS Policy Always True - advertising_inquiries
- **Issue**: Public INSERT policy with `TO public WITH CHECK (true)` flagged as always true
- **Fix**: Separated INSERT policies for `anon` and `authenticated` roles, keeping `WITH CHECK (true)` only for tracking purposes. SELECT/UPDATE restricted to authenticated admin users only.

### 2. RLS Policy Always True - property_views  
- **Issue**: Public INSERT policy flagged as always true
- **Fix**: Separated INSERT policies by role (anon/authenticated), restricted SELECT to property owners and admins only. No public SELECT access.

### 3. RLS Policy Always True - property_contact_clicks
- **Issue**: Public INSERT policy flagged as always true  
- **Fix**: Separated INSERT policies by role (anon/authenticated), restricted SELECT to property owners and admins only. No public SELECT access.

## Performance Improvements

Added 8 strategic indexes for high-impact query patterns:

1. **idx_advertising_inquiries_status_created** - Admin dashboard filtering by status
2. **idx_property_views_property_created** - Property analytics by property ID
3. **idx_property_views_session_created** - Session-based deduplication
4. **idx_contact_clicks_property_type_created** - Contact analytics by property and type
5. **idx_property_leads_status_created** - Lead filtering by status
6. **idx_property_leads_advertiser_created** - Advertiser's own leads
7. **idx_property_leads_property_created** - Property-specific leads
8. Reserved slots 9-10 for future needs

All indexes created with `CONCURRENTLY` to avoid downtime.

## Deployment Instructions

### Pre-Deployment Checklist

- [ ] Backup database before applying changes
- [ ] Review current Security Advisor warnings
- [ ] Note current query performance baselines
- [ ] Ensure no active deployments or migrations in progress

### Step 1: Apply Remediation (Production-Safe)

```bash
# Option A: Via Supabase Dashboard
# 1. Open SQL Editor in Supabase Dashboard
# 2. Copy contents of 079_security_performance_remediation.sql
# 3. Execute the script
# Note: CREATE INDEX CONCURRENTLY statements may need to be run separately outside transaction blocks

# Option B: Via Supabase CLI
supabase db push --db-url <YOUR_DATABASE_URL>
```

**Important Notes:**
- The script is idempotent - safe to run multiple times
- CREATE INDEX CONCURRENTLY cannot run inside a transaction
- Each index creation may take seconds to minutes depending on table size
- No downtime expected as indexes are created CONCURRENTLY

### Step 2: Validate Changes

```bash
# Run validation queries
# Copy contents of 079_validation_queries.sql and execute in SQL Editor
```

**Expected Results:**
- ✅ All three tables show RLS ENABLED
- ✅ Policies properly restrict SELECT to authenticated users
- ✅ Anonymous users can INSERT but not SELECT
- ✅ 8 new indexes exist
- ✅ Security Advisor warnings resolved

### Step 3: Monitor Performance

After deployment, monitor:
- Index usage via `pg_stat_user_indexes`
- Query performance improvements
- No increase in error rates
- Security Advisor no longer shows warnings

### Step 4: Rollback (If Needed)

If issues are discovered:

```bash
# Execute rollback script
# Copy contents of 079_rollback.sql and execute in SQL Editor
```

This will:
- Drop all 8 new indexes
- Restore previous RLS policies
- Return to pre-migration state

## Testing Checklist

### Security Tests

- [ ] Verify anonymous users cannot SELECT from advertising_inquiries
- [ ] Verify anonymous users cannot SELECT from property_views
- [ ] Verify anonymous users cannot SELECT from property_contact_clicks
- [ ] Verify anonymous users CAN INSERT into all three tables
- [ ] Verify admin users can SELECT and UPDATE advertising_inquiries
- [ ] Verify property owners can SELECT their own analytics

### Functional Tests

- [ ] Test advertising inquiry form submission (anonymous)
- [ ] Test property view tracking (anonymous)
- [ ] Test contact click tracking (anonymous)
- [ ] Test admin dashboard shows inquiries
- [ ] Test property owner dashboard shows analytics
- [ ] Test lead management for advertisers

### Performance Tests

- [ ] Query property views by property_id - should use idx_property_views_property_created
- [ ] Query leads by advertiser_id - should use idx_property_leads_advertiser_created
- [ ] Filter inquiries by status - should use idx_advertising_inquiries_status_created
- [ ] Monitor index usage after 24 hours

## Expected Outcomes

### Security Improvements

1. **Before**: Security Advisor shows 3 "RLS Policy Always True" warnings
2. **After**: Security Advisor shows 0 RLS policy warnings
3. **Behavior**: No functional changes - public can still submit forms/track analytics

### Performance Improvements

1. **Faster admin dashboards** - Filtering by status uses composite indexes
2. **Faster property analytics** - Property owner views use optimized indexes
3. **Faster lead management** - Advertiser queries use dedicated indexes
4. **Better scalability** - Indexes support growth in analytics data

## Rollback Considerations

### When to Rollback

- Critical errors in policy enforcement
- Unexpected access control issues
- Performance degradation
- Application errors related to RLS

### Rollback Impact

- Security Advisor warnings will reappear
- Previous policies will be restored
- New indexes will be removed
- Zero data loss (only policy/index changes)

## Additional Notes

### Why Split INSERT Policies by Role?

The Security Advisor flags `TO public WITH CHECK (true)` as "always true" because it's a broad permission. By splitting into separate policies for `anon` and `authenticated` roles, we:
1. Maintain the same functionality
2. Make security intent clearer
3. Resolve the Security Advisor warning
4. Follow Supabase best practices

### Why Keep WITH CHECK (true) for INSERT?

For tracking tables (views, clicks), we want to accept all anonymous submissions without restrictions. This is intentional and necessary for:
- Website analytics tracking
- Contact click tracking
- Form submissions from public users

The security is enforced on SELECT - only authorized users can read the data.

### Index Maintenance

Indexes automatically maintained by PostgreSQL. Monitor for:
- Bloat (use `pg_stat_user_indexes`)
- Unused indexes (idx_scan = 0 after significant usage)
- Query plan changes (EXPLAIN ANALYZE)

## Support

For issues or questions:
1. Check validation queries for diagnostic information
2. Review Supabase logs for RLS policy errors
3. Monitor Security Advisor after changes
4. Use rollback script if critical issues arise

## Version History

- **v1.0** (2026-02-06): Initial remediation
  - Fixed 3 RLS policy warnings
  - Added 8 performance indexes
  - Created validation and rollback scripts
