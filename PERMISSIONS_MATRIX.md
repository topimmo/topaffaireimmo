# Permissions Matrix - TopAffaireImmo

## User Roles

| Role | Description | Database Mapping |
|------|-------------|------------------|
| **user** | Property owner (regular user) | `user_role: real_estate_advertiser` + `advertiser_type: owner` |
| **agent** | Real estate broker/agent | `user_role: real_estate_advertiser` + `advertiser_type: broker` |
| **merchant** | Agency or commercial advertiser | `user_role: real_estate_advertiser` + `advertiser_type: agency` OR `user_role: commercial_advertiser` |
| **admin** | System administrator | Entry in `admins` table |

## Route Permissions

### Legend
- ✅ = Full access
- 🔒 = No access (redirected)
- 🌐 = Public (no auth required)

| Route | user | agent | merchant | admin | Public |
|-------|------|-------|----------|-------|--------|
| **Authentication** |
| `/login` | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| `/register` | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| `/reset-password` | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| `/auth/callback` | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| **Public Pages** |
| `/` (homepage) | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| `/search` | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| `/property/:id` | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| `/services` | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| `/services/:slug` | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| `/about` | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| `/contact` | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| `/privacy` | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| `/terms` | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| `/agencies` | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| `/advertise` | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| `/guides` | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| `/guides/:slug` | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| **SEO Pages** |
| `/immobilier/*` | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| `/:city` | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| `/:city/*` | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| **Dashboards** |
| `/dashboard` | ✅ (stays) | ✅ (→/agent) | ✅ (→/merchant) | ✅ (→/admin) | 🔒 |
| `/agent` | 🔒 | ✅ | 🔒 | ✅ | 🔒 |
| `/merchant` | 🔒 | 🔒 | ✅ | ✅ | 🔒 |
| `/commercial-dashboard` | 🔒 | 🔒 | ✅ | ✅ | 🔒 |
| **Property Management** |
| `/add-listing` | 🔒 | ✅ | ✅ | ✅ | 🔒 |
| `/edit-listing/:id` | 🔒 | ✅ | ✅ | ✅ | 🔒 |
| **Advertising** |
| `/advertising` | 🔒 | 🔒 | ✅ | ✅ | 🔒 |
| `/advertising/new` | 🔒 | 🔒 | ✅ | ✅ | 🔒 |
| **Admin** |
| `/admin` | 🔒 | 🔒 | 🔒 | ✅ | 🔒 |
| `/admin/*` | 🔒 | 🔒 | 🔒 | ✅ | 🔒 |

## Feature Permissions

| Feature | user | agent | merchant | admin |
|---------|------|-------|----------|-------|
| **Properties** |
| View own properties | ✅ | ✅ | ✅ | ✅ |
| View all properties | 🔒 | 🔒 | 🔒 | ✅ |
| Create property listing | 🔒 | ✅ | ✅ | ✅ |
| Edit own property | 🔒 | ✅ | ✅ | ✅ |
| Edit any property | 🔒 | 🔒 | 🔒 | ✅ |
| Delete own property | 🔒 | ✅ | ✅ | ✅ |
| Delete any property | 🔒 | 🔒 | 🔒 | ✅ |
| Approve/reject property | 🔒 | 🔒 | 🔒 | ✅ |
| **Advertising** |
| View own ad campaigns | 🔒 | 🔒 | ✅ | ✅ |
| View all ad campaigns | 🔒 | 🔒 | 🔒 | ✅ |
| Create ad campaign | 🔒 | 🔒 | ✅ | ✅ |
| Edit own ad campaign | 🔒 | 🔒 | ✅ | ✅ |
| Approve/reject ads | 🔒 | 🔒 | 🔒 | ✅ |
| **Users** |
| View own profile | ✅ | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ | ✅ |
| View all users | 🔒 | 🔒 | 🔒 | ✅ |
| Edit user roles | 🔒 | 🔒 | 🔒 | ✅ |
| Delete users | 🔒 | 🔒 | 🔒 | ✅ |
| **Services** |
| View services | ✅ | ✅ | ✅ | ✅ |
| Request quote | ✅ | ✅ | ✅ | ✅ |
| Manage service categories | 🔒 | 🔒 | 🔒 | ✅ |
| **System** |
| View diagnostics | 🔒 | 🔒 | 🔒 | ✅ |
| Manage settings | 🔒 | 🔒 | 🔒 | ✅ |
| Manage locations | 🔒 | 🔒 | 🔒 | ✅ |
| Manage agencies | 🔒 | 🔒 | 🔒 | ✅ |
| Manage CMS content | 🔒 | 🔒 | 🔒 | ✅ |
| Manage promo banners | 🔒 | 🔒 | 🔒 | ✅ |

## Mobile FAB Visibility

| Context | user | agent | merchant | admin |
|---------|------|-------|----------|-------|
| `/dashboard` | Hidden | Visible | Visible | Hidden |
| `/agent` | N/A | Visible | N/A | Visible |
| `/merchant` | N/A | N/A | Visible | Visible |
| `/services/*` | Hidden | Hidden | Hidden | Hidden |
| Public pages | Hidden | Hidden | Hidden | Hidden |
| Property pages | Hidden | Hidden | Hidden | Hidden |

**FAB Action:** Always links to `/add-listing`

## Redirect Behavior

### When Accessing Restricted Route

| User Role | Redirected To |
|-----------|---------------|
| user | `/dashboard` |
| agent | `/agent` |
| merchant | `/merchant` |
| admin | `/admin` |
| Not authenticated | `/login` |

### Smart Dashboard Redirect

When accessing `/dashboard`:

| User Role | Redirected To |
|-----------|---------------|
| user | Stays on `/dashboard` |
| agent | `/agent` |
| merchant | `/merchant` |
| admin | `/admin` |

## Database Permissions (RLS)

These are Supabase Row Level Security policies - not affected by this update:

| Table | user | agent | merchant | admin |
|-------|------|-------|----------|-------|
| `properties` | Read own | Read/Write own | Read/Write own | Read/Write all |
| `profiles` | Read/Write own | Read/Write own | Read/Write own | Read/Write all |
| `admins` | Read only | Read only | Read only | Read/Write |
| `service_categories` | Read active | Read active | Read active | Read/Write all |
| `cities` | Read all | Read all | Read all | Read/Write all |
| `neighborhoods` | Read all | Read all | Read all | Read/Write all |

## API Endpoints

| Endpoint | user | agent | merchant | admin |
|----------|------|-------|----------|-------|
| GET `/api/properties` | Public | Public | Public | Public |
| POST `/api/properties` | 🔒 | ✅ | ✅ | ✅ |
| PATCH `/api/properties/:id` | 🔒 | ✅ (own) | ✅ (own) | ✅ (all) |
| DELETE `/api/properties/:id` | 🔒 | ✅ (own) | ✅ (own) | ✅ (all) |
| GET `/api/users` | 🔒 | 🔒 | 🔒 | ✅ |
| GET `/api/users/:id` | ✅ (self) | ✅ (self) | ✅ (self) | ✅ (all) |

## Permission Enforcement Points

1. **Frontend (React Router):**
   - `ProtectedRoute` component checks auth and role
   - Redirects if unauthorized

2. **Backend (Supabase RLS):**
   - Row Level Security policies enforce data access
   - Even if frontend bypassed, backend prevents unauthorized actions

3. **API Layer:**
   - Server-side validation of user role
   - Additional business logic checks

## Testing Checklist

- [ ] User cannot access agent/merchant routes
- [ ] Agent can access property management
- [ ] Merchant can access advertising
- [ ] Admin can access everything
- [ ] Correct redirects on dashboard
- [ ] FAB shows only where appropriate
- [ ] RLS policies work as expected
