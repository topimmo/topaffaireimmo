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

The current implementation uses a simplified approach for demonstration. For production:

1. Use a proper Web Push library with full encryption support
2. Implement proper VAPID authentication headers
3. Add retry logic for failed pushes
4. Monitor and log push notification delivery
5. Implement rate limiting to prevent abuse
