# Send Facebook Webhook Edge Function

Supabase Edge Function that sends approved listings to Make.com for automatic Facebook posting.

## Purpose

When a listing is approved by an admin, this function:
1. Validates the listing hasn't been posted yet (idempotency check)
2. Fetches complete listing data from the database
3. Sends a webhook to Make with formatted payload
4. Updates the listing's Facebook posting status

## Environment Variables

Set via Supabase secrets (NOT in .env):

```bash
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/YOUR_WEBHOOK_ID
```

Required (auto-provided by Supabase):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin access

Optional:
- `VITE_PRODUCTION_DOMAIN` - Domain for public listing URLs (default: https://topaffaireimmo.vercel.app)

## Request

**Method**: POST

**Endpoint**: `https://YOUR_PROJECT.supabase.co/functions/v1/send-facebook-webhook`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Body**:
```json
{
  "listing_id": "uuid-of-approved-listing"
}
```

## Response

### Success
```json
{
  "success": true,
  "message": "Posted to Facebook successfully",
  "listing_id": "xxx",
  "facebook_post_id": "xxx" // if Make returns it
}
```

### Already Posted
```json
{
  "success": true,
  "message": "Already posted to Facebook",
  "already_posted": true
}
```

### Webhook URL Not Configured
```json
{
  "success": false,
  "message": "Webhook URL not configured",
  "skipped": true
}
```

### Error
```json
{
  "success": false,
  "error": "Error message",
  "details": "..."
}
```

## Webhook Payload Sent to Make

```json
{
  "listing_id": "uuid",
  "title": "Property title (French)",
  "price": "1500000",
  "city": "Casablanca",
  "neighborhood": "Maarif",
  "category": "sale - apartment",
  "condition": "apartment",
  "public_url": "https://domain/listing/uuid",
  "image_url": "https://storage.supabase.co/.../image.jpg",
  "approved_at": "2024-01-25T10:30:00Z",
  "approved_by": "admin-uuid"
}
```

## Idempotency

The function checks `facebook_posted` flag:
- If `true`: Returns "already posted" without calling webhook
- If `false`: Sends webhook and sets flag to `true` on success

This prevents duplicate Facebook posts.

## Error Handling

- **Listing not found**: Returns 404
- **Webhook URL missing**: Logs warning, sets error field, returns success=false with skipped=true
- **Webhook fails**: Logs error, sets `facebook_post_error`, does NOT set `facebook_posted`
- **Database update fails**: Returns 500

Errors are stored in `properties.facebook_post_error` for admin visibility.

## Deployment

```bash
# Deploy function
supabase functions deploy send-facebook-webhook

# Set webhook URL secret
supabase secrets set MAKE_WEBHOOK_URL=https://hook.eu1.make.com/xxxxx

# View logs
supabase functions logs send-facebook-webhook
```

## Local Development

```bash
# Serve function locally
supabase functions serve send-facebook-webhook --env-file .env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/send-facebook-webhook \
  -H "Authorization: Bearer YOUR_LOCAL_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"listing_id": "test-uuid"}'
```

## Security

- Requires valid Supabase auth token
- Uses service role key to bypass RLS (admin-only operation)
- Webhook URL is server-side secret (not exposed to client)
- Validates listing exists before sending webhook

## Integration

Called by:
- `src/lib/facebookWebhook.ts` - Client library
- `src/pages/admin/AdminListingDetail.tsx` - Detail page
- `src/pages/admin/AdminListings.tsx` - List page

After:
- Admin approves a listing
- Listing is retried from admin UI
