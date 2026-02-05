# Send Push Notification Edge Function

This Supabase Edge Function sends web push notifications to subscribed users.

## Setup

### 1. Generate VAPID Keys

VAPID keys are required for web push notifications. Generate them using:

```bash
npm install -g web-push
web-push generate-vapid-keys
```

This will output:
```
Public Key: <your-public-key>
Private Key: <your-private-key>
```

### 2. Set Environment Variables

Add these to your Supabase project:

```bash
# Via Supabase CLI
supabase secrets set VAPID_PUBLIC_KEY="<your-public-key>"
supabase secrets set VAPID_PRIVATE_KEY="<your-private-key>"
supabase secrets set VAPID_SUBJECT="mailto:contact@topaffaireimmo.com"

# Via Supabase Dashboard
# Settings > Edge Functions > Add secret
```

### 3. Deploy Function

```bash
supabase functions deploy send-push-notification
```

## Usage

### Send to Specific Users

```typescript
const { data, error } = await supabase.functions.invoke('send-push-notification', {
  body: {
    user_ids: ['user-uuid-1', 'user-uuid-2'],
    payload: {
      title: 'Nouvelle propriété!',
      body: 'Une nouvelle propriété correspond à vos critères',
      icon: '/icons/icon-192.png',
      data: {
        url: '/property/123'
      }
    }
  }
})
```

### Send to All Users

```typescript
const { data, error } = await supabase.functions.invoke('send-push-notification', {
  body: {
    send_to_all: true,
    payload: {
      title: 'Annonce importante',
      body: 'Consultez nos nouvelles propriétés',
      icon: '/icons/icon-192.png',
      data: {
        url: '/'
      }
    }
  }
})
```

## Security

- Only authenticated admin users can send notifications
- Requires valid JWT token in Authorization header
- VAPID keys must be configured
- Invalid subscriptions are automatically deactivated

## Response Format

```json
{
  "success": true,
  "message": "Push notifications sent to 45 out of 50 subscriptions",
  "sent": 45,
  "failed": 5,
  "total": 50,
  "failedSubscriptions": ["uuid-1", "uuid-2"]
}
```

## Error Handling

- 401: Missing or invalid authorization
- 403: User is not an admin
- 400: Invalid payload (missing title or body)
- 500: VAPID keys not configured or other server error

## Production Notes

⚠️ **IMPORTANT**: The current implementation uses a simplified approach for demonstration purposes.

### Current Limitations
- Simplified Web Push protocol implementation
- No payload encryption (requires full web-push library)
- No proper VAPID signing (requires full web-push library)
- Manual subscription cleanup only on 410 errors

### For Production Deployment

**Option 1: Use a Web Push Service** (Recommended)
- Use a service like Firebase Cloud Messaging (FCM)
- Or OneSignal, Pushwoosh, etc.
- These handle all encryption and VAPID signing

**Option 2: Implement Full Web Push Protocol**
1. Use the `web-push` npm package (supports Deno)
2. Implement proper payload encryption with AES-GCM
3. Add VAPID signing to all requests
4. Handle all HTTP headers correctly

Example with web-push library:
```typescript
import webpush from 'npm:web-push@3.6.6'

// Configure VAPID
webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

// Send notification
const result = await webpush.sendNotification(
  {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth
    }
  },
  JSON.stringify(payload)
)
```

### Additional Production Requirements
1. Add retry logic for failed pushes
2. Implement rate limiting to prevent abuse
3. Add monitoring and logging for push delivery
4. Set up alerts for high failure rates
5. Implement push notification analytics
6. Add user preference management (notification types)
7. Consider implementing a queue system for bulk sends

