# E2E Sanity Testing Guide

This guide provides step-by-step instructions for validating the production crash fix in real-world scenarios.

## Prerequisites

- Access to the deployed application (staging or production)
- Multiple browsers: Chrome, Firefox, Safari (desktop and mobile)
- Network debugging tools (browser DevTools)

---

## Test 1: API Health Check Verification

**Purpose**: Verify the health check endpoint is working correctly

### Steps

1. **Open Browser DevTools**
   - Press `F12` or right-click → Inspect
   - Go to the Network tab

2. **Test Health Endpoint**
   ```bash
   # Using curl (command line)
   curl -I https://topaffaireimmo.com/api/health
   
   # Using browser
   # Navigate to: https://topaffaireimmo.com/api/health
   ```

3. **Expected Response**
   - Status: `200 OK`
   - Content-Type: `application/json`
   - Body should contain:
     ```json
     {
       "status": "ok",
       "timestamp": "2026-02-12T22:30:00.000Z",
       "version": "abc1234"
     }
     ```

4. **Verify Response Time**
   - Response should be < 500ms
   - Check Network tab for timing details

### ✅ Pass Criteria
- Health endpoint returns 200 status
- Response contains valid JSON
- Response time is acceptable

---

## Test 2: No Startup Crash - Chrome Desktop

**Purpose**: Verify the app loads without crashing in normal mode

### Steps

1. **Clear Browser Cache**
   - Chrome Settings → Privacy and Security → Clear Browsing Data
   - Select "Cached images and files"
   - Clear data

2. **Navigate to Homepage**
   - Go to: `https://topaffaireimmo.com`
   - Wait for page to fully load

3. **Check Console for Errors**
   - Open DevTools (`F12`)
   - Go to Console tab
   - Look for red error messages

4. **Verify App Functionality**
   - ✅ Homepage renders correctly
   - ✅ Header and footer visible
   - ✅ No "Something went wrong" error boundary
   - ✅ No unhandled promise rejections
   - ✅ Navigation works (click menu items)

### ✅ Pass Criteria
- No error boundary shown
- No uncaught errors in console
- App renders and functions normally
- No navigator.locks errors

---

## Test 3: No Startup Crash - Chrome Incognito

**Purpose**: Verify the app loads in private browsing mode (limited storage)

### Steps

1. **Open Incognito Window**
   - Chrome: `Ctrl+Shift+N` (Windows/Linux) or `Cmd+Shift+N` (Mac)

2. **Navigate to Homepage**
   - Go to: `https://topaffaireimmo.com`
   - Wait for page to fully load

3. **Check for Navigator.locks Errors**
   - Open DevTools Console
   - Look for messages about navigator.locks
   - Should see: `[Supabase] Navigator.locks disabled to prevent gotrue-js crashes`

4. **Verify Limited Mode Banner**
   - Check for yellow banner at top of page (if Supabase init failed)
   - Banner should say: "Service Configuration Issue - Some features may be temporarily unavailable"

5. **Verify App Still Functions**
   - ✅ Page renders without crash
   - ✅ Can browse properties
   - ✅ No error boundary
   - ✅ Auth features may be limited (expected)

### ✅ Pass Criteria
- App loads successfully
- No crashes or error boundaries
- Banner shows if Supabase unavailable (graceful degradation)
- Basic browsing works

---

## Test 4: No Startup Crash - Firefox Desktop

**Purpose**: Cross-browser compatibility verification

### Steps

1. **Clear Browser Cache**
   - Firefox Settings → Privacy & Security → Clear Data
   - Check "Cached Web Content"

2. **Navigate to Homepage**
   - Go to: `https://topaffaireimmo.com`

3. **Check Console**
   - Press `F12`
   - Console tab
   - Look for errors

4. **Verify Functionality**
   - ✅ Page renders
   - ✅ No error boundary
   - ✅ Navigation works
   - ✅ No console errors

### ✅ Pass Criteria
- Same as Chrome desktop test
- No Firefox-specific errors

---

## Test 5: No Startup Crash - Mobile Chrome (Android)

**Purpose**: Verify mobile device compatibility

### Steps

1. **Using Real Device or Chrome DevTools Mobile Emulation**
   - DevTools → Toggle Device Toolbar (`Ctrl+Shift+M`)
   - Select mobile device (e.g., "Pixel 5")

2. **Navigate to Site**
   - Go to: `https://topaffaireimmo.com`

3. **Check Console**
   - Enable "Show Console" in DevTools

4. **Verify Mobile UI**
   - ✅ Responsive design works
   - ✅ No crashes
   - ✅ Touch interactions work
   - ✅ No console errors

### ✅ Pass Criteria
- Mobile UI renders correctly
- No crashes or error boundaries
- Touch navigation works

---

## Test 6: No Startup Crash - Safari iOS (Private Mode)

**Purpose**: Verify iOS Safari private browsing (most restrictive)

### Steps

1. **Open Safari on iOS Device**
   - Or use Safari on Mac in private mode

2. **Enable Private Browsing**
   - iOS: Tap tab switcher → "Private"
   - Mac: File → New Private Window

3. **Navigate to Site**
   - Go to: `https://topaffaireimmo.com`

4. **Check for Crashes**
   - ✅ Page loads
   - ✅ No blank screen
   - ✅ No "Something went wrong"

5. **Verify Safari Console (Mac only)**
   - Develop → Show JavaScript Console
   - Check for navigator.locks errors (should be prevented)

### ✅ Pass Criteria
- App loads without crashes
- Navigator.locks errors prevented
- Graceful degradation if storage blocked

---

## Test 7: Missing Environment Variables

**Purpose**: Verify app handles misconfiguration gracefully

### Steps (Development Only)

1. **Create Test Build Without Env Vars**
   ```bash
   # Remove .env file temporarily
   mv .env .env.backup
   
   # Build without env vars
   npm run build
   
   # Serve locally
   npm run preview
   ```

2. **Navigate to Localhost**
   - Go to: `http://localhost:4173`

3. **Expected Behavior**
   - ✅ App still renders (doesn't crash)
   - ✅ Yellow banner shows: "Service Configuration Issue"
   - ✅ Console shows: "Supabase not initialized"
   - ✅ Can still browse (read-only mode)
   - ✅ Auth features gracefully fail

4. **Restore Environment**
   ```bash
   mv .env.backup .env
   ```

### ✅ Pass Criteria
- App doesn't crash without config
- Clear visual feedback (banner)
- Graceful degradation

---

## Test 8: Network Interruption

**Purpose**: Verify app handles network issues gracefully

### Steps

1. **Enable Network Throttling**
   - DevTools → Network tab
   - Throttling: "Offline"

2. **Reload Page**
   - App should show connection status banner
   - No crashes

3. **Re-enable Network**
   - Throttling: "Online"
   - Page should recover

### ✅ Pass Criteria
- Offline banner shows
- No crashes
- Recovers when online

---

## Test 9: Blocked Third-Party Cookies

**Purpose**: Verify app works with strict cookie policies

### Steps

1. **Block Third-Party Cookies**
   - Chrome: Settings → Privacy → Cookies → "Block third-party cookies"
   - Firefox: Settings → Privacy → "Strict" mode

2. **Navigate to Site**
   - Go to: `https://topaffaireimmo.com`

3. **Verify Functionality**
   - ✅ App loads
   - ✅ localStorage used instead of cookies
   - ✅ Sessions work (if localStorage available)

### ✅ Pass Criteria
- App functions normally
- Falls back to localStorage
- No crashes

---

## Test 10: Diagnostics Page Access Control

**Purpose**: Verify /diagnostics is properly gated

### Steps

1. **Production Build**
   ```bash
   NODE_ENV=production npm run build
   ```

2. **Try to Access Diagnostics**
   - Navigate to: `https://topaffaireimmo.com/diagnostics`
   - Should get 404 or redirect

3. **Development Mode**
   ```bash
   npm run dev
   ```
   - Navigate to: `http://localhost:5173/diagnostics`
   - Should load diagnostics page

### ✅ Pass Criteria
- Diagnostics NOT accessible in production
- Diagnostics accessible in development

---

## Test Summary Checklist

Use this checklist for comprehensive testing:

### API Health
- [ ] `/api/health` returns 200 OK
- [ ] Response contains valid JSON
- [ ] Response time < 500ms

### Desktop Browsers
- [ ] Chrome - Normal mode loads without crash
- [ ] Chrome - Incognito mode loads without crash
- [ ] Firefox - Normal mode loads without crash
- [ ] Safari - Normal mode loads without crash
- [ ] Safari - Private mode loads without crash

### Mobile Browsers
- [ ] Chrome Android - Loads without crash
- [ ] Safari iOS - Loads without crash
- [ ] Safari iOS Private - Loads without crash

### Error Scenarios
- [ ] Missing env vars - Shows banner, doesn't crash
- [ ] Network offline - Shows banner, doesn't crash
- [ ] Blocked cookies - App still works
- [ ] Blocked storage - Graceful degradation

### Security & Access Control
- [ ] /diagnostics not accessible in production
- [ ] /api/client-error requires ENABLE_ERROR_REPORTING flag
- [ ] Rate limiting works on API endpoints

### Console Validation
- [ ] No uncaught errors in console
- [ ] No unhandled promise rejections
- [ ] Navigator.locks disabled message appears (DEV mode)
- [ ] Supabase init status logged (DEV mode)

---

## Automated Testing

For CI/CD integration, consider these automated checks:

```bash
# Health check
curl -f https://topaffaireimmo.com/api/health || exit 1

# Homepage loads
curl -f https://topaffaireimmo.com/ || exit 1

# Check for error boundary in response
if curl -s https://topaffaireimmo.com/ | grep -q "Something went wrong"; then
  echo "Error boundary detected!"
  exit 1
fi
```

---

## Troubleshooting

### If Tests Fail

1. **Check Browser Console**
   - Look for specific error messages
   - Check Network tab for failed requests

2. **Verify Environment Variables**
   - Ensure `VITE_SUPABASE_URL` is set
   - Ensure `VITE_SUPABASE_ANON_KEY` is set

3. **Check Deployment**
   - Verify latest code is deployed
   - Check build logs for errors

4. **Clear All Caches**
   - Browser cache
   - Service worker cache (if applicable)
   - CDN cache

### Common Issues

**Issue**: "Supabase not initialized" in console
- **Cause**: Missing environment variables
- **Fix**: Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

**Issue**: Navigator.locks error still appears
- **Cause**: Code not properly deployed
- **Fix**: Verify `disableNavigatorLocks()` is called before client creation

**Issue**: Error boundary shows
- **Cause**: Uncaught error in component rendering
- **Fix**: Check console for stack trace, add try-catch

---

## Success Criteria

All tests pass when:

✅ **Zero startup crashes** across all browsers and modes
✅ **Graceful degradation** when services unavailable
✅ **Clear user feedback** via banners when issues occur
✅ **No uncaught errors** in production console
✅ **API endpoints** respond correctly
✅ **Security gates** properly restrict access

---

## Reporting Issues

When reporting test failures, include:

1. **Test number and name**
2. **Browser and version**
3. **Operating system**
4. **Console errors** (screenshot or copy-paste)
5. **Network tab** showing failed requests
6. **Steps to reproduce**

---

## Next Steps

After successful E2E testing:

1. **Monitor Production Logs**
   - Check for client error reports
   - Monitor health check failures
   - Track navigator.locks disable rate

2. **Set Up Alerts**
   - Alert on high error rates
   - Alert on health check failures
   - Alert on unusual patterns

3. **Document Edge Cases**
   - Note any browser-specific issues
   - Document workarounds if needed
   - Update this guide with findings

---

## Conclusion

This E2E testing guide ensures the production crash fix works across all supported browsers and scenarios. Regular testing helps maintain confidence in the stability and reliability of the application.

For questions or issues, refer to:
- `PRODUCTION_CRASH_PERMANENT_FIX.md` - Root cause and fix details
- `STARTUP_CRASH_FIX_VERIFICATION.md` - Implementation verification
- `PRODUCTION_CRASH_COMPLETE_SUMMARY.md` - Complete implementation summary
