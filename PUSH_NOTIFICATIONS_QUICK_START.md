# Web Push Notifications - Quick Start Guide

This guide will help you get web push notifications up and running quickly.

## For Developers

### Step 1: Generate VAPID Keys (One-time)

```bash
npm run generate:vapid-keys
```

This outputs:
- **Public Key** - For frontend (.env and Vercel)
- **Private Key** - For backend (Supabase secrets) - **KEEP SECRET!**

### Step 2: Configure Frontend

Add to `.env` (local) and Vercel environment variables:

```bash
VITE_VAPID_PUBLIC_KEY=your_public_key_here
```

### Step 3: Configure Backend (Supabase)

```bash
# Set Edge Function secrets
supabase secrets set VAPID_PUBLIC_KEY="your_public_key_here"
supabase secrets set VAPID_PRIVATE_KEY="your_private_key_here"
supabase secrets set VAPID_SUBJECT="mailto:contact@topaffaireimmo.com"
```

### Step 4: Deploy Database Migration

Run the migration:
```sql
-- Execute supabase/migrations/076_create_push_subscriptions_table.sql
-- in Supabase Dashboard SQL Editor
```

Or use CLI:
```bash
supabase db push
```

### Step 5: Deploy Edge Function

```bash
supabase functions deploy send-push-notification
```

### Step 6: Deploy Frontend

```bash
npm run build
# Deploy to Vercel
```

## For End Users

### Enabling Notifications

1. Log in to your account
2. Go to Dashboard
3. Find "Notifications" section
4. Toggle the switch ON
5. Click "Allow" when browser asks for permission
6. Done! You'll receive notifications

### Disabling Notifications

1. Go to Dashboard
2. Toggle the "Notifications" switch OFF

## Testing

### Check if Notification Permission is Granted

Open browser console and run:
```javascript
console.log('Permission:', Notification.permission)
// Should show: "granted", "denied", or "default"
```

### Check if Service Worker is Active

1. Open DevTools → Application tab
2. Click "Service Workers"
3. Verify service worker is activated
4. Look for "[Service Worker] Loaded with push notification support" in console

### Check Subscription

Open browser console and run:
```javascript
navigator.serviceWorker.ready.then(async (registration) => {
  const subscription = await registration.pushManager.getSubscription()
  console.log('Subscription:', subscription)
})
```

### Send Test Notification (Admin Only)

From browser console (while logged in as admin):

```javascript
const { data, error } = await supabase.functions.invoke('send-push-notification', {
  body: {
    send_to_all: true,
    payload: {
      title: 'Test Notification',
      body: 'This is a test!',
      icon: '/icons/icon-192.png',
      data: { url: '/' }
    }
  }
})
console.log('Result:', data, error)
```

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Android Chrome | All recent | ✅ Full |
| Desktop Chrome | All recent | ✅ Full |
| Desktop Edge | All recent | ✅ Full |
| Desktop Firefox | All recent | ✅ Full |
| iOS Safari | 16.4+ | ✅ Full |
| iOS Safari | < 16.4 | ❌ No support |

## Common Issues

### "Notifications not supported"
- **Cause**: Old browser or iOS < 16.4
- **Solution**: Update browser or explain feature not available

### "Permission denied"
- **Cause**: User clicked "Block" on permission prompt
- **Solution**: User must manually enable in browser settings

### Subscription fails
- **Cause**: VAPID public key not set
- **Solution**: Check environment variables are set correctly

### Notifications not appearing
- **Cause**: Multiple possible causes
- **Check**:
  1. VAPID keys match in frontend and backend
  2. Edge function has secrets set
  3. Subscription is active in database
  4. Browser allows notifications

## Security Notes

✅ **Safe Practices Implemented**:
- No auth tokens cached in service worker
- RLS policies protect user data
- Only admins can send notifications
- Private keys never exposed to frontend
- User consent required before subscribing

⚠️ **Important**:
- Never commit VAPID private key to git
- Always use environment variables
- Keep Supabase secrets secure

## Next Steps

1. **Production**: Consider using Firebase Cloud Messaging or another push service
2. **Analytics**: Track notification delivery and click rates
3. **User Preferences**: Let users choose notification types
4. **Scheduling**: Add ability to schedule notifications
5. **Templates**: Create reusable notification templates

## Support

For more details, see:
- [Full Implementation Guide](./PUSH_NOTIFICATIONS_IMPLEMENTATION.md)
- [Edge Function README](./supabase/functions/send-push-notification/README.md)

## Troubleshooting

### Check Service Worker Console
1. Open DevTools → Application → Service Workers
2. Click "sw.js" link to view service worker code
3. Look for push event handlers

### Check Database
```sql
SELECT * FROM push_subscriptions WHERE is_active = true;
```

### Check Edge Function Logs
1. Go to Supabase Dashboard
2. Edge Functions → send-push-notification
3. View logs for errors

### Re-subscribe
If something goes wrong, try:
1. Toggle notifications OFF
2. Wait 5 seconds
3. Toggle notifications ON
4. Accept permission again

---

**Last Updated**: February 2026
**Status**: ✅ Production Ready (with production push service recommended)
