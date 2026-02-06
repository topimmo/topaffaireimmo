# Properties RLS Policies - Quick Reference

## TL;DR

After Migration 083, the `properties` table has **exactly 7 RLS policies**:

| Policy | Role | Action | Condition |
|--------|------|--------|-----------|
| `properties_select_own` | Owner | SELECT | created_by OR owner_id = uid |
| `properties_select_admin` | Admin | SELECT | uid IN admins |
| `properties_insert_own` | Owner | INSERT | created_by AND owner_id = uid |
| `properties_update_own` | Owner | UPDATE | Owns + draft/rejected status |
| `properties_update_admin` | Admin | UPDATE | uid IN admins |
| `properties_delete_own` | Owner | DELETE | Owns + draft/rejected status |
| `properties_delete_admin` | Admin | DELETE | uid IN admins |

## Role Access Summary

### Anonymous (anon)
- ❌ Cannot access `properties` table directly
- ✅ Can access `properties_public` view (published listings only)

### Authenticated (property owner)
- ✅ SELECT: Own properties
- ✅ INSERT: New properties (draft/pending)
- ✅ UPDATE: Own draft/rejected properties
- ✅ DELETE: Own draft/rejected properties
- ❌ Cannot update/delete published properties
- ❌ Cannot approve own properties

### Authenticated (admin)
- ✅ SELECT: All properties
- ✅ UPDATE: All properties (any status)
- ✅ DELETE: All properties
- ✅ Can approve/publish/archive any property

## Common Queries

### As Anonymous User
```sql
-- ❌ This will fail
SELECT * FROM properties;

-- ✅ Use the view instead
SELECT * FROM properties_public WHERE city_id = 'xyz';
```

### As Property Owner
```sql
-- View my properties
SELECT * FROM properties 
WHERE created_by = auth.uid() OR owner_id = auth.uid();

-- Create new property
INSERT INTO properties (created_by, owner_id, title_fr, status)
VALUES (auth.uid(), auth.uid(), 'My Property', 'draft');

-- Update draft property
UPDATE properties 
SET title_fr = 'Updated Title'
WHERE id = 'my-property-id' AND status = 'draft';

-- Delete rejected property
DELETE FROM properties 
WHERE id = 'my-property-id' AND status = 'rejected';
```

### As Admin
```sql
-- View all properties
SELECT * FROM properties;

-- Approve a property
UPDATE properties 
SET status = 'published'
WHERE id = 'property-id';

-- Archive a property
UPDATE properties 
SET status = 'archived', is_archived = TRUE
WHERE id = 'property-id';

-- Delete any property
DELETE FROM properties WHERE id = 'property-id';
```

## Verification Commands

```sql
-- Count policies (should be 7)
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'properties';

-- List all policies
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY cmd, policyname;

-- Check for duplicates (should be 0)
SELECT policyname, COUNT(*) 
FROM pg_policies 
WHERE tablename = 'properties'
GROUP BY policyname 
HAVING COUNT(*) > 1;
```

## Troubleshooting

### "Permission denied" on SELECT
**Problem**: User cannot see their properties  
**Solution**: Check that both `created_by` and `owner_id` are set to user's UUID

### "Permission denied" on UPDATE
**Problem**: User cannot update their property  
**Solution**: Check property status - only `draft` and `rejected` can be edited

### Admin cannot access properties
**Problem**: Admin gets permission denied  
**Solution**: Verify user is in `admins` table:
```sql
SELECT * FROM admins WHERE user_id = auth.uid();
```

### Anonymous cannot see properties
**Problem**: Public listings not visible  
**Solution**: This is expected. Use `properties_public` view instead of direct table access.

## Status Workflow

```
draft → pending → published → archived
  ↓                    ↓
  ↓                    └─────→ rejected ──┐
  └─────────────────────────────────────→ (resubmit to draft)
```

| Status | Owner Can Edit | Owner Can Delete | Public Visible |
|--------|---------------|------------------|----------------|
| draft | ✅ | ✅ | ❌ |
| pending | ❌ | ❌ | ❌ |
| published | ❌ | ❌ | ✅ |
| rejected | ✅ | ✅ | ❌ |
| archived | ❌ | ❌ | ❌ |

Admins can edit/delete in **any** status.

## Files Created

1. **Migration**: `supabase/migrations/083_consolidate_properties_rls_policies.sql`
2. **Documentation**: `docs/PROPERTIES_RLS_POLICIES.md` (full reference)
3. **Architecture**: `docs/PROPERTIES_RLS_ARCHITECTURE.md` (diagrams)
4. **Summary**: `docs/RLS_CLEANUP_SUMMARY.md` (changes made)
5. **Verification**: `scripts/verify-properties-rls-policies.sql` (test script)
6. **Quick Ref**: `docs/PROPERTIES_RLS_QUICK_REFERENCE.md` (this file)

## Migration Commands

```bash
# Apply migration (Supabase CLI)
supabase db push

# Or via SQL
psql -f supabase/migrations/083_consolidate_properties_rls_policies.sql

# Verify
psql -f scripts/verify-properties-rls-policies.sql
```

## Security Checklist

- [x] Anonymous users cannot access properties table directly
- [x] Anonymous users can only see published properties via view
- [x] Contact information filtered by visibility flags
- [x] Users can only see/edit their own properties
- [x] Users cannot self-approve properties
- [x] Admins have full control via admins table
- [x] Status workflow enforced via trigger
- [x] No duplicate policies
- [x] No conflicting conditions
- [x] Clear role separation

## Need Help?

See full documentation: `docs/PROPERTIES_RLS_POLICIES.md`

## Summary

✅ **7 policies** (minimal set)  
✅ **3 roles** (anon/owner/admin)  
✅ **No duplicates**  
✅ **Production ready**  
