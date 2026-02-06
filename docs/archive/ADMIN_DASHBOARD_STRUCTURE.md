# Admin Dashboard Route Structure

```
/admin (Protected by AdminProtectedRoute)
│
├── / (AdminDashboard)
│   ├── Stats Cards
│   │   ├── Pending Listings
│   │   ├── Approved Listings
│   │   ├── Rejected Listings
│   │   ├── Total Listings
│   │   ├── Total Users
│   │   └── Total Agencies
│   ├── Quick Actions
│   │   ├── Review Pending Listings
│   │   ├── All Listings
│   │   └── Manage Users
│   └── Recent Activity Log
│
├── /users (AdminUsers)
│   ├── Search Input (name, email, phone)
│   ├── Role Filter (all, user, agent, merchant, admin)
│   ├── Users Table
│   │   ├── Columns: Name, Email, Phone, Role, Advertiser Type, Agency, Status, Date
│   │   └── Badges: Active/Inactive, Verified
│   ├── Pagination (50/page)
│   ├── Export CSV
│   └── Summary Stats (Total, Active, Agents, Agencies)
│
├── /listings (AdminListings)
│   ├── Status Filter (all, pending, approved, rejected)
│   ├── Properties Table
│   │   ├── Columns: Image, Title, Owner, Advertiser, Phone, City, Neighborhood, Price, Status, Date
│   │   └── Actions: View, Approve, Reject, Delete
│   ├── Pagination (50/page)
│   └── Export CSV
│
├── /properties (ALIAS → AdminListings)
│   └── Same as /listings
│
├── /listings/:id (AdminListingDetail)
│   └── Detailed property view
│
├── /properties/:id (ALIAS → AdminListingDetail)
│   └── Same as /listings/:id
│
├── /agencies (AdminAgencies)
│   └── Agency management (existing)
│
├── /locations (AdminLocations)
│   └── Location management (existing)
│
├── /settings (AdminSettings)
│   └── Admin settings (existing)
│
├── /diagnostics (AdminDiagnostics)
│   └── System diagnostics (existing)
│
└── /content (AdminContent)
    ├── /pages (AdminContentPages)
    ├── /pages/:id (AdminContentPageEditor)
    └── /categories (AdminContentCategories)
```

## AdminLayout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                      │
│  ┌────────────┬─────────────────────────────┬──────────────┐│
│  │ Logo + App │                              │ Notifications││
│  │   Badge    │                              │  User Email  ││
│  │            │                              │    Logout    ││
│  └────────────┴─────────────────────────────┴──────────────┘│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┬──────────────────────────────────────────────┐│
│  │ Sidebar  │  Main Content Area                           ││
│  │          │                                               ││
│  │ • Dash   │  [Page Content Here]                         ││
│  │ • Lstngs │                                               ││
│  │ • Users  │                                               ││
│  │ • Agncs  │                                               ││
│  │ • Locns  │                                               ││
│  │ • Cntnt  │                                               ││
│  │ • Stngs  │                                               ││
│  │ • Diag   │                                               ││
│  │          │                                               ││
│  └──────────┴──────────────────────────────────────────────┘│
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  Mobile Bottom Navigation (< 768px)                          │
│  [ Dashboard ] [ Listings ] [ Users ] [ Agencies ]           │
└─────────────────────────────────────────────────────────────┘
```

## AdminProtectedRoute Flow

```
User requests /admin/*
      │
      ↓
┌─────────────────┐
│ Check Auth      │ ← useAuth()
│ Loading?        │
└────┬────────────┘
     │
     ↓ No user?
┌────────────────────┐
│ Redirect to /login │
└────────────────────┘
     │
     ↓ Has user
┌─────────────────┐
│ Check Admin     │ ← useAdmin() queries 'admins' table
│ Loading?        │
└────┬────────────┘
     │
     ↓ Not admin?
┌────────────────────┐
│ Redirect to /      │
└────────────────────┘
     │
     ↓ Is admin
┌────────────────────┐
│ Render Admin Page  │
└────────────────────┘
```

## Data Flow

```
AdminDashboard
     │
     ├──→ Supabase.from('properties').count() [by status]
     ├──→ Supabase.from('profiles').count()
     ├──→ Supabase.from('profiles').eq('advertiser_type', 'agency').count()
     └──→ Supabase.from('admin_audit_logs').select().order().limit(10)

AdminUsers
     │
     ├──→ Supabase.from('profiles').select('*').order().range()
     ├──→ Filter by role (client-side)
     ├──→ Search (client-side)
     └──→ Export CSV (client-side)

AdminListings (/admin/properties)
     │
     ├──→ Supabase.from('properties').select('*, city, neighborhood').order().range()
     ├──→ Supabase.from('profiles').select('id, full_name, phone, email').in('id', ownerIds)
     ├──→ Approve: Update status + Send Facebook webhook + Log audit
     ├──→ Reject: Update status + Log audit
     └──→ Delete: Remove storage images + Delete row + Log audit
```

## UI Components Used

- Card, CardContent, CardHeader, CardTitle (Dashboard stats)
- Table, TableBody, TableCell, TableHead, TableHeader, TableRow (Data tables)
- Button (Actions, navigation)
- Badge (Status indicators)
- Select, SelectContent, SelectItem, SelectTrigger, SelectValue (Filters)
- Input (Search)
- Loader2 (Loading states)
- Icons from lucide-react (Dashboard, Users, FileText, etc.)
- Toast from sonner (Notifications)

## Responsive Breakpoints

- **Mobile:** < 768px
  - Single column layouts
  - Collapsible sidebar (overlay)
  - Bottom navigation bar (4 quick links)
  - Simplified table views
  
- **Tablet:** 768px - 1024px
  - Two column layouts where appropriate
  - Fixed sidebar
  - Optimized table columns
  
- **Desktop:** > 1024px
  - Multi-column layouts
  - Full sidebar always visible
  - All table columns visible
  - Hover states and tooltips
