# TopAffaireImmo - Backend Deployment Guide

## 🎯 Overview

This guide covers the complete deployment of the TopAffaireImmo Supabase backend, including database migrations, edge functions, and third-party integrations.

---

## 📋 Pre-Deployment Checklist

### Required Accounts & Services

- [ ] Supabase project created
- [ ] Stripe account (for payments)
- [ ] Vonage/Twilio account (optional, for SMS)
- [ ] Facebook Developer account (optional, for ads integration)
- [ ] Domain configured with SSL

### Required Credentials

- [ ] Supabase project URL
- [ ] Supabase anon/public key
- [ ] Supabase service role key
- [ ] Stripe publishable key
- [ ] Stripe secret key
- [ ] Stripe webhook secret

---

## 🗄️ Database Setup

### Step 1: Apply Migrations

#### Option A: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Apply all migrations
supabase db push

# Verify migrations
supabase db remote --status
```

#### Option B: Using SQL Editor (Supabase Dashboard)

1. Go to **SQL Editor** in Supabase Dashboard
2. Run migrations in order (001 to 114)
3. Critical: Run migration 114 (`114_complete_backend_features.sql`)

### Step 2: Verify Database Schema

Run this verification query:

```sql
-- Check all required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles',
    'properties',
    'property_images',
    'notifications',
    'boost_plans',
    'property_boosts',
    'payments',
    'phone_reveal_events',
    'artisan_profiles',
    'admins',
    'admin_audit_logs',
    'sms_logs'
  )
ORDER BY table_name;

-- Should return all 12 tables
```

### Step 3: Verify RLS Policies

```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;

-- Should return empty (all tables should have RLS enabled)
```

### Step 4: Create First Admin

```sql
-- Get your user ID from auth.users
SELECT id, email FROM auth.users WHERE email = 'your-admin-email@example.com';

-- Add to admins table
INSERT INTO public.admins (user_id, is_active)
VALUES ('your-user-id-here', true);

-- Verify
SELECT a.user_id, p.email, p.full_name
FROM public.admins a
JOIN public.profiles p ON p.id = a.user_id
WHERE a.is_active = true;
```

---

## 🔧 Storage Buckets Setup

### Create Storage Buckets

Run this in SQL Editor:

```sql
-- Create buckets (if not already created)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('property-images', 'property-images', true),
  ('avatars', 'avatars', true),
  ('payment-receipts', 'payment-receipts', false),
  ('banner-images', 'banner-images', true),
  ('agency-logos', 'agency-logos', true)
ON CONFLICT (id) DO NOTHING;
```

### Verify Storage Policies

```sql
-- Check storage policies
SELECT bucket_id, name, definition
FROM storage.policies
ORDER BY bucket_id, name;

-- Should show policies for each bucket
```

### Storage Configuration

In Supabase Dashboard > Storage:

1. **property-images**
   - Public: Yes
   - File size limit: 5MB
   - Allowed MIME types: image/jpeg, image/png, image/webp

2. **avatars**
   - Public: Yes
   - File size limit: 2MB
   - Allowed MIME types: image/jpeg, image/png, image/webp

3. **payment-receipts**
   - Public: No
   - File size limit: 5MB
   - Allowed MIME types: image/jpeg, image/png, application/pdf

---

## 🚀 Edge Functions Deployment

### Step 1: Set Environment Variables

In Supabase Dashboard > Settings > Edge Functions:

```bash
# Required
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Optional
FACEBOOK_ACCESS_TOKEN=your-token
FACEBOOK_PIXEL_ID=your-pixel-id
VONAGE_API_KEY=your-key
VONAGE_API_SECRET=your-secret
```

Or using CLI:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Step 2: Deploy Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy stripe-webhook
supabase functions deploy reveal-phone
supabase functions deploy send-push-notification
```

### Step 3: Verify Deployment

```bash
# Check function status
supabase functions list

# Test function
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## 💳 Stripe Integration

### Step 1: Configure Webhook

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Set endpoint URL:
   ```
   https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to send:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add secret to Supabase Edge Functions environment

### Step 2: Test Webhook

Using Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local function (for testing)
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Trigger test event
stripe trigger payment_intent.succeeded \
  --override payment_intent:metadata.payment_id=test-payment-id \
  --override payment_intent:metadata.property_boost_id=test-boost-id
```

### Step 3: Verify in Production

1. Create a test payment
2. Check Stripe webhook logs
3. Verify payment status updated in database
4. Verify boost activated
5. Check user received notification

---

## 🔐 Security Configuration

### Step 1: Configure Auth Settings

In Supabase Dashboard > Authentication > Settings:

- **Site URL**: `https://yourdomain.com`
- **Redirect URLs**: Add all allowed redirect URLs
- **Email Auth**: Enabled
- **Email Confirmation**: Required
- **JWT Expiry**: 3600 (1 hour recommended)
- **Refresh Token Rotation**: Enabled

### Step 2: Set Up SMTP (Production Email)

In Authentication > Settings > SMTP Settings:

```
Host: smtp.sendgrid.net
Port: 587
User: apikey
Password: YOUR_SENDGRID_API_KEY
Sender Email: noreply@yourdomain.com
Sender Name: TopAffaireImmo
```

Or use your preferred SMTP provider (Mailgun, Amazon SES, etc.)

### Step 3: Configure Rate Limits

In Project Settings > API:

- **Rate Limit**: 100 requests per second (adjust based on traffic)
- **Burst Rate**: 200 requests

### Step 4: Set Security Headers

In Project Settings > API > CORS:

Add allowed origins:
```
https://yourdomain.com
https://www.yourdomain.com
```

---

## 🧪 Testing & Verification

### Database Tests

```sql
-- Test property creation
INSERT INTO public.properties (
  owner_id,
  transaction_type,
  property_type,
  city_id,
  price,
  title_fr,
  title_ar,
  status
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'sale',
  'apartment',
  1,
  1500000,
  'Test Property',
  'عقار تجريبي',
  'draft'
)
RETURNING id;

-- Test property moderation
SELECT public.submit_property_for_review('property-id-from-above');

-- Test as admin
SELECT public.approve_property('property-id-from-above');

-- Verify notification created
SELECT * FROM public.notifications ORDER BY created_at DESC LIMIT 5;
```

### Search Tests

```sql
-- Test search function
SELECT * FROM public.search_properties(
  query := 'appartement',
  city_filter := 1,
  min_price := 500000,
  max_price := 2000000,
  page_number := 1,
  page_size := 10
);
```

### RPC Function Tests

```javascript
// In browser console or Postman

// Test mark notification as read
const { data, error } = await supabase.rpc('mark_notification_read', {
  notification_id: 'your-notification-id'
});

// Test search
const { data: results } = await supabase.rpc('search_properties', {
  query: 'villa',
  city_filter: 3,
  page_number: 1,
  page_size: 20
});

// Test email resend
const { data: emailResult } = await supabase.rpc('resend_email_confirmation');
```

---

## 📊 Monitoring Setup

### Step 1: Enable Monitoring

In Supabase Dashboard > Settings > Monitoring:

- Enable **Database Metrics**
- Enable **API Metrics**
- Enable **Edge Functions Metrics**

### Step 2: Set Up Alerts

Create alerts for:

1. **High Error Rate**
   - Condition: Error rate > 5%
   - Action: Email to admin

2. **Slow Queries**
   - Condition: Query time > 5s
   - Action: Slack notification

3. **Storage Full**
   - Condition: Storage > 80%
   - Action: Email to admin

### Step 3: Log Retention

Configure in Project Settings:

- Database logs: 7 days
- API logs: 7 days
- Edge Function logs: 7 days

For longer retention, export to external service.

---

## 🔄 Maintenance Tasks

### Daily

- [ ] Check error logs
- [ ] Monitor payment webhooks
- [ ] Review new property submissions

### Weekly

- [ ] Review audit logs
- [ ] Check boost expirations
- [ ] Analyze contact reveal patterns
- [ ] Review system performance metrics

### Monthly

- [ ] Database backup verification
- [ ] Security policy review
- [ ] Update dependencies
- [ ] Performance optimization

### Automated Tasks (Cron Jobs)

Create these functions and schedule with pg_cron:

```sql
-- Expire old boosts (run daily)
CREATE OR REPLACE FUNCTION expire_old_boosts()
RETURNS void AS $$
BEGIN
  UPDATE public.property_boosts
  SET status = 'expired'
  WHERE status = 'active'
    AND ends_at < NOW();
    
  -- Remove featured status if no active boosts
  UPDATE public.properties p
  SET featured = false
  WHERE featured = true
    AND NOT EXISTS (
      SELECT 1 FROM public.property_boosts pb
      WHERE pb.property_id = p.id
        AND pb.status = 'active'
    );
END;
$$ LANGUAGE plpgsql;

-- Schedule daily at 2 AM
SELECT cron.schedule('expire-boosts', '0 2 * * *', 'SELECT expire_old_boosts()');
```

---

## 🚨 Troubleshooting

### Issue: Migration fails

**Solution**:
1. Check migration order
2. Verify dependencies exist
3. Review error message
4. Apply migrations one by one

```sql
-- Check last successful migration
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 1;
```

### Issue: RLS blocking queries

**Solution**:
1. Check if user is authenticated
2. Verify RLS policies
3. Test with service role key (temporarily)

```sql
-- Check user permissions
SELECT auth.uid(), auth.role();

-- Temporarily disable RLS for testing (DON'T DO IN PRODUCTION)
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;
```

### Issue: Stripe webhook not working

**Solution**:
1. Verify webhook URL
2. Check webhook secret
3. Review function logs
4. Test with Stripe CLI

```bash
# Check function logs
supabase functions logs stripe-webhook --limit 50

# Test locally
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

### Issue: Storage upload fails

**Solution**:
1. Check file size limits
2. Verify MIME types
3. Review storage policies
4. Check user authentication

```javascript
// Debug storage upload
const { data, error } = await supabase.storage
  .from('property-images')
  .upload('test.jpg', file, {
    cacheControl: '3600',
    upsert: false
  });

console.log('Upload error:', error);
```

---

## 📦 Rollback Procedures

### Rollback Migration

```sql
-- Rollback is not directly supported
-- Instead, create a new migration to undo changes

-- Example: Remove table created in migration 114
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.boost_plans CASCADE;
DROP TABLE IF EXISTS public.property_boosts CASCADE;
```

### Rollback Edge Function

```bash
# Deploy previous version
git checkout previous-commit
supabase functions deploy stripe-webhook
git checkout main
```

### Emergency Database Restore

```bash
# In Supabase Dashboard
# Settings > Database > Backups
# Click "Restore" on desired backup point
```

---

## ✅ Post-Deployment Checklist

### Infrastructure

- [ ] All migrations applied successfully
- [ ] All storage buckets created
- [ ] All edge functions deployed
- [ ] All environment variables set

### Security

- [ ] RLS enabled on all tables
- [ ] Admin users created
- [ ] SMTP configured
- [ ] Stripe webhook configured
- [ ] CORS configured
- [ ] SSL certificate active

### Testing

- [ ] Property CRUD tested
- [ ] Property moderation tested
- [ ] Boost purchase tested
- [ ] Notifications tested
- [ ] Search tested
- [ ] Contact reveals tested
- [ ] Payment webhook tested

### Monitoring

- [ ] Alerts configured
- [ ] Logs accessible
- [ ] Metrics dashboard set up
- [ ] Error tracking active

### Documentation

- [ ] Admin credentials documented (securely)
- [ ] Webhook URLs documented
- [ ] API keys stored in vault
- [ ] Runbook created

---

## 🎓 Training & Handoff

### Admin Training Topics

1. **Property Moderation**
   - Reviewing submissions
   - Approving/rejecting properties
   - Setting rejection reasons

2. **User Management**
   - Creating admin users
   - Managing artisan verification
   - Handling user issues

3. **Analytics**
   - Viewing contact reveals
   - Monitoring boost performance
   - Reviewing audit logs

4. **System Health**
   - Checking error logs
   - Monitoring performance
   - Handling alerts

### Support Resources

- **Backend Documentation**: `/supabase/BACKEND_DOCUMENTATION.md`
- **Security Policies**: `/supabase/SECURITY_POLICIES.md`
- **Edge Functions Guide**: `/supabase/functions/README.md`
- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs

---

## 📞 Support Contacts

**Technical Issues**:
- Supabase Support: https://supabase.com/support
- Stripe Support: https://support.stripe.com

**Platform Issues**:
- Create GitHub issue
- Email: admin@topaffaireimmo.com

---

**Deployment Date**: _____________________  
**Deployed By**: _____________________  
**Version**: Migration 114  
**Status**: ✅ Production Ready
