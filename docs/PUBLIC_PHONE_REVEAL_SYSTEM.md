# Public Phone Reveal System - Implementation Documentation

## Overview
This document describes the implementation of the public phone reveal system that allows anonymous visitors to view phone numbers on listings and service provider profiles without authentication, while maintaining security and analytics tracking.

## Architecture

### Components

#### 1. Frontend Component: `PublicRevealPhoneButton`
**Location**: `src/components/PublicRevealPhoneButton.tsx`

**Features**:
- Works for anonymous visitors (no authentication required)
- Calls secure Edge Function endpoint
- Client-side analytics tracking
- Rate limit error handling
- Loading and error states
- Masked phone preview (optional)

**Usage**:
```tsx
import PublicRevealPhoneButton from '@/components/PublicRevealPhoneButton';

<PublicRevealPhoneButton
  entityType="listing"
  entityId="uuid-here"
  entityName="Property Title"
  source="immobilier"
  maskedPhone="+212 6** *** **78"
/>
```

**Props**:
- `entityType`: 'listing' | 'service' - Type of entity
- `entityId`: string - UUID of the entity
- `entityName?`: string - Optional entity name for analytics
- `source?`: 'immobilier' | 'services' - Source for analytics
- `maskedPhone?`: string - Optional masked phone preview

#### 2. Backend: Supabase Edge Function
**Location**: `supabase/functions/reveal-phone/index.ts`

**Endpoint**: `POST /functions/v1/reveal-phone`

**Request Body**:
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

**Response (Success)**:
```json
{
  "success": true,
  "phone": "+212664228976",
  "whatsapp": "+212664228976",
  "email": "contact@example.com",
  "businessName": "Business Name" // only for services
}
```

**Response (Rate Limit - 429)**:
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Rate limit exceeded. Please wait before requesting more reveals."
}
```

#### 3. Database: SQL Migration
**Location**: `supabase/migrations/105_public_phone_reveal_system.sql`

**Tables Created**:
- `phone_reveal_events` - Logs all reveal attempts with analytics data

**Functions Created**:
- `hash_ip_address(TEXT)` - SHA-256 hash for IP addresses
- `hash_user_agent(TEXT)` - SHA-256 hash for user agents
- `check_reveal_rate_limit(...)` - Rate limiting check
- `get_listing_phone(UUID)` - Securely fetch listing contact info
- `get_artisan_phone(UUID)` - Securely fetch artisan contact info

**Views Created**:
- `phone_reveal_analytics` - Daily analytics summary for admins

## Security Measures

### 1. Rate Limiting
- **10 reveals per minute** per IP + User Agent combination
- **2 reveals per entity per minute** from same IP (anti-spam)
- Rate limit check happens before phone reveal
- Blocked attempts are logged for analysis

### 2. Privacy
- IP addresses are **hashed (SHA-256)** before storage
- User agents are **hashed (SHA-256)** before storage
- Original IP/UA never stored in database
- Salt: 'topaffaire_salt_2024' (should be moved to environment variable in production)

### 3. Data Access Control
- Phone numbers **NOT** accessible via public select queries
- `properties_public` view returns `NULL` for `contact_phone`
- Phone only retrievable via Edge Function with service role
- RLS policies prevent direct public access to phone data

### 4. Validation
- Entity type validation (listing | service)
- UUID format validation for entity ID
- Entity existence check
- Entity status check (published/verified/active)

### 5. Input Sanitization
- JSON parsing with error handling
- Request body validation
- SQL injection prevention via parameterized queries

## Analytics Tracking

### Client-Side Events
Tracked via Google Analytics (gtag) when available:

1. **phone_reveal_clicked**
   - Triggered: When user clicks reveal button
   - Metadata: entity_type, entity_id, entity_name, source, language

2. **phone_reveal_success**
   - Triggered: After successful reveal
   - Metadata: entity_type, entity_id, has_phone, has_whatsapp, has_email

3. **phone_reveal_blocked**
   - Triggered: When rate limit blocks the request
   - Metadata: entity_type, entity_id, reason

4. **phone_reveal_error**
   - Triggered: On any error during reveal
   - Metadata: entity_type, entity_id, error message

### Server-Side Logging
All reveal attempts logged to `phone_reveal_events` table:

**Columns**:
- `id` - UUID primary key
- `created_at` - Timestamp
- `entity_type` - 'listing' | 'service'
- `entity_id` - UUID of entity
- `ip_hash` - SHA-256 hash of IP
- `user_agent_hash` - SHA-256 hash of user agent
- `referrer` - HTTP referrer
- `page_url` - Page where reveal occurred
- `language` - User language preference
- `source` - 'immobilier' | 'services'
- `success` - Boolean (true if revealed)
- `blocked` - Boolean (true if rate limited)
- `block_reason` - Reason for block (if blocked)

**Analytics View**:
Admins can query `phone_reveal_analytics` for daily summaries:
```sql
SELECT * FROM phone_reveal_analytics 
WHERE reveal_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY reveal_date DESC;
```

## Integration Points

### PropertyDetails Page
**Location**: `src/pages/PropertyDetails.tsx`

**Changes**:
1. Import `PublicRevealPhoneButton`
2. Replace old contact button section
3. Pass listing ID and metadata to component

**Before** (auth-required):
```tsx
{shouldShowPhone && phone && (
  <Button asChild>
    <a href={`tel:${phone}`}>
      <Phone /> Call Now
    </a>
  </Button>
)}
```

**After** (public):
```tsx
<PublicRevealPhoneButton
  entityType="listing"
  entityId={id}
  entityName={title}
  source="immobilier"
  maskedPhone={phone || undefined}
/>
```

### Service Provider Profiles
**When Implemented**:
Use the same `PublicRevealPhoneButton` component with `entityType="service"`:

```tsx
<PublicRevealPhoneButton
  entityType="service"
  entityId={artisanId}
  entityName={artisanName}
  source="services"
/>
```

## Deployment

### 1. Database Migration
Run the SQL migration to create tables and functions:
```bash
# If using Supabase CLI
supabase db push

# Or run migration file directly in Supabase dashboard
# Location: supabase/migrations/105_public_phone_reveal_system.sql
```

### 2. Deploy Edge Function
```bash
# Deploy the reveal-phone function
supabase functions deploy reveal-phone

# Verify deployment
supabase functions list
```

### 3. Environment Variables
Ensure these are set in Supabase dashboard:
- `SUPABASE_URL` - Auto-configured
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-configured (keep secret!)
- **`PHONE_REVEAL_HASH_SALT`** - **CRITICAL: Must be set in production!**

**Setting the Hash Salt** (IMPORTANT for security):
```bash
# Option 1: Via Supabase Dashboard (Recommended)
# Settings -> Vault -> New Secret
# Name: PHONE_REVEAL_HASH_SALT
# Value: <generate strong random salt>

# Option 2: Via SQL (Alternative)
ALTER DATABASE postgres SET app.phone_reveal_hash_salt = 'your-strong-random-salt';

# Generate a strong salt (example)
openssl rand -hex 32
```

**Note**: The migration includes a fallback salt for development, but this MUST be overridden in production for security.

### 4. Frontend Build
No special configuration needed. The component uses existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Testing

### Manual Test Checklist
See `docs/PHONE_REVEAL_TEST_CHECKLIST.md` for detailed testing steps.

Quick tests:
1. Open listing page as anonymous user
2. Click "Afficher le numéro" button
3. Verify phone number is revealed
4. Check phone is NOT in HTML source (View Page Source)
5. Click reveal 11 times rapidly - should get rate limit error
6. Wait 1 minute and try again - should work

### Edge Function Local Testing
```bash
# Start local Supabase
supabase start

# Serve function locally
supabase functions serve reveal-phone

# Test with curl
curl -X POST \
  http://localhost:54321/functions/v1/reveal-phone \
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

## Performance Considerations

### Database Indexes
The migration creates indexes for:
- `phone_reveal_events.created_at` (DESC) - Analytics queries
- `phone_reveal_events.entity_type, entity_id` - Entity lookup
- `phone_reveal_events.ip_hash, created_at` - Rate limiting
- `phone_reveal_events.ip_hash, user_agent_hash, created_at` - Detailed rate limiting

### Edge Function Performance
- Uses Supabase service role (bypasses RLS overhead)
- Rate limit check is a single RPC call
- Phone retrieval is a single RPC call
- Average response time: ~200-500ms

### Caching Considerations
- No caching of phone numbers (always fresh from DB)
- Rate limit checks query recent events only (indexed)
- Consider adding Redis cache for rate limits in high-traffic scenarios

## Security Best Practices

### Production Recommendations

1. **Update Salt**:
   Move hash salt to environment variable:
   ```typescript
   const HASH_SALT = Deno.env.get('PHONE_REVEAL_HASH_SALT') || 'default_salt'
   ```

2. **Monitor Abuse**:
   Set up alerts for:
   - High block rates (>50% blocked in 1 hour)
   - Unusual IP patterns
   - Rapid sequential entity reveals

3. **Adjust Rate Limits**:
   Based on analytics, consider adjusting:
   ```typescript
   const RATE_LIMIT_WINDOW_SECONDS = 60
   const RATE_LIMIT_MAX_REQUESTS = 10
   ```

4. **Additional Bot Protection**:
   Consider adding:
   - CAPTCHA for high-frequency users
   - Honeypot fields
   - Browser fingerprinting

5. **Audit Logging**:
   The current system logs all attempts. Consider:
   - Regular cleanup of old events (>90 days)
   - Archiving to cheaper storage
   - GDPR compliance checks

## Troubleshooting

### Edge Function Not Working
1. Check Supabase project logs
2. Verify environment variables are set
3. Test with curl (see testing section)
4. Check CORS headers in browser

### Rate Limit Not Working
1. Verify migration ran successfully
2. Check `check_reveal_rate_limit` function exists
3. Test rate limit manually with multiple requests
4. Verify indexes exist on `phone_reveal_events`

### Phone Not Revealed
1. Check entity exists in database
2. Verify entity status (published/verified)
3. Check entity has phone number set
4. Review Edge Function logs for errors
5. Verify RPC functions exist (`get_listing_phone`, `get_artisan_phone`)

### Analytics Not Tracking
1. Verify Google Analytics is configured
2. Check browser console for gtag errors
3. Review `phone_reveal_events` table for server-side logs
4. Check admin can query `phone_reveal_analytics` view

## Future Enhancements

### Planned
1. **CAPTCHA Integration**: Add hCaptcha or reCAPTCHA for suspicious patterns
2. **Email Notifications**: Alert owners when their phone is revealed
3. **Premium Analytics**: Detailed dashboards for property owners
4. **A/B Testing**: Test different reveal button designs
5. **WhatsApp Direct Link**: Pre-filled message when clicking WhatsApp

### Under Consideration
1. **Reveal Credits System**: Limit free reveals, charge for more
2. **Geographic Restrictions**: Limit reveals by country/region
3. **Business Hours**: Only reveal during business hours
4. **Verified Viewers**: Higher limits for verified users

## Support
For issues or questions, please:
1. Check Supabase Edge Function logs
2. Review database migration logs
3. Check browser console for client-side errors
4. Contact dev team with relevant logs

## Version History
- **v1.0** (2024-02-13): Initial implementation
  - Public phone reveal for listings
  - Rate limiting and analytics
  - Edge Function deployment
