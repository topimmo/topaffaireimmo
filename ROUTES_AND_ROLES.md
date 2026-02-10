# Routes and Roles - TopAffaireImmo

## Overview
This document describes how roles are enforced and how dashboard routing works in TopAffaireImmo.

## Role System

### Database Roles (profiles.user_role)
The `profiles` table contains a `user_role` field with these values:
- `admin` - System administrators (deprecated for access control)
- `real_estate_advertiser` - Property advertisers (owners, brokers, agencies)
- `commercial_advertiser` - Commercial/banner advertisers

### Application Roles
The application uses these simplified roles:
- `user` - Regular property owners
- `agent` - Real estate brokers/agents
- `merchant` - Agencies and commercial advertisers
- `admin` - System administrators

### Role Mapping Logic

#### From Database to Application

**Admin Access:**
- Checked via `admins` table (user ID must exist in this table)
- App role: `admin`

**Real Estate Advertisers:**
- `user_role: real_estate_advertiser` + `advertiser_type: owner` → `user`
- `user_role: real_estate_advertiser` + `advertiser_type: broker` → `agent`
- `user_role: real_estate_advertiser` + `advertiser_type: agency` → `merchant`

**Commercial Advertisers:**
- `user_role: commercial_advertiser` → `merchant`

**Default:**
- If no role found → `user`

## Role Enforcement

### ProtectedRoute Component
Location: `src/components/ProtectedRoute.tsx`

**How it works:**
1. Checks if user is authenticated
2. Fetches user's role from database
3. Compares against `allowedRoles` prop
4. If role matches → renders children
5. If role doesn't match → redirects to appropriate dashboard

**Redirect Logic:**
- Admin → `/admin`
- Merchant → `/merchant`
- Agent → `/agent`
- User → `/dashboard`
- Not authenticated → `/login`

## Dashboard Routing

### Smart Dashboard Redirect
Location: `src/components/SmartDashboardRedirect.tsx`

When a user visits `/dashboard`, they are redirected based on their role:

| User Role | Redirected To | Component |
|-----------|---------------|-----------|
| user | /dashboard (stays) | Dashboard.tsx |
| agent | /agent | Dashboard.tsx |
| merchant | /merchant | CommercialDashboard.tsx |
| admin | /admin | AdminDashboard |

### Legacy Routes
These routes are kept for backward compatibility:
- `/agent` - Works for agents
- `/merchant` - Works for merchants
- `/commercial-dashboard` - Redirects to `/merchant`

## Route Permission Matrix

### Public Routes (No Authentication Required)
- `/` - Homepage
- `/search` - Property search
- `/property/:id` - Property details
- `/services` - Services listing
- `/services/:slug` - Service category pages
- `/login`, `/register` - Authentication pages
- `/about`, `/contact`, `/privacy`, `/terms` - Information pages
- All SEO landing pages (cities, neighborhoods, etc.)

### Protected Routes (Authentication Required)

| Route | Allowed Roles | Purpose |
|-------|---------------|---------|
| `/dashboard` | Any authenticated | Smart redirect to role-specific dashboard |
| `/agent` | agent, admin | Agent dashboard |
| `/merchant` | merchant, admin | Merchant dashboard |
| `/add-listing` | agent, merchant, admin | Create property listing |
| `/edit-listing/:id` | agent, merchant, admin | Edit property listing |
| `/advertising` | merchant, admin | Commercial advertising management |
| `/advertising/new` | merchant, admin | New ad request |

### Admin Routes (Requires `admins` table entry)

| Route | Purpose |
|-------|---------|
| `/admin` | Admin dashboard |
| `/admin/listings` | Property management |
| `/admin/users` | User management |
| `/admin/agencies` | Agency management |
| `/admin/locations` | Location management |
| `/admin/settings` | Site settings |
| `/admin/diagnostics` | System diagnostics |
| `/admin/content/*` | CMS pages |
| `/admin/promo-banners` | Promo banner management |
| `/admin/dummy-properties` | Dummy property management |

## Implementation Notes

### Zero Breaking Changes
- All existing routes continue to work
- Legacy role parameters in ProtectedRoute are now enforced
- Existing Dashboard and CommercialDashboard components are reused
- No new authentication system - uses existing Supabase auth

### Role Detection Flow
```
1. User logs in → Supabase auth session created
2. ProtectedRoute component loads
3. Checks admins table for admin access
4. If not admin, fetches profile.user_role and advertiser_type
5. Maps to app role (user/agent/merchant)
6. Compares with allowedRoles prop
7. Either renders content or redirects
```

### Dashboard Redirect Flow
```
1. User visits /dashboard
2. SmartDashboardRedirect component loads
3. Determines user's role
4. If user → stays on /dashboard
5. If agent/merchant/admin → redirects to their dashboard
6. Dashboard.tsx or CommercialDashboard.tsx renders
```

## Testing

### Manual Testing Checklist
1. **As User (owner):**
   - ✓ Can access `/dashboard`
   - ✓ Cannot access `/agent`, `/merchant`
   - ✓ Cannot access `/add-listing`
   - ✓ Redirected to `/dashboard` from protected pages

2. **As Agent (broker):**
   - ✓ Can access `/agent`
   - ✓ Can access `/add-listing`, `/edit-listing`
   - ✓ Cannot access `/merchant`, `/advertising`
   - ✓ Redirected to `/agent` from `/dashboard`

3. **As Merchant (agency or commercial):**
   - ✓ Can access `/merchant`
   - ✓ Can access `/add-listing`, `/advertising`
   - ✓ Cannot access `/agent`
   - ✓ Redirected to `/merchant` from `/dashboard`

4. **As Admin:**
   - ✓ Can access all routes
   - ✓ Redirected to `/admin` from `/dashboard`

## Troubleshooting

### User sees "Access Denied"
- Check if user has correct `user_role` in profiles table
- Check if `advertiser_type` is set correctly for real estate advertisers
- Verify user is in `admins` table if they should have admin access

### Infinite Redirects
- Ensure ProtectedRoute's allowedRoles includes the user's actual role
- Check that SmartDashboardRedirect is only used on `/dashboard` route

### Role Not Detected
- Verify profile exists in database for the user
- Check browser console for error messages
- Ensure Supabase RLS policies allow reading profiles table
