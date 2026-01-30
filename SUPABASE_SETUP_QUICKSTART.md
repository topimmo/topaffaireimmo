# 🚀 Supabase Setup Quick Start Guide

**For:** TopAffaireImmo Project  
**Purpose:** Get Supabase configured and running quickly

---

## ⚡ 5-Minute Critical Setup

### Step 1: Configure Environment Variables (2 min)

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_PRODUCTION_DOMAIN=https://www.topaffaireimmo.com
```

**Where to get these:**
- Login to Supabase Dashboard
- Go to Settings → API
- Copy "Project URL" and "anon public" key

---

### Step 2: Run Database Migrations (1 min)

Supabase automatically runs migrations on project creation. Verify:

1. Go to Supabase Dashboard → SQL Editor
2. Run this query:
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected:** You should see 9 tables (admins, banner_requests, banner_slots, cities, neighborhoods, profiles, properties, property_images, advertising_inquiries)

---

### Step 3: Create First Admin User (1 min)

**CRITICAL:** Without this, admin panel won't work!

1. Go to Supabase Dashboard → SQL Editor
2. Run this query (replace with your email):
```sql
-- Step 1: Find your user UUID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Step 2: Insert into admins table (replace UUID)
INSERT INTO public.admins (user_id) 
VALUES ('paste-uuid-from-above')
ON CONFLICT (user_id) DO NOTHING;
```

**Verify:**
```sql
SELECT u.email, a.created_at 
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id;
```

---

### Step 4: Apply Critical Fixes (1 min)

Run these SQL fixes to enable image uploads:

1. Go to Supabase Dashboard → SQL Editor
2. Copy and run: `supabase/fixes/001_fix_storage_policies.sql`
3. Copy and run: `supabase/fixes/002_fix_storage_security.sql` (Option A recommended)

**Verify:** Try uploading an image in the app - should work now!

---

## 🔧 Dashboard Configuration (10 minutes)

### Configure SMTP (Email Authentication)

**Location:** Supabase Dashboard → Settings → Auth → SMTP Settings

1. Enable Custom SMTP
2. Fill in:
   - **Host:** `smtp.hostinger.com`
   - **Port:** `465`
   - **Encryption:** `SSL`
   - **Sender Email:** `noreply@topaffaireimmo.com`
   - **Sender Name:** `TopAffaireImmo`
   - **Username:** `noreply@topaffaireimmo.com`
   - **Password:** [Get from Hostinger]
3. Click Save

**Test:** Send invite to test email - should receive it

---

### Configure Auth URLs

**Location:** Supabase Dashboard → Authentication → URL Configuration

1. **Site URL:** `https://www.topaffaireimmo.com`
2. **Redirect URLs:**
```
https://www.topaffaireimmo.com/**
https://www.topaffaireimmo.com/auth/callback
https://topaffaireimmo.com/**
http://localhost:5173/**
```

**Test:** Try password reset - email link should redirect correctly

---

### Configure Storage Buckets

**Location:** Supabase Dashboard → Storage

For each bucket, verify settings:

| Bucket | Public | Size Limit | MIME Types |
|--------|--------|-----------|------------|
| property-images | ❌ No | 5 MB | image/jpeg, image/png, image/webp |
| banner-images | ✅ Yes | 2 MB | image/jpeg, image/png, image/gif, image/webp |
| payment-receipts | ❌ No | 5 MB | image/jpeg, image/png, application/pdf |
| agency-logos | ✅ Yes | 1 MB | image/jpeg, image/png, image/webp |

---

### Configure Edge Function Secrets

**Location:** Supabase Dashboard → Edge Functions → send-facebook-webhook → Secrets

Add these secrets:
1. **MAKE_WEBHOOK_URL:** `https://hook.eu1.make.com/[your-webhook-id]`
2. **VITE_PRODUCTION_DOMAIN:** `https://www.topaffaireimmo.com`

**Get MAKE_WEBHOOK_URL from:** Make.com scenario webhook trigger

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Frontend loads without errors
- [ ] User can sign up (receives confirmation email)
- [ ] User can login
- [ ] User can create property listing
- [ ] User can upload property images
- [ ] Admin can access `/admin`
- [ ] Admin can approve listings
- [ ] Approved listings appear on homepage
- [ ] Password reset emails work

---

## 🆘 Troubleshooting

### Images won't upload
- Check Storage policies: Run `supabase/fixes/001_fix_storage_policies.sql`
- Verify bucket exists: Dashboard → Storage
- Check browser console for errors

### Admin panel shows 403
- Create admin user: Run Step 3 above
- Verify: `SELECT * FROM public.admins;`

### Emails not sending
- Check SMTP settings: Dashboard → Settings → Auth
- Verify credentials are correct
- Test with "Send invite" feature

### Password reset links wrong domain
- Check Auth URLs: Dashboard → Authentication → URL Configuration
- Add your domain to Redirect URLs

---

## 📚 Full Documentation

For complete details, see:
- `SUPABASE_AUDIT_REPORT.md` - Comprehensive audit and fixes
- `supabase/fixes/README.md` - Database fix scripts
- `.env.example` - Environment variables guide

---

## 🎯 Next Steps

After basic setup:
1. Run remaining fixes: `003_add_banner_rls_policies.sql`, `004_add_updated_at_triggers.sql`
2. Customize email templates (Dashboard → Authentication → Email Templates)
3. Set up Database Webhook for Facebook auto-posting
4. Configure Make.com scenario for Facebook integration
5. Test all features end-to-end

---

**Setup Time:** ~15 minutes total  
**Difficulty:** Beginner-friendly  
**Support:** See audit report for detailed help
