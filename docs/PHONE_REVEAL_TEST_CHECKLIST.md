# Phone Reveal System - Manual Test Checklist

## Prerequisites
- [ ] Database migration `105_public_phone_reveal_system.sql` has been applied
- [ ] Edge Function `reveal-phone` has been deployed
- [ ] At least one published listing exists with a phone number
- [ ] Browser with developer tools (Chrome/Firefox recommended)

## Test Environment Setup
- [ ] Open application in incognito/private browsing mode (to simulate anonymous user)
- [ ] Open browser developer tools (F12)
- [ ] Navigate to Console tab (for error checking)
- [ ] Navigate to Network tab (for API monitoring)

---

## Test 1: Anonymous Visitor Can Reveal Phone

### Steps
1. [ ] Open a listing detail page as anonymous user (not logged in)
   - URL: `/property/{listing-id}`
2. [ ] Verify "Afficher le numéro" (Show Number) button is visible
3. [ ] Verify phone number is NOT visible in initial page load
4. [ ] Click the "Afficher le numéro" button
5. [ ] Wait for loading state
6. [ ] Verify phone number is displayed
7. [ ] Verify phone number has clickable `tel:` link
8. [ ] Click phone number link - should trigger phone dial

### Expected Results
- [ ] Button changes to loading state when clicked
- [ ] After ~1-2 seconds, phone number appears
- [ ] Phone number is clickable and formatted correctly
- [ ] No login prompt or redirect occurred
- [ ] Success toast notification shown (if implemented)

### Developer Console Checks
- [ ] No JavaScript errors in console
- [ ] Network tab shows POST request to `/functions/v1/reveal-phone`
- [ ] Request returns 200 status
- [ ] Response includes `success: true` and phone number
- [ ] Analytics events logged (if GA configured)

---

## Test 2: Phone Not Exposed in HTML Source

### Steps
1. [ ] Navigate to a listing page as anonymous user
2. [ ] Right-click page and select "View Page Source" (Ctrl+U)
3. [ ] Search source code (Ctrl+F) for the phone number
4. [ ] Search for partial phone number (e.g., last 4 digits)
5. [ ] Inspect Network tab for initial page load API calls
6. [ ] Check if phone is in any API response before reveal

### Expected Results
- [ ] Phone number NOT found in HTML source
- [ ] Phone number NOT found in initial API responses
- [ ] Phone only appears after clicking reveal button
- [ ] API calls before reveal do not contain phone data

### Additional Checks
- [ ] View `properties_public` data in Supabase dashboard
- [ ] Verify `contact_phone` column returns NULL for public access
- [ ] Test direct query to `properties` table (should fail with RLS)

---

## Test 3: Rate Limiting Works

### Setup
- [ ] Note current time for reference
- [ ] Clear browser cache and cookies
- [ ] Open listing page in incognito mode

### Steps
1. [ ] Click "Afficher le numéro" 10 times (refresh page between clicks if needed)
2. [ ] On the 11th click, verify rate limit error
3. [ ] Verify error message is user-friendly
4. [ ] Wait exactly 60 seconds
5. [ ] Try revealing again - should work

### Expected Results
- [ ] First 10 reveals work fine
- [ ] 11th reveal returns error
- [ ] Error toast shows "Rate limit exceeded" or similar
- [ ] Network response shows 429 status code
- [ ] After 60 seconds, reveals work again
- [ ] Retry-After header present (value: "60")

### Database Verification
```sql
-- Check phone_reveal_events for blocked entries
SELECT 
  created_at,
  entity_id,
  success,
  blocked,
  block_reason
FROM phone_reveal_events
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 20;
```
- [ ] Blocked events have `blocked = true`
- [ ] Block reason is logged
- [ ] IP hash is present (not raw IP)

---

## Test 4: Protected Routes Still Require Auth

### Steps
1. [ ] As anonymous user, try to access `/dashboard`
2. [ ] Verify redirect to `/login` occurs
3. [ ] Try to access `/agent/*` (any agent route)
4. [ ] Verify redirect to `/login` occurs
5. [ ] Try to access `/admin/*` (any admin route)
6. [ ] Verify redirect to `/login` occurs
7. [ ] Try to access `/artisan/services` (protected)
8. [ ] Verify redirect to `/login` occurs

### Expected Results
- [ ] All protected routes redirect to login
- [ ] No access granted without authentication
- [ ] Login page shows "from" parameter in URL
- [ ] After login, user is redirected to original destination

### Public Routes Test
1. [ ] Access `/` (home) - should work
2. [ ] Access `/search` - should work
3. [ ] Access `/property/{id}` - should work
4. [ ] Access `/services` - should work
5. [ ] Access `/services/{slug}` - should work
6. [ ] Access `/about`, `/contact`, `/privacy` - should work

- [ ] All public routes accessible without login
- [ ] No authentication prompts on public pages

---

## Test 5: Role Selection Not Affected

### Setup
1. [ ] Create test user account (or use existing)
2. [ ] Ensure user has `user_role = 'user'` in profiles table
3. [ ] Login as this user

### Steps
1. [ ] Navigate to home page
2. [ ] Browse to a listing page
3. [ ] Verify no role selection prompt appears
4. [ ] Click "Afficher le numéro" - should work
5. [ ] Navigate to `/dashboard` (protected route)
6. [ ] If user_role is 'user', dashboard should load
7. [ ] If user needs role selection, should only trigger when accessing protected content

### Expected Results
- [ ] Public browsing works without role selection prompt
- [ ] Listing detail pages fully accessible
- [ ] Phone reveal works without role selection
- [ ] Role selection only required for dashboard/publishing features
- [ ] User with role='user' can access user dashboard

---

## Test 6: Analytics Tracking

### Client-Side Analytics
1. [ ] Open browser console
2. [ ] Navigate to listing page
3. [ ] Click reveal button
4. [ ] Check console for analytics events

**Expected Console Logs** (if gtag configured):
- [ ] `[Analytics] phone_reveal_clicked` with metadata
- [ ] `[Analytics] phone_reveal_success` with metadata

If using Google Analytics:
- [ ] Open GA Real-Time reports
- [ ] Verify events appear in real-time stream

### Server-Side Analytics
```sql
-- Check recent reveal events
SELECT 
  created_at,
  entity_type,
  source,
  language,
  success,
  blocked
FROM phone_reveal_events
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

- [ ] New entries created for each reveal
- [ ] Metadata fields populated (referrer, page_url, language, source)
- [ ] IP hash is a 64-character hex string (SHA-256)
- [ ] User agent hash is a 64-character hex string
- [ ] Success field correctly set

### Admin Analytics View
```sql
-- Check daily summary
SELECT * FROM phone_reveal_analytics
WHERE reveal_date = CURRENT_DATE;
```

- [ ] Daily aggregations working
- [ ] Unique IP count makes sense
- [ ] Total reveals match database count
- [ ] Blocked reveals counted separately

---

## Test 7: Error Handling

### Test Case 7a: Invalid Entity ID
1. [ ] Call edge function with invalid UUID
2. [ ] Verify 400 error returned
3. [ ] Error message is clear

### Test Case 7b: Non-Existent Entity
1. [ ] Call edge function with valid UUID but non-existent entity
2. [ ] Verify 404 error returned
3. [ ] Error message: "Entity not found or not accessible"

### Test Case 7c: Entity Without Phone
1. [ ] Create listing without phone number
2. [ ] Try to reveal phone
3. [ ] Verify 404 error
4. [ ] Error message: "No contact information available"

### Test Case 7d: Network Error
1. [ ] Block network in dev tools (Offline mode)
2. [ ] Try to reveal phone
3. [ ] Verify error toast shown
4. [ ] UI shows error state with retry button

### Test Case 7e: Unpublished Entity
1. [ ] Create listing with status = 'pending'
2. [ ] Try to reveal phone
3. [ ] Verify 404 error (entity not accessible)

---

## Test 8: Cross-Browser Compatibility

### Browsers to Test
- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

For each browser:
- [ ] Page loads correctly
- [ ] Reveal button works
- [ ] Phone displays correctly
- [ ] Rate limiting works
- [ ] No console errors

---

## Test 9: Accessibility

### Keyboard Navigation
1. [ ] Tab to reveal button
2. [ ] Press Enter to trigger reveal
3. [ ] Tab to phone link after reveal
4. [ ] Press Enter to trigger phone call

- [ ] All interactive elements keyboard-accessible
- [ ] Focus indicators visible
- [ ] Logical tab order

### Screen Reader
1. [ ] Enable screen reader (NVDA/JAWS/VoiceOver)
2. [ ] Navigate to reveal button
3. [ ] Verify button label is announced
4. [ ] Trigger reveal
5. [ ] Verify phone number is announced

- [ ] Button has proper aria-label
- [ ] Loading state announced
- [ ] Success/error states announced

---

## Test 10: Performance

### Metrics to Check
1. [ ] Time to reveal phone after click
2. [ ] Page load time (initial)
3. [ ] Network payload size

**Expected Performance**:
- [ ] Reveal response time < 1 second
- [ ] Initial page load not affected by reveal system
- [ ] No large bundles loaded for reveal feature
- [ ] Edge function cold start < 2 seconds

### Load Testing (Optional)
```bash
# Using ab (Apache Bench)
ab -n 100 -c 10 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ANON_KEY" \
  -p request.json \
  https://YOUR_PROJECT.supabase.co/functions/v1/reveal-phone
```

- [ ] Edge function handles concurrent requests
- [ ] Rate limiting works under load
- [ ] No database deadlocks
- [ ] Response times consistent

---

## Test 11: Security Audit

### SQL Injection Tests
1. [ ] Try entity ID with SQL injection payload: `'; DROP TABLE phone_reveal_events; --`
2. [ ] Verify error or safe handling (no SQL execution)

### XSS Tests
1. [ ] Create listing with XSS in title: `<script>alert('xss')</script>`
2. [ ] Reveal phone on this listing
3. [ ] Verify no script execution

### CSRF Tests
1. [ ] Attempt reveal without proper CORS headers
2. [ ] Verify CORS protection works

### Direct Database Access
1. [ ] As anonymous user, try direct query to `properties` table
2. [ ] Verify RLS blocks access to phone
3. [ ] Try query to `phone_reveal_events` table
4. [ ] Verify public cannot read events

---

## Test 12: Multi-Language Support

### French (fr)
- [ ] Navigate to listing in French
- [ ] Verify button text: "Afficher le numéro"
- [ ] Reveal phone
- [ ] Verify success message in French
- [ ] Verify error messages in French

### Arabic (ar)
- [ ] Switch to Arabic
- [ ] Navigate to listing
- [ ] Verify button text in Arabic: "عرض رقم الهاتف"
- [ ] Verify RTL layout works
- [ ] Reveal phone
- [ ] Verify messages in Arabic

---

## Post-Testing Cleanup

### Database Cleanup (Optional)
```sql
-- Clear test reveal events
DELETE FROM phone_reveal_events
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND entity_id IN ('test-entity-id-1', 'test-entity-id-2');
```

### Verification
- [ ] Test data removed
- [ ] Production data intact
- [ ] No orphaned records

---

## Sign-Off

### Tester Information
- **Name**: _________________
- **Date**: _________________
- **Environment**: Production / Staging / Local
- **Browser**: _________________
- **OS**: _________________

### Test Results
- [ ] All tests passed
- [ ] Some tests failed (see notes below)
- [ ] Blockers found (see notes below)

### Notes / Issues Found
```
(Add any issues, bugs, or observations here)
```

### Approval
- [ ] System ready for production
- [ ] Additional testing required
- [ ] Bug fixes needed before deployment

---

## Quick Reference

### Useful SQL Queries

```sql
-- View recent reveals
SELECT * FROM phone_reveal_events 
WHERE created_at > NOW() - INTERVAL '1 hour' 
ORDER BY created_at DESC;

-- Count reveals by entity
SELECT entity_id, COUNT(*) as reveal_count
FROM phone_reveal_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY entity_id
ORDER BY reveal_count DESC;

-- Check rate limiting effectiveness
SELECT 
  blocked,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM phone_reveal_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY blocked;

-- Daily analytics
SELECT * FROM phone_reveal_analytics
WHERE reveal_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY reveal_date DESC;
```

### Edge Function Test Curl
```bash
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/reveal-phone \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "entityType": "listing",
    "entityId": "LISTING_UUID_HERE",
    "metadata": {
      "source": "immobilier",
      "language": "fr",
      "pageUrl": "http://localhost:5173/property/LISTING_UUID_HERE",
      "referrer": "http://localhost:5173/search"
    }
  }'
```
