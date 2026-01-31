# Admin Dashboard UI Mockups

## 1. Admin Dashboard (/admin)

```
┌────────────────────────────────────────────────────────────────────┐
│ TopAffaireImmo [Admin]              user@email.com  🔔 [Logout]   │
├────────────────────────────────────────────────────────────────────┤
│ ┌──────────┬───────────────────────────────────────────────────┐  │
│ │ Dashboard│  Dashboard                                         │  │
│ │ Listings │  Overview of your platform                         │  │
│ │ Users    │                                                     │  │
│ │ Agencies │  ┌───────────┬───────────┬───────────┐            │  │
│ │ Locations│  │ ⏱️ Pending │ ✅ Approved│ 📄 Rejected│            │  │
│ │ Content  │  │ Listings  │ Listings  │ Listings   │            │  │
│ │ Settings │  │    24     │    156    │     8      │            │  │
│ │ Diagnost.│  └───────────┴───────────┴───────────┘            │  │
│ │          │  ┌───────────┬───────────┬───────────┐            │  │
│ │          │  │ 📄 Total  │ 👥 Users  │ 🏢 Agencies│            │  │
│ │          │  │ Listings  │           │            │            │  │
│ │          │  │    188    │    342    │     45     │            │  │
│ │          │  └───────────┴───────────┴───────────┘            │  │
│ │          │                                                     │  │
│ │          │  Quick Actions                                     │  │
│ │          │  ┌────────────────────────────────────────────┐   │  │
│ │          │  │ Review Pending Listings                     │   │  │
│ │          │  │ View and approve pending listings       [→] │   │  │
│ │          │  ├────────────────────────────────────────────┤   │  │
│ │          │  │ All Listings                                │   │  │
│ │          │  │ Manage all listings in the system       [→] │   │  │
│ │          │  ├────────────────────────────────────────────┤   │  │
│ │          │  │ Manage Users                                │   │  │
│ │          │  │ View and manage user accounts           [→] │   │  │
│ │          │  └────────────────────────────────────────────┘   │  │
│ │          │                                                     │  │
│ │          │  Recent Activity                                   │  │
│ │          │  ┌────────────────────────────────────────────┐   │  │
│ │          │  │ Approved Property - 2 min ago              │   │  │
│ │          │  │ Rejected Property - 15 min ago             │   │  │
│ │          │  │ Created User - 1 hour ago                  │   │  │
│ │          │  └────────────────────────────────────────────┘   │  │
│ └──────────┴───────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

## 2. User Management (/admin/users)

```
┌────────────────────────────────────────────────────────────────────┐
│ TopAffaireImmo [Admin]              user@email.com  🔔 [Logout]   │
├────────────────────────────────────────────────────────────────────┤
│ ┌──────────┬───────────────────────────────────────────────────┐  │
│ │ Dashboard│  User Management                       [Export CSV]│  │
│ │→Users    │  View and manage user accounts                     │  │
│ │ Listings │                                                     │  │
│ │ Agencies │  [🔍 Search by name, email, phone...] [Role: All▼]│  │
│ │ Locations│                                                     │  │
│ │ Content  │  ┌──────────────────────────────────────────────┐ │  │
│ │ Settings │  │Name      Email         Phone    Role  Advert.│ │  │
│ │ Diagnost.│  ├──────────────────────────────────────────────┤ │  │
│ │          │  │John Doe  john@ex.com  +212...  [User] [Owner]│ │  │
│ │          │  │          [Active] [Verified]                  │ │  │
│ │          │  ├──────────────────────────────────────────────┤ │  │
│ │          │  │Ahmed     ahmed@ex.com +212... [Agent] [Broker]│ │  │
│ │          │  │          [Active]                             │ │  │
│ │          │  ├──────────────────────────────────────────────┤ │  │
│ │          │  │Sara      sara@ex.com  +212... [Merchant]      │ │  │
│ │          │  │ Realty                        [Agency]        │ │  │
│ │          │  │          [Active] [Verified]                  │ │  │
│ │          │  └──────────────────────────────────────────────┘ │  │
│ │          │  Showing 1-50 of 342      [Previous] [Next]       │  │
│ │          │                                                     │  │
│ │          │  ┌───────────┬───────────┬───────────┬──────────┐ │  │
│ │          │  │Total Users│Active Users│ Agents   │ Agencies │ │  │
│ │          │  │    342    │    315     │   45     │    23    │ │  │
│ │          │  └───────────┴───────────┴───────────┴──────────┘ │  │
│ └──────────┴───────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

## 3. Property Management (/admin/properties or /admin/listings)

```
┌────────────────────────────────────────────────────────────────────┐
│ TopAffaireImmo [Admin]              user@email.com  🔔 [Logout]   │
├────────────────────────────────────────────────────────────────────┤
│ ┌──────────┬───────────────────────────────────────────────────┐  │
│ │ Dashboard│  Manage Listings                       [Export CSV]│  │
│ │ Users    │  Review and approve property listings              │  │
│ │→Listings │                                                     │  │
│ │ Agencies │                           [Status: Pending ▼]      │  │
│ │ Locations│                                                     │  │
│ │ Content  │  ┌──────────────────────────────────────────────┐ │  │
│ │ Settings │  │Img  Title      Owner   Type  City    Price   │ │  │
│ │ Diagnost.│  ├──────────────────────────────────────────────┤ │  │
│ │          │  │[🏠] Apartment  John   [Own]  Casa   500k DH  │ │  │
│ │          │  │     in Maarif        [Brk]           [Pend]  │ │  │
│ │          │  │                      +212...    [👁️][✅][❌]   │ │  │
│ │          │  ├──────────────────────────────────────────────┤ │  │
│ │          │  │[🏠] Villa in   Ahmed  [Agn]  Rabat  1.2M DH  │ │  │
│ │          │  │     Souissi          Sara R  [Pend]          │ │  │
│ │          │  │                      +212...    [👁️][✅][❌]   │ │  │
│ │          │  ├──────────────────────────────────────────────┤ │  │
│ │          │  │[🏠] Commercial Hassan [Own]  Tanger  800k DH │ │  │
│ │          │  │     Space            [Broker] [Pend]          │ │  │
│ │          │  │                      +212...    [👁️][✅][❌]   │ │  │
│ │          │  └──────────────────────────────────────────────┘ │  │
│ │          │  Showing 1-50 of 24       [Previous] [Next]       │  │
│ └──────────┴───────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

## 4. Mobile View (< 768px)

```
┌──────────────────────────────┐
│ TopAffaireImmo [Admin]   ☰  │
│           🔔 user@email.com  │
├──────────────────────────────┤
│                              │
│  Dashboard                   │
│  Overview of platform        │
│                              │
│  ┌──────────────────────┐   │
│  │ ⏱️ Pending Listings   │   │
│  │        24            │   │
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │ ✅ Approved Listings  │   │
│  │        156           │   │
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │ 👥 Total Users        │   │
│  │        342           │   │
│  └──────────────────────┘   │
│                              │
│  Quick Actions               │
│  ┌──────────────────────┐   │
│  │ Review Pending       │   │
│  │ Listings         [→] │   │
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │ All Listings     [→] │   │
│  └──────────────────────┘   │
│                              │
├──────────────────────────────┤
│ [📊] [📄] [👥] [🏢]          │
│ Dash  List Users Agenc       │
└──────────────────────────────┘
```

## 5. RTL (Arabic) Layout

```
┌────────────────────────────────────────────────────────────────────┐
│   [تسجيل الخروج] 🔔 user@email.com            [مدير] TopAffaireImmo│
├────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┬──────────┐  │
│  │  لوحة التحكم                                      │لوحة التحكم│  │
│  │  نظرة عامة على منصتك                             │الإعلانات │  │
│  │                                                    │المستخدمون│  │
│  │            ┌───────────┬───────────┬───────────┐  │الوكالات  │  │
│  │            │إعلانات    │إعلانات    │إعلانات    │  │المواقع   │  │
│  │            │مرفوضة     │معتمدة     │قيد الانتظار│  │المحتوى   │  │
│  │            │     8     │    156    │    24     │  │الإعدادات │  │
│  │            └───────────┴───────────┴───────────┘  │التشخيص   │  │
│  │            ┌───────────┬───────────┬───────────┐  │          │  │
│  │            │وكالات     │مستخدمون   │إجمالي     │  │          │  │
│  │            │           │           │الإعلانات  │  │          │  │
│  │            │    45     │    342    │    188    │  │          │  │
│  │            └───────────┴───────────┴───────────┘  │          │  │
│  └───────────────────────────────────────────────────┴──────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

## UI Features Highlighted

### Dashboard Stats Cards
- Color-coded backgrounds (yellow, green, red, blue, purple)
- Large numbers for quick scanning
- Icon indicators for each stat type
- Clickable cards that navigate to filtered views

### User Management Table
- Role badges (User: blue, Agent: purple, Merchant: orange, Admin: red)
- Status badges (Active: green, Inactive: gray, Verified: blue)
- Advertiser type badges (Owner, Broker, Agency)
- Search with debouncing
- Dropdown filters
- Responsive column hiding on mobile

### Property Listings Table
- Thumbnail images with fallback
- Status badges (Pending: yellow, Approved: green, Rejected: red)
- Action buttons (View, Approve, Reject, Delete)
- Loading states during actions
- Confirmation dialogs for destructive actions
- Facebook integration on approval

### Common UI Patterns
- Consistent spacing and padding
- Rounded corners on cards and buttons
- Shadow effects on hover
- Loading spinners during data fetch
- Toast notifications for user feedback
- Empty states when no data
- Pagination controls
- Export functionality

### Accessibility
- Semantic HTML (table, header, nav)
- ARIA labels on buttons
- Keyboard navigation
- Focus states
- Screen reader support
- Color contrast compliance
