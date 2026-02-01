# Approve/Reject Flow - Visual Architecture

This document provides a visual representation of the complete Approve/Reject flow, from user click to database update.

---

## 🎯 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│  (AdminListings.tsx / AdminListingDetail.tsx)                   │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Approve    │  │    Reject    │  │    Delete    │          │
│  │   Button     │  │    Button    │  │    Button    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┴──────────────────┘                  │
│                             │                                     │
│                  handleStatusChange(id, status)                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   STEP A: CLICK   │
                    │   (Console Log)    │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    AUTHENTICATION CHECK                          │
│                                                                   │
│  supabase.auth.getUser()                                        │
│  ├─ Gets current logged-in user                                 │
│  ├─ Extracts user.id for approved_by                            │
│  └─ JWT token from session                                      │
│                                                                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  STEP B: PREPARE  │
                    │   (Console Log)    │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      SUPABASE UPDATE CALL                        │
│                                                                   │
│  await supabase.from('properties')                              │
│    .update({                                                     │
│      status: 'approved',                                         │
│      approved_at: '2024-01-31T12:34:56.789Z',                   │
│      approved_by: 'admin-user-uuid',                            │
│      published_at: '2024-01-31T12:34:56.789Z'                   │
│    })                                                            │
│    .eq('id', propertyId)                                        │
│    .select()                                                     │
│                                                                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ HTTP POST
                              │
                    ┌─────────▼─────────┐
                    │  NETWORK REQUEST  │
                    │                    │
                    │  Authorization:    │
                    │  Bearer [JWT]      │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      SUPABASE SERVER                             │
│                                                                   │
│  1. Verify JWT token                                            │
│  2. Extract auth.uid() from JWT                                 │
│  3. Check RLS policies                                          │
│  4. Execute UPDATE if allowed                                   │
│  5. Return updated row                                          │
│                                                                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                       DATABASE LAYER                             │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ STEP 1: RLS Policy Check (properties_update_admin)     │    │
│  │ ────────────────────────────────────────────────────────│    │
│  │ USING (auth.uid() IN (SELECT user_id FROM admins))     │    │
│  │                                                          │    │
│  │ ✅ Pass: User is in admins table                        │    │
│  │ ❌ Fail: Reject with 42501 permission denied           │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                    │
│                    (If RLS passes)                               │
│                              │                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ STEP 2: Trigger - protect_property_status              │    │
│  │ ────────────────────────────────────────────────────────│    │
│  │ BEFORE UPDATE trigger checks:                          │    │
│  │                                                          │    │
│  │ IF status is changing:                                  │    │
│  │   IF NOT EXISTS (user in admins table):                │    │
│  │     NEW.status := OLD.status  (revert change)          │    │
│  │                                                          │    │
│  │ ✅ Admin: Allow status change                          │    │
│  │ ⚠️ Non-admin: Revert status to old value              │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                    │
│                    (If trigger allows)                           │
│                              │                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ STEP 3: UPDATE properties SET                          │    │
│  │ ────────────────────────────────────────────────────────│    │
│  │ UPDATE public.properties                                │    │
│  │ SET                                                      │    │
│  │   status = 'approved',                                  │    │
│  │   approved_at = '2024-01-31T12:34:56.789Z',            │    │
│  │   approved_by = 'admin-uuid',                           │    │
│  │   published_at = '2024-01-31T12:34:56.789Z',           │    │
│  │   updated_at = NOW()  (auto-updated by trigger)        │    │
│  │ WHERE id = 'property-uuid'                              │    │
│  │                                                          │    │
│  │ ✅ Row updated successfully                            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  STEP C: RESPONSE │
                    │   (Console Log)    │
                    │                    │
                    │  ✅ Success or     │
                    │  ❌ Error          │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    VERIFICATION QUERY                            │
│                                                                   │
│  await supabase.from('properties')                              │
│    .select('id, status, approved_at, approved_by')             │
│    .eq('id', propertyId)                                        │
│    .single()                                                     │
│                                                                   │
│  Checks if database was actually updated                        │
│                                                                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  STEP D: VERIFY   │
                    │   (Console Log)    │
                    │                    │
                    │  Status Match?     │
                    │  ✅ YES / ❌ NO    │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      AUDIT LOGGING                               │
│                                                                   │
│  logAdminAction({                                               │
│    action: 'approve',                                            │
│    entity_type: 'property',                                      │
│    entity_id: propertyId,                                        │
│    metadata: { title: '...' }                                   │
│  })                                                              │
│                                                                   │
│  Inserts into admin_audit_logs table                            │
│                                                                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                   FACEBOOK WEBHOOK (Optional)                    │
│                                                                   │
│  sendFacebookWebhook(propertyId)                                │
│  Posts approved property to Facebook                            │
│  (Only for approve, not reject)                                 │
│                                                                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  REFRESH UI       │
                    │                    │
                    │  fetchProperties() │
                    │  Show toast msg    │
                    └───────────────────┘
```

---

## 🔐 Security Layers

The approve/reject flow has **3 layers of security**:

```
┌───────────────────────────────────────────────────────────────┐
│  LAYER 1: CLIENT-SIDE (UI Protection)                         │
│  ──────────────────────────────────────────────────────────── │
│  • Only admin users see approve/reject buttons                │
│  • isAdmin hook checks admins table                           │
│  • Buttons disabled while processing                          │
│                                                                 │
│  ⚠️ Can be bypassed (client-side security)                    │
└───────────────────────────────────────────────────────────────┘
                             ↓
┌───────────────────────────────────────────────────────────────┐
│  LAYER 2: ROW LEVEL SECURITY (Database Policy)                │
│  ──────────────────────────────────────────────────────────── │
│  • properties_update_admin policy                             │
│  • Checks: auth.uid() IN (SELECT user_id FROM admins)        │
│  • Blocks entire UPDATE if not admin                          │
│                                                                 │
│  ✅ Server-side, cannot be bypassed                           │
└───────────────────────────────────────────────────────────────┘
                             ↓
┌───────────────────────────────────────────────────────────────┐
│  LAYER 3: TRIGGER (Status Change Protection)                  │
│  ──────────────────────────────────────────────────────────── │
│  • protect_property_status trigger                            │
│  • Runs BEFORE UPDATE, checks admin status again              │
│  • Reverts status change if not admin                         │
│  • Allows other fields to update                              │
│                                                                 │
│  ✅ Additional safety layer, prevents partial updates         │
└───────────────────────────────────────────────────────────────┘
```

**Why 3 layers?**
- Layer 1: Better UX (hide buttons from non-admins)
- Layer 2: Security enforcement (RLS policy)
- Layer 3: Data integrity (prevent status manipulation even if RLS misconfigured)

---

## 📊 Data Flow Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser   │────▶│   Supabase   │────▶│  PostgreSQL │
│  (Frontend) │     │     API      │     │  Database   │
└─────────────┘     └──────────────┘     └─────────────┘
      │                    │                     │
      │ 1. Click Approve   │                     │
      │                    │                     │
      │ 2. Prepare data    │                     │
      │    (Step B)        │                     │
      │                    │                     │
      │ 3. HTTP POST ─────▶│                     │
      │    with JWT        │                     │
      │                    │ 4. Verify JWT       │
      │                    │    Check RLS ──────▶│
      │                    │                     │
      │                    │                     │ 5. Run trigger
      │                    │                     │    Check admin
      │                    │                     │
      │                    │                     │ 6. UPDATE row
      │                    │                     │
      │                    │◀──── 7. Return ─────│
      │                    │       updated row   │
      │◀─── 8. Response ───│                     │
      │     (Step C)       │                     │
      │                    │                     │
      │ 9. Verify update ─▶│ 10. SELECT ───────▶│
      │    (Step D)        │                     │
      │                    │◀──── 11. Return ────│
      │◀─── 12. Confirm ───│      current state  │
      │                    │                     │
      │ 13. Log audit ────▶│ 14. INSERT ───────▶│
      │                    │     audit_logs      │
      │                    │                     │
      │ 15. Refresh UI     │                     │
```

---

## 🗄️ Database Tables Relationship

```
┌────────────────────┐
│    auth.users      │ (Supabase Auth)
│ ─────────────────  │
│ • id (UUID)        │
│ • email            │
│ • created_at       │
└──────────┬─────────┘
           │
           │ Referenced by (FK)
           │
    ┌──────┴───────────────────────┬──────────────────┐
    │                              │                   │
    ▼                              ▼                   ▼
┌────────────────┐    ┌──────────────────────┐   ┌──────────────┐
│ public.admins  │    │ public.properties    │   │admin_audit   │
│ ──────────────│    │ ──────────────────── │   │_logs         │
│ • user_id (PK)│    │ • id (UUID PK)       │   │──────────────│
│ • created_at  │    │ • owner_id (FK) ──┐  │   │• id          │
└────────────────┘    │ • status          │  │   │• admin_id(FK)│
                      │ • approved_at     │  │   │• action      │
                      │ • approved_by ────┼──┘   │• entity_id   │
                      │ • published_at    │      │• metadata    │
                      │ • rejection_reason│      └──────────────┘
                      │ • created_at      │
                      │ • updated_at      │
                      └───────────────────┘

RELATIONSHIPS:
• admins.user_id → auth.users.id (Who is admin)
• properties.owner_id → auth.users.id (Who owns property)
• properties.approved_by → auth.users.id (Who approved - no FK constraint)
• admin_audit_logs.admin_id → auth.users.id (Who performed action)

RLS CHECKS:
• "Is user admin?" → Check if auth.uid() IN (SELECT user_id FROM admins)
```

---

## 🔄 State Transitions

```
Property Status State Machine:

         ┌──────────┐
    ┌───▶│ pending  │◀─── New listing created
    │    └────┬─────┘
    │         │
    │         │ Admin clicks "Approve"
    │         │
    │         ▼
    │    ┌──────────┐
    │    │ approved │ ───┐
    │    └────┬─────┘    │ User marks as sold
    │         │          │
    │         │          ▼
    │         │     ┌────────┐
    │         │     │  sold  │
    │         │     └────────┘
    │         │
    │         │ Admin clicks "Reject"
    │         │
    │         ▼
    │    ┌──────────┐
    └────│ rejected │
         └──────────┘

Status Values:
• pending   - Default for new listings (awaiting approval)
• approved  - Admin approved, visible to public
• rejected  - Admin rejected, not visible to public
• sold      - Property marked as sold (by owner or admin)
• rented    - Property marked as rented
• expired   - Listing expired (after 90 days)
• archived  - Archived by owner or admin

Only admins can:
• pending → approved
• pending → rejected
• approved → rejected
• rejected → approved
```

---

## 🎨 UI Components Hierarchy

```
AdminDashboard
├── Stats Cards
│   ├── Total Properties
│   ├── Pending (needs approval)
│   ├── Approved
│   └── Rejected
│
├── AdminListings (Table View)
│   ├── Filters (Status dropdown)
│   ├── Property Cards
│   │   ├── Property Info
│   │   ├── Status Badge
│   │   └── Action Buttons
│   │       ├── [View Details]
│   │       ├── [Approve] ← handleStatusChange(id, 'approved')
│   │       ├── [Reject]  ← handleStatusChange(id, 'rejected')
│   │       └── [Delete]
│   └── Pagination
│
└── AdminListingDetail (Detail View)
    ├── Property Full Info
    ├── Image Gallery
    ├── Owner Info
    ├── Status Section
    │   ├── Current Status
    │   ├── [Change to Approved]
    │   ├── [Change to Rejected]
    │   └── Rejection Reason Input
    │
    ├── Facebook Integration
    │   └── [Post to Facebook]
    │
    └── Activity Log
        └── Recent admin actions on this property
```

---

## 📈 Performance & Timing

```
Typical Approve Flow Timing:

┌─────────────────────────────────────┬──────────┐
│ Operation                            │   Time   │
├─────────────────────────────────────┼──────────┤
│ 1. Button click → Step A             │   1ms    │
│ 2. Get user auth                     │  10ms    │
│ 3. Prepare update data → Step B      │   1ms    │
│ 4. HTTP POST to Supabase             │  50-200ms│
│ 5. JWT verification                  │   5ms    │
│ 6. RLS policy check                  │  10ms    │
│ 7. Trigger execution                 │   5ms    │
│ 8. Database UPDATE                   │  20ms    │
│ 9. Response → Step C                 │  50ms    │
│ 10. Verification query → Step D      │  50ms    │
│ 11. Audit log insert                 │  30ms    │
│ 12. Facebook webhook                 │  500ms   │
│ 13. Refresh property list            │  100ms   │
├─────────────────────────────────────┼──────────┤
│ TOTAL (without Facebook)             │  ~350ms  │
│ TOTAL (with Facebook)                │  ~850ms  │
└─────────────────────────────────────┴──────────┘

Performance Tips:
• Facebook webhook runs async (doesn't block UI)
• Audit log insert is fire-and-forget
• Property list refresh can be optimistic (update local state)
```

---

## 🐛 Common Failure Points

```
Where things can go wrong:

❌ Point 1: User not logged in
   └─ Symptom: No JWT token in request
   └─ Error: 401 Unauthorized
   └─ Fix: Re-login

❌ Point 2: User not in admins table
   └─ Symptom: RLS blocks UPDATE
   └─ Error: 403 Permission Denied (42501)
   └─ Fix: Add user to admins table

❌ Point 3: Trigger reverts status
   └─ Symptom: Update succeeds but status unchanged
   └─ Error: Silent fail (no error in Step C)
   └─ Fix: Add user to admins table

❌ Point 4: JWT expired
   └─ Symptom: All requests fail
   └─ Error: 401 JWT invalid
   └─ Fix: Re-login to refresh token

❌ Point 5: Property doesn't exist
   └─ Symptom: No rows updated
   └─ Error: 406 Not Acceptable
   └─ Fix: Check property ID

❌ Point 6: Invalid status value
   └─ Symptom: Constraint violation
   └─ Error: 23514 Check constraint
   └─ Fix: Use valid status value

Success Rate by Layer:
• Layer 1 (UI): 95% (if admin check works)
• Layer 2 (RLS): 100% (if user is admin)
• Layer 3 (Trigger): 100% (if user is admin)
```

---

## 📋 Checklist for Adding New Admin

```
1. Get User UUID
   └─ SQL: SELECT id FROM auth.users WHERE email = '...';

2. Insert into admins table
   └─ SQL: INSERT INTO public.admins (user_id) VALUES ('uuid');

3. Verify insertion
   └─ SQL: SELECT * FROM public.admins WHERE user_id = 'uuid';

4. Test from client
   └─ JS: const { data } = await supabase.from('admins')
                                        .select('*')
                                        .eq('user_id', user.id);

5. Test approve flow
   └─ Click Approve, check console Steps A-D

6. Verify in database
   └─ SQL: SELECT status, approved_by FROM properties WHERE ...;

✅ Complete when all steps pass
```

---

**Visual Architecture Complete**
