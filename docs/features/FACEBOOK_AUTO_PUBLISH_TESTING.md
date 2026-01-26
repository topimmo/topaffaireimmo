# Facebook Auto-Publish Testing Guide

This guide provides step-by-step instructions for testing the Facebook auto-publish feature.

## Prerequisites

Before testing, ensure:
1. ✅ Database migrations applied (036, 037)
2. ✅ Edge Function deployed to Supabase
3. ✅ MAKE_WEBHOOK_URL configured in Supabase secrets
4. ✅ Make scenario created and webhook active
5. ✅ Admin account with approval permissions

## Local Testing (Development)

### 1. Setup Local Environment

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# (Optional) Start Supabase locally
supabase start
supabase functions serve
```

### 2. Test Database Migration

```sql
-- Check new fields exist in properties table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'properties'
AND column_name IN (
  'approved_at', 'approved_by', 'published_at',
  'facebook_posted', 'facebook_posted_at', 'facebook_post_id',
  'facebook_post_error', 'share_token'
)
ORDER BY column_name;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'properties'
AND indexname IN ('idx_properties_facebook_posted', 'idx_properties_approved_at');
```

Expected: All 8 fields exist, 2 indexes created.

### 3. Test Edge Function (Mock Webhook)

Create a test webhook endpoint (e.g., using webhook.site or RequestBin):

```bash
# Set test webhook URL
supabase secrets set MAKE_WEBHOOK_URL=https://webhook.site/your-unique-id

# Call Edge Function with test listing
curl -X POST http://localhost:54321/functions/v1/send-facebook-webhook \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"listing_id": "test-listing-uuid"}'
```

Expected: Webhook received with correct payload.

### 4. Test Admin UI - Approval Flow

1. **Login as Admin**:
   - Navigate to `/admin`
   - Login with admin credentials

2. **Create Test Listing** (or use existing pending listing):
   - Go to regular user flow
   - Create a new listing
   - Status will be "pending"

3. **View Pending Listings**:
   - Go to Admin → Listings
   - Filter by "Pending"
   - Confirm test listing appears

4. **Approve Listing (Quick Approve)**:
   - Click checkmark icon on listing row
   - Observe toast notification
   - Check console for webhook call
   - Verify listing status changes to "Approved"

5. **Check Database**:
```sql
SELECT 
  id, title_fr, status, 
  approved_at, approved_by, published_at,
  facebook_posted, facebook_posted_at, facebook_post_error
FROM properties
WHERE id = 'your-test-listing-id';
```

Expected:
- `status` = 'approved'
- `approved_at`, `approved_by`, `published_at` set
- `facebook_posted` = true (if webhook succeeded)
- `facebook_posted_at` set (if webhook succeeded)

### 5. Test Admin UI - Detail View Approval

1. **Click on Pending Listing**:
   - View full listing details

2. **Click Approve Button**:
   - Observe loading state
   - Check toast notification
   - Verify Facebook status card appears

3. **Check Facebook Status Card**:
   - Shows "Posted successfully" or error
   - Displays timestamp if successful
   - Shows post ID if returned by Make

### 6. Test Idempotency

1. **Try to Approve Again**:
   - Same listing, click approve again
   - Or call Edge Function again with same listing_id

Expected:
- Webhook NOT sent (idempotency check)
- Response: `already_posted: true`
- Database: `facebook_posted` remains true

### 7. Test Error Handling

#### Missing Webhook URL
```bash
# Unset webhook URL
supabase secrets unset MAKE_WEBHOOK_URL

# Approve a listing
# Expected: Warning toast, error in facebook_post_error field
```

#### Invalid Webhook URL
```bash
# Set invalid URL
supabase secrets set MAKE_WEBHOOK_URL=https://invalid-url-123456.com

# Approve a listing
# Expected: Error toast, error details in database
```

#### Make Scenario Offline
- Pause Make scenario
- Approve a listing
- Expected: Error toast, retry button available

### 8. Test Retry Functionality

1. **Create a Failed Post**:
   - Cause webhook to fail (invalid URL, Make offline, etc.)
   - Approve a listing
   - Confirm error shown

2. **View Listing Detail**:
   - Navigate to listing detail page
   - Verify Facebook status shows error
   - Verify retry button is visible

3. **Click Retry Button**:
   - Fix the issue (e.g., restore webhook URL)
   - Click "Retry Post" button
   - Observe loading state
   - Check success toast

4. **Verify Success**:
```sql
SELECT facebook_posted, facebook_posted_at, facebook_post_error
FROM properties
WHERE id = 'your-test-listing-id';
```

Expected:
- `facebook_posted` = true
- `facebook_posted_at` set
- `facebook_post_error` = null

## Production Testing

### 1. Pre-Deployment Checklist

- [ ] All database migrations run in production
- [ ] Edge Function deployed: `supabase functions deploy send-facebook-webhook`
- [ ] MAKE_WEBHOOK_URL set in production Supabase secrets
- [ ] Make scenario tested and active
- [ ] Facebook Page connected to Make
- [ ] VITE_PRODUCTION_DOMAIN set correctly

### 2. Smoke Test (Production)

1. **Create Test Listing** (as regular user):
   - Use test data (clearly marked as test)
   - Submit listing

2. **Approve Test Listing** (as admin):
   - Go to admin panel
   - Approve the test listing
   - Check webhook was sent (Make execution history)
   - Verify Facebook post appeared

3. **Verify Facebook Post**:
   - Check Facebook Page
   - Confirm post has correct content
   - Verify public URL works
   - Check image displays correctly

4. **Clean Up**:
   - Delete test Facebook post
   - Mark test listing as inactive or delete

### 3. Monitor Production

1. **Check Edge Function Logs**:
   - Supabase Dashboard → Edge Functions → Logs
   - Look for errors or warnings

2. **Check Make Execution History**:
   - Make Dashboard → Scenario → History
   - Verify all executions succeed

3. **Database Monitoring**:
```sql
-- Count successful posts
SELECT COUNT(*) as successful_posts
FROM properties
WHERE facebook_posted = true;

-- Count failed attempts
SELECT COUNT(*) as failed_attempts
FROM properties
WHERE status = 'approved'
  AND facebook_posted = false
  AND facebook_post_error IS NOT NULL;

-- Recent approvals
SELECT id, title_fr, approved_at, facebook_posted, facebook_post_error
FROM properties
WHERE status = 'approved'
ORDER BY approved_at DESC
LIMIT 10;
```

## Common Issues & Solutions

### Issue: Webhook not sent

**Symptoms**: Listing approved but no webhook call

**Check**:
1. Edge Function logs for errors
2. MAKE_WEBHOOK_URL is set correctly
3. Admin session is valid

**Solution**:
- Verify secret: `supabase secrets list`
- Redeploy function: `supabase functions deploy send-facebook-webhook`

### Issue: Webhook sent but Make fails

**Symptoms**: Webhook received but Make execution fails

**Check**:
1. Make execution history
2. Facebook connection in Make
3. Webhook payload structure

**Solution**:
- Verify Make scenario modules
- Check Facebook Page permissions
- Test Make scenario manually

### Issue: Facebook post created but not marked in DB

**Symptoms**: Post on Facebook but `facebook_posted` still false

**Check**:
1. Edge Function logs for database update errors
2. Network issues during response

**Solution**:
- Manually set `facebook_posted = true` in database
- Or use retry button (will skip posting due to existing post)

### Issue: Duplicate posts

**Symptoms**: Multiple Facebook posts for same listing

**Check**:
1. `facebook_posted` flag in database
2. Multiple admin approvals

**Solution**:
- Should not happen due to idempotency
- If it does, investigate Edge Function logs
- Verify idempotency check is working

## Performance Testing

### Load Test (Optional)

Test approving multiple listings rapidly:

```sql
-- Approve 10 listings at once
UPDATE properties
SET status = 'approved',
    approved_at = NOW(),
    approved_by = 'admin-uuid',
    published_at = NOW()
WHERE status = 'pending'
LIMIT 10;
```

Expected:
- All webhooks sent successfully
- No duplicates
- All marked as posted

Note: Make has rate limits, ensure scenario can handle burst.

## Success Criteria

✅ **Core Functionality**:
- Approving listing triggers webhook
- Webhook payload is complete and correct
- Facebook post created successfully
- Database updated correctly

✅ **Idempotency**:
- Same listing never posted twice
- Retry only works for genuine failures

✅ **Error Handling**:
- Graceful degradation if webhook fails
- Clear error messages to admins
- Retry mechanism works

✅ **Security**:
- Only admins can approve
- Webhook URL not exposed to client
- No sensitive data leaks

✅ **Performance**:
- Approval flow is fast (<3 seconds)
- No blocking operations
- Webhooks sent asynchronously

## Rollback Plan

If issues arise in production:

1. **Disable Feature**:
```bash
# Unset webhook URL (stops posting)
supabase secrets unset MAKE_WEBHOOK_URL
```

2. **Revert Database** (if needed):
```sql
-- Remove new fields (destructive)
ALTER TABLE properties
DROP COLUMN approved_at,
DROP COLUMN approved_by,
DROP COLUMN published_at,
DROP COLUMN facebook_posted,
DROP COLUMN facebook_posted_at,
DROP COLUMN facebook_post_id,
DROP COLUMN facebook_post_error,
DROP COLUMN share_token;
```

3. **Revert Code**:
```bash
git revert <commit-hash>
git push origin main
```

4. **Notify Team**:
- Inform admins feature is disabled
- Manual posting required temporarily

## Support Contacts

- **Supabase Issues**: Check dashboard logs, documentation
- **Make Issues**: Check execution history, contact Make support
- **Facebook Issues**: Check Page settings, API access
