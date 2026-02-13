# Reveal Phone Edge Function

## Purpose
Secure, public endpoint for revealing phone numbers with rate limiting and analytics.

## Endpoint
`POST /functions/v1/reveal-phone`

## Security Features
- ✅ **Rate Limiting**: Max 10 reveals per minute per IP+UserAgent
- ✅ **Privacy**: IP and User-Agent are hashed (SHA-256) before storage
- ✅ **Validation**: Entity type and ID validation
- ✅ **Analytics**: All reveal attempts are logged for analysis
- ✅ **Bot Protection**: Cooldown per entity (max 2 reveals/entity/minute)

## Request Body
```json
{
  "entityType": "listing" | "service",
  "entityId": "uuid-string",
  "metadata": {
    "referrer": "string (optional)",
    "pageUrl": "string (optional)",
    "language": "fr | ar (optional)",
    "source": "immobilier | services (optional)"
  }
}
```

## Response (Success)
```json
{
  "success": true,
  "phone": "+212664228976",
  "whatsapp": "+212664228976",
  "email": "contact@example.com",
  "businessName": "Plombier Pro" // only for services
}
```

## Response (Rate Limit)
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Rate limit exceeded. Please wait before requesting more reveals."
}
```

## Response (Not Found)
```json
{
  "success": false,
  "error": "Entity not found or not accessible"
}
```

## Environment Variables Required
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Deployment
```bash
# Deploy to Supabase
supabase functions deploy reveal-phone

# Test locally
supabase functions serve reveal-phone
```

## Testing
```bash
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/reveal-phone \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "entityType": "listing",
    "entityId": "00000000-0000-0000-0000-000000000000",
    "metadata": {
      "source": "immobilier",
      "language": "fr"
    }
  }'
```

## Analytics
All reveal events are logged to `phone_reveal_events` table with:
- Hashed IP and User-Agent (privacy-safe)
- Entity type and ID
- Success/failure status
- Block reason (if blocked)
- Metadata (referrer, page URL, language, source)

Admins can query `phone_reveal_analytics` view for daily summaries.
