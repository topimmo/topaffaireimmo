# Old to New Pages Mapping

## Overview
This document maps legacy pages and routes to their new implementations after the UX/role-based routing improvements.

## Dashboard Routes

### Before
- `/dashboard` - Generic dashboard for all users, no role differentiation
- `/agent` - Same Dashboard component, different route
- `/merchant` - CommercialDashboard component
- `/commercial-dashboard` - Alias for merchant dashboard

### After
- `/dashboard` - **Smart redirect** based on user role:
  - Users (owners) → stays on `/dashboard` (Dashboard.tsx)
  - Agents (brokers) → redirects to `/agent` (Dashboard.tsx)
  - Merchants (agencies/commercial) → redirects to `/merchant` (CommercialDashboard.tsx)
  - Admins → redirects to `/admin` (AdminDashboard)

### What Changed
- `/dashboard` is now intelligent - it determines the user's role and redirects appropriately
- Component: Added `SmartDashboardRedirect` component
- **No breaking changes** - all routes still work, just smarter routing logic

## Property Management Routes

### Before
```
/add-listing      → Accessible by all authenticated users (not enforced)
/edit-listing/:id → Accessible by all authenticated users (not enforced)
```

### After
```
/add-listing      → Restricted to agent, merchant, admin roles (enforced)
/edit-listing/:id → Restricted to agent, merchant, admin roles (enforced)
```

### What Changed
- `ProtectedRoute` now **enforces** the `allowedRoles` parameter
- Regular users (owners) are redirected to their dashboard if they try to access
- **No UI changes** - same components, just proper access control

## Services Routes

### Before
- `/services` - List of service categories
- `/services/:slug` - Service category detail page with message "Les prestataires seront bientôt disponibles"

### After
- `/services` - **No change** - same listing page
- `/services/:slug` - **Enhanced UX** with:
  - Prominent "Service en cours d'ouverture" message
  - **New:** "Demander un devis" CTA button
  - **New:** "Êtes-vous prestataire? Rejoignez-nous" CTA button
  - Better visual hierarchy with blue background box
  - Same "Services similaires" section

### What Changed
- Better empty state UX with actionable CTAs
- Links to `/contact` page for quote requests and provider registration
- **No breaking changes** - same routes, enhanced UI

## Admin Routes

### Before and After - **No Changes**
All admin routes remain the same:
```
/admin                      → Admin dashboard
/admin/listings             → Property management
/admin/users                → User management
/admin/agencies             → Agency management
/admin/locations            → Location management
/admin/settings             → Settings
/admin/diagnostics          → System diagnostics
/admin/content/*            → CMS management
/admin/promo-banners        → Promo banners
/admin/dummy-properties     → Dummy properties
```

## Mobile FAB (Floating Action Button)

### Before
- Shown on all pages except `/add-listing`
- Always links to `/add-listing`

### After
- **Shown only on:** `/dashboard`, `/agent`, `/merchant`
- **Hidden for:** Regular users (only visible for agents/merchants)
- **Hidden on:** `/services/*`, public pages, property pages
- Still links to `/add-listing`

### What Changed
- Context-aware display logic
- Role-based visibility
- Better UX - doesn't appear where not relevant

## Authentication Routes

### No Changes
All authentication routes remain public and unchanged:
```
/login          → Login page
/register       → Registration page
/reset-password → Password reset (must stay public)
/auth/callback  → OAuth callback (must stay public)
```

## SEO and Public Routes

### No Changes
All public routes remain unchanged:
```
/                           → Homepage
/search                     → Property search
/property/:id               → Property details
/about                      → About page
/contact                    → Contact page
/privacy                    → Privacy policy
/terms                      → Terms of service
/agencies                   → Agencies listing
/advertise                  → Advertise with us
/guides                     → Guides listing
/guides/:slug               → Guide detail
/immobilier/*               → SEO landing pages
/:city                      → City landing pages
/:city/vente                → Transaction pages
/:city/appartements         → Property type pages
```

## Removed/Deprecated Routes

**None** - All existing routes are preserved for backward compatibility.

## New Routes

**None** - No new routes added. Existing routes enhanced with smarter logic.

## Component Mapping

| Route | Old Component | New Component | Changes |
|-------|---------------|---------------|---------|
| /dashboard | Dashboard.tsx | Dashboard.tsx + SmartDashboardRedirect | Added smart redirect |
| /agent | Dashboard.tsx | Dashboard.tsx | No change |
| /merchant | CommercialDashboard.tsx | CommercialDashboard.tsx | No change |
| /add-listing | AddListing.tsx | AddListing.tsx | Role enforcement added |
| /edit-listing/:id | EditListing.tsx | EditListing.tsx | Role enforcement added |
| /services/:slug | ServiceCategoryPage.tsx | ServiceCategoryPage.tsx | Enhanced empty state |

## Protected Route Changes

| Route | Old Behavior | New Behavior |
|-------|-------------|--------------|
| Any protected route | allowedRoles parameter ignored | allowedRoles parameter **enforced** |
| Wrong role access | User can still access | User **redirected** to their dashboard |

## Migration Notes

### For Users
- **No action required** - all existing URLs work
- Better experience with role-appropriate dashboards
- Clearer error messages if accessing wrong areas

### For Developers
- `ProtectedRoute` now enforces roles - update `allowedRoles` arrays if needed
- Test role-based access after deploying
- Check that redirects work correctly for all user types

### For Admins
- No database changes required
- Existing user roles and advertiser types work as-is
- Admin access still controlled via `admins` table

## Breaking Changes

**NONE** - This is a non-breaking update. All routes, components, and functionality remain backward compatible.

## Summary

This update improves UX and role enforcement **without breaking existing functionality**:

✅ Smarter dashboard routing based on user role
✅ Proper role enforcement on protected routes  
✅ Better services page UX with actionable CTAs
✅ Context-aware Mobile FAB
✅ All existing routes preserved
✅ All existing components reused
✅ Zero database schema changes
