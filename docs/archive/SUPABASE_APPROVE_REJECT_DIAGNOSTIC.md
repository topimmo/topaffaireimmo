# Supabase Approve/Reject Flow - Complete Diagnostic Report

**Generated:** 2026-01-31  
**Repository:** topimmo/topaffaireimmo  
**Feature:** Property Approve/Reject Functionality

---

## 📋 Executive Summary

This diagnostic report provides a complete analysis of the Supabase database setup for the property approve/reject functionality, including:
- Database tables and columns involved
- Row Level Security (RLS) policies
- Admin authentication setup
- Triggers and functions
- Ready-to-run SQL scripts for setup and verification

---

## 1. DATABASE TABLES & COLUMNS

### 1.1 Properties Table

The main table for property listings with approval workflow.

```sql
-- Table: public.properties
CREATE TABLE IF NOT EXISTS public.properties (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Property Details
  property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'house', 'villa', 'land', 'commercial')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'rent')),
  advertiser_type TEXT NOT NULL DEFAULT 'owner' CHECK (advertiser_type IN ('owner', 'broker', 'agency')),
  
  -- Location
  city_id INTEGER NOT NULL REFERENCES cities(id),
  neighborhood_id INTEGER REFERENCES neighborhoods(id),
  
  -- Pricing & Specs
  price DECIMAL(15, 2) NOT NULL,
  area DECIMAL(10, 2),
  bedrooms INTEGER,
  bathrooms INTEGER,
  
  -- Multilingual Content
  title_fr TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_fr TEXT,
  description_ar TEXT,
  
  -- ⭐ APPROVE/REJECT WORKFLOW COLUMNS ⭐
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'rejected', 'sold', 'rented', 'expired', 'archived')),
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,      -- Set when status = 'approved'
  approved_by UUID,              -- admin user_id who approved
  published_at TIMESTAMPTZ,      -- Set when status = 'approved'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days')
);
```

**Key Columns for Approve/Reject:**

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| `status` | TEXT | 'pending' | NOT NULL | Property approval status |
| `rejection_reason` | TEXT | NULL | YES | Reason for rejection (populated on reject) |
| `approved_at` | TIMESTAMPTZ | NULL | YES | Timestamp when approved |
| `approved_by` | UUID | NULL | YES | User ID of admin who approved |
| `published_at` | TIMESTAMPTZ | NULL | YES | Timestamp when published (same as approved_at) |

**Status Values:**
- `pending` - New listing awaiting approval (default)
- `approved` - Approved by admin, visible to public
- `rejected` - Rejected by admin
- `sold` - Property marked as sold
- `rented` - Property marked as rented
- `expired` - Listing expired (after 90 days)
- `archived` - Archived by owner or admin

---

### 1.2 Admins Table

Identifies which users have admin privileges.

```sql
-- Table: public.admins
CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Simple whitelist of admin users. Any user whose `user_id` exists in this table is considered an admin.

**Critical Note:** The first admin must be inserted using the Supabase service role key (bypassing RLS), as RLS policies require an existing admin to insert new admins.

---

### 1.3 Admin Audit Logs Table

Tracks all admin actions for compliance and debugging.

```sql
-- Table: public.admin_audit_logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'delete', 'feature', 'unfeature', 'update', 'create', 'bulk_action')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('property', 'user', 'page', 'category', 'settings', 'location', 'other')),
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);
```

**Approve/Reject Actions Logged:**
- `action = 'approve'` when property is approved
- `action = 'reject'` when property is rejected
- `entity_type = 'property'`
- `entity_id = property.id`
- `metadata = { title: property.title_fr, rejection_reason: "..." (if rejected) }`

---

### 1.4 Profiles Table (for reference)

```sql
-- Table: public.profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  user_role TEXT NOT NULL DEFAULT 'user' CHECK (user_role IN ('user', 'admin', 'real_estate_advertiser', 'commercial_advertiser')),
  
  -- NOTE: user_role is NOT used for admin checks
  -- Admin status is determined solely by the admins table
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Important:** The `user_role = 'admin'` column exists but is **NOT** used in RLS policies. Admin authorization is based solely on the `admins` table.

---

## 2. ROW LEVEL SECURITY (RLS) POLICIES

### 2.1 Properties Table Policies

**RLS Status:** ✅ ENABLED

```sql
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
```

#### SELECT Policies

**Policy 1: properties_select_own**
```sql
CREATE POLICY "properties_select_own" ON public.properties
  FOR SELECT USING (
    owner_id = auth.uid()
  );
```
- **Who:** Property owner
- **Can:** View their own properties (all statuses)

**Policy 2: properties_select_admin**
```sql
CREATE POLICY "properties_select_admin" ON public.properties
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );
```
- **Who:** Admin users (user_id in admins table)
- **Can:** View ALL properties regardless of status

**Policy 3: properties_select_public**
```sql
CREATE POLICY "properties_select_public" ON public.properties
  FOR SELECT USING (
    status = 'approved'
  );
```
- **Who:** Everyone (including unauthenticated)
- **Can:** View only approved properties

#### UPDATE Policies

**Policy 4: properties_update_own**
```sql
CREATE POLICY "properties_update_own" ON public.properties
  FOR UPDATE 
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
```
- **Who:** Property owner
- **Can:** Update their own properties
- **Limitation:** Status changes are blocked by trigger (see section 3)

**Policy 5: properties_update_admin**
```sql
CREATE POLICY "properties_update_admin" ON public.properties
  FOR UPDATE 
  USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));
```
- **Who:** Admin users
- **Can:** Update ALL properties including status changes

#### INSERT Policy

**Policy 6: properties_insert_authenticated**
```sql
CREATE POLICY "properties_insert_authenticated" ON public.properties
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    owner_id = auth.uid()
  );
```
- **Who:** Any authenticated user
- **Can:** Create new properties (defaults to status='pending')

#### DELETE Policies

**Policy 7: properties_delete_own**
```sql
CREATE POLICY "properties_delete_own" ON public.properties
  FOR DELETE USING (
    owner_id = auth.uid()
  );
```
- **Who:** Property owner
- **Can:** Delete their own properties

**Policy 8: properties_delete_admin**
```sql
CREATE POLICY "properties_delete_admin" ON public.properties
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );
```
- **Who:** Admin users
- **Can:** Delete any property

---

### 2.2 Admins Table Policies

**RLS Status:** ✅ ENABLED

```sql
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
```

**Policy 1: admins_select_admin_only**
```sql
CREATE POLICY "admins_select_admin_only" ON public.admins
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );
```
- Only admins can view the admins table

**Policy 2: admins_insert_admin_only**
```sql
CREATE POLICY "admins_insert_admin_only" ON public.admins
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );
```
- Only existing admins can add new admins
- **Bootstrap Issue:** First admin must be created via service role

**Policy 3: admins_delete_admin_only**
```sql
CREATE POLICY "admins_delete_admin_only" ON public.admins
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );
```
- Only admins can remove admins

---

### 2.3 Admin Audit Logs Policies

**RLS Status:** ✅ ENABLED

```sql
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
```

**Policy 1: Admins can read audit logs**
```sql
CREATE POLICY "Admins can read audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );
```

**Policy 2: Admins can insert audit logs**
```sql
CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
    AND admin_id = auth.uid()
  );
```

---

### 2.4 RLS Policy Analysis

#### ✅ Complete & Correct Policies

1. **Admin Authorization:** Uses `admins` table correctly
2. **Property Visibility:** 
   - Owners see their own properties
   - Admins see all properties
   - Public sees only approved properties
3. **Update Authorization:**
   - Admins can update all properties
   - Owners can update their own (but not status - protected by trigger)
4. **Audit Trail:** Only admins can read/write audit logs

#### ⚠️ Potential Issues

**Issue 1: No Missing Policies**
All necessary policies are in place.

**Issue 2: Circular Dependency (Bootstrap)**
The `admins_insert_admin_only` policy requires an existing admin to insert new admins. This is by design but requires:
- First admin must be inserted using service role key
- Documented in migration 050

**Issue 3: Profile Table Not Used**
The `profiles.user_role` column exists but is not used in approve/reject logic. Only the `admins` table is checked. This is correct but may cause confusion.

---

## 3. TRIGGERS & FUNCTIONS

### 3.1 Protect Property Status Trigger

**Purpose:** Prevent non-admin users from changing property status.

```sql
-- Function
CREATE OR REPLACE FUNCTION public.protect_property_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is being changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Check if user is admin
    IF NOT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) THEN
      -- If not admin, prevent status change
      NEW.status := OLD.status;
      
      -- Optionally raise a notice (won't stop the update, just warns)
      RAISE NOTICE 'Status change prevented: Only admins can change property status';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER protect_property_status_trigger
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_property_status();
```

**How it Works:**
1. Trigger fires BEFORE UPDATE on properties table
2. If status is changing, checks if user is in admins table
3. If not admin, reverts status to old value
4. Update continues with other changes but status remains unchanged

**Security Level:** `SECURITY DEFINER` - runs with function owner's privileges, allowing it to check admins table

---

### 3.2 Auto-Update Timestamp Trigger

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

**Purpose:** Automatically updates `updated_at` timestamp on any property change.

---

### 3.3 Helper Function: is_admin()

```sql
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins WHERE admins.user_id = is_admin.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

**Purpose:** Helper function to check if a user is admin. Can be used in queries but not currently used in RLS policies.

---

## 4. ADMIN SETUP & AUTHENTICATION

### 4.1 Current Admin Table Structure

```sql
SELECT * FROM public.admins;
```

**Expected Result:**
```
 user_id                              | created_at
--------------------------------------+----------------------------
 xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | 2024-XX-XX XX:XX:XX+00
```

**Verification Script:**
```sql
-- Check if your user is an admin
SELECT 
  u.id as user_id,
  u.email,
  CASE 
    WHEN a.user_id IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END as is_admin
FROM auth.users u
LEFT JOIN public.admins a ON u.id = a.user_id
WHERE u.id = auth.uid();
```

---

### 4.2 JWT & Auth Session Verification

The approve/reject flow requires a valid authenticated session with JWT token.

**Client-Side Code (AdminListings.tsx):**
```typescript
const handleStatusChange = async (propertyId: string, newStatus: string) => {
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  
  console.log('Current User ID:', user?.id);
  console.log('Current User Email:', user?.email);
  
  // Prepare update
  const updateData: any = { status: newStatus };
  
  if (newStatus === 'approved') {
    const now = new Date().toISOString();
    updateData.approved_at = now;
    updateData.approved_by = user?.id || null;
    updateData.published_at = now;
  }
  
  // Update property
  const { data, error } = await supabase
    .from('properties')
    .update(updateData)
    .eq('id', propertyId)
    .select();
  
  // ... error handling ...
}
```

**JWT Token Contents:**
```json
{
  "aud": "authenticated",
  "role": "authenticated",
  "sub": "user-uuid-here",
  "email": "admin@example.com",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Important:** Supabase uses the JWT's `sub` claim as `auth.uid()` in RLS policies.

---

### 4.3 Confirm Admin Status

**Method 1: SQL Query (Supabase SQL Editor)**
```sql
-- Replace with your user ID
SELECT * FROM public.admins WHERE user_id = 'your-user-uuid-here';
```

**Method 2: Browser Console (while logged in)**
```javascript
// Get current user
const { data: { user } } = await supabase.auth.getUser();
console.log('User ID:', user.id);

// Check if admin
const { data, error } = await supabase
  .from('admins')
  .select('*')
  .eq('user_id', user.id);
  
console.log('Is Admin:', data && data.length > 0);
```

**Method 3: SQL Function Call**
```sql
SELECT public.is_admin(auth.uid());
```

---

## 5. CONSOLE LOGS DIAGNOSTIC GUIDE

The code includes comprehensive logging at each step (Steps A–D).

### Step A: Approve/Reject onClick Triggered

**Log Group:** `🔍 [STEP A] Approve/Reject onClick Triggered`

**Location:** `AdminListings.tsx` line 228

**What to Check:**
```javascript
console.group('🔍 [STEP A] Approve/Reject onClick Triggered');
console.log('Function: handleStatusChange (AdminListings)');
console.log('Timestamp:', new Date().toISOString());
console.log('New Status:', newStatus);
console.log('Property ID:', propertyId);
console.log('Property Title:', property?.title_fr || 'Unknown');
console.groupEnd();
```

**Expected Output:**
```
🔍 [STEP A] Approve/Reject onClick Triggered
  Function: handleStatusChange (AdminListings)
  Timestamp: 2024-01-31T12:34:56.789Z
  New Status: approved
  Property ID: 123e4567-e89b-12d3-a456-426614174000
  Property Title: Villa moderne à Casablanca
```

**Issues to Check:**
- ❌ No logs appear → onClick handler not triggered (button disabled or event not bound)
- ❌ Wrong property ID → State management issue
- ❌ Wrong status value → Button sending wrong parameter

---

### Step B: Sending Supabase Update Request

**Log Group:** `🔍 [STEP B] Sending Supabase Update Request`

**Location:** `AdminListings.tsx` line 255

**What to Check:**
```javascript
console.group('🔍 [STEP B] Sending Supabase Update Request');
console.log('Table:', 'properties');
console.log('Property ID:', propertyId);
console.log('Update Data:', JSON.stringify(updateData, null, 2));
console.log('Request Time:', new Date().toISOString());
console.groupEnd();
```

**Expected Output:**
```
🔍 [STEP B] Sending Supabase Update Request
  Table: properties
  Property ID: 123e4567-e89b-12d3-a456-426614174000
  Update Data: {
    "status": "approved",
    "approved_at": "2024-01-31T12:34:56.789Z",
    "approved_by": "admin-uuid-here",
    "published_at": "2024-01-31T12:34:56.789Z"
  }
  Request Time: 2024-01-31T12:34:56.789Z
```

**Issues to Check:**
- ❌ No Step B logs → Code crashed before reaching network call
- ❌ Missing fields in updateData → Logic error in data preparation
- ❌ approved_by is null → User not authenticated

---

### Step C: Supabase Response

**Log Group:** `🔍 [STEP C] Supabase Response`

**Location:** `AdminListings.tsx` line 269

**What to Check:**
```javascript
console.group('🔍 [STEP C] Supabase Response');
console.log('Response Time:', new Date().toISOString());
if (error) {
  console.error('❌ Error Object:', error);
  console.error('Error Code:', error.code);
  console.error('Error Message:', error.message);
  console.error('Error Details:', error.details);
  console.error('Error Hint:', error.hint);
} else {
  console.log('✅ Success - No Error');
  console.log('Response Data:', data);
}
console.groupEnd();
```

**Success Output:**
```
🔍 [STEP C] Supabase Response
  Response Time: 2024-01-31T12:34:57.123Z
  ✅ Success - No Error
  Response Data: [{
    id: "123e4567-e89b-12d3-a456-426614174000",
    status: "approved",
    approved_at: "2024-01-31T12:34:56.789Z",
    ...
  }]
```

**Common Errors:**

**Error 1: Permission Denied (RLS)**
```
❌ Error Code: 42501
❌ Error Message: new row violates row-level security policy for table "properties"
❌ Error Hint: Check RLS policies
```
**Cause:** User is not in admins table
**Fix:** Add user to admins table (see Section 6.1)

**Error 2: Invalid Status Value**
```
❌ Error Code: 23514
❌ Error Message: new row for relation "properties" violates check constraint
```
**Cause:** Status value not in allowed list
**Fix:** Check status value matches constraint

**Error 3: Not Authenticated**
```
❌ Error Code: PGRST301
❌ Error Message: JWT token is missing or invalid
```
**Cause:** User session expired or not logged in
**Fix:** Re-login to get fresh JWT token

---

### Step D: Verify DB Update

**Log Group:** `🔍 [STEP D] Verifying DB Update`

**Location:** `AdminListings.tsx` line 286

**What to Check:**
```javascript
console.group('🔍 [STEP D] Verifying DB Update');
const { data: verifyData, error: verifyError } = await supabase
  .from('properties')
  .select('id, status, approved_at, approved_by, published_at')
  .eq('id', propertyId)
  .single();

if (verifyError) {
  console.error('❌ Verification Query Error:', verifyError);
} else {
  console.log('✅ Current DB State:', verifyData);
  console.log('Status Match:', verifyData?.status === newStatus ? '✅ YES' : '❌ NO');
  if (newStatus === 'approved') {
    console.log('Approved At Set:', verifyData?.approved_at ? '✅ YES' : '❌ NO');
    console.log('Approved By Set:', verifyData?.approved_by ? '✅ YES' : '❌ NO');
    console.log('Published At Set:', verifyData?.published_at ? '✅ YES' : '❌ NO');
  }
}
console.groupEnd();
```

**Expected Output (Success):**
```
🔍 [STEP D] Verifying DB Update
  ✅ Current DB State: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    status: "approved",
    approved_at: "2024-01-31T12:34:56.789Z",
    approved_by: "admin-uuid",
    published_at: "2024-01-31T12:34:56.789Z"
  }
  Status Match: ✅ YES
  Approved At Set: ✅ YES
  Approved By Set: ✅ YES
  Published At Set: ✅ YES
```

**Issue Output (Status Not Changed):**
```
🔍 [STEP D] Verifying DB Update
  ✅ Current DB State: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    status: "pending",    // ← Still pending!
    approved_at: null,
    approved_by: null,
    published_at: null
  }
  Status Match: ❌ NO
  Approved At Set: ❌ NO
  Approved By Set: ❌ NO
  Published At Set: ❌ NO
```
**Cause:** Trigger reverted status change (user not admin) OR RLS blocked update

---

## 6. READY-TO-RUN SQL SCRIPTS

### 6.1 Create First Admin User

**⚠️ CRITICAL:** Must be run using service role key or Supabase SQL Editor (which uses service role).

```sql
-- Step 1: Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Step 2: Insert into admins table (replace with your user ID)
INSERT INTO public.admins (user_id)
VALUES ('your-user-uuid-here')
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Verify
SELECT 
  u.id, 
  u.email,
  a.user_id IS NOT NULL as is_admin,
  a.created_at as admin_since
FROM auth.users u
LEFT JOIN public.admins a ON u.id = a.user_id
WHERE u.email = 'your-email@example.com';
```

---

### 6.2 Verify RLS Policies

```sql
-- Check all policies on properties table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY policyname;

-- Check all policies on admins table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'admins'
ORDER BY policyname;

-- Check all policies on admin_audit_logs table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'admin_audit_logs'
ORDER BY policyname;
```

**Expected Results:**
- 8 policies on properties (3 SELECT, 2 UPDATE, 1 INSERT, 2 DELETE)
- 3 policies on admins (1 SELECT, 1 INSERT, 1 DELETE)
- 2 policies on admin_audit_logs (1 SELECT, 1 INSERT)

---

### 6.3 Verify Triggers

```sql
-- Check trigger exists
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgtype,
  tgenabled
FROM pg_trigger
WHERE tgname = 'protect_property_status_trigger';

-- Expected: 1 row with tgname = 'protect_property_status_trigger'

-- Check function exists
SELECT 
  proname as function_name,
  prosrc as source_code
FROM pg_proc
WHERE proname = 'protect_property_status';
```

---

### 6.4 Test Approve/Reject Flow (SQL)

```sql
-- 1. Create test property (as regular user)
SET request.jwt.claims.sub = 'regular-user-uuid';

INSERT INTO public.properties (
  owner_id, property_type, transaction_type, city_id,
  price, title_fr, title_ar, status
) VALUES (
  'regular-user-uuid', 'apartment', 'sale', 1,
  500000, 'Test Property', 'عقار تجريبي', 'pending'
) RETURNING id;

-- 2. Try to approve as regular user (should fail or status stays pending)
SET request.jwt.claims.sub = 'regular-user-uuid';

UPDATE public.properties
SET status = 'approved'
WHERE id = 'test-property-id';

-- Verify status is still pending
SELECT status FROM public.properties WHERE id = 'test-property-id';
-- Expected: status = 'pending' (trigger prevented change)

-- 3. Approve as admin (should succeed)
SET request.jwt.claims.sub = 'admin-user-uuid';

UPDATE public.properties
SET 
  status = 'approved',
  approved_at = NOW(),
  approved_by = 'admin-user-uuid',
  published_at = NOW()
WHERE id = 'test-property-id';

-- Verify status changed
SELECT status, approved_at, approved_by FROM public.properties 
WHERE id = 'test-property-id';
-- Expected: status = 'approved', approved_at and approved_by are set
```

---

### 6.5 Check Missing Columns

```sql
-- Verify properties table has all required columns
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'properties'
  AND column_name IN (
    'status', 'rejection_reason', 'approved_at', 
    'approved_by', 'published_at'
  )
ORDER BY column_name;
```

**Expected Result:**
```
 column_name      | data_type                   | column_default | is_nullable
------------------+-----------------------------+----------------+-------------
 approved_at      | timestamp with time zone    | NULL           | YES
 approved_by      | uuid                        | NULL           | YES
 published_at     | timestamp with time zone    | NULL           | YES
 rejection_reason | text                        | NULL           | YES
 status           | text                        | 'pending'      | NO
```

---

### 6.6 Enable RLS (if disabled)

```sql
-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('properties', 'admins', 'admin_audit_logs');

-- Enable RLS if disabled
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
```

---

### 6.7 Audit Log Queries

```sql
-- View recent admin actions
SELECT 
  aal.created_at,
  u.email as admin_email,
  aal.action,
  aal.entity_type,
  aal.entity_id,
  aal.metadata
FROM public.admin_audit_logs aal
JOIN auth.users u ON aal.admin_id = u.id
ORDER BY aal.created_at DESC
LIMIT 50;

-- View approve/reject actions only
SELECT 
  aal.created_at,
  u.email as admin_email,
  aal.action,
  aal.metadata->>'title' as property_title,
  aal.metadata->>'rejection_reason' as reason
FROM public.admin_audit_logs aal
JOIN auth.users u ON aal.admin_id = u.id
WHERE aal.action IN ('approve', 'reject')
ORDER BY aal.created_at DESC
LIMIT 20;
```

---

## 7. NETWORK REQUEST/RESPONSE LOGS

### 7.1 How to Capture Network Logs

**Chrome DevTools:**
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Click Approve/Reject button
5. Look for POST request to Supabase API

**Request Details:**
```
POST https://[project-ref].supabase.co/rest/v1/properties?id=eq.{property-id}
```

**Request Headers:**
```
apikey: [your-anon-key]
Authorization: Bearer [jwt-token]
Content-Type: application/json
Prefer: return=representation
```

**Request Body (Approve):**
```json
{
  "status": "approved",
  "approved_at": "2024-01-31T12:34:56.789Z",
  "approved_by": "admin-uuid-here",
  "published_at": "2024-01-31T12:34:56.789Z"
}
```

**Request Body (Reject):**
```json
{
  "status": "rejected",
  "rejection_reason": "Does not meet quality standards"
}
```

**Success Response (200 OK):**
```json
[
  {
    "id": "property-uuid",
    "status": "approved",
    "approved_at": "2024-01-31T12:34:56.789Z",
    "approved_by": "admin-uuid",
    "published_at": "2024-01-31T12:34:56.789Z",
    "title_fr": "Villa moderne à Casablanca",
    ...
  }
]
```

**Error Response (403 Forbidden - RLS):**
```json
{
  "code": "42501",
  "details": null,
  "hint": null,
  "message": "new row violates row-level security policy for table \"properties\""
}
```

**Error Response (401 Unauthorized):**
```json
{
  "code": "PGRST301",
  "details": null,
  "hint": null,
  "message": "JWT token is missing or invalid"
}
```

---

### 7.2 Decode JWT Token

**Browser Console:**
```javascript
// Get current session
const { data: { session } } = await supabase.auth.getSession();

// Decode JWT (base64)
const token = session.access_token;
const payload = JSON.parse(atob(token.split('.')[1]));

console.log('JWT Payload:', payload);
console.log('User ID (sub):', payload.sub);
console.log('Email:', payload.email);
console.log('Role:', payload.role);
console.log('Issued At:', new Date(payload.iat * 1000));
console.log('Expires At:', new Date(payload.exp * 1000));
```

**Expected Payload:**
```json
{
  "aud": "authenticated",
  "role": "authenticated",
  "sub": "user-uuid-here",
  "email": "admin@example.com",
  "email_confirmed_at": "2024-01-15T10:30:00Z",
  "phone": "",
  "app_metadata": {
    "provider": "email",
    "providers": ["email"]
  },
  "user_metadata": {
    "full_name": "Admin User"
  },
  "iat": 1706789456,
  "exp": 1706793056,
  "iss": "https://[project-ref].supabase.co/auth/v1"
}
```

---

## 8. DIAGNOSTIC CHECKLIST

Use this checklist to systematically diagnose approve/reject issues.

### 8.1 User Authentication

- [ ] User is logged in (check localStorage for `supabase.auth.token`)
- [ ] JWT token is valid (check exp timestamp)
- [ ] User ID matches expected admin user
- [ ] Session is active (no 401 errors in network tab)

**Verification:**
```javascript
const { data: { user } } = await supabase.auth.getUser();
console.log('Logged in as:', user?.email, 'ID:', user?.id);
```

---

### 8.2 Admin Status

- [ ] User ID exists in `public.admins` table
- [ ] RLS policies on admins table are enabled
- [ ] No typos in user ID when inserting into admins

**Verification:**
```sql
SELECT user_id FROM public.admins WHERE user_id = 'your-uuid';
```

---

### 8.3 Database Schema

- [ ] Properties table exists
- [ ] Status column exists with CHECK constraint
- [ ] approved_at, approved_by, published_at columns exist
- [ ] rejection_reason column exists

**Verification:**
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns
WHERE table_name = 'properties';
```

---

### 8.4 RLS Policies

- [ ] RLS enabled on properties table
- [ ] properties_update_admin policy exists
- [ ] Policy checks admins table (not profiles.user_role)
- [ ] No conflicting policies blocking admin updates

**Verification:**
```sql
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'properties' AND policyname LIKE '%admin%';
```

---

### 8.5 Triggers

- [ ] protect_property_status trigger exists
- [ ] Trigger function checks admins table
- [ ] Trigger is enabled (not disabled)

**Verification:**
```sql
SELECT tgname, tgenabled FROM pg_trigger 
WHERE tgname = 'protect_property_status_trigger';
```

---

### 8.6 Network Requests

- [ ] POST request is sent to /rest/v1/properties
- [ ] Authorization header includes valid JWT
- [ ] Request body includes correct status value
- [ ] Response is 200 OK (not 403 or 401)

**Verification:** Check Network tab in DevTools

---

### 8.7 Code Logic

- [ ] onClick handler is triggered (Step A logs appear)
- [ ] Update data is correctly prepared (Step B logs)
- [ ] No JavaScript errors in console
- [ ] Supabase client is initialized correctly

**Verification:** Check browser console for Steps A-D logs

---

## 9. COMMON ISSUES & SOLUTIONS

### Issue 1: "Permission Denied" Error (42501)

**Symptoms:**
- Error code 42501 in Step C
- Message: "new row violates row-level security policy"

**Diagnosis:**
```sql
-- Check if user is admin
SELECT * FROM public.admins WHERE user_id = 'your-uuid';
```

**Solutions:**
1. Add user to admins table (Section 6.1)
2. Verify RLS policies are correct (Section 6.2)
3. Check JWT contains correct user ID

---

### Issue 2: Status Not Changing (Silent Fail)

**Symptoms:**
- Step C shows success
- Step D shows status = 'pending' (unchanged)
- No error message

**Diagnosis:**
- Trigger is reverting status change

**Solutions:**
```sql
-- Verify trigger checks admins table correctly
SELECT prosrc FROM pg_proc WHERE proname = 'protect_property_status';

-- Ensure user is in admins table
INSERT INTO public.admins (user_id) VALUES ('your-uuid')
ON CONFLICT DO NOTHING;
```

---

### Issue 3: JWT Token Missing or Invalid

**Symptoms:**
- Error code PGRST301
- Message: "JWT token is missing or invalid"

**Diagnosis:**
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

**Solutions:**
1. Re-login to get fresh token
2. Check token expiry: `exp` claim in JWT
3. Verify Supabase client is initialized with correct keys

---

### Issue 4: First Admin Cannot Be Created

**Symptoms:**
- INSERT into admins table fails with permission error

**Diagnosis:**
- Circular dependency: Need to be admin to insert admin

**Solutions:**
1. Use Supabase SQL Editor (service role)
2. Temporarily disable RLS:
```sql
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;
INSERT INTO public.admins (user_id) VALUES ('first-admin-uuid');
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
```

---

### Issue 5: Approved Properties Not Visible

**Symptoms:**
- Property approved successfully
- Not showing in public listings

**Diagnosis:**
```sql
SELECT id, status, approved_at FROM properties WHERE id = 'property-uuid';
```

**Solutions:**
1. Verify status = 'approved' in database
2. Check frontend filter logic
3. Ensure SELECT policy allows approved properties

---

## 10. SCREENSHOTS & OUTPUTS

### 10.1 Console Log Screenshots

**Location:** Open browser DevTools → Console tab → Click Approve button

**Expected Console Output:**

```
🔍 [STEP A] Approve/Reject onClick Triggered
  Function: handleStatusChange (AdminListings)
  Timestamp: 2024-01-31T12:34:56.789Z
  New Status: approved
  Property ID: abc123...
  Property Title: Villa moderne

🔍 [STEP B] Sending Supabase Update Request
  Table: properties
  Property ID: abc123...
  Update Data: {
    "status": "approved",
    "approved_at": "2024-01-31T12:34:56.789Z",
    "approved_by": "admin-uuid",
    "published_at": "2024-01-31T12:34:56.789Z"
  }

🔍 [STEP C] Supabase Response
  ✅ Success - No Error
  Response Data: [{ id: "abc123", status: "approved", ... }]

🔍 [STEP D] Verifying DB Update
  ✅ Current DB State: { status: "approved", ... }
  Status Match: ✅ YES
  Approved At Set: ✅ YES
  Approved By Set: ✅ YES
  Published At Set: ✅ YES
```

**To capture:** Right-click in console → "Save as..." → save-console.log

---

### 10.2 Network Tab Screenshots

**Location:** DevTools → Network → Filter: "Fetch/XHR"

**What to Capture:**
1. Request URL
2. Request Headers (especially Authorization)
3. Request Payload
4. Response Status Code
5. Response Body

**To capture:** Right-click on request → "Copy" → "Copy as cURL" or "Copy all as HAR"

---

### 10.3 SQL Query Results

**Run in Supabase SQL Editor:**

```sql
-- Admin check
SELECT * FROM public.admins;

-- Recent properties
SELECT id, status, approved_at, approved_by, title_fr 
FROM public.properties 
ORDER BY created_at DESC 
LIMIT 10;

-- RLS policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'properties';
```

**To capture:** Click "Download CSV" or copy results

---

## 11. SUMMARY & RECOMMENDATIONS

### ✅ Current Setup Status

**Database Schema:** ✅ Complete
- All required tables exist (properties, admins, admin_audit_logs)
- All required columns exist
- Constraints properly defined

**RLS Policies:** ✅ Comprehensive
- Properties table: 8 policies covering all CRUD operations
- Admins table: 3 policies for admin management
- Audit logs table: 2 policies for admin-only access

**Triggers:** ✅ Functional
- Status protection trigger prevents non-admin status changes
- Auto-update timestamp trigger

**Code Implementation:** ✅ Complete
- Proper error handling
- Comprehensive logging (Steps A-D)
- Audit trail logging
- Facebook webhook integration

---

### ⚠️ Potential Issues to Check

1. **Admin User Setup**
   - Verify your user ID exists in `public.admins` table
   - First admin must be created via service role

2. **JWT Token Validity**
   - Check token hasn't expired
   - Verify `auth.uid()` matches your user ID

3. **Network Connectivity**
   - Ensure Supabase API is reachable
   - Check for CORS or firewall issues

---

### 📋 Next Steps

1. **Verify Admin Status:**
```sql
-- Run in Supabase SQL Editor
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
SELECT * FROM public.admins WHERE user_id = 'your-uuid-from-above';
```

2. **Test Approve Flow:**
   - Login as admin user
   - Navigate to Admin Listings page
   - Click Approve on pending property
   - Check console for Steps A-D logs
   - Verify no errors in Network tab

3. **Capture Diagnostics:**
   - Console logs (Steps A-D)
   - Network request/response
   - SQL query results from Section 10.3

4. **Report Issues:**
   - If errors occur, note exact error code and message
   - Share console logs and network logs
   - Provide results of SQL verification queries

---

## 12. QUICK REFERENCE

### Admin Check (SQL)
```sql
SELECT * FROM public.admins WHERE user_id = auth.uid();
```

### Add Admin (SQL - Service Role)
```sql
INSERT INTO public.admins (user_id) VALUES ('user-uuid-here');
```

### Check Property Status (SQL)
```sql
SELECT id, status, approved_at, approved_by FROM properties WHERE id = 'property-uuid';
```

### Test Admin Status (Browser Console)
```javascript
const { data: { user } } = await supabase.auth.getUser();
const { data } = await supabase.from('admins').select('*').eq('user_id', user.id);
console.log('Is Admin:', data?.length > 0);
```

### Verify JWT (Browser Console)
```javascript
const { data: { session } } = await supabase.auth.getSession();
const payload = JSON.parse(atob(session.access_token.split('.')[1]));
console.log('User ID:', payload.sub, 'Email:', payload.email);
```

---

## 13. SUPPORT RESOURCES

### Documentation
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [Supabase Triggers](https://supabase.com/docs/guides/database/postgres/triggers)

### Code Locations
- **Approve/Reject Logic:** `/src/pages/admin/AdminListings.tsx` (line 226)
- **Audit Logging:** `/src/lib/auditLog.ts`
- **Main Migration:** `/supabase/migrations/050_create_admins_table_and_rls.sql`
- **Audit Logs Migration:** `/supabase/migrations/053_create_admin_audit_logs.sql`

---

**End of Diagnostic Report**

*Last Updated: 2026-01-31*
