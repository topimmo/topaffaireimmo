# GA4 Verification Guide for TopAffaireImmo

## Overview
This guide helps you verify that Google Analytics 4 is working correctly on your production website after deployment.

## Quick Verification Checklist

### ✅ Step 1: Deploy to Production
- Deploy the latest build to Vercel
- Ensure deployment is live on `topaffaireimmo.com` or `www.topaffaireimmo.com`

### ✅ Step 2: Verify in Browser Console

1. **Open the website** in a browser (Chrome recommended)
2. **Open DevTools** (F12 or Right-click → Inspect)
3. **Go to Console tab**
4. **Look for GA4 initialization messages:**
   ```
   [GA4] Initialization started from index.html
   [GA4] Script loaded and configured from index.html
   [GA4] ✅ Page view tracked: {path: '/', title: '...', url: '...'}
   ```

5. **If you see any warnings**, check:
   - Are you on the production domain? (not localhost or preview URL)
   - Is an ad blocker blocking analytics?
   - Are there any CSP errors?

### ✅ Step 3: Verify Network Requests

1. **Open DevTools → Network tab**
2. **Filter by "google" or "analytics"**
3. **Look for these requests:**

   a. **Script Load Request:**
   ```
   Name: gtag/js?id=G-TMY9XWWH6G
   Status: 200 OK
   Type: script
   ```

   b. **Data Collection Requests:**
   ```
   Name: g/collect?v=2&...
   Status: 200 OK
   Type: ping or xhr
   ```

4. **Test SPA navigation:**
   - Click on different pages (e.g., /search, /about, /contact)
   - You should see a new `g/collect` request for each page change
   - Console should show: `[GA4] ✅ Page view tracked: ...`

### ✅ Step 4: Verify in Google Analytics

1. **Go to Google Analytics:** https://analytics.google.com
2. **Select your property** (TopAffaireImmo - G-TMY9XWWH6G)
3. **Navigate to:** Reports → Realtime
4. **You should see:**
   - Active users (should be at least 1 - you!)
   - Page views updating in real-time
   - Page paths you're visiting (/, /search, etc.)

5. **Test multiple pages:**
   - Navigate through the site
   - Each page change should appear in Realtime within a few seconds

### ✅ Step 5: Check Data Stream Status

1. **Go to:** Admin → Data Streams
2. **Click on your Web stream** (topaffaireimmo.com)
3. **Status should show:** 
   - ✅ "Data collection is active" 
   - OR "Data received in the last 48 hours"
4. **NOT:** ❌ "La collecte de données n'est pas active"

## Manual Testing

### Test Initial Page Load
1. Open a new incognito/private window
2. Navigate to https://topaffaireimmo.com
3. Open DevTools Console
4. Should see: `[GA4] Initialization started from index.html`
5. Then: `[GA4] ✅ Page view tracked: {path: '/', ...}`

### Test SPA Navigation
1. From homepage, click "Rechercher" or any link
2. Check console for new page view event
3. Check Network tab for new `g/collect` request
4. Check GA Realtime for updated page view

### Test Custom Events (Optional)
Open browser console and run:
```javascript
gtag('event', 'test_event', { 
  event_category: 'verification',
  event_label: 'manual_test',
  value: 123
});
```

Should see:
- Console: `[GA4] ✅ Event tracked: test_event ...`
- Network: new `g/collect` request
- GA Realtime: event appears in Events section

## Troubleshooting

### Issue: Console shows "Not on production domain"
**Solution:** You're testing on localhost or a non-production URL. GA4 only tracks on `topaffaireimmo.com` and `www.topaffaireimmo.com`.

### Issue: Script fails to load (404 or CORS error)
**Possible causes:**
- Ad blocker is blocking Google Analytics
- Network/firewall restrictions
- CSP (Content Security Policy) blocking the script

**Solution:** 
- Disable ad blocker
- Try a different network
- Check CSP headers in Network tab

### Issue: No data in GA Realtime
**Possible causes:**
- Not on production domain
- GA script blocked by ad blocker
- Wrong measurement ID
- Data collection not enabled in GA

**Solutions:**
1. Verify you're on production domain
2. Check browser console for errors
3. Verify measurement ID is `G-TMY9XWWH6G`
4. Wait 5-10 minutes (sometimes there's a delay)
5. Check Admin → Data Streams → ensure stream is active

### Issue: Duplicate page views
**Solution:** This should be prevented by the implementation. If you see duplicates:
- Check console for messages like: `[GA4] Duplicate page view prevented`
- If duplicates persist, check if `send_page_view: false` is set in the config

### Issue: Missing page views on route changes
**Solution:** The `ScrollToTop` component should track all route changes. Verify:
1. Component is mounted in App.tsx
2. `trackPageView()` is called in the useEffect
3. Dependencies include `location.pathname` and `location.search`

## Expected Console Output

### On Initial Page Load:
```
[GA4] Initialization started from index.html
[GA4] Script loaded and configured from index.html
🚀 Application Deployment Info
  Build Timestamp: 2026-02-08T...
  Deployment Version: ...
  Current URL: https://topaffaireimmo.com/
  Environment Mode: production
  Base URL: /
[GA4] ✅ Page view tracked: {path: '/', title: 'TopAffaireImmo - ...', url: 'https://topaffaireimmo.com/'}
```

### On Route Change (e.g., clicking "About"):
```
[GA4] ✅ Page view tracked: {path: '/about', title: 'À propos - TopAffaireImmo', url: 'https://topaffaireimmo.com/about'}
```

## Network Tab Expected Requests

### 1. Script Load (happens once on page load):
```
Request URL: https://www.googletagmanager.com/gtag/js?id=G-TMY9XWWH6G
Status: 200 OK
Type: script
Size: ~30 KB
```

### 2. Data Collection (happens on each page view and event):
```
Request URL: https://www.google-analytics.com/g/collect?v=2&tid=G-TMY9XWWH6G&...
Status: 200 OK
Type: ping or xhr
Size: ~1 KB

Query Parameters should include:
- tid: G-TMY9XWWH6G (measurement ID)
- en: page_view (event name)
- dl: https://topaffaireimmo.com/... (page location)
- dt: TopAffaireImmo - ... (page title)
- dp: /... (page path)
```

## Success Criteria

You can confirm GA4 is working correctly when:

✅ Console shows GA4 initialization and page view tracking  
✅ Network tab shows gtag.js script loading (200 OK)  
✅ Network tab shows g/collect requests for each page view  
✅ GA Realtime shows active users (you)  
✅ GA Realtime shows page views updating in real-time  
✅ Data Stream status shows "Data collection is active"  
✅ No errors in browser console  

## Additional Resources

- **GA4 Quick Start:** `GA4_QUICK_START.md`
- **Diagnostic Report:** `GA4_DIAGNOSTIC_REPORT.md`
- **Executive Summary:** `GA4_EXECUTIVE_SUMMARY.md`
- **Implementation Code:**
  - `index.html` (lines 76-111) - Primary initialization
  - `src/lib/analytics/ga4.ts` - Analytics utilities
  - `src/App.tsx` (lines 79-89) - Page view tracking

## Support

If you continue to have issues:
1. Check all documentation files (GA4_*.md)
2. Run verification script: `npm run verify:ga4`
3. Check browser console for specific error messages
4. Verify deployment is live on production domain
5. Wait 24-48 hours and check GA again (initial data can be delayed)

---

**Last Updated:** 2026-02-08  
**GA4 Measurement ID:** G-TMY9XWWH6G  
**Production Domains:** topaffaireimmo.com, www.topaffaireimmo.com
