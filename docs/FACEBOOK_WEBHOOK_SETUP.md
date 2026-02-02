# Facebook Webhook Setup Guide

## Problem Solved

This document describes the fix for the Facebook webhook 401 spam issue in the admin console.

### Previous Issue
- Client-side code called `sendFacebookWebhook()` from browser on every property approval
- Caused 401 errors in console because client-side calls require auth tokens
- React.StrictMode caused double-rendering, leading to duplicate/spam requests
- No protection against multiple clicks or retries

### Solution
**Removed all automatic client-side webhook calls** from the approval flow to eliminate 401 spam and duplicate requests.

## Current Implementation

### Automatic Posting (Recommended)
To enable automatic Facebook posting when properties are approved, configure **Supabase Database Webhooks** in your Supabase Dashboard:

1. Go to your Supabase Project Dashboard
2. Navigate to **Database** → **Webhooks**
3. Click **Create a new webhook**
4. Configure as follows:
   - **Name**: `facebook-webhook-on-approval`
   - **Table**: `properties`
   - **Events**: `UPDATE`
   - **Type**: `Edge Function`
   - **Edge Function**: `send-facebook-webhook`
   - **HTTP Headers**: 
     ```json
     {
       "Content-Type": "application/json"
     }
     ```
   - **Conditions** (PostgreSQL WHERE clause):
     ```sql
     (NEW.status = 'approved' AND OLD.status != 'approved' AND (NEW.facebook_posted IS NULL OR NEW.facebook_posted = false))
     ```
   - **Payload** (JSON):
     ```json
     {
       "listing_id": "${record.id}"
     }
     ```

5. Save the webhook

This configuration ensures:
- ✅ Webhook only fires when status changes TO 'approved'
- ✅ Webhook only fires for properties not yet posted to Facebook
- ✅ No client-side calls (no 401 errors)
- ✅ No duplicate requests
- ✅ Server-side execution (no StrictMode issues)

### Manual Posting (Fallback)

If automatic webhooks are not configured, admins can manually post to Facebook:

1. Navigate to the property detail page in Admin Panel
2. Find the "Facebook Posting Status" section
3. Click the **"Retry Post"** button

This sends a single, authorized request to the Edge Function.

## Edge Function Behavior

The `send-facebook-webhook` Edge Function (`supabase/functions/send-facebook-webhook/index.ts`) handles:

1. **Idempotency**: Never posts the same listing twice (checks `facebook_posted` flag)
2. **Error handling**: Stores errors in `facebook_post_error` field without failing
3. **Make.com integration**: Sends listing data to Make webhook for Facebook posting
4. **Database updates**: Marks listings as posted with timestamp

## Files Modified

1. ✅ `src/pages/admin/AdminListings.tsx` - Removed automatic webhook call on approval
2. ✅ `src/pages/admin/AdminListingDetail.tsx` - Removed automatic webhook call on approval (kept manual retry button)
3. ✅ `src/lib/facebookWebhook.ts` - Unchanged (still used for manual retry)

## Testing

### Test Automatic Webhook (if configured)
1. Configure Supabase Database Webhook as described above
2. Approve a property in Admin Panel
3. Check the property's `facebook_posted` flag - should be `true`
4. Check `facebook_post_id` if Make.com returns it
5. Verify no 401 errors in browser console

### Test Manual Retry
1. Approve a property (or use existing approved property)
2. Go to property detail page
3. Click "Retry Post" button
4. Should show success/error message
5. No 401 spam in console

### Verify No Client-Side Calls
1. Open browser DevTools → Network tab
2. Approve a property
3. Should NOT see any POST requests to `/functions/v1/send-facebook-webhook` from the client
4. No 401 errors in console

## Benefits

✅ **No more 401 spam** - Client-side calls eliminated  
✅ **No duplicate requests** - Server-side execution prevents StrictMode issues  
✅ **Better security** - Auth tokens not sent from client  
✅ **Cleaner architecture** - Separation of concerns (approval vs. posting)  
✅ **Manual fallback** - Retry button for edge cases  
✅ **Idempotent** - Edge Function prevents duplicate posts

## Environment Variables

Ensure these are set in Supabase Edge Function secrets:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access
- `MAKE_WEBHOOK_URL` - Make.com webhook URL for Facebook posting
- `VITE_PRODUCTION_DOMAIN` - Public domain for listing URLs

## Troubleshooting

### Webhook not firing
- Check Supabase Dashboard → Database → Webhooks → Logs
- Verify the conditions match your database schema
- Ensure Edge Function is deployed

### Edge Function errors
- Check Supabase Dashboard → Edge Functions → Logs
- Verify all environment variables are set
- Check Make.com webhook is accessible

### Manual retry not working
- Check browser console for errors
- Verify admin is logged in (session active)
- Check Edge Function logs for detailed errors
