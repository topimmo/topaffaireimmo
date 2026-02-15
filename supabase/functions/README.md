# Supabase Edge Functions

This directory contains Deno-based Edge Functions for TopAffaireImmo.

## Functions Overview

### 1. reveal-phone
**Purpose**: Securely reveal phone numbers with rate limiting and analytics.

**Features**:
- Public access (no authentication required)
- Rate limiting (5 per hour, 20 per day per IP)
- Privacy-safe analytics (hashed IP/User-Agent)
- Supports both properties and artisan services

**Usage**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/reveal-phone \
  -H "Content-Type: application/json" \
  -d '{
    "entity_type": "listing",
    "entity_id": "uuid-here",
    "referrer": "https://example.com",
    "page_url": "https://example.com/property/123"
  }'
```

**Response**:
```json
{
  "success": true,
  "phone": "+212 6XX XXX XXX"
}
```

**Rate Limit Response**:
```json
{
  "success": false,
  "blocked": true,
  "message": "Rate limit exceeded. Please try again later."
}
```

### 2. stripe-webhook (NEW)
**Purpose**: Handle Stripe payment webhooks for property boosts.

**Features**:
- Webhook signature verification
- Payment status updates
- Automatic boost activation
- User notifications
- Refund handling

**Events Handled**:
- `payment_intent.succeeded` - Activate boost
- `payment_intent.payment_failed` - Notify user
- `charge.refunded` - Deactivate boost

**Setup**:
1. Set Stripe webhook secret in Supabase:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

2. Configure Stripe webhook endpoint:
   ```
   https://your-project.supabase.co/functions/v1/stripe-webhook
   ```

3. Select events to send:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`

**Metadata Required** (in Stripe PaymentIntent):
```json
{
  "payment_id": "uuid-from-payments-table",
  "property_boost_id": "uuid-from-property-boosts-table"
}
```

### 3. send-facebook-webhook
**Purpose**: Send property data to Facebook for advertising integration.

**Features**:
- Facebook Conversions API integration
- Property view tracking
- Lead tracking

**Usage**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-facebook-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "ViewContent",
    "property_id": "uuid-here",
    "user_data": {...}
  }'
```

### 4. send-push-notification
**Purpose**: Send push notifications to users.

**Features**:
- Web Push notifications
- Firebase Cloud Messaging integration
- Notification batching

**Usage**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-push-notification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "user_id": "uuid-here",
    "title": "New Property",
    "body": "A new property matching your criteria is available",
    "data": {...}
  }'
```

## Development

### Local Testing

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Start local Supabase:
   ```bash
   supabase start
   ```

3. Serve functions locally:
   ```bash
   supabase functions serve stripe-webhook --env-file ./supabase/.env.local
   ```

4. Test with curl:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/stripe-webhook \
     -H "Content-Type: application/json" \
     -d @test-payload.json
   ```

### Deployment

Deploy all functions:
```bash
supabase functions deploy
```

Deploy specific function:
```bash
supabase functions deploy stripe-webhook
```

## Environment Variables

Configure in Supabase Dashboard > Settings > Edge Functions:

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes (auto) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Yes (auto) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Yes (stripe-webhook) |
| `STRIPE_SECRET_KEY` | Stripe API secret key | Optional |
| `FACEBOOK_ACCESS_TOKEN` | Facebook API token | Optional |
| `FACEBOOK_PIXEL_ID` | Facebook Pixel ID | Optional |
| `VAPID_PUBLIC_KEY` | Web Push public key | Optional |
| `VAPID_PRIVATE_KEY` | Web Push private key | Optional |

## Security

### Best Practices

1. **Always verify webhook signatures**
   - Stripe: Use `stripe-signature` header
   - Custom webhooks: Use HMAC validation

2. **Use Service Role Key carefully**
   - Only in Edge Functions (server-side)
   - Never expose to client
   - Bypasses RLS policies

3. **Validate input**
   ```typescript
   if (!entity_id || !entity_type) {
     return new Response(
       JSON.stringify({ error: 'Missing required fields' }),
       { status: 400 }
     )
   }
   ```

4. **Handle errors gracefully**
   ```typescript
   try {
     // Function logic
   } catch (error) {
     console.error('Function error:', error)
     return new Response(
       JSON.stringify({ error: 'Internal server error' }),
       { status: 500 }
     )
   }
   ```

5. **Rate limiting**
   - Implement for public endpoints
   - Use IP-based or user-based limits
   - Return 429 Too Many Requests

### CORS Configuration

All functions include CORS headers:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

Restrict origins in production:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
```

## Monitoring

### Logs

View function logs:
```bash
supabase functions logs stripe-webhook
```

View logs in dashboard:
- Supabase Dashboard > Edge Functions > [Function Name] > Logs

### Metrics

Monitor in Supabase Dashboard:
- Invocations count
- Error rate
- Execution time
- CPU usage
- Memory usage

### Alerts

Set up alerts for:
- High error rate (>5%)
- Slow execution (>5s)
- High invocation count (unusual traffic)

## Testing

### Unit Tests

```typescript
// stripe-webhook.test.ts
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts"

Deno.test("webhook validates signature", async () => {
  const req = new Request("http://localhost", {
    method: "POST",
    headers: {
      "stripe-signature": "valid-signature"
    },
    body: JSON.stringify({
      type: "payment_intent.succeeded",
      data: {...}
    })
  })
  
  // Test logic
})
```

### Integration Tests

```bash
# Test Stripe webhook
stripe trigger payment_intent.succeeded \
  --override payment_intent:metadata.payment_id=test-uuid \
  --override payment_intent:metadata.property_boost_id=test-uuid
```

### Load Testing

```bash
# Using artillery
artillery quick --count 100 --num 10 \
  https://your-project.supabase.co/functions/v1/stripe-webhook
```

## Troubleshooting

### Common Issues

1. **Function timeout (60s default)**
   - Solution: Optimize queries, use batch operations
   - Long-running tasks: Use background jobs

2. **Memory limit exceeded**
   - Solution: Process data in chunks
   - Limit response size

3. **CORS errors**
   - Check `Access-Control-Allow-Origin` header
   - Verify preflight OPTIONS handling

4. **Webhook not triggering**
   - Verify webhook URL in provider dashboard
   - Check webhook secret
   - Review function logs for errors

5. **Database connection errors**
   - Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   - Check network connectivity
   - Review RLS policies

### Debug Mode

Enable verbose logging:
```typescript
const DEBUG = Deno.env.get('DEBUG') === 'true'

if (DEBUG) {
  console.log('Request headers:', req.headers)
  console.log('Request body:', body)
}
```

Set in Supabase:
```bash
supabase secrets set DEBUG=true
```

## Performance Optimization

### Best Practices

1. **Minimize database queries**
   ```typescript
   // Bad: Multiple queries
   const property = await supabase.from('properties').select('*').eq('id', id).single()
   const owner = await supabase.from('profiles').select('*').eq('id', property.owner_id).single()
   
   // Good: Single query with join
   const { data } = await supabase
     .from('properties')
     .select('*, owner:profiles!inner(*)')
     .eq('id', id)
     .single()
   ```

2. **Use connection pooling**
   - Reuse Supabase client instance
   - Don't create new client for each request

3. **Cache responses**
   ```typescript
   // Cache boost plans (rarely change)
   const cacheKey = 'boost_plans'
   let plans = cache.get(cacheKey)
   
   if (!plans) {
     const { data } = await supabase.from('boost_plans').select('*')
     plans = data
     cache.set(cacheKey, plans, { ttl: 3600 }) // 1 hour
   }
   ```

4. **Batch operations**
   ```typescript
   // Insert multiple notifications at once
   await supabase
     .from('notifications')
     .insert(notificationArray)
   ```

## Migration Guide

### Adding a New Function

1. Create function directory:
   ```bash
   mkdir supabase/functions/my-function
   ```

2. Create `index.ts`:
   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
   
   serve(async (req) => {
     // Your logic here
   })
   ```

3. Deploy:
   ```bash
   supabase functions deploy my-function
   ```

4. Set secrets:
   ```bash
   supabase secrets set MY_SECRET=value
   ```

### Updating Existing Function

1. Modify `index.ts`
2. Test locally
3. Deploy with `--no-verify-jwt` if needed:
   ```bash
   supabase functions deploy my-function --no-verify-jwt
   ```

## Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

---

**Last Updated**: February 2024  
**Maintained by**: TopAffaireImmo Team
