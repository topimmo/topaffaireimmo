# PWA Install Experience - Implementation Guide

## Overview
This document describes the enhanced PWA install experience implementation for TopAffaireImmo, providing platform-specific behaviors, delayed triggers, and smooth animations.

## Architecture

### Component Structure
```
src/
├── contexts/
│   └── PWAInstallContext.tsx          # Global state management
├── components/
│   └── pwa/
│       ├── InstallPWAButton.tsx       # Header/desktop button
│       ├── MobileInstallBar.tsx       # Mobile bottom sticky bar
│       └── IOSInstallInstructions.tsx # iOS instruction modal
└── App.tsx                            # Integration point
```

## Key Components

### 1. PWAInstallContext
**Purpose**: Centralized state management for PWA install prompts

**Features**:
- Detects if app is already installed (standalone mode)
- Captures `beforeinstallprompt` event (Android/Desktop)
- Detects iOS Safari
- Implements delayed triggers (scroll OR time)
- Provides event tracking utilities

**Triggers**:
- User scrolls down > 100px
- OR user spends 17 seconds on site
- Only shows if NOT already installed
- Respects user dismissal (7 days for iOS)

**Usage**:
```tsx
const { 
  showInstallPrompt,
  handleInstall,
  dismissInstall,
  isIOS,
  trackEvent 
} = usePWAInstall();
```

### 2. InstallPWAButton
**Purpose**: Desktop/header install button

**Features**:
- Animated download icon (5 repetitions)
- Appears in header when prompt is ready
- Hover dismiss button
- Triggers native install or iOS instructions
- Responsive (hides on mobile in favor of bottom bar)

**Platform Behavior**:
- Android/Desktop: Triggers native install dialog
- iOS: Opens IOSInstallInstructions modal

### 3. MobileInstallBar
**Purpose**: Mobile bottom sticky install bar

**Features**:
- Slides up from bottom with spring animation
- Shows app icon, title, and description
- Install and dismiss buttons
- Auto-hidden on desktop (md: breakpoint)
- Respects `prefers-reduced-motion`

**Layout**:
```
┌─────────────────────────────────────┐
│ [Icon] Install TopAffaireImmo   [X]│
│        Quick access from home    [↓]│
└─────────────────────────────────────┘
```

### 4. IOSInstallInstructions
**Purpose**: Apple-style installation instructions for iOS Safari

**Features**:
- Modal dialog with step-by-step instructions
- Animated steps with icons
- Visual share icon representation
- Bilingual support (FR + AR)
- RTL-aware layout
- One-time display per user

**Steps**:
1. Tap Share button in toolbar
2. Scroll and select "Add to Home Screen"
3. Tap "Add" to confirm

## User Flow

### Android/Desktop Chrome/Edge
```
User visits site
     ↓
Scrolls OR waits 17s
     ↓
MobileInstallBar appears (mobile)
OR InstallPWAButton appears (desktop)
     ↓
User clicks install
     ↓
Native install prompt
     ↓
User accepts → App installed ✓
User dismisses → Prompt hidden for session
```

### iOS Safari
```
User visits site
     ↓
Scrolls OR waits 17s
     ↓
MobileInstallBar appears
     ↓
User clicks install
     ↓
IOSInstallInstructions modal opens
     ↓
User follows manual steps
     ↓
Dismissal saved for 7 days
```

## Event Tracking

All events are logged to console with the format:
```
[PWA Install] event_name {data}
```

### Tracked Events
- `app_already_installed` - App is running in standalone mode
- `beforeinstallprompt_captured` - Install prompt available (Android/Desktop)
- `user_scrolled` - User scrolled past threshold
- `user_spent_time` - User spent 17 seconds on site
- `install_prompt_shown` - Prompt displayed to user
  - Data: `{ trigger, platform }`
- `install_prompt_interaction` - User interacted with native prompt
  - Data: `{ outcome: 'accepted' | 'dismissed' }`
- `install_dismissed` - User dismissed prompt
  - Data: `{ platform, source }`
- `ios_instructions_opened` - iOS instructions modal opened
  - Data: `{ source }`
- `ios_instructions_closed` - iOS instructions modal closed

### Analytics Integration
To integrate with analytics services (Google Analytics, PostHog, etc.), modify the `trackEvent` function in `PWAInstallContext.tsx`:

```tsx
const trackEvent = (event: string, data?: Record<string, any>) => {
  console.log(`[PWA Install] ${event}`, data || {});
  
  // Add your analytics service here
  // Example for Google Analytics:
  // if (window.gtag) {
  //   window.gtag('event', event, {
  //     event_category: 'PWA Install',
  //     ...data
  //   });
  // }
};
```

## Accessibility

### Reduced Motion Support
The implementation respects user preferences for reduced motion:

```tsx
// Detects prefers-reduced-motion
window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Fallback to simple transitions
{
  type: 'tween',
  duration: 0.2
}
```

### Keyboard Navigation
- All buttons are keyboard accessible
- Modal dialogs support Escape to close
- Focus management in modals

### Screen Readers
- Proper ARIA labels on dismiss buttons
- Semantic HTML structure
- Descriptive button text

## Internationalization

### Supported Languages
- French (FR) - Default
- Arabic (AR) - RTL support

### Translation Keys
All PWA-related translations are in `src/contexts/LanguageContext.tsx`:

```tsx
'pwa.install': 'Installer l\'app' / 'تثبيت التطبيق'
'pwa.installPrompt': 'Installer TopAffaireImmo...'
'pwa.installDescription': 'Accédez rapidement...'
'pwa.installButton': 'Installer' / 'تثبيت'
'pwa.installLater': 'Plus tard' / 'لاحقاً'
'pwa.iosTitle': 'Comment installer sur iOS'
'pwa.iosInstructions': 'Sur iPhone: appuyez...'
```

### RTL Support
- Automatic RTL detection via `isRTL` flag
- Icons rotate for RTL (share icon)
- Layout mirrors for RTL languages
- Proper text alignment

## Configuration

### Timing Adjustments
To change the delayed trigger timing, modify `PWAInstallContext.tsx`:

```tsx
// Scroll threshold (currently 100px)
if (!userHasScrolled && window.scrollY > 100) {

// Time threshold (currently 17 seconds)
const timeoutId = setTimeout(() => {
  setUserHasSpentTime(true);
}, 17000);
```

### iOS Dismissal Duration
To change how long iOS dismissal is remembered:

```tsx
// Currently 7 days
const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
if (daysSinceDismissed < 7) {
```

### Animation Settings
To adjust animations, modify the respective component files:

**InstallPWAButton** - Icon wiggle:
```tsx
animate={{ rotate: [0, -10, 10, -10, 0] }}
transition={{ duration: 0.5, repeat: 5, repeatDelay: 3 }}
```

**MobileInstallBar** - Slide up:
```tsx
initial={{ y: 100, opacity: 0 }}
animate={{ y: 0, opacity: 1 }}
transition={{ type: 'spring', stiffness: 300, damping: 30 }}
```

## Testing

### Development Testing
The `beforeinstallprompt` event doesn't fire in regular development. To test:

1. **Build and serve**: `npm run build && npm run preview`
2. **Use Chrome DevTools**:
   - Open DevTools > Application > Manifest
   - Check "Add to home screen" requirements
3. **Simulate events**: Use browser console to trigger events manually

### iOS Testing
1. Open in Safari on iOS device
2. Wait 17 seconds or scroll
3. Tap install button
4. Verify modal appears with instructions

### Android Testing
1. Open in Chrome on Android device
2. Build app with valid manifest
3. Wait for triggers
4. Verify native install banner appears

### Verification Checklist
- [ ] Prompt appears after scroll trigger
- [ ] Prompt appears after time trigger (17s)
- [ ] Desktop shows header button
- [ ] Mobile shows bottom sticky bar
- [ ] iOS shows manual instructions
- [ ] Android shows native prompt
- [ ] Dismiss works and persists
- [ ] Already installed = no prompts
- [ ] Animations smooth and non-intrusive
- [ ] Works in both FR and AR
- [ ] RTL layout correct for Arabic
- [ ] Console tracking events firing
- [ ] No JavaScript errors

## Troubleshooting

### Issue: Prompt doesn't appear
**Causes**:
1. App already installed (check standalone mode)
2. Triggers not met (scroll OR 17 seconds)
3. Recently dismissed (check localStorage)
4. Development mode (event not firing)

**Solution**:
```js
// Check in browser console
console.log('Standalone:', window.matchMedia('(display-mode: standalone)').matches);
console.log('iOS Dismissed:', localStorage.getItem('pwa-ios-install-dismissed'));
```

### Issue: Animations not smooth
**Causes**:
1. Low-end device
2. Reduced motion preference enabled

**Solution**: Animations already respect `prefers-reduced-motion`

### Issue: iOS instructions not showing
**Causes**:
1. Not detected as iOS
2. Recently dismissed

**Solution**:
```js
// Check iOS detection
console.log('Is iOS:', /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()));
```

### Issue: Translations missing
**Causes**:
1. Translation key not defined
2. Language context not loaded

**Solution**: Check `LanguageContext.tsx` has all required keys

## Production Deployment

### Pre-deployment Checklist
- [ ] All translation keys present
- [ ] PWA manifest configured (`vite.config.ts`)
- [ ] Service worker registered
- [ ] Icons present (192x192, 512x512)
- [ ] HTTPS enabled (required for PWA)
- [ ] Build successful
- [ ] No console errors
- [ ] Security scan passed

### Post-deployment Verification
1. Test on real devices (Android + iOS)
2. Verify install prompt appears
3. Check analytics events
4. Monitor user feedback
5. Track install conversion rate

### Performance Monitoring
Monitor these metrics:
- Prompt shown rate
- Install acceptance rate
- Dismissal rate
- Platform distribution
- Time to prompt (scroll vs time)

## Security Considerations

✅ **No vulnerabilities** detected by CodeQL
✅ **localStorage** usage is scoped and safe
✅ **No unsafe eval** or innerHTML
✅ **User inputs** properly sanitized
✅ **Events** properly typed

## Browser Support

| Browser | Version | Support | Notes |
|---------|---------|---------|-------|
| Chrome | 76+ | ✅ Full | Native beforeinstallprompt |
| Edge | 79+ | ✅ Full | Native beforeinstallprompt |
| Safari iOS | 12+ | ✅ Partial | Manual instructions only |
| Firefox | Any | ⚠️ Limited | No beforeinstallprompt |
| Safari macOS | Any | ⚠️ Limited | No beforeinstallprompt |

## Future Enhancements

Potential improvements for future versions:
- [ ] A/B testing different trigger timings
- [ ] Custom analytics dashboard
- [ ] Smart trigger based on user engagement
- [ ] Install rate predictions
- [ ] Personalized messaging
- [ ] Device-specific optimizations
- [ ] Progressive enhancement for new browser APIs

## Support

For questions or issues:
1. Check this documentation first
2. Review console logs for tracking events
3. Verify browser compatibility
4. Test on multiple devices
5. Contact development team

---

**Last Updated**: 2026-02-05
**Version**: 1.0.0
**Author**: GitHub Copilot Agent
