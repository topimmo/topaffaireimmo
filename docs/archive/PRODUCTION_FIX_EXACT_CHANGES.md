# Production Fix - Exact Code Changes & SQL

## Quick Reference - What to Run

### 1. Run This SQL in Supabase SQL Editor

```sql
-- Migration 074: Fix site_settings contact fields
BEGIN;

-- Delete contact_phone and contact_whatsapp
DELETE FROM public.site_settings
WHERE key IN ('contact_phone', 'contact_whatsapp');

-- Upsert contact_email with proper JSONB format
INSERT INTO public.site_settings (key, value, category, is_public, description)
VALUES (
  'contact_email',
  to_jsonb('contact@topaffaireimmo.com'::text),
  'contact',
  true,
  'Contact email address for the website'
)
ON CONFLICT (key)
DO UPDATE SET
  value = to_jsonb('contact@topaffaireimmo.com'::text),
  category = 'contact',
  is_public = true,
  description = 'Contact email address for the website',
  updated_at = now();

COMMIT;
```

### 2. Verify Admin Profile

```sql
-- Check admin profile exists
SELECT id, email, is_admin 
FROM public.profiles 
WHERE email = 'contact@topaffaireimmo.com';

-- If is_admin is false, run this:
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'contact@topaffaireimmo.com';
```

### 3. Run Seed Workflow

1. Go to: https://github.com/topimmo/topaffaireimmo/actions/workflows/seed-sample-listings.yml
2. Click "Run workflow"
3. Use defaults or customize:
   - admin_email: contact@topaffaireimmo.com
   - listings_count: 50
4. Click "Run workflow"
5. Wait for completion (~2-5 minutes)

### 4. Verify Success

```sql
-- Check properties were created
SELECT COUNT(*) FROM public.properties;
SELECT COUNT(*) FROM public.properties WHERE status = 'published';

-- Should show 50 properties, all published
```

## Code Changes Summary

### File 1: scripts/seed-sample-listings.ts

**Key Changes:**
1. Added ADMIN_EMAIL configuration (line 39)
2. Replaced system user creation (lines 425-478) with admin lookup (lines 425-476)
3. Added before/after property counts (lines 478-499)
4. Added critical failure check (lines 664-679)

**Critical Section - Admin Lookup (replaces system user creation):**

```typescript
// NEW CODE - Lines 425-476
// Step 2: Get admin user by email
console.log('👤 Looking up admin user by email...');
console.log(`   - Admin email: ${ADMIN_EMAIL}`);

const { data: adminProfile, error: adminError } = await supabase
  .from('profiles')
  .select('id, email, is_admin')
  .eq('email', ADMIN_EMAIL)
  .single();

if (adminError || !adminProfile) {
  console.error('');
  console.error('❌ ERROR: Admin profile not found!');
  console.error('═══════════════════════════════════════════════════════');
  console.error(`Admin email searched: ${ADMIN_EMAIL}`);
  console.error('');
  console.error('Details:', adminError || 'No profile found with this email');
  console.error('');
  console.error('REQUIRED ACTION:');
  console.error('1. Verify that a profile exists in public.profiles with this email:');
  console.error(`   SELECT id, email, is_admin FROM public.profiles WHERE email = '${ADMIN_EMAIL}';`);
  console.error('');
  console.error('2. Ensure the profile has is_admin = true:');
  console.error(`   UPDATE public.profiles SET is_admin = true WHERE email = '${ADMIN_EMAIL}';`);
  console.error('');
  console.error('NOTE: Do NOT create profiles directly in SQL without corresponding auth.users entry!');
  console.error('This will cause foreign key constraint violations.');
  console.error('═══════════════════════════════════════════════════════');
  console.error('');
  process.exit(1);
}

if (!adminProfile.is_admin) {
  console.error('');
  console.error('❌ ERROR: Profile found but is_admin is not true!');
  console.error('═══════════════════════════════════════════════════════');
  console.error(`Email: ${adminProfile.email}`);
  console.error(`Profile ID: ${adminProfile.id}`);
  console.error(`is_admin: ${adminProfile.is_admin}`);
  console.error('');
  console.error('REQUIRED ACTION:');
  console.error('Run this SQL to grant admin privileges:');
  console.error(`   UPDATE public.profiles SET is_admin = true WHERE id = '${adminProfile.id}';`);
  console.error('═══════════════════════════════════════════════════════');
  console.error('');
  process.exit(1);
}

const ownerId = adminProfile.id;
console.log(`✓ Admin profile found:`);
console.log(`   - ID: ${ownerId}`);
console.log(`   - Email: ${adminProfile.email}`);
console.log(`   - is_admin: ${adminProfile.is_admin}`);
```

**OLD CODE (REMOVED) - Was lines 425-478:**
```typescript
// Step 2: Get or create a system user for sample listings
console.log('👤 Setting up system user for sample listings...');

// Try to find existing admin user first
const { data: profiles } = await supabase
  .from('profiles')
  .select('id')
  .eq('user_role', 'admin')
  .limit(1);

let ownerId: string;

if (profiles && profiles.length > 0) {
  ownerId = profiles[0].id;
  console.log(`✓ Using existing admin user: ${ownerId}`);
} else {
  // No admin user found - create a dedicated system user for sample listings
  console.log('⚠️  No admin user found. Creating system user for sample listings...');
  
  // Use a deterministic UUID for the system user
  const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';
  
  // Try to create or use existing system user profile
  const { data: systemUser, error: systemUserError } = await supabase
    .from('profiles')
    .upsert({
      id: SYSTEM_USER_ID,
      email: 'system+sample-listings@topaffaireimmo.ma',
      full_name: 'System User (Sample Listings)',
      user_role: 'admin',
      is_admin: true,
      is_active: true,
      is_verified: true
    }, {
      onConflict: 'id',
      ignoreDuplicates: false
    })
    .select()
    .single();
  
  if (systemUserError && systemUserError.code !== POSTGRES_DUPLICATE_KEY_ERROR) {
    console.error('❌ Error creating system user:', systemUserError);
    console.error('');
    console.error('Please ensure:');
    console.error('1. You have at least one admin user in your database, OR');
    console.error('2. The service role key has permission to create profiles');
    return;
  }
  
  ownerId = SYSTEM_USER_ID;
  console.log(`✓ Created/using system user: ${ownerId}`);
}
```

### File 2: .github/workflows/seed-sample-listings.yml

**Status:** Created from scratch (was empty)

**Full Content:** See file - key features:
- workflow_dispatch with inputs
- Before/after property counts
- Explicit failure if count is 0
- Debugging summary

### File 3: src/pages/admin/AdminDiagnostics.tsx

**Changed:** Lines 49-85 (contact fields check)

**NEW CODE:**
```typescript
// 3. Check contact email in site_settings
try {
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value')
    .eq('key', 'contact_email')
    .single();

  if (error && error.code !== 'PGRST116') {
    diagnostics.push({
      name: isRTL ? 'معلومات الاتصال' : 'Contact Information',
      status: 'error',
      message: isRTL ? 'خطأ في التحقق' : 'Error checking settings',
      details: error.message,
    });
  } else if (!data) {
    diagnostics.push({
      name: isRTL ? 'معلومات الاتصال' : 'Contact Information',
      status: 'warning',
      message: isRTL ? 'لا توجد بيانات للتواصل' : 'No contact email configured',
      details: 'contact_email not found in site_settings',
    });
  } else {
    let emailValue = '';
    try {
      emailValue = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    } catch {
      emailValue = data.value;
    }
    
    diagnostics.push({
      name: isRTL ? 'معلومات الاتصال' : 'Contact Information',
      status: 'success',
      message: isRTL ? 'تم تكوين البريد الإلكتروني' : 'Email configured',
      details: `contact_email: ${emailValue}`,
    });
  }
}
```

**OLD CODE (REMOVED):**
```typescript
// 3. Check required columns in properties table
try {
  const { data, error } = await supabase
    .from('properties')
    .select('contact_phone, contact_whatsapp, contact_email')
    .limit(1);

  if (error) {
    diagnostics.push({
      name: isRTL ? 'أعمدة معلومات الاتصال' : 'Contact Columns',
      status: 'error',
      message: isRTL ? 'خطأ في التحقق' : 'Error checking columns',
      details: error.message,
    });
  } else {
    const hasColumns = data && data.length > 0;
    diagnostics.push({
      name: isRTL ? 'أعمدة معلومات الاتصال' : 'Contact Columns',
      status: hasColumns ? 'success' : 'warning',
      message: hasColumns
        ? isRTL ? 'جميع الأعمدة موجودة' : 'All columns exist'
        : isRTL ? 'لا توجد بيانات للتحقق' : 'No data to verify',
      details: 'contact_phone, contact_whatsapp, contact_email',
    });
  }
}
```

### File 4: src/pages/admin/AdminSettings.tsx

**Changes:**
1. Settings interface (line 16-24) - removed contact_phone, contact_whatsapp
2. fetchSettings (line 61-69) - removed phone/whatsapp from mapping
3. UI (line 145-184) - removed phone/whatsapp input fields

**Interface Change:**
```typescript
// NEW
interface Settings {
  contact_email?: string;
  maintenance_mode?: boolean;
  adsense_header_slot?: string;
  adsense_sidebar_slot?: string;
  adsense_footer_slot?: string;
}

// OLD
interface Settings {
  contact_email?: string;
  contact_phone?: string;      // REMOVED
  contact_whatsapp?: string;   // REMOVED
  maintenance_mode?: boolean;
  adsense_header_slot?: string;
  adsense_sidebar_slot?: string;
  adsense_footer_slot?: string;
}
```

**UI Change - Now only shows email field:**
```typescript
<CardContent className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="contact_email">{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
    <Input
      id="contact_email"
      type="email"
      value={settings.contact_email || ''}
      onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
      placeholder="contact@topaffaireimmo.com"
    />
    <p className="text-sm text-muted-foreground">
      {isRTL ? 'عنوان البريد الإلكتروني الرئيسي للموقع' : 'Primary email address for the site'}
    </p>
  </div>
</CardContent>
```

### File 5: supabase/migrations/074_fix_site_settings_contact_fields.sql

**Status:** New migration file

See SQL at top of this document.

## Verification Steps

### Step 1: Pre-Deployment
```sql
-- Check admin exists
SELECT id, email, is_admin FROM public.profiles WHERE email = 'contact@topaffaireimmo.com';
-- Expected: 1 row, is_admin = true

-- Check current properties
SELECT COUNT(*) FROM public.properties;
-- Expected: 0 or very low
```

### Step 2: Run SQL Migration
Run the SQL from the top of this document in Supabase SQL Editor.

```sql
-- Verify migration
SELECT key, value, category FROM public.site_settings WHERE key LIKE 'contact_%';
-- Expected: Only contact_email row
```

### Step 3: Deploy Code
Merge the PR or deploy the branch.

### Step 4: Run Seed Workflow
Follow steps in "Quick Reference" section above.

### Step 5: Post-Deployment Verification
```sql
-- Check properties created
SELECT COUNT(*) FROM public.properties;
SELECT COUNT(*) FROM public.properties WHERE status = 'published';
-- Expected: 50 total, 50 published

-- View sample listings
SELECT id, title_fr, status, is_sample FROM public.properties WHERE is_sample = true LIMIT 5;
-- Expected: 5 rows with is_sample = true, status = 'published'

-- Check owner
SELECT DISTINCT p.owner_id, pr.email, pr.is_admin
FROM public.properties p
JOIN public.profiles pr ON p.owner_id = pr.id
WHERE p.is_sample = true;
-- Expected: owner_id matches contact@topaffaireimmo.com
```

### Step 6: Website Check
1. Visit https://topaffaireimmo.com
2. Verify listings appear on home page
3. Click on a listing to view details
4. Test search/filter functionality

### Step 7: Admin Panel Check
1. Login as admin (contact@topaffaireimmo.com)
2. Go to Admin > Diagnostics
3. Verify: "Contact Information" shows ✅ Email configured
4. Go to Admin > Settings
5. Verify: Only Email field shown, no Phone/WhatsApp fields

## Troubleshooting

### Workflow Fails at "Run seed script"

**Check logs for:**

1. **"Admin profile not found"**
   - Run: `SELECT * FROM profiles WHERE email = 'contact@topaffaireimmo.com'`
   - If not found: Admin needs to sign up first
   - If found: Run `UPDATE profiles SET is_admin = true WHERE email = '...'`

2. **"FK constraint violation"**
   - Profile exists but no auth.users entry
   - This is data corruption - delete profile and recreate through proper signup

3. **"No published properties found after seeding"**
   - Check RLS policies on properties table
   - Check insert errors in logs
   - Verify service role key is correct

### Diagnostics Still Shows Warning

If after migration you still see contact fields warning:

1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check SQL migration ran successfully:
   ```sql
   SELECT key, value FROM site_settings WHERE key LIKE 'contact_%';
   ```
4. Verify code deployment completed

## Files Changed

1. ✅ scripts/seed-sample-listings.ts - Fixed admin lookup
2. ✅ .github/workflows/seed-sample-listings.yml - Created workflow
3. ✅ supabase/migrations/074_fix_site_settings_contact_fields.sql - Migration
4. ✅ src/pages/admin/AdminDiagnostics.tsx - Updated check
5. ✅ src/pages/admin/AdminSettings.tsx - Removed fields
6. ✅ PRODUCTION_FIX_GUIDE.md - Comprehensive guide
7. ✅ PRODUCTION_FIX_EXACT_CHANGES.md - This file (exact changes)

## Contact

For issues or questions about this fix:
- Check PRODUCTION_FIX_GUIDE.md for detailed explanations
- Check workflow logs in GitHub Actions
- Check Supabase logs for database errors
