# Admin Properties RLS Policies - Verification

## Current Status: ✅ ALREADY CONFIGURED

The RLS policies for admin access to properties were created in **Migration 050** (`supabase/migrations/050_create_admins_table_and_rls.sql`).

## Admin Table Structure

```sql
-- Table: public.admins
CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS enabled
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
```

## Properties Table RLS Policies

### SELECT Policies

```sql
-- 1. Users can read their own listings
CREATE POLICY "properties_select_own" ON public.properties
  FOR SELECT USING (
    owner_id = auth.uid()
  );

-- 2. Admin can read ALL listings ✅
CREATE POLICY "properties_select_admin" ON public.properties
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- 3. Public can read approved listings
CREATE POLICY "properties_select_public" ON public.properties
  FOR SELECT USING (
    status = 'approved'
  );
```

### UPDATE Policies

```sql
-- 1. Users can update their own listings
CREATE POLICY "properties_update_own" ON public.properties
  FOR UPDATE 
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- 2. Admin can update ALL listings ✅
CREATE POLICY "properties_update_admin" ON public.properties
  FOR UPDATE 
  USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));
```

### DELETE Policies

```sql
-- 1. Users can delete their own listings
CREATE POLICY "properties_delete_own" ON public.properties
  FOR DELETE USING (
    owner_id = auth.uid()
  );

-- 2. Admin can delete ALL listings ✅
CREATE POLICY "properties_delete_admin" ON public.properties
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );
```

## Status Change Protection

A trigger ensures only admins can change property status:

```sql
CREATE OR REPLACE FUNCTION public.protect_property_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) THEN
      NEW.status := OLD.status;
      RAISE NOTICE 'Status change prevented: Only admins can change property status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER protect_property_status_trigger
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_property_status();
```

## Verification Queries

### Check if user is admin
```sql
SELECT EXISTS (
  SELECT 1 FROM public.admins WHERE user_id = auth.uid()
) AS is_admin;
```

### List all admins
```sql
SELECT a.user_id, u.email, p.full_name
FROM public.admins a
LEFT JOIN auth.users u ON a.user_id = u.id
LEFT JOIN public.profiles p ON a.user_id = p.id;
```

### View RLS policies on properties
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY policyname;
```

## Making a User an Admin

```sql
-- Find user's UUID by email
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- Add to admins table (replace with actual UUID)
INSERT INTO public.admins (user_id) VALUES ('user-uuid-here');
```

## Troubleshooting

### Error: "new row violates row-level security policy"
**Cause:** User is not in the admins table  
**Solution:** Add user to admins table with query above

### Error: "permission denied for table properties"
**Cause:** RLS not enabled or policies missing  
**Solution:** Run migration 050 to create policies

### Status change not working
**Cause:** Trigger preventing non-admin status changes  
**Solution:** Ensure user is in admins table

## Summary

✅ **No additional migration needed** - All RLS policies are already in place via migration 050.

The approve/reject actions will work for any user in the `public.admins` table.
