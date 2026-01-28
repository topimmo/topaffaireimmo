# System Architecture Diagram

## Admin/User Listing Management System

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │    Header    │      │  Dashboard   │      │  AddListing  │  │
│  │              │      │              │      │              │  │
│  │ • Shows      │      │ • Queries    │      │ • Creates    │  │
│  │   admin link │      │   own        │      │   listing    │  │
│  │   if admin   │      │   listings   │      │ • Upload     │  │
│  │              │      │              │      │   images     │  │
│  └──────┬───────┘      └──────┬───────┘      └──────┬───────┘  │
│         │                     │                     │           │
│         │ uses                │ uses                │ uses      │
│         ↓                     ↓                     ↓           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              useAdmin Hook & useAuth Hook                │  │
│  │  • Queries admins table                                  │  │
│  │  • Returns { isAdmin, loading, error }                   │  │
│  │  • Simple authentication check                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐                        │
│  │   Protected  │      │    Admin     │                        │
│  │    Route     │      │  Protected   │                        │
│  │              │      │    Route     │                        │
│  │ • Requires   │      │ • Requires   │                        │
│  │   auth only  │      │   admin      │                        │
│  └──────────────┘      └──────────────┘                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls (Supabase Client)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE BACKEND                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              ROW LEVEL SECURITY (RLS)                   │    │
│  │  Enforces ALL authorization - frontend checks removed  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    auth.users Table                       │  │
│  │  • User authentication                                    │  │
│  │  • Source of truth for user ID                           │  │
│  └───────┬──────────────────────────────────────────────────┘  │
│          │                                                       │
│          │ references                                            │
│          ↓                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               public.admins Table                         │  │
│  │  ┌────────────────────────────────────┐                  │  │
│  │  │ user_id (UUID, FK to auth.users)   │                  │  │
│  │  │ created_at (timestamp)              │                  │  │
│  │  └────────────────────────────────────┘                  │  │
│  │  • Identifies admin users                                │  │
│  │  • Simple boolean: in table = admin                      │  │
│  │                                                            │  │
│  │  RLS Policies:                                            │  │
│  │  • SELECT: Only admins can view                          │  │
│  │  • INSERT: Only admins can add                           │  │
│  │  • DELETE: Only admins can remove                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │             public.properties Table                       │  │
│  │  ┌────────────────────────────────────┐                  │  │
│  │  │ id (UUID, PK)                       │                  │  │
│  │  │ owner_id (UUID, FK to auth.users)   │ ← defaults to   │  │
│  │  │ status (TEXT)                       │   auth.uid()    │  │
│  │  │ announcer_type (TEXT)               │                  │  │
│  │  │ title_fr, title_ar, etc.            │                  │  │
│  │  │ images (TEXT[])                     │                  │  │
│  │  └────────────────────────────────────┘                  │  │
│  │                                                            │  │
│  │  RLS Policies:                                            │  │
│  │  • SELECT:                                                │  │
│  │    - Users: own listings                                 │  │
│  │    - Admins: ALL listings                                │  │
│  │    - Public: approved listings only                      │  │
│  │  • INSERT:                                                │  │
│  │    - Any authenticated user (owner_id = auth.uid())      │  │
│  │  • UPDATE:                                                │  │
│  │    - Users: own listings                                 │  │
│  │    - Admins: ALL listings                                │  │
│  │  • DELETE: Same as UPDATE                                │  │
│  │                                                            │  │
│  │  Trigger: protect_property_status                        │  │
│  │  • Prevents non-admins from changing status field        │  │
│  │  • Enforced at database level                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              storage.objects (property-images)            │  │
│  │  • Path: {user-id}/{listing-id}/{filename}               │  │
│  │                                                            │  │
│  │  RLS Policies:                                            │  │
│  │  • INSERT: User uploads to own folder                    │  │
│  │  • SELECT:                                                │  │
│  │    - Users: own images                                   │  │
│  │    - Admins: all images                                  │  │
│  │    - Public: all images (for display)                    │  │
│  │  • DELETE:                                                │  │
│  │    - Users: own images                                   │  │
│  │    - Admins: all images                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                        USER FLOWS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  NORMAL USER:                                                   │
│  1. Sign up → auth.users entry created                         │
│  2. Login → Redirect to /                                       │
│  3. Create listing → owner_id = auth.uid(), status = 'pending' │
│  4. View dashboard → See ONLY own listings (RLS enforced)      │
│  5. Edit listing → Can edit content, NOT status (trigger)      │
│  6. Upload images → To {user-id}/ folder (RLS enforced)        │
│                                                                  │
│  ADMIN USER:                                                    │
│  1. Created in auth.users (normal signup)                       │
│  2. Added to admins table (via SQL by super admin)             │
│  3. Login → Redirect to /                                       │
│  4. Header shows "Administration" link (useAdmin hook)          │
│  5. Access /admin → See ALL listings (RLS allows)              │
│  6. Approve listing → Change status (trigger allows)            │
│  7. Can edit/delete any listing (RLS allows)                    │
│  8. Can view/delete any images (RLS allows)                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: Authentication (Supabase Auth)                        │
│  ─────────────────────────────────────────────────────           │
│  • Users must be logged in                                      │
│  • auth.uid() provides user identity                            │
│  • Frontend: ProtectedRoute checks auth                         │
│                                                                  │
│  Layer 2: Row Level Security (PostgreSQL)                       │
│  ─────────────────────────────────────────────────────           │
│  • ALL queries filtered by RLS policies                         │
│  • Cannot be bypassed from client                               │
│  • Enforced at database level                                   │
│                                                                  │
│  Layer 3: Database Triggers                                     │
│  ─────────────────────────────────────────────────────           │
│  • protect_property_status prevents status changes              │
│  • Runs BEFORE UPDATE                                           │
│  • Even admins must use proper flow                             │
│                                                                  │
│  Layer 4: Storage Policies                                      │
│  ─────────────────────────────────────────────────────           │
│  • Path-based access control                                    │
│  • Users isolated to own folders                                │
│  • Admins have full access                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                    DATA FLOW EXAMPLE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Creates Listing:                                          │
│                                                                  │
│  1. User fills form in AddListing component                     │
│  2. User uploads images                                          │
│     └─> Storage INSERT policy checks:                           │
│         • bucket = 'property-images'? ✓                         │
│         • auth.uid() != null? ✓                                 │
│         • folder = auth.uid()? ✓                                │
│     └─> Upload succeeds, returns URL                            │
│                                                                  │
│  3. Form submits to properties table                            │
│     └─> INSERT policy checks:                                   │
│         • auth.uid() != null? ✓                                 │
│         • owner_id = auth.uid()? ✓                              │
│     └─> Insert succeeds, returns listing                        │
│                                                                  │
│  4. User views dashboard                                        │
│     └─> SELECT policy checks:                                   │
│         • owner_id = auth.uid()? ✓                              │
│     └─> Returns ONLY user's listings                            │
│                                                                  │
│  Admin Approves Listing:                                        │
│                                                                  │
│  1. Admin views /admin/listings                                 │
│     └─> SELECT policy checks:                                   │
│         • auth.uid() IN (admins)? ✓                             │
│     └─> Returns ALL listings                                    │
│                                                                  │
│  2. Admin clicks "Approve"                                      │
│     └─> UPDATE policy checks:                                   │
│         • auth.uid() IN (admins)? ✓                             │
│     └─> protect_property_status trigger:                        │
│         • Changing status? Yes                                  │
│         • User is admin? ✓                                      │
│     └─> Update succeeds, status → 'approved'                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Principles

1. **RLS First**: All authorization enforced by database
2. **Simple Frontend**: Just checks authentication, not roles
3. **Admin via Table**: Admin status determined by admins table
4. **Secure by Default**: Can't bypass security from client
5. **Clear Separation**: Auth (who you are) vs Authorization (what you can do)

## Why This Architecture?

✅ **Security**: Server-side enforcement, can't be bypassed
✅ **Performance**: No extra profile queries, RLS is fast
✅ **Simplicity**: Frontend doesn't manage complex permissions
✅ **Maintainability**: Clear patterns, easy to understand
✅ **Flexibility**: Easy to add/remove admins without code changes
✅ **Scalability**: RLS handled by PostgreSQL, very efficient

---

For implementation details, see:
- `ADMIN_SYSTEM_GUIDE.md` - Complete system documentation
- `TESTING_GUIDE_ADMIN.md` - Testing procedures
- `IMPLEMENTATION_SUMMARY.md` - Overview and migration
