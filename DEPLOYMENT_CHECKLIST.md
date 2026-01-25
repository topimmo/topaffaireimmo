# TopAffaireImmo - Deployment Checklist

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account with a project created
- Vercel account (for deployment)

## 📋 Supabase Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned (2-3 minutes)
3. Note your project URL and anon key from Settings → API

### 2. Run Migrations
Execute migrations in order (they are numbered for this reason):

```bash
# Option 1: Using Supabase CLI (recommended)
supabase db push

# Option 2: Manual execution via SQL Editor in Supabase Dashboard
# Copy and paste each migration file in order:
# 001, 002, 003, ... 035
```

**⚠️ CRITICAL MIGRATIONS:**
- `020_full_rebuild.sql` - Complete schema rebuild (most comprehensive)
- `033_fix_profile_trigger_rls.sql` - **MUST RUN** - Fixes signup trigger RLS issue (LATEST FIX)

### 3. Verify Database Setup

Run this query in Supabase SQL Editor to verify setup:

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'properties', 'banner_requests');

-- Check INSERT policy for profiles
SELECT * FROM pg_policies 
WHERE tablename = 'profiles' 
AND cmd = 'INSERT';
```

**Expected Results:**
- ✅ `on_auth_user_created` trigger exists
- ✅ All 3 tables have `rowsecurity = true`
- ✅ Profiles has INSERT policy allowing `auth.uid() IS NULL OR id = auth.uid()`

### 4. Enable Email Confirmation (Optional)

**Option A: Disable Email Confirmation (for testing)**
1. Go to Authentication → Settings → Email Auth
2. **Uncheck** "Enable email confirmations"
3. Users can login immediately after signup

**Option B: Enable Email Confirmation (production)**
1. Configure email templates in Authentication → Email Templates
2. Customize confirmation email
3. Users must click email link before first login

## 🔐 Environment Variables

### Local Development

Create `.env` file:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Vercel Deployment

Add environment variables in Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add these variables for **all environments** (Production, Preview, Development):

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | From Supabase Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | From Supabase Settings → API (public key, safe to expose) |

**⚠️ NEVER expose:**
- `service_role` key (server-side only)
- Database password
- JWT secret

## 🏗️ Build & Deploy

### Local Build Test

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test production build locally
npm run preview
```

### Vercel Deployment

#### Method 1: GitHub Integration (Recommended)
1. Connect your GitHub repository to Vercel
2. Select the repository
3. Configure build settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Add environment variables (see above)
5. Deploy!

#### Method 2: Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

## 🧪 Testing Signup Flow

### Manual Test Checklist

1. **Registration:**
   - [ ] Go to `/register`
   - [ ] Fill out form with valid data
   - [ ] Submit form
   - [ ] Check browser console for success logs:
     - `✅ Signup successful!`
     - `User ID: <uuid>`
     - `✅ Profile created successfully: {...}`
   - [ ] See success message in UI

2. **Verify in Supabase:**
   - [ ] Go to Authentication → Users
   - [ ] See new user with correct email
   - [ ] Go to Table Editor → profiles
   - [ ] See matching profile row with:
     - Same `id` as auth user
     - `full_name` populated
     - `user_role = 'real_estate_advertiser'`
     - `is_active = true`

3. **Login:**
   - [ ] If email confirmation disabled: Login immediately
   - [ ] If enabled: Check email → Click confirmation → Login
   - [ ] After login, redirect to `/dashboard`
   - [ ] Check console: `✅ Sign in successful!`

### Common Issues & Solutions

#### Issue: "Erreur de base de données lors de l'enregistrement"

**Cause:** RLS policy blocking profile creation during signup trigger

**Solution:**
```sql
-- Verify migration 035 was applied
SELECT * FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname = 'profiles_insert_system_or_own';

-- If not found, run migration 033_fix_profile_trigger_rls.sql
```

#### Issue: User in Auth but no profile row

**Cause:** Trigger not firing or failing silently

**Solution:**
```sql
-- Check trigger exists and is enabled
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check for errors in Supabase Logs
-- Dashboard → Logs → Postgres Logs
```

#### Issue: "Invalid login credentials" after signup

**Cause:** Email confirmation required but not completed

**Solution:**
- Check Supabase Auth settings
- If testing, disable email confirmation
- If production, instruct user to check email

## 📊 Monitoring

### Check Supabase Logs

1. **Auth Logs:** Authentication → Logs
   - View signup/login attempts
   - See error messages

2. **Postgres Logs:** Logs → Postgres Logs
   - View trigger execution
   - See RLS policy denials
   - Check for SQL errors

### Browser Console Logs

Our enhanced logging provides detailed insights:

**Successful Signup:**
```
🔐 Starting signup process for: user@example.com
📝 User metadata: {full_name: "...", phone: "...", ...}
✅ Signup successful!
User ID: abc123...
✅ Profile created successfully: {...}
```

**Signup Error:**
```
❌ Signup error: {message: "...", ...}
Error message: Database error ...
```

**Successful Login:**
```
🔐 Attempting sign in for: user@example.com
✅ Sign in successful!
User ID: abc123...
Session: Created
```

## 🔒 Security Checklist

- [x] Only `VITE_SUPABASE_ANON_KEY` in frontend (public key)
- [x] No `service_role` key in frontend code
- [x] RLS enabled on all tables
- [x] Users can only read/write their own data
- [x] Trigger function uses `SECURITY DEFINER`
- [x] Storage buckets have proper policies
- [x] Protected routes check user roles
- [x] npm audit shows 0 vulnerabilities

## 📱 Post-Deployment Verification

1. **Test signup:** Create new account → Verify in Supabase
2. **Test login:** Login with new account → Redirect to dashboard
3. **Test protected routes:** Try accessing `/dashboard` without login
4. **Test language switch:** Switch FR ↔ AR → Verify RTL/LTR
5. **Test mobile:** View on mobile device → Check responsiveness

## 🆘 Support

If issues persist:

1. Check Supabase Logs (Auth + Postgres)
2. Check browser console for detailed error messages
3. Verify environment variables are set correctly
4. Ensure migrations ran in order (especially 035)
5. Test with email confirmation disabled first

## 📚 Key Files Reference

- **Auth Context:** `src/contexts/AuthContext.tsx`
- **Register Page:** `src/pages/Register.tsx`
- **Login Page:** `src/pages/Login.tsx`
- **Supabase Client:** `src/lib/supabase.ts`
- **Latest Migration:** `supabase/migrations/033_fix_profile_trigger_rls.sql`
- **Trigger Function:** In migration 033 (use this version - most up to date)
