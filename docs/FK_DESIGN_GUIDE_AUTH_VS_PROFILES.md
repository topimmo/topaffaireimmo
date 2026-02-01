# Foreign Key Design Guide: auth.users vs public.profiles

## Overview

This guide explains when to reference `auth.users` vs `public.profiles` in foreign key constraints, with specific recommendations for the TopAffaireImmo application.

---

## Quick Decision Chart

```
Should this table reference user identity?
│
├─ YES → Reference auth.users(id)
│   ├─ Core user identity tracking
│   ├─ Ownership relationships
│   ├─ Audit trails
│   └─ Admin authorization
│
└─ NO → Consider public.profiles(id)
    ├─ User metadata/settings only
    ├─ Extended profile relationships
    └─ Social features (followers, etc.)
```

---

## Rule of Thumb

**Reference `auth.users(id)` when:**
- The relationship is about **WHO** the user is
- The data must exist when user is authenticated
- You need guaranteed referential integrity
- The relationship is core to the application security

**Reference `public.profiles(id)` when:**
- The relationship is about **WHAT** the user has configured
- The data is optional or supplementary
- You want to decouple from authentication layer
- Profile creation timing doesn't matter

---

## Case Study: TopAffaireImmo Tables

### ✅ CORRECT: Reference auth.users

#### 1. `public.admins` Table

```sql
CREATE TABLE public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);
```

**Why auth.users?**
- Admin authorization is about user **identity**, not profile data
- Must work immediately when user is authenticated
- RLS policies use `auth.uid()` which comes from auth.users
- No dependency on profile creation timing
- If user deleted from auth.users, admin access should be revoked

**Wrong approach (causes issues):**
```sql
-- ❌ DON'T DO THIS
CREATE TABLE public.admins (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id)
);
```

**Problem:** If profile creation is delayed or fails, you can't add admin even though user exists.

---

#### 2. `public.properties` Table

```sql
CREATE TABLE public.properties (
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
```

**Why auth.users?**
- Property ownership is about user **identity**
- RLS policies check `owner_id = auth.uid()`
- User can create property immediately after signup
- No dependency on profile creation
- If user deleted, their properties should cascade delete

**Migration history:**
- Initially referenced `profiles(id)` (wrong)
- Caused FK ↔ RLS mismatch errors
- Fixed in migration 061 to reference `auth.users(id)`

---

#### 3. `public.admin_audit_logs` Table

```sql
CREATE TABLE public.admin_audit_logs (
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
```

**Why auth.users?**
- Audit logging tracks **who** performed the action
- Critical for security and compliance
- Must be reliable - can't depend on profile existence
- User identity is the single source of truth

---

### ⚠️ CONSIDER: Reference public.profiles

#### 1. `public.user_preferences` (hypothetical)

```sql
-- If you had a user preferences table
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme TEXT,
  language TEXT,
  notifications_enabled BOOLEAN
);
```

**Why profiles?**
- Preferences are supplementary to the profile
- Profile contains user_role, which affects available preferences
- Natural grouping: profile + preferences both in public schema
- Still works fine if referencing auth.users, but profiles makes sense

**Note:** In TopAffaireImmo, these fields are directly in profiles table, so this is hypothetical.

---

#### 2. `public.saved_searches` (hypothetical)

```sql
-- If you had saved searches
CREATE TABLE public.saved_searches (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  search_params JSONB
);
```

**Why profiles could work:**
- Saved searches are optional user features
- Could be tied to user_role (e.g., only for real_estate_advertiser)
- Not critical for core functionality

**But auth.users is also fine:**
- Saved searches are still about user identity
- No harm in referencing auth.users directly
- More future-proof if profiles table is removed

---

## Migration Examples

### Example 1: Fix Wrong FK (admins table)

```sql
-- BEFORE (wrong)
ALTER TABLE public.admins 
  DROP CONSTRAINT IF EXISTS admins_user_id_fkey;

-- AFTER (correct)
ALTER TABLE public.admins 
  ADD CONSTRAINT admins_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

### Example 2: Fix Wrong FK (properties table)

```sql
-- From migration 061
ALTER TABLE public.properties 
  DROP CONSTRAINT IF EXISTS properties_owner_id_fkey;

ALTER TABLE public.properties 
  ADD CONSTRAINT properties_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

---

## Common Patterns

### Pattern 1: User-Owned Resources

```sql
-- Properties, listings, posts, etc.
CREATE TABLE public.{resource_name} (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- other columns
);

-- RLS policy (using auth.uid() from auth.users)
CREATE POLICY "{resource}_select_own" ON public.{resource_name}
  FOR SELECT USING (owner_id = auth.uid());
```

**Key:** Both FK and RLS use auth.users, so they're aligned.

---

### Pattern 2: Admin/Authorization Tables

```sql
-- Admin whitelist, role assignments, permissions
CREATE TABLE public.{auth_table} (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- authorization columns
);

-- RLS check (queries this table)
CREATE POLICY "some_policy" ON public.other_table
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.{auth_table})
  );
```

**Key:** Authorization tables should reference auth.users for reliability.

---

### Pattern 3: Audit Logs

```sql
-- Admin actions, user activity logs
CREATE TABLE public.{audit_table} (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  -- other columns
);
```

**Key:** Audit logs track user identity, not profile metadata.

---

## Triggers and Sync Considerations

### Profile Creation Trigger

```sql
-- Trigger that creates profile when user signs up
CREATE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, ...)
  VALUES (NEW.id, NEW.email, ...);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Implications:**
- `profiles.id` should always equal `auth.users.id` (enforced by PK)
- Profile created AFTER user in auth.users
- Small window where user exists but profile doesn't
- **This is why critical tables should reference auth.users**

---

### Alternative: Ensure Profile Exists Before FK

```sql
-- If you MUST reference profiles, ensure it exists first
CREATE FUNCTION ensure_profile_exists(user_uuid UUID) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  SELECT id, email FROM auth.users WHERE id = user_uuid
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Call before inserting into table that references profiles
SELECT ensure_profile_exists(auth.uid());
INSERT INTO public.some_table (user_id) VALUES (auth.uid());
```

**But this is complex. Better to just reference auth.users.**

---

## Troubleshooting

### Issue 1: FK violation even though user exists

**Symptom:**
```
ERROR: Key (user_id)=(xxx) is not present in table "profiles"
```

**Cause:** Referencing profiles but profile wasn't created yet

**Solution:**
```sql
-- Change FK to reference auth.users
ALTER TABLE your_table 
  DROP CONSTRAINT your_fk_constraint;

ALTER TABLE your_table 
  ADD CONSTRAINT your_fk_constraint 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

---

### Issue 2: FK vs RLS mismatch

**Symptom:** INSERT fails with FK error, but RLS policy uses `auth.uid()`

**Diagnosis:**
```sql
-- Check what FK references
SELECT confrelid::regclass AS references_table
FROM pg_constraint
WHERE conname = 'your_fk_constraint';

-- Check what RLS uses
SELECT qual FROM pg_policies 
WHERE tablename = 'your_table' AND cmd = 'INSERT';
```

**Solution:** Ensure both FK and RLS use the same source (auth.users)

---

## Recommendations for TopAffaireImmo

### Current Correct References

✅ `public.admins.user_id` → `auth.users(id)`
✅ `public.properties.owner_id` → `auth.users(id)`  
✅ `public.admin_audit_logs.admin_id` → `auth.users(id)`

### Tables to Review

Check these tables (if they exist):
- `public.favorites` → Should reference `auth.users(id)`
- `public.messages` → Should reference `auth.users(id)`
- `public.notifications` → Should reference `auth.users(id)`

### Future Tables

When creating new tables, ask:
1. Is this about user identity? → Reference `auth.users`
2. Is this tied to RLS policies using `auth.uid()`? → Reference `auth.users`
3. Must it work immediately after signup? → Reference `auth.users`
4. Is it critical for security/audit? → Reference `auth.users`

**Default: When in doubt, reference `auth.users(id)`**

---

## Summary

### ✅ DO Reference auth.users

- Admin/authorization tables (`admins`, `moderators`, etc.)
- Resource ownership (`properties`, `posts`, etc.)
- Audit/activity logs
- Any table with RLS policies using `auth.uid()`
- When referential integrity is critical

### ⚠️ MAYBE Reference public.profiles

- Extended profile relationships (followers, settings)
- Non-critical supplementary data
- When you explicitly want profile-level granularity

### ❌ DON'T Reference public.profiles

- If RLS policies use `auth.uid()`
- If table must work immediately after signup
- If you want to avoid timing dependencies
- For security-critical relationships

---

## Final Note

The TopAffaireImmo application has moved to **auth.users as the single source of truth** for all identity-related foreign keys. This simplifies the data model, eliminates timing issues, and aligns FK constraints with RLS policies.

The `profiles` table remains for **storing additional user metadata** (name, phone, user_role, advertiser_type, etc.) but is **not used for referential integrity** in core tables.

---

**Last Updated:** 2026-02-01  
**Related Migrations:** 050, 061, 062
