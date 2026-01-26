# Deployment Guide - Supabase Signup Fix

## Overview

This guide explains how to deploy the Supabase signup fix to production.

## Prerequisites

- Access to Supabase Dashboard (https://app.supabase.com)
- Admin access to your Supabase project
- OR Supabase CLI installed locally

## Deployment Options

### Option 1: Supabase Dashboard (Recommended for Quick Fix)

This is the fastest way to apply the fix to production:

1. **Login to Supabase Dashboard**
   - Go to https://app.supabase.com
   - Login to your account
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "+ New query" button

3. **Copy Migration Content**
   - Open the file: `supabase/migrations/035_fix_signup_rls_policy.sql`
   - Copy the entire contents

4. **Paste and Execute**
   - Paste the SQL into the query editor
   - Click "Run" or press Ctrl+Enter (Cmd+Enter on Mac)
   - Wait for confirmation that all statements executed successfully

5. **Verify Success**
   - Check for "Success. No rows returned" or similar message
   - No errors should appear

### Option 2: Supabase CLI (Recommended for Version Control)

This method keeps your database schema in sync with your codebase:

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link to Your Project**
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (Find your project ref in Supabase Dashboard → Settings → General)

4. **Push Migration**
   ```bash
   supabase db push
   ```
   
   This will apply all pending migrations to your production database.

### Option 3: CI/CD Pipeline

If you have automated deployments:

1. **Ensure Migration is Committed**
   - The migration file should be in your repository
   - File path: `supabase/migrations/035_fix_signup_rls_policy.sql`

2. **Deploy via Your CI/CD**
   - Push to your main/production branch
   - Your CI/CD should automatically run `supabase db push` or similar
   - Monitor the deployment logs for success

## Post-Deployment Verification

### Step 1: Check Migration Applied

**Via Dashboard:**
1. Go to Database → Migrations (if available)
2. Verify migration 035 is listed

**Via SQL Query:**
```sql
-- Check if new policy exists
SELECT * FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname = 'profiles_insert_system_or_own';

-- Should return 1 row with the new policy
```

### Step 2: Test Signup Flow

**Important: Use a new email address that hasn't been used before**

1. **Navigate to Registration Page**
   - Go to your production URL: https://your-vercel-app.vercel.app/register
   - Or use your custom domain

2. **Fill Registration Form**
   - Email: test-[timestamp]@example.com (use unique email)
   - Password: TestPassword123
   - Full Name: Test User
   - Phone: +212600000000 (optional)
   - Company Name: Test Company (optional)

3. **Submit Form**
   - Click "S'inscrire" or Register button
   - **Expected**: Success message, no database error

4. **Check Email**
   - Check inbox for confirmation email from Supabase
   - Click confirmation link
   - **Expected**: Email confirmed successfully

5. **Login**
   - Go to login page
   - Enter the email and password you used
   - **Expected**: Successful login, redirected to dashboard

### Step 3: Verify Profile Created

**Via Supabase Dashboard:**
1. Go to Database → Table Editor → profiles
2. Search for your test email
3. **Expected**: Profile row exists with:
   - Correct email
   - Full name populated
   - user_role = 'real_estate_advertiser'
   - is_active = true

**Via SQL Query:**
```sql
SELECT * FROM profiles 
WHERE email = 'your-test-email@example.com';
```

### Step 4: Test on Mobile

1. Open your Vercel app on a mobile device
2. Navigate to registration page
3. Fill form with another unique email
4. **Expected**: Same successful signup as desktop

## Rollback Plan (If Needed)

If something goes wrong, you can rollback:

**Quick Rollback SQL:**
```sql
-- 1. Drop the new policy
DROP POLICY IF EXISTS "profiles_insert_system_or_own" ON public.profiles;

-- 2. Restore the old policy
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- 3. Restore old trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    phone, 
    user_role, 
    company_name, 
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'user_role', 'real_estate_advertiser'),
    NEW.raw_user_meta_data->>'company_name',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Note**: Rolling back will restore the bug. Only do this if the new migration causes other issues.

## Troubleshooting

### Issue: Migration fails with "policy already exists"

**Solution:**
```sql
-- Drop the policy first
DROP POLICY IF EXISTS "profiles_insert_system_or_own" ON public.profiles;

-- Then re-run the migration
```

### Issue: Signup still fails after migration

**Check:**
1. Verify migration actually ran (check pg_policies table)
2. Check Supabase logs for actual error message
3. Verify RLS is enabled on profiles table:
   ```sql
   SELECT relname, relrowsecurity 
   FROM pg_class 
   WHERE relname = 'profiles';
   -- relrowsecurity should be 't' (true)
   ```

### Issue: Users can't login after signup

**Possible causes:**
1. Email confirmation required - check email
2. Password too weak - ensure 6+ characters
3. Supabase Auth settings - check Auth → Settings in dashboard

### Issue: Profile created but missing data

**Check:**
1. Verify metadata is being sent in signup call
2. Check trigger function is using correct field names:
   ```sql
   SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
   ```

## Monitoring

### What to Monitor After Deployment

1. **Signup Success Rate**
   - Monitor successful signups in Supabase → Authentication → Users
   - Should see new users appearing

2. **Error Logs**
   - Check Vercel logs for frontend errors
   - Check Supabase → Logs → Postgres Logs for database errors
   - **Note**: Check "Postgres Logs", NOT "Edge Logs"

3. **Profile Creation**
   - Periodically verify profiles table is growing with auth.users
   - Run query:
     ```sql
     SELECT 
       COUNT(*) as total_users,
       COUNT(p.id) as total_profiles
     FROM auth.users u
     LEFT JOIN profiles p ON p.id = u.id;
     -- Both counts should be equal
     ```

## Success Criteria

✅ Migration applied without errors
✅ New policy exists in pg_policies
✅ Test signup completes successfully
✅ Profile created automatically with metadata
✅ Email confirmation works
✅ User can login after confirming email
✅ No errors in Supabase Postgres logs
✅ Mobile signup works

## Support

If you encounter issues:

1. **Check Documentation**
   - Review `SUPABASE_SIGNUP_FIX.md` for technical details
   - Check Supabase docs: https://supabase.com/docs

2. **Review Logs**
   - Supabase Dashboard → Logs → Postgres Logs
   - Vercel Dashboard → Your Project → Logs

3. **Test in Isolation**
   - Use Supabase Dashboard → Authentication → Create User
   - Check if profile gets created via trigger

4. **Contact Support**
   - Supabase Discord: https://discord.supabase.com
   - GitHub Issues (if applicable)

## Timeline

- **Estimated deployment time**: 5-10 minutes
- **Estimated verification time**: 5-10 minutes
- **Total time**: 15-20 minutes

## Final Notes

- This is a **critical fix** that should be deployed as soon as possible
- The fix is **safe** and maintains all security guarantees
- **No data loss** risk - migration only adds/modifies policies and functions
- **No downtime** required - can be applied while app is running
- Existing users are **not affected** - fix only impacts new signups
