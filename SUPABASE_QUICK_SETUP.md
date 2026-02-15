# Supabase Quick Setup - Copy/Paste Commands

**For**: Setting up a brand new Supabase project from scratch

**Time**: ~10 minutes

---

## 🚀 Quick Commands (Codespaces/Linux)

```bash
# 1. Login to Supabase
npx supabase login
# → Opens browser OR prompts for token
# → Get token from: https://app.supabase.com/account/tokens

# 2. Link to your new project (interactive)
npx supabase link
# → Select project with arrow keys
# → Enter database password

# OR link with project ref directly:
# npx supabase link --project-ref YOUR_PROJECT_REF

# 3. Push all migrations (creates entire schema)
npx supabase db push
# → Applies all 114 migrations
# → Takes 2-5 minutes

# 4. Verify deployment
echo "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" | npx supabase db execute
# → Should show 30+ tables

# 5. Setup environment variables
cp .env.example .env
# → Edit .env with your project URL and keys
# → Get from: https://app.supabase.com/project/YOUR_PROJECT/settings/api
```

---

## 📁 What's Being Applied

**Source**: `/supabase/migrations/` (114 files, 23,075 lines of SQL)

**Creates**:
- 30+ database tables
- 40+ SQL functions  
- 100+ RLS security policies
- 50+ performance indexes
- 5 storage buckets
- Extensions: pgcrypto, pg_trgm, unaccent

---

## ✅ Verification Queries

Run in **Supabase Dashboard → SQL Editor**:

```sql
-- Check tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Expected: ~30+

-- Check RLS enabled
SELECT COUNT(*) FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;
-- Expected: 0

-- Check storage buckets
SELECT id, name, public FROM storage.buckets;
-- Expected: 5 buckets

-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```

---

## 👤 Create Admin User

```sql
-- 1. Get your user ID (after signing up)
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- 2. Make yourself admin
INSERT INTO public.admins (user_id, is_active, role)
VALUES ('YOUR_USER_ID', true, 'super_admin');

-- 3. Verify
SELECT a.user_id, p.email, a.role 
FROM public.admins a
JOIN public.profiles p ON p.id = a.user_id;
```

---

## 🔧 Configure Frontend (.env)

```bash
# Required
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Get from: https://app.supabase.com/project/YOUR_PROJECT/settings/api
```

---

## 🎯 Deploy Edge Functions (Optional)

```bash
# Set secrets first in Dashboard → Settings → Edge Functions

# Deploy functions
npx supabase functions deploy reveal-phone
npx supabase functions deploy stripe-webhook
npx supabase functions deploy send-facebook-webhook
npx supabase functions deploy send-push-notification
```

---

## 🐛 Common Issues

### Migration already applied error
**Solution**: You're on the right project but migrations already exist. For a brand new project, this shouldn't happen.

### Permission denied
**Solution**: Reset database password in Dashboard → Settings → Database

### Function not found error
**Solution**: Ensure all migrations completed successfully with `npx supabase db push`

---

## 📚 Full Documentation

See **`SUPABASE_NEW_PROJECT_SETUP.md`** for complete step-by-step guide with explanations.

---

## 🎉 That's It!

Your Supabase project is ready with:
✅ Complete database schema  
✅ All security policies  
✅ Storage buckets  
✅ Functions and triggers  

**Next**: Update your app's `.env` and deploy!
