# QA Testing Checklist - TopAffaireImmo UX Improvements

## Pre-Testing Setup

- [ ] Build passes: `npm run build`
- [ ] TypeScript passes: `npm run typecheck`
- [ ] No console errors in dev mode
- [ ] Test database has users with all role types

## Test Users Setup

Create/verify test accounts for each role:

- [ ] **User (Owner):**
  - Email: `owner@test.com`
  - DB: `user_role: real_estate_advertiser`, `advertiser_type: owner`

- [ ] **Agent (Broker):**
  - Email: `agent@test.com`
  - DB: `user_role: real_estate_advertiser`, `advertiser_type: broker`

- [ ] **Merchant (Agency):**
  - Email: `agency@test.com`
  - DB: `user_role: real_estate_advertiser`, `advertiser_type: agency`

- [ ] **Merchant (Commercial):**
  - Email: `commercial@test.com`
  - DB: `user_role: commercial_advertiser`

- [ ] **Admin:**
  - Email: `admin@test.com`
  - DB: Entry in `admins` table

## 1. Role Enforcement Testing

### As User (Owner)

- [ ] **Login:** Can log in successfully
- [ ] **Dashboard Access:**
  - [ ] Can access `/dashboard`
  - [ ] Dashboard shows own properties (if any)
  - [ ] "Add Listing" button is NOT visible (or leads to access denied)
- [ ] **Restricted Access:**
  - [ ] `/agent` → Redirects to `/dashboard`
  - [ ] `/merchant` → Redirects to `/dashboard`
  - [ ] `/add-listing` → Redirects to `/dashboard`
  - [ ] `/edit-listing/[any-id]` → Redirects to `/dashboard`
  - [ ] `/advertising` → Redirects to `/dashboard`
  - [ ] `/admin` → Redirects to `/dashboard`
- [ ] **Mobile FAB:**
  - [ ] FAB NOT visible on `/dashboard`
  - [ ] FAB NOT visible on public pages

### As Agent (Broker)

- [ ] **Login:** Can log in successfully
- [ ] **Dashboard Redirect:**
  - [ ] `/dashboard` → Redirects to `/agent`
- [ ] **Dashboard Access:**
  - [ ] Can access `/agent`
  - [ ] Dashboard shows own properties
  - [ ] Can see "Add Listing" button
- [ ] **Property Management:**
  - [ ] Can access `/add-listing`
  - [ ] Can create a new property listing
  - [ ] Can access `/edit-listing/:id` for own properties
  - [ ] Can edit own property
  - [ ] Can delete own property
- [ ] **Restricted Access:**
  - [ ] `/merchant` → Redirects to `/agent`
  - [ ] `/advertising` → Redirects to `/agent`
  - [ ] `/admin` → Redirects to `/agent`
- [ ] **Mobile FAB:**
  - [ ] FAB IS visible on `/agent` dashboard
  - [ ] FAB links to `/add-listing`
  - [ ] FAB NOT visible on public pages

### As Merchant (Agency or Commercial)

- [ ] **Login:** Can log in successfully
- [ ] **Dashboard Redirect:**
  - [ ] `/dashboard` → Redirects to `/merchant`
- [ ] **Dashboard Access:**
  - [ ] Can access `/merchant`
  - [ ] Shows appropriate dashboard (Commercial or Properties)
  - [ ] Can see "Add Listing" or "New Campaign" button
- [ ] **Property Management (if Real Estate Merchant):**
  - [ ] Can access `/add-listing`
  - [ ] Can create property listing
  - [ ] Can edit/delete own properties
- [ ] **Advertising Management (if Commercial Merchant):**
  - [ ] Can access `/advertising`
  - [ ] Can see ad campaigns
  - [ ] Can access `/advertising/new`
  - [ ] Can create new ad request
- [ ] **Restricted Access:**
  - [ ] `/agent` → Redirects to `/merchant`
  - [ ] `/admin` → Redirects to `/merchant`
- [ ] **Mobile FAB:**
  - [ ] FAB IS visible on `/merchant` dashboard
  - [ ] FAB links to `/add-listing` (or appropriate action)
  - [ ] FAB NOT visible on public pages

### As Admin

- [ ] **Login:** Can log in successfully
- [ ] **Dashboard Redirect:**
  - [ ] `/dashboard` → Redirects to `/admin`
- [ ] **Dashboard Access:**
  - [ ] Can access `/admin`
  - [ ] Can access all `/admin/*` routes
- [ ] **Full Access:**
  - [ ] Can access `/agent`
  - [ ] Can access `/merchant`
  - [ ] Can access `/add-listing`
  - [ ] Can access `/advertising`
- [ ] **Admin Features:**
  - [ ] Can view all properties in `/admin/listings`
  - [ ] Can manage users in `/admin/users`
  - [ ] Can access diagnostics in `/admin/diagnostics`

## 2. Services Page Testing

### Empty Category UX

- [ ] **Navigate to any service category:** `/services/[slug]`
- [ ] **Visual Check:**
  - [ ] Page loads without errors
  - [ ] Category name and description display correctly
  - [ ] Blue box with "Service en cours d'ouverture" message visible
- [ ] **CTAs Present:**
  - [ ] "Demander un devis" button visible and styled
  - [ ] "Êtes-vous prestataire? Rejoignez-nous" button visible
  - [ ] Both buttons link to `/contact` (or appropriate page)
  - [ ] Buttons are clickable and navigate correctly
- [ ] **Similar Services:**
  - [ ] "Services similaires" section displays
  - [ ] Shows 4 related service categories
  - [ ] Each card has icon, name, and slug
  - [ ] Cards are clickable and navigate to other categories
- [ ] **Back Link:**
  - [ ] "Revenir aux services" link works
  - [ ] Links back to `/services`

### French/Arabic Toggle

- [ ] Switch to Arabic (`ar`)
  - [ ] All text translates to Arabic
  - [ ] RTL layout applies correctly
  - [ ] CTAs are in Arabic
- [ ] Switch back to French (`fr`)
  - [ ] Text reverts to French
  - [ ] LTR layout applies

## 3. Mobile FAB Testing

### Context Awareness

- [ ] **On `/dashboard` (as user):**
  - [ ] FAB is NOT visible
  
- [ ] **On `/agent` (as agent):**
  - [ ] FAB IS visible
  - [ ] FAB displays on mobile viewport only
  - [ ] FAB positioned correctly (bottom-right for LTR, bottom-left for RTL)
  - [ ] FAB does not overlap footer
  - [ ] Clicking FAB navigates to `/add-listing`
  
- [ ] **On `/merchant` (as merchant):**
  - [ ] FAB IS visible
  - [ ] Same positioning and behavior as agent

- [ ] **On Public Pages:**
  - [ ] Navigate to `/` (homepage)
  - [ ] FAB is NOT visible
  - [ ] Navigate to `/search`
  - [ ] FAB is NOT visible
  - [ ] Navigate to `/services/plomberie`
  - [ ] FAB is NOT visible

### Mobile Viewport

- [ ] Open DevTools and set mobile viewport (e.g., iPhone 12)
- [ ] Verify FAB is visible on allowed pages
- [ ] Verify FAB is hidden on tablet/desktop viewports (md breakpoint)

## 4. Smart Dashboard Redirect Testing

### Redirect Logic

- [ ] **As user:** Navigate to `/dashboard` → Stays on `/dashboard`
- [ ] **As agent:** Navigate to `/dashboard` → Redirects to `/agent`
- [ ] **As merchant:** Navigate to `/dashboard` → Redirects to `/merchant`
- [ ] **As admin:** Navigate to `/dashboard` → Redirects to `/admin`

### No Infinite Loops

- [ ] **As each role:** Ensure no redirect loops occur
- [ ] Check browser console for errors during redirects
- [ ] Verify SmartDashboardRedirect component loads only once

## 5. SEO and Public Routes

### Ensure No Breaking Changes

- [ ] **Homepage:** Navigate to `/` → Loads correctly
- [ ] **Search:** Navigate to `/search` → Works as before
- [ ] **Property Details:** Navigate to `/property/[valid-id]` → Displays property
- [ ] **Services:** Navigate to `/services` → Lists all categories
- [ ] **City Pages:** Navigate to `/casablanca` → Shows city landing page
- [ ] **Guides:** Navigate to `/guides` → Lists guides

### Sitemap Integrity

- [ ] Run `npm run generate:sitemaps`
- [ ] Verify `public/sitemap.xml` generates without errors
- [ ] Check that all public routes are included

## 6. Build and TypeScript

### Build Process

- [ ] Run `npm run build`
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No build warnings (or only acceptable warnings)

### TypeScript Check

- [ ] Run `npm run typecheck`
- [ ] Output shows: `0 errors`

## 7. Accessibility

### Keyboard Navigation

- [ ] Tab through dashboard navigation
- [ ] FAB is focusable with keyboard
- [ ] Enter key activates FAB
- [ ] Service CTAs are keyboard accessible

### Screen Reader

- [ ] FAB has proper `aria-label`
- [ ] Headings have proper hierarchy
- [ ] Buttons have descriptive text

## 8. Browser Compatibility

Test in multiple browsers:

- [ ] **Chrome/Edge (Chromium)**
  - [ ] All features work
  - [ ] No console errors
  
- [ ] **Firefox**
  - [ ] All features work
  - [ ] No console errors
  
- [ ] **Safari (if available)**
  - [ ] All features work
  - [ ] No console errors

## 9. Responsive Design

### Desktop (1920x1080)

- [ ] Dashboard layouts look correct
- [ ] Services page renders properly
- [ ] FAB is hidden (md:hidden works)

### Tablet (768x1024)

- [ ] Dashboards are responsive
- [ ] Services page is readable
- [ ] FAB may or may not show (check breakpoint)

### Mobile (375x667)

- [ ] Dashboards are mobile-friendly
- [ ] Services page scrolls well
- [ ] FAB shows where expected
- [ ] FAB doesn't overlap footer
- [ ] Safe area insets work on iOS

## 10. Edge Cases

### No Role/Profile

- [ ] Create user with no profile entry
- [ ] Login and check redirect behavior
- [ ] Should default to user role

### Multiple Roles

- [ ] User is both in profiles and admins table
- [ ] Should be treated as admin

### Session Timeout

- [ ] Let session expire
- [ ] Try accessing protected route
- [ ] Should redirect to `/login`

## 11. Performance

- [ ] Dashboard loads in < 2 seconds
- [ ] Services page loads in < 2 seconds
- [ ] No unnecessary re-renders
- [ ] Role checks don't slow down app

## 12. Data Integrity

- [ ] No data loss during role checks
- [ ] Properties still belong to correct owners
- [ ] Ad campaigns still accessible by merchants
- [ ] No database mutations from frontend changes

## Issues Found

Document any issues discovered during testing:

| Test # | Issue Description | Severity | Status |
|--------|-------------------|----------|--------|
| | | | |

## Sign-off

- [ ] All critical tests pass
- [ ] No P0/P1 bugs found
- [ ] Minor issues documented
- [ ] Ready for production deployment

**Tested by:** _______________  
**Date:** _______________  
**Build Version:** _______________  
**Notes:**
