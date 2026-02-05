# PWA Production Testing Checklist

Use this checklist to verify the PWA implementation after deploying to production.

## Pre-Deployment Checklist ✅

- [x] All code committed and pushed
- [x] Build successful locally
- [x] Service worker generated
- [x] Manifest generated
- [x] Icons accessible
- [x] Code review passed (0 issues)
- [x] Security scan passed (0 vulnerabilities)
- [x] Documentation complete

## Production Deployment Steps

1. **Deploy to Production**
   ```bash
   # Push to main branch (or create PR and merge)
   git checkout main
   git merge copilot/implement-pwa-setup
   git push origin main
   ```

2. **Wait for Vercel Deployment**
   - Check Vercel dashboard for deployment status
   - Verify deployment is successful

## Post-Deployment Testing

### 1. Desktop Chrome Testing

- [ ] Visit https://www.topaffaireimmo.com
- [ ] Open Chrome DevTools (F12)
- [ ] Navigate to **Application** tab
- [ ] **Manifest Section**:
  - [ ] Verify manifest loads without errors
  - [ ] Check name: "TopAffaireImmo"
  - [ ] Check start_url: "/"
  - [ ] Check display: "standalone"
  - [ ] Check theme_color: "#3b82f6"
  - [ ] Check all 4 icons load correctly
- [ ] **Service Workers Section**:
  - [ ] Verify service worker is registered
  - [ ] Status should be "activated and running"
  - [ ] No errors in service worker
- [ ] **Cache Storage**:
  - [ ] Check precached assets exist
  - [ ] Verify runtime caches created after navigation
- [ ] **Install Button**:
  - [ ] Install button should appear in header
  - [ ] Click install button
  - [ ] Native Chrome install dialog should appear
  - [ ] Install the app
  - [ ] Verify app opens in standalone window (no browser UI)
  - [ ] Close and reopen app from Chrome Apps

### 2. Desktop Lighthouse Audit

- [ ] Open DevTools → Lighthouse tab
- [ ] Select "Progressive Web App" category
- [ ] Run audit
- [ ] **Target Scores**:
  - [ ] Installable: ✅ Pass
  - [ ] PWA Optimized: ✅ Pass
  - [ ] Overall PWA score: ≥90/100
- [ ] Check for any PWA-related warnings/errors

### 3. Android Chrome Testing

**Requirements**: Android device with Chrome browser

- [ ] Visit https://www.topaffaireimmo.com on Android Chrome
- [ ] **Install Button Test**:
  - [ ] Install button appears in header
  - [ ] Click install button
  - [ ] Native install prompt appears
  - [ ] Accept installation
- [ ] **Installed App Test**:
  - [ ] App icon appears on home screen
  - [ ] Icon looks correct (not generic)
  - [ ] Tap icon to open app
  - [ ] App opens in standalone mode (no Chrome UI)
  - [ ] Status bar color matches theme (#3b82f6)
- [ ] **Functionality Test**:
  - [ ] Browse properties - works
  - [ ] Search - works
  - [ ] View property details - works
  - [ ] Login/Register - works
  - [ ] Switch language FR/AR - works
  - [ ] RTL layout works in Arabic
- [ ] **Offline Test**:
  - [ ] Navigate to a few pages
  - [ ] Turn on Airplane mode
  - [ ] Try to navigate to new page
  - [ ] Offline page appears
  - [ ] Turn off Airplane mode
  - [ ] App auto-reloads

### 4. iOS Safari Testing

**Requirements**: iPhone/iPad with iOS 11.3+

- [ ] Visit https://www.topaffaireimmo.com in Safari
- [ ] **Install Instructions Test**:
  - [ ] Install button appears in header
  - [ ] Click install button
  - [ ] Modal with iOS instructions appears
  - [ ] Instructions are clear and correct
  - [ ] Close modal
- [ ] **Manual Installation**:
  - [ ] Tap Share button (bottom toolbar)
  - [ ] Scroll and find "Add to Home Screen"
  - [ ] Tap "Add to Home Screen"
  - [ ] Verify app name and icon preview
  - [ ] Tap "Add"
- [ ] **Installed App Test**:
  - [ ] App icon appears on home screen
  - [ ] Icon looks correct
  - [ ] Tap icon to open app
  - [ ] App opens fullscreen (no Safari UI)
  - [ ] Status bar color matches theme
- [ ] **Functionality Test** (same as Android):
  - [ ] Browse properties - works
  - [ ] Search - works
  - [ ] View property details - works
  - [ ] Login/Register - works
  - [ ] Switch language FR/AR - works
  - [ ] RTL layout works in Arabic
- [ ] **Offline Test** (same as Android):
  - [ ] Navigate to a few pages
  - [ ] Turn on Airplane mode
  - [ ] Try to navigate to new page
  - [ ] Offline page appears
  - [ ] Turn off Airplane mode
  - [ ] App auto-reloads

### 5. Authentication & Security Testing

- [ ] **Login Test**:
  - [ ] Open PWA (installed app)
  - [ ] Login with valid credentials
  - [ ] Login successful
  - [ ] Session persists across app restarts
  
- [ ] **Cache Verification**:
  - [ ] Open DevTools → Application → Cache Storage
  - [ ] Check caches for sensitive data
  - [ ] Verify NO auth tokens in cache
  - [ ] Verify NO user-specific data in cache
  - [ ] Verify only public data is cached

- [ ] **API Calls**:
  - [ ] Network tab → filter "Fetch/XHR"
  - [ ] Trigger some API calls
  - [ ] Verify Supabase calls work correctly
  - [ ] Verify auth headers not cached

### 6. Auto-Update Testing

- [ ] Make a trivial change to the code (e.g., update README)
- [ ] Commit and push to trigger new deployment
- [ ] Wait for deployment to complete
- [ ] **On already-installed app**:
  - [ ] Keep app open
  - [ ] Service worker should detect update
  - [ ] App should reload automatically (or show update prompt)
  - [ ] Verify new version is loaded

### 7. Multi-Language Testing

- [ ] **French Mode**:
  - [ ] Install button text: "Installer l'app"
  - [ ] iOS instructions in French
  - [ ] LTR layout
  
- [ ] **Arabic Mode**:
  - [ ] Switch to Arabic
  - [ ] Install button text: "تثبيت التطبيق"
  - [ ] iOS instructions in Arabic
  - [ ] RTL layout (button on right side)

### 8. Performance Testing

- [ ] **First Load**:
  - [ ] Clear cache and reload
  - [ ] Note load time
  
- [ ] **Second Load** (with PWA cache):
  - [ ] Reload page
  - [ ] Should be noticeably faster
  - [ ] Images load instantly from cache
  
- [ ] **Offline Load**:
  - [ ] Turn on Airplane mode
  - [ ] Try to load cached pages
  - [ ] Should work for previously visited pages

## Issues to Watch For

### Common Issues
- [ ] Icons not displaying: Check icon paths and sizes
- [ ] Install button not appearing: Check console for errors
- [ ] Service worker not registering: Check HTTPS and no console errors
- [ ] Offline page not working: Check navigateFallback config
- [ ] Auth not working: Verify auth endpoints excluded from cache

### Browser-Specific Issues
- [ ] **iOS**: May need to clear Safari cache if icons don't update
- [ ] **Android**: May need to clear Chrome app data if service worker won't update
- [ ] **Desktop**: May need hard refresh (Ctrl+Shift+R) for updates

## Success Criteria

All items below should be ✅:

- [ ] PWA installable on Android Chrome (native prompt)
- [ ] PWA installable on iOS Safari (manual instructions)
- [ ] PWA installable on Desktop Chrome
- [ ] App opens in standalone mode (no browser UI)
- [ ] Icons display correctly on all platforms
- [ ] Offline page works when network unavailable
- [ ] Service worker caches assets correctly
- [ ] Auth still works (no tokens cached)
- [ ] Auto-updates work
- [ ] Lighthouse PWA audit passes (≥90/100)
- [ ] Multi-language support works (FR/AR)
- [ ] RTL layout works in Arabic
- [ ] No console errors
- [ ] No security vulnerabilities

## Next Steps After Testing

1. **If all tests pass** ✅:
   - Mark PR as ready for merge
   - Document any observations
   - Celebrate! 🎉

2. **If issues found** ⚠️:
   - Document the issue
   - Create follow-up ticket
   - Fix critical issues before merge

## Additional Resources

- **README PWA Section**: See comprehensive documentation in README.md
- **Implementation Summary**: See PWA_IMPLEMENTATION_SUMMARY.md
- **Troubleshooting**: Check Chrome DevTools Console and Application tab
- **Support**: Refer to vite-plugin-pwa docs: https://vite-pwa-org.netlify.app/
