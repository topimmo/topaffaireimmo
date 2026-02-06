# Service Worker Offline Fallback Fix - Testing Guide

## Problem Fixed
Previously, the service worker would show the "Vous êtes hors ligne" (offline) page too aggressively, even when users had internet connection. This was particularly problematic on pages like `/add-listing` where users would see the offline page after refreshing even when they were online.

## Solution Implemented

### 1. Smart Offline Fallback Logic (src/sw.ts)
The service worker now implements intelligent offline detection:

- **Only shows offline page when truly offline**: Checks `navigator.onLine === false`
- **Critical routes protection**: Routes like `/add-listing`, `/edit-listing`, `/dashboard` NEVER show the offline page
  - Instead, they return the cached app shell (index.html) 
  - This allows the React app to handle the connection issue with a toast/banner
- **API request handling**: API requests return proper 503 error responses instead of offline.html
- **Safe navigation fallback**: 
  1. Try network first
  2. If network fails and it's a critical route → return cached shell
  3. If truly offline (navigator.onLine = false) → return offline.html
  4. Otherwise → try cached page or shell

### 2. Connection Status Monitoring (React)
Added client-side connection monitoring:

- **useOnlineStatus hook** (`src/hooks/useOnlineStatus.ts`): Monitors navigator.onLine
- **ConnectionStatusBanner component** (`src/components/ConnectionStatusBanner.tsx`): Shows non-intrusive banner
  - "Connexion instable" when offline (orange banner)
  - "Connexion rétablie" when back online (green banner, auto-dismisses after 3s)
- **App.tsx integration**: Banner is active on all pages

## How to Test

### Test 1: Verify Normal Online Behavior
1. **Build the app**: `npm run build`
2. **Serve production build**: `npx serve dist -l 3000`
3. **Open in browser**: http://localhost:3000
4. **Navigate to /add-listing** while online
5. **Refresh the page multiple times**
6. **Expected**: Page loads normally, NO offline page shown

### Test 2: Verify Offline Banner (Not Offline Page)
1. **Open DevTools** (F12) → Network tab
2. **Set to Offline mode** (throttling dropdown)
3. **Observe**: Orange banner appears at top: "Connexion instable"
4. **Expected**: 
   - Banner shows at top of page
   - Page stays functional with cached content
   - NO full offline page redirect

### Test 3: Verify Critical Routes Protection
1. **Navigate to /add-listing** while online
2. **In DevTools, set to "Slow 3G" or similar**
3. **Refresh the page**
4. **Expected**:
   - Page may be slow but eventually loads
   - If it fails, you see the app shell, NOT offline.html
   - Connection banner may appear if truly offline

### Test 4: Verify True Offline Behavior
1. **Navigate to a non-critical page** (e.g., /about)
2. **Set DevTools to Offline**
3. **Hard refresh** (Ctrl+Shift+R)
4. **Expected**: 
   - If page is cached: Shows cached content + orange banner
   - If page not cached AND navigator.onLine = false: Shows offline.html

### Test 5: Verify Connection Restoration
1. **While offline** (orange banner showing)
2. **Re-enable network** in DevTools
3. **Expected**: 
   - Green banner appears: "Connexion rétablie"
   - Banner auto-dismisses after 3 seconds

### Test 6: Verify API Error Handling
1. **With network enabled**
2. **Make an API request that fails** (you can simulate this in DevTools by blocking specific requests)
3. **Expected**: 
   - Request returns 503 error with JSON
   - NOT redirected to offline.html
   - App can handle the error properly

## Production Deployment Notes

### Service Worker Version
- Bumped to **1.1.0** (was 1.0.3)
- Users will get the new service worker on next visit
- May need to clear browser cache on some browsers

### Browser Compatibility
- Works on all modern browsers supporting Service Workers
- Falls back gracefully on older browsers
- `navigator.onLine` is well-supported (IE9+)

### Debugging
- Service Worker logs prefixed with `[SW]`
- Connection status logs prefixed with `[Online Status]`
- Check console for diagnostic messages

## Files Changed

1. **src/sw.ts** (Service Worker)
   - Added smart offline detection
   - Added critical routes protection
   - Added API error handling
   - Explicit offline page precaching

2. **src/hooks/useOnlineStatus.ts** (New)
   - React hook for online/offline detection

3. **src/components/ConnectionStatusBanner.tsx** (New)
   - Non-intrusive connection status banner

4. **src/App.tsx**
   - Integrated ConnectionStatusBanner component

## Rollback Plan (if needed)

If issues arise, you can:
1. Revert to commit before these changes
2. Or, to disable the connection banner only:
   - Remove `<ConnectionStatusBanner />` from `src/App.tsx`
   - Keep the service worker changes (they're safer)

## Future Enhancements

Consider adding:
- Network quality indicator (poor/good connection)
- Offline queue for form submissions
- Better retry logic for failed requests
- Progressive enhancement for offline editing
