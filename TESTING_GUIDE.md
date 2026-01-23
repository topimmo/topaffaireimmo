# Testing Guide - TopAffaireImmo Supabase Integration

## Prerequisites

Before testing, ensure:
1. ✅ Supabase project created at https://app.supabase.com
2. ✅ All migrations applied in order (001 → 034)
3. ✅ `.env` file created with correct credentials:
   ```bash
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```
4. ✅ Dependencies installed: `npm install`
5. ✅ Build successful: `npm run build`

## Migration Order

Apply migrations in this exact order in Supabase SQL Editor:

1. **Core Schema**: Run migration `020_full_rebuild.sql` (complete database setup)
2. **Storage**: Run migration `021_storage_buckets.sql` (file storage setup)
3. **Admin Setup**: Run migration `029_admin_user_setup.sql` (adds is_admin column)
4. **RLS Fixes**: Run migration `031_fix_policies_final.sql` (fixes RLS policies)
5. **Final Fixes**: Run migration `033_final_fixes.sql` (storage policies & trigger)
6. **Advertising**: Run migration `033_advertising_inquiries.sql` (advertising form)
7. **Schema Fixes**: Run migration `034_fix_schema_mismatches.sql` (field compatibility)

**Note**: Skip migrations 001-019, 022-028, 030, 032 as they are superseded by the above.

## Test 1: Signup (User Registration)

### Steps
1. Start dev server: `npm run dev`
2. Open browser to `http://localhost:5173`
3. Click "S'inscrire" (Register) in the header
4. Fill the registration form:
   - **Email**: test@example.com
   - **Password**: Test123456!
   - **Full Name**: Test User
   - **Phone**: +212 6XX XX XX XX
   - **User Role**: Select "Annonceur Immobilier" (Real Estate Advertiser)
   - **Company Name**: (optional)
5. Click "S'inscrire" button

### Expected Results
✅ Success message displayed  
✅ Automatic redirect to `/dashboard` after 2 seconds  
✅ User sees "Mes Annonces" page with no listings  
✅ User profile created in database with:
   - id (UUID from auth.users)
   - email
   - full_name
   - phone
   - user_role = 'real_estate_advertiser'
   - is_active = true

### Verification (Supabase Dashboard)
```sql
-- Check auth user created
SELECT id, email, created_at FROM auth.users WHERE email = 'test@example.com';

-- Check profile created by trigger
SELECT id, email, full_name, phone, user_role, is_admin 
FROM public.profiles 
WHERE email = 'test@example.com';
```

### Troubleshooting
❌ **Error**: "Configuration Supabase manquante"
   - Check `.env` file exists and has correct values
   - Restart dev server after creating `.env`

❌ **Error**: "Erreur de base de données"
   - Check migrations 020, 029, 033, 034 are applied
   - Verify handle_new_user() trigger exists
   - Check Supabase logs for detailed error

---

## Test 2: Login (User Authentication)

### Steps
1. Navigate to `/login` or click "Se connecter" in header
2. Enter credentials:
   - **Email**: test@example.com
   - **Password**: Test123456!
3. Click "Se connecter" button

### Expected Results
✅ Login successful  
✅ Redirect to `/dashboard`  
✅ User profile loaded in AuthContext  
✅ Header shows user name and "Déconnexion" button  
✅ Session persists on page reload  

### Verification (Browser DevTools)
1. Open DevTools → Application → Local Storage
2. Check for Supabase session keys:
   - `sb-<project-id>-auth-token`
   - Should contain access_token and refresh_token

3. Open DevTools → Console
4. Check no errors logged
5. Network tab should show successful API calls

### Troubleshooting
❌ **Error**: "Invalid login credentials"
   - Verify email/password are correct
   - Check user exists in auth.users table

❌ **Session doesn't persist**
   - Check localStorage not disabled
   - Verify Supabase client initialized correctly

---

## Test 3: Add Property Listing

### Steps
1. Login as real estate advertiser (Test 1 & 2)
2. Click "Publier une annonce" in header or navigation
3. Fill the property form:
   - **Type de transaction**: Vente (Sale)
   - **Type de bien**: Select any type (Appartement, Maison, etc.)
   - **Ville**: Select a city (e.g., Casablanca)
   - **Quartier**: Select neighborhood or enter custom
   - **Prix**: 500000
   - **Superficie**: 120
   - **Chambres**: 3
   - **Salles de bain**: 2
   - **Titre (FR)**: Bel appartement à Casablanca
   - **Titre (AR)**: شقة جميلة في الدار البيضاء
   - **Description (FR)**: Description détaillée...
   - **Description (AR)**: وصف مفصل...
   - **Téléphone**: +212 6XX XX XX XX
4. Optionally upload images (up to 6)
5. Click "Publier l'annonce"

### Expected Results
✅ Form validates successfully  
✅ Success icon and message displayed  
✅ Redirect to `/dashboard` after 3 seconds  
✅ Property appears in "Mes Annonces" with status "En attente"  
✅ Property record created in database

### Verification (Supabase Dashboard)
```sql
-- Check property created
SELECT 
  id, 
  owner_id, 
  title_fr, 
  title_ar,
  title_en,
  property_type, 
  transaction_type,
  city_id,
  price,
  area,
  bedrooms,
  phone,
  contact_phone,
  status,
  created_at
FROM public.properties
WHERE owner_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
ORDER BY created_at DESC
LIMIT 1;
```

### Expected Database Values
- `owner_id`: User's UUID from auth.users
- `title_en`: Copy of title_fr
- `title_fr`: "Bel appartement à Casablanca"
- `title_ar`: "شقة جميلة في الدار البيضاء"
- `description_en`: Copy of description_fr
- `phone`: "+212 6XX XX XX XX"
- `contact_phone`: "+212 6XX XX XX XX" (same as phone)
- `status`: 'pending'
- `transaction_type`: 'sale'
- `property_type`: Selected type (e.g., 'apartment')

### Troubleshooting
❌ **Error**: "Permission denied" or "42501"
   - Check RLS policy `properties_insert_authenticated` exists
   - Verify user has profile with user_role = 'real_estate_advertiser'
   - Run this query to check:
     ```sql
     SELECT id, user_role, is_admin FROM profiles WHERE id = auth.uid();
     ```

❌ **Error**: "violates check constraint" or "23514"
   - Verify property_type is one of: apartment, house, villa, commercial, land
   - Verify transaction_type is one of: sale, rent
   - Verify status is one of: pending, approved, rejected, sold, rented, inactive

❌ **Error**: "null value in column" or "23502"
   - Check all required fields filled: property_type, city_id, price, title_fr, title_ar
   - Verify migration 034 applied (adds title_en, description_en columns)

❌ **Property creates but phone is null**
   - Check migration 034 applied (adds phone column)
   - Verify both phone and contact_phone set in insert data

---

## Test 4: View Published Ads

### Steps
1. As admin, approve the property:
   ```sql
   UPDATE public.properties 
   SET status = 'approved', moderated_at = NOW()
   WHERE id = '<property_id>';
   ```
2. Logout from test user
3. Navigate to home page `/`
4. Property should appear in "Dernières Annonces" section

### Expected Results
✅ Approved properties visible to public (unauthenticated users)  
✅ Property details page accessible at `/property/:id`  
✅ Owner contact information displayed  
✅ Images displayed (if uploaded)

### Verification
- Public can view approved properties (SELECT policy allows it)
- Pending properties only visible to owner and admin
- Owner can edit/delete their own properties

---

## Test 5: Session Persistence

### Steps
1. Login as test user
2. Reload the page (F5)
3. Navigate to different pages
4. Close browser tab
5. Reopen browser and navigate to app
6. Check if still logged in

### Expected Results
✅ Session persists across page reloads  
✅ Session persists across browser tabs  
✅ Session persists for ~1 hour (default Supabase session duration)  
✅ Refresh token used to renew session automatically

---

## Test 6: Protected Routes

### Steps
1. Logout (if logged in)
2. Try to access protected routes:
   - `/dashboard`
   - `/add-listing`
   - `/admin-panel`

### Expected Results
✅ `/dashboard` → Redirect to `/login`  
✅ `/add-listing` → Shows "Login required" page with login/register buttons  
✅ `/admin-panel` → Redirect to home (only admins allowed)

---

## Test 7: Admin Panel (Requires Admin User)

### Create Admin User
```sql
-- Create admin user in Supabase dashboard
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@topaffaireimmo.com',
  crypt('Admin123456!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User","user_role":"admin"}',
  false,
  ''
);

-- Set as admin in profiles (trigger should create it, but ensure is_admin=true)
UPDATE public.profiles 
SET is_admin = true, user_role = 'admin'
WHERE email = 'admin@topaffaireimmo.com';
```

### Steps
1. Login as admin@topaffaireimmo.com
2. Navigate to `/admin-panel`
3. View pending properties
4. Approve or reject properties
5. View banner requests
6. Manage users

### Expected Results
✅ Admin can view all properties (any status)  
✅ Admin can approve/reject properties  
✅ Admin can delete any property  
✅ Admin can view all users  
✅ Non-admin users cannot access admin panel

---

## Common Issues & Solutions

### Issue: Build Fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Database Connection Errors
1. Check `.env` file has correct values
2. Verify Supabase project is active (not paused)
3. Check Supabase dashboard for project status
4. Verify anon key is correct (not service role key)

### Issue: RLS Policy Denies Access
```sql
-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'properties';

-- Test policy for current user
SELECT auth.uid(); -- Get current user ID
SELECT * FROM properties WHERE owner_id = auth.uid(); -- Should work
```

### Issue: Trigger Not Firing
```sql
-- Check trigger exists
SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass;

-- Check function exists
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';

-- Manually test trigger function
SELECT handle_new_user();
```

---

## Performance Testing

### Load Test
1. Create 100+ properties in database
2. Navigate to search results page
3. Verify pagination works
4. Check page load time (should be < 2s)

### Image Upload Test
1. Upload 6 images (max limit)
2. Each image should be < 5MB
3. Verify images stored in `property-images` bucket
4. Check public URL accessibility

---

## Security Testing

### Test 1: RLS Enforcement
```sql
-- As anonymous user (logout first)
-- Should only see approved properties
SELECT * FROM properties WHERE status = 'pending'; -- Should return 0 rows

-- As authenticated user
-- Should only see own properties + approved
SELECT * FROM properties WHERE owner_id != auth.uid() AND status = 'pending'; -- Should return 0 rows
```

### Test 2: Profile Privacy
```sql
-- Users should only see their own profile
SELECT * FROM profiles WHERE id != auth.uid(); -- Should return 0 rows (unless admin)
```

### Test 3: Admin Restrictions
```sql
-- Non-admin users should not be able to modify site_settings
UPDATE site_settings SET value = '"hacked"' WHERE key = 'site_name'; 
-- Should fail with permission denied
```

---

## Final Checklist

Before deployment:
- [ ] All migrations applied successfully
- [ ] .env configured with production Supabase credentials
- [ ] Build succeeds without errors
- [ ] Signup creates user and profile
- [ ] Login works and session persists
- [ ] Add listing creates property with correct fields
- [ ] Public can view approved properties
- [ ] RLS policies protect sensitive data
- [ ] Admin panel accessible only to admins
- [ ] Images upload to storage buckets
- [ ] Email confirmation configured (if required)
- [ ] Password reset flow works
- [ ] Error messages are user-friendly
- [ ] Console shows no critical errors

---

## Support

For issues:
1. Check console for detailed error messages
2. Review Supabase logs in dashboard
3. Verify all migrations applied in correct order
4. Refer to AUDIT_REPORT.md for known issues
5. Check database schema matches code expectations
