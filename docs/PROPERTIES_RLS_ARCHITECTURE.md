# Properties Table RLS Policy Architecture

## Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     PROPERTIES TABLE (RLS ENABLED)               │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
         │  ANON   │    │ OWNER   │    │ ADMIN   │
         │  ROLE   │    │  ROLE   │    │  ROLE   │
         └────┬────┘    └────┬────┘    └────┬────┘
              │              │               │
              │              │               │
    ┌─────────▼─────────┐    │               │
    │  NO DIRECT ACCESS │    │               │
    │  ❌ properties     │    │               │
    │  ✅ properties_    │    │               │
    │     public (view) │    │               │
    └───────────────────┘    │               │
                             │               │
         ┌───────────────────▼─────┐         │
         │   OWN PROPERTIES        │         │
         │   (created_by=uid OR    │         │
         │    owner_id=uid)        │         │
         └───────────────────┬─────┘         │
                             │               │
         ┌───────────────────▼─────┐         │
         │ SELECT: All own props   │         │
         │ INSERT: New properties  │         │
         │ UPDATE: draft/rejected  │         │
         │ DELETE: draft/rejected  │         │
         └─────────────────────────┘         │
                                             │
                   ┌─────────────────────────▼─────┐
                   │   ALL PROPERTIES               │
                   │   (user_id IN admins)          │
                   └─────────────────────┬──────────┘
                                         │
                   ┌─────────────────────▼──────────┐
                   │ SELECT: All properties         │
                   │ UPDATE: All properties         │
                   │        (bypass workflow)       │
                   │ DELETE: All properties         │
                   └────────────────────────────────┘
```

## Policy Matrix

| Policy Name | Role | Command | Ownership Check | Status Check | Admin Check |
|-------------|------|---------|----------------|--------------|-------------|
| properties_select_own | authenticated | SELECT | ✅ created_by OR owner_id | ➖ None | ❌ No |
| properties_select_admin | authenticated | SELECT | ➖ None | ➖ None | ✅ admins table |
| properties_insert_own | authenticated | INSERT | ✅ created_by AND owner_id | ✅ draft/pending | ❌ No |
| properties_update_own | authenticated | UPDATE | ✅ created_by OR owner_id | ✅ draft/rejected | ❌ No |
| properties_update_admin | authenticated | UPDATE | ➖ None | ➖ None | ✅ admins table |
| properties_delete_own | authenticated | DELETE | ✅ created_by OR owner_id | ✅ draft/rejected | ❌ No |
| properties_delete_admin | authenticated | DELETE | ➖ None | ➖ None | ✅ admins table |

## Access Flow Diagram

```
┌──────────────┐
│ HTTP REQUEST │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Supabase Auth    │
│ - anon token     │
│ - user JWT       │
└──────┬───────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ RLS Policy Evaluation                │
│                                      │
│ IF auth.uid() IS NULL:               │
│   ├─ Role: anon                      │
│   ├─ No matching policies            │
│   └─ Result: 0 rows                  │
│                                      │
│ IF auth.uid() IN admins:             │
│   ├─ Role: authenticated (admin)     │
│   ├─ Match: properties_*_admin       │
│   └─ Result: ALL rows (no filter)    │
│                                      │
│ IF auth.uid() NOT IN admins:         │
│   ├─ Role: authenticated (owner)     │
│   ├─ Match: properties_*_own         │
│   └─ Result: Filtered by ownership   │
│             & status                 │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────┐
│ Query Execution  │
└──────────────────┘
```

## Status Workflow Integration

```
┌──────────┐
│  DRAFT   │ ◄─── User can: SELECT, UPDATE, DELETE, INSERT (initial)
└────┬─────┘
     │ User: submit
     ▼
┌──────────┐
│ PENDING  │ ◄─── User can: SELECT only (locked)
└────┬─────┘      Admin can: SELECT, UPDATE, DELETE
     │ Admin: approve/reject
     ├─────────────────────┐
     │                     │
     ▼                     ▼
┌──────────┐         ┌──────────┐
│PUBLISHED │         │ REJECTED │ ◄─── User can: SELECT, UPDATE, DELETE
└──────────┘         └────┬─────┘      (can resubmit)
     │                    │
User can: SELECT only     │ User: resubmit
Admin can: ALL            └──────────┐
     │                               │
     ▼                               ▼
┌──────────┐                    ┌──────────┐
│ ARCHIVED │                    │  DRAFT   │
└──────────┘                    └──────────┘
Admin only: ALL
```

## Security Boundaries

```
┌────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: Supabase Auth                                    │
│  ├─ JWT validation                                         │
│  ├─ Role assignment (anon/authenticated)                   │
│  └─ auth.uid() extraction                                  │
│                                                             │
│  Layer 2: RLS Policies (THIS MIGRATION)                    │
│  ├─ Row-level filtering by ownership                       │
│  ├─ Admin role verification (admins table)                 │
│  └─ Command-level permissions (SELECT/INSERT/UPDATE/DELETE)│
│                                                             │
│  Layer 3: Trigger (protect_property_status)                │
│  ├─ Status workflow enforcement                            │
│  ├─ Prevent unauthorized status changes                    │
│  └─ Admin bypass logic                                     │
│                                                             │
│  Layer 4: View Layer (properties_public)                   │
│  ├─ Contact visibility filtering                           │
│  ├─ Published-only filtering                               │
│  └─ Anonymous access point                                 │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

## Data Flow Examples

### Example 1: Anonymous User Viewing Properties
```
1. Request: GET /rest/v1/properties
2. Auth: anon token (no auth.uid())
3. RLS Evaluation: No matching policies
4. Result: 0 rows (access denied)

Alternative:
1. Request: GET /rest/v1/properties_public
2. Auth: anon token
3. View Filter: status='published' AND not archived
4. Contact Filter: Respect show_*_public flags
5. Result: Published properties with filtered contacts
```

### Example 2: Property Owner Updating Draft
```
1. Request: PATCH /rest/v1/properties?id=eq.abc-123
2. Auth: user token (auth.uid()=user-456)
3. RLS Evaluation:
   - properties_update_own matches
   - USING: created_by=user-456 OR owner_id=user-456 ✓
   - USING: status='draft' ✓
   - WITH CHECK: ownership still matches ✓
   - WITH CHECK: new status in allowed list ✓
4. Trigger: protect_property_status
   - OLD.status='draft' (allowed) ✓
   - NEW.status='draft' or 'pending' (allowed) ✓
5. Result: Update succeeds
```

### Example 3: Admin Approving Property
```
1. Request: PATCH /rest/v1/properties?id=eq.abc-123
2. Auth: admin token (auth.uid()=admin-789)
3. RLS Evaluation:
   - properties_update_admin matches
   - USING: admin-789 IN (SELECT user_id FROM admins) ✓
4. Trigger: protect_property_status
   - is_admin check: TRUE ✓
   - Bypass all restrictions ✓
5. Result: Update succeeds (can set status='published')
```

## Migration Strategy

```
┌─────────────────────────────────────────────────────────────┐
│ BEFORE: Migrations 010-082 (Chaotic State)                 │
├─────────────────────────────────────────────────────────────┤
│ • 30+ policies across 10+ migrations                        │
│ • Conflicting conditions (owner_id vs created_by OR owner)  │
│ • Duplicate policy names                                    │
│ • Inconsistent admin checks                                 │
│ • Public access confusion                                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Migration 083
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ AFTER: Migration 083 (Clean State)                          │
├─────────────────────────────────────────────────────────────┤
│ • Exactly 7 policies (minimal set)                          │
│ • Consistent conditions (created_by OR owner_id)            │
│ • No duplicate names                                        │
│ • Single admin check (admins table)                         │
│ • Clear public access (via view)                            │
│ • Complete documentation                                    │
└─────────────────────────────────────────────────────────────┘
```

## Performance Considerations

### Indexing
```sql
-- Existing indexes that support RLS policies
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_created_by ON properties(created_by);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_is_archived ON properties(is_archived) WHERE is_archived = FALSE;
```

### Query Optimization
- Admin queries: No additional filtering (fastest)
- Owner queries: Filtered by UID + status (indexed)
- Public queries: Use view (pre-filtered)

## Compliance & Auditing

### GDPR Compliance
✅ Anonymous users cannot access personal data
✅ Contact information filtered by visibility flags
✅ Users can only access their own data (unless admin)

### Audit Trail
- All changes logged via Supabase auth
- auth.uid() tracked for all operations
- Status changes enforced and logged

## Troubleshooting

### Common Issues
1. **User cannot see their properties**
   - Check: created_by AND owner_id both set?
   - Check: User authenticated?
   - Check: Properties in allowed status?

2. **Admin cannot access properties**
   - Check: User in admins table?
   - Query: `SELECT * FROM admins WHERE user_id = auth.uid()`

3. **Public cannot see properties**
   - Expected: Use properties_public view instead
   - Check: View permissions granted to anon?

## Summary

This migration provides:
- ✅ **Minimal policy set** (7 policies, no redundancy)
- ✅ **Clear role separation** (anon/owner/admin)
- ✅ **Security by default** (deny-all for anon)
- ✅ **Maintainable** (single source of truth)
- ✅ **Well-documented** (this diagram + docs)
- ✅ **Production-ready** (tested patterns)
