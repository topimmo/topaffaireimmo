# Facebook Auto-Publish Setup Guide

This guide explains how to configure and use the Facebook auto-publish feature for approved listings.

## Overview

When an admin approves a listing, the system automatically:
1. Updates listing status to "approved"
2. Sets approval timestamps and admin ID
3. Sends a webhook to Make (Integromat) with listing details
4. Make processes the webhook and posts to your Facebook Page
5. System marks the listing as "posted" to prevent duplicates

## Setup Instructions

### 1. Configure Make Webhook

1. **Create a Make Scenario**:
   - Go to [Make.com](https://www.make.com)
   - Create a new scenario
   - Add a **Webhook** trigger module
   - Copy the webhook URL (looks like: `https://hook.eu1.make.com/xxxxx`)

2. **Configure Facebook Module**:
   - Add a **Facebook** action module
   - Connect your Facebook Page
   - Map the webhook data to create a post:
     - **Message**: Use `title`, `price`, `city`, `neighborhood`
     - **Link**: Use `public_url`
     - **Photo URL**: Use `image_url`

3. **Optional - Return Post ID**:
   - Add a **Webhook Response** module at the end
   - Return JSON: `{"success": true, "facebook_post_id": "{{post_id}}"}`

### 2. Configure Supabase Edge Function

The webhook URL must be set as a secret in Supabase:

```bash
# Using Supabase CLI
supabase secrets set MAKE_WEBHOOK_URL=https://hook.eu1.make.com/YOUR_WEBHOOK_ID

# Or via Supabase Dashboard:
# 1. Go to Project Settings → Edge Functions
# 2. Add secret: MAKE_WEBHOOK_URL = your_webhook_url
```

**Important**: Do NOT set this in `.env` file as it's server-side only.

### 3. Deploy Edge Function

Deploy the webhook function to Supabase:

```bash
# Deploy using Supabase CLI
supabase functions deploy send-facebook-webhook

# Or via Supabase Dashboard:
# Functions are automatically deployed from your git repository
```

### 4. Apply Database Migrations

Run the migrations to add required fields:

```bash
# Using Supabase CLI (locally)
supabase migration up

# Or apply via Supabase Dashboard:
# Database → Migrations → Run pending migrations
```

Migrations:
- `036_facebook_posting_fields.sql` - Adds Facebook posting fields
- `037_facebook_webhook_trigger.sql` - Creates trigger function (optional)

## Webhook Payload

The Edge Function sends this JSON to Make:

```json
{
  "listing_id": "uuid-of-listing",
  "title": "Beautiful Apartment in Casablanca",
  "price": "1500000",
  "city": "Casablanca",
  "neighborhood": "Maarif",
  "category": "sale - apartment",
  "condition": "apartment",
  "public_url": "https://topaffaireimmo.ma/listing/uuid",
  "image_url": "https://storage.supabase.co/.../image.jpg",
  "approved_at": "2024-01-25T10:30:00Z",
  "approved_by": "admin-uuid"
}
```

## Usage

### For Admins

1. **Approve a Listing**:
   - Go to Admin → Listings
   - Click on a pending listing OR use quick-approve
   - Click "Approve" button
   - System will automatically post to Facebook

2. **Check Facebook Status**:
   - View any approved listing in detail
   - See "Facebook Posting Status" card
   - Shows: Posted/Not Posted, timestamp, post ID, errors

3. **Retry Failed Posts**:
   - If posting failed (network error, etc.)
   - Click "Retry Post" button
   - System will attempt to post again

### Idempotency

The system prevents duplicate posts:
- Each listing has a `facebook_posted` flag
- Once posted successfully, flag is set to `true`
- Subsequent approval attempts skip posting
- Use "Retry" only for genuine failures

## Troubleshooting

### Webhook Not Sent

**Symptoms**: Listing approved but no Facebook post

**Possible Causes**:
1. MAKE_WEBHOOK_URL not configured
   - Check Supabase Edge Function secrets
   - Verify URL is correct

2. Edge Function not deployed
   - Deploy: `supabase functions deploy send-facebook-webhook`

3. Check function logs:
   - Supabase Dashboard → Edge Functions → Logs

### Webhook Sent but Failed

**Symptoms**: Error shown in admin UI

**Possible Causes**:
1. Invalid webhook URL
   - Verify Make webhook is active
   - Test webhook manually

2. Make scenario error
   - Check Make execution history
   - Verify Facebook connection is active

3. Facebook API error
   - Check Facebook Page permissions
   - Verify page access token is valid

### How to Test

1. **Test Webhook URL**:
```bash
curl -X POST https://hook.eu1.make.com/YOUR_WEBHOOK_ID \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": "test",
    "title": "Test Listing",
    "price": "100000",
    "city": "Test City",
    "category": "sale - apartment",
    "public_url": "https://example.com",
    "image_url": "https://example.com/image.jpg"
  }'
```

2. **Test Edge Function** (requires auth token):
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-facebook-webhook \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"listing_id": "actual-listing-uuid"}'
```

## Security

- Webhook URL is server-side only (in Edge Function secrets)
- Only admins can approve listings (RLS enforced)
- Edge Function validates session before sending webhook
- Idempotency prevents abuse/duplicates

## Environment Variables

### Server-Side (Supabase Secrets)
```bash
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/xxxxx
```

### Client-Side (.env)
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.ma
```

## Database Schema

New fields added to `properties` table:

| Field | Type | Description |
|-------|------|-------------|
| `approved_at` | TIMESTAMPTZ | When listing was approved |
| `approved_by` | UUID | Admin who approved |
| `published_at` | TIMESTAMPTZ | When listing was published |
| `facebook_posted` | BOOLEAN | Idempotency flag |
| `facebook_posted_at` | TIMESTAMPTZ | When posted to Facebook |
| `facebook_post_id` | TEXT | Facebook post ID |
| `facebook_post_error` | TEXT | Last error message |
| `share_token` | TEXT | Optional share token |

## Files Modified

- `src/lib/facebookWebhook.ts` - Webhook service library
- `src/pages/admin/AdminListingDetail.tsx` - Detail page with retry
- `src/pages/admin/AdminListings.tsx` - List page with quick-approve
- `supabase/functions/send-facebook-webhook/index.ts` - Edge Function
- `supabase/migrations/036_facebook_posting_fields.sql` - Schema changes
- `supabase/migrations/037_facebook_webhook_trigger.sql` - Trigger (optional)

## Support

For issues or questions:
1. Check Edge Function logs in Supabase Dashboard
2. Check Make execution history
3. Review error messages in admin UI
4. Check listing's `facebook_post_error` field in database
