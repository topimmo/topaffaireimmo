# 🚀 SUPABASE QUICK REFERENCE
## TopAffaireImmo - Fast Setup & Troubleshooting

**For:** Quick lookup when something's broken  
**See also:** [SUPABASE_DIAGNOSTIC_REPORT.md](./SUPABASE_DIAGNOSTIC_REPORT.md) for complete details

---

## 🆘 EMERGENCY FIXES

### ❌ "Can't create property - city dropdown is empty"
```sql
-- Check cities exist
SELECT COUNT(*) FROM public.cities;
-- If 0, run the cities population SQL from SUPABASE_DIAGNOSTIC_REPORT.md section 7.2
```

### ❌ "Access Denied on /admin page"
```sql
-- Check if you're an admin
SELECT u.email FROM public.admins a
JOIN auth.users u ON a.user_id = u.id
WHERE u.email = 'your-email@example.com';

-- If empty, make yourself admin:
-- 1. Get your UUID
SELECT id FROM auth.users WHERE email = 'your-email@example.com';
-- 2. Add to admins
INSERT INTO public.admins (user_id) VALUES ('paste-uuid-here');
```

### ❌ "Image upload fails - Bucket not found"
**Fix:** Create buckets in Supabase Dashboard → Storage:
- `property-images` (public, 5MB)
- `banner-images` (public, 2MB)
- `payment-receipts` (private, 5MB)
- `agency-logos` (public, 1MB)

### ❌ "Email confirmation never arrives"
**Check:** Supabase Dashboard → Settings → Auth → SMTP Settings  
**Fix:** Configure SMTP with Hostinger credentials (see SUPABASE_DIAGNOSTIC_REPORT.md section 7.5)

### ❌ "Email link redirects to wrong domain"
**Check:** Supabase Dashboard → Authentication → URL Configuration  
**Fix:** Set Site URL to `https://www.topaffaireimmo.com`  
Add redirect URLs:
- `https://www.topaffaireimmo.com/**`
- `https://www.topaffaireimmo.com/auth/callback`

### ❌ "Properties page is empty (but I have data)"
**Cause:** RLS blocking your queries  
**Check:**
```sql
-- Verify you can read properties
SELECT COUNT(*) FROM public.properties WHERE owner_id = auth.uid();

-- If 0 but you have data, check RLS policies:
SELECT policyname FROM pg_policies WHERE tablename = 'properties';
```
**Fix:** Apply migration 050 RLS policies

### ❌ "Facebook auto-post doesn't work"
**Check:**
```bash
supabase functions list
# Should show: send-facebook-webhook
```
**Fix:**
```bash
supabase functions deploy send-facebook-webhook
supabase secrets set MAKE_WEBHOOK_URL=https://hook.eu1.make.com/YOUR_ID
```

---

## 📋 MUST-HAVE CHECKLIST

Before launching, verify these:

### Database ✅
- [ ] 9 tables exist (run: `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`)
- [ ] At least 10 cities in cities table
- [ ] At least 1 admin user in admins table
- [ ] `properties` table has columns: contact_phone, contact_email, contact_whatsapp
- [ ] `properties` table has columns: facebook_posted, facebook_post_id

### Storage ✅
- [ ] 4 buckets exist: property-images, banner-images, payment-receipts, agency-logos
- [ ] property-images is PUBLIC with 5MB limit
- [ ] payment-receipts is PRIVATE

### Auth ✅
- [ ] Site URL = `https://www.topaffaireimmo.com`
- [ ] Redirect URLs include production domains
- [ ] SMTP configured (test with password reset)

### Admin ✅
- [ ] You can login as admin
- [ ] You can access /admin route
- [ ] You can approve/reject properties

### Environment ✅
- [ ] Vercel has VITE_SUPABASE_URL
- [ ] Vercel has VITE_SUPABASE_ANON_KEY
- [ ] Vercel has VITE_PRODUCTION_DOMAIN

---

## 🔧 COMMON SQL FIXES

### Create First Admin
```sql
-- Get your UUID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Make yourself admin (replace UUID)
INSERT INTO public.admins (user_id) VALUES ('your-uuid-here')
ON CONFLICT (user_id) DO NOTHING;

-- Verify
SELECT u.email FROM public.admins a
JOIN auth.users u ON a.user_id = u.id;
```

### Populate Cities (Top 15 Morocco Cities)
```sql
INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active) VALUES
('Casablanca', 'الدار البيضاء', 'Grand Casablanca', 'الدار البيضاء الكبرى', 1, true),
('Rabat', 'الرباط', 'Rabat-Salé-Kénitra', 'الرباط-سلا-القنيطرة', 2, true),
('Marrakech', 'مراكش', 'Marrakech-Safi', 'مراكش-آسفي', 3, true),
('Fès', 'فاس', 'Fès-Meknès', 'فاس-مكناس', 4, true),
('Tanger', 'طنجة', 'Tanger-Tétouan-Al Hoceïma', 'طنجة-تطوان-الحسيمة', 5, true),
('Agadir', 'أكادير', 'Souss-Massa', 'سوس-ماسة', 6, true),
('Meknès', 'مكناس', 'Fès-Meknès', 'فاس-مكناس', 7, true),
('Oujda', 'وجدة', 'Oriental', 'الشرق', 8, true),
('Kenitra', 'القنيطرة', 'Rabat-Salé-Kénitra', 'الرباط-سلا-القنيطرة', 9, true),
('Tétouan', 'تطوان', 'Tanger-Tétouan-Al Hoceïma', 'طنجة-تطوان-الحسيمة', 10, true),
('Salé', 'سلا', 'Rabat-Salé-Kénitra', 'الرباط-سلا-القنيطرة', 11, true),
('Temara', 'تمارة', 'Rabat-Salé-Kénitra', 'الرباط-سلا-القنيطرة', 12, true),
('El Jadida', 'الجديدة', 'Casablanca-Settat', 'الدار البيضاء-سطات', 13, true),
('Mohammedia', 'المحمدية', 'Casablanca-Settat', 'الدار البيضاء-سطات', 14, true),
('Béni Mellal', 'بني ملال', 'Béni Mellal-Khénifra', 'بني ملال-خنيفرة', 15, true)
ON CONFLICT (name_fr, name_ar) DO NOTHING;
```

### Check Missing Columns
```sql
-- Check if contact columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'properties' 
  AND column_name IN ('contact_phone', 'contact_email', 'contact_whatsapp');
-- Should return 3 rows

-- Check if Facebook columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'properties' 
  AND column_name LIKE 'facebook_%';
-- Should return 4 rows (facebook_posted, facebook_posted_at, facebook_post_id, facebook_post_error)
```

### Verify RLS Policies
```sql
-- Check properties policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY policyname;
-- Should see: insert, select (own/admin/public), update (own/admin), delete (own/admin)

-- Check storage policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%property_images%'
ORDER BY policyname;
-- Should see: insert, read (own/admin/public), delete (own/admin)
```

### Verify Triggers
```sql
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger
WHERE tgisinternal = false
ORDER BY tgname;
-- Should see: handle_new_user, protect_property_status, etc.
```

---

## 🗂️ REQUIRED TABLES (9 Total)

| Table | Must Have Data? | Purpose |
|-------|-----------------|---------|
| `profiles` | Auto-created on signup | User profiles |
| `properties` | User-created | Property listings |
| `property_images` | Auto-populated | Image tracking |
| `cities` | ✅ YES - Manual | City reference data |
| `neighborhoods` | ✅ YES - Manual | Neighborhood data |
| `banner_slots` | Optional | Ad slot definitions |
| `banner_requests` | User-created | Ad requests |
| `advertising_inquiries` | User-created | Contact forms |
| `admins` | ✅ YES - Manual | Admin identification |

---

## 📦 REQUIRED BUCKETS (4 Total)

| Bucket | Public? | Size Limit | MIME Types |
|--------|---------|------------|------------|
| `property-images` | ✅ Yes | 5MB | jpeg, png, webp |
| `banner-images` | ✅ Yes | 2MB | jpeg, png, gif, webp |
| `payment-receipts` | ❌ No | 5MB | jpeg, png, pdf |
| `agency-logos` | ✅ Yes | 1MB | jpeg, png, webp, svg |

---

## 🔐 REQUIRED ENVIRONMENT VARIABLES

### Vercel Dashboard
```
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com
VITE_SITE_URL=https://www.topaffaireimmo.com
```

### Supabase Secrets (via CLI)
```bash
supabase secrets set MAKE_WEBHOOK_URL=https://hook.eu1.make.com/YOUR_ID
```

---

## 🔍 DIAGNOSTIC QUERIES

### Count Everything
```sql
SELECT 
  (SELECT COUNT(*) FROM public.cities) as cities_count,
  (SELECT COUNT(*) FROM public.neighborhoods) as neighborhoods_count,
  (SELECT COUNT(*) FROM public.properties) as properties_count,
  (SELECT COUNT(*) FROM public.admins) as admins_count,
  (SELECT COUNT(*) FROM auth.users) as users_count;
```

### List All Tables
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### List All Buckets
```sql
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets
ORDER BY name;
```

### Check Your Admin Status
```sql
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) 
    THEN 'You are an ADMIN ✅'
    ELSE 'You are NOT an admin ❌'
  END as admin_status;
```

### Check Your Properties
```sql
SELECT id, title_fr, status, created_at 
FROM public.properties 
WHERE owner_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;
```

---

## ⚡ CRITICAL MIGRATIONS TO APPLY

If you have issues, ensure these migrations are applied:

### Migration 050 (Admin System)
**File:** `supabase/migrations/050_create_admins_table_and_rls.sql`  
**Creates:** admins table, updated RLS policies, status protection trigger

### Migration 052 (Image Security)
**File:** `supabase/migrations/052_fix_storage_security.sql`  
**Creates:** property_images table, image access functions

### Migration 036 (Facebook Auto-Post)
**File:** `supabase/migrations/036_facebook_posting_fields.sql`  
**Adds:** facebook_posted, facebook_post_id, approved_at, etc.

**How to Apply:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy entire migration file content
3. Paste and click "Run"
4. Check for errors

---

## 📞 WHEN TO USE WHICH TOOL

### Supabase Dashboard (Web Interface)
- Creating storage buckets
- Configuring SMTP
- Setting auth redirect URLs
- Uploading email templates
- Viewing logs

### SQL Editor (Supabase Dashboard)
- Running migrations
- Creating first admin user
- Populating cities/neighborhoods
- Checking data/policies
- Debugging queries

### Supabase CLI (Terminal)
- Deploying edge functions
- Setting secrets
- Viewing function logs
- Pushing migrations (advanced)

### Vercel Dashboard (Web Interface)
- Setting environment variables
- Triggering redeployments
- Viewing deployment logs

---

## 🚨 RED FLAGS

These indicate serious configuration issues:

- ❌ `SELECT COUNT(*) FROM public.cities;` returns 0
- ❌ `SELECT COUNT(*) FROM public.admins;` returns 0
- ❌ Can't upload images → Buckets missing
- ❌ Emails never arrive → SMTP not configured
- ❌ Email links go to localhost → Auth URLs wrong
- ❌ Properties page empty for owner → RLS blocking
- ❌ Can't access /admin → Not in admins table
- ❌ Facebook post fails → Edge function not deployed

---

## 📚 ADDITIONAL RESOURCES

- **Complete Diagnostic:** [SUPABASE_DIAGNOSTIC_REPORT.md](./SUPABASE_DIAGNOSTIC_REPORT.md)
- **Setup Guide:** [SUPABASE_SETUP_QUICKSTART.md](./SUPABASE_SETUP_QUICKSTART.md)
- **Migrations:** `supabase/migrations/`
- **Email Templates:** `supabase/templates/`
- **Edge Functions:** `supabase/functions/`

---

## 🎯 QUICK WINS

Start here for fastest results:

1. **Create first admin** (1 min) - section "Create First Admin"
2. **Populate cities** (1 min) - section "Populate Cities"
3. **Create storage buckets** (2 min) - Supabase Dashboard → Storage
4. **Configure auth URLs** (1 min) - Supabase Dashboard → Auth
5. **Set Vercel env vars** (2 min) - Vercel Dashboard → Settings

After these 5 steps, the app should be 80% functional.

---

**Last Updated:** 2026-01-30  
**Version:** 1.0
