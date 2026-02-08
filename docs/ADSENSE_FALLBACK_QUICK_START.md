# Quick Start: AdSense Fallback CTA

## What is it?
A responsive Call-To-Action component that displays on your homepage when Google AdSense is not active. Perfect for converting visitors while waiting for AdSense approval.

## Location
The component appears on the homepage between the "Featured Properties" and "Property Categories" sections.

## How to Customize

### 1. Update WhatsApp Number
**File**: `src/components/advertising/AdSenseFallbackCTA.tsx`

```tsx
// Find this line:
const WHATSAPP_NUMBER = '212600000000';

// Replace with your number:
const WHATSAPP_NUMBER = '212612345678';
```

### 2. Update Text
**File**: `src/components/advertising/AdSenseFallbackCTA.tsx`

```tsx
// Main heading - search for:
🏡 Buy – Sell – Rent real estate in Morocco

// Promotional text - search for:
✨ 300 free lifetime accounts (limited time)
```

### 3. Update Buttons
- **Primary button**: Search for "Create Free Account"
- **Secondary button**: Search for "Contact via WhatsApp"
- **Link destination**: The signup link is `/register`

## When will it show?
- **AdSense NOT active**: Shows this CTA component ✅
- **AdSense active**: Shows AdSense ads instead

## Testing
1. Open homepage: `http://localhost:5173`
2. Look between "Featured Properties" and "Categories"
3. Test on mobile (375px), tablet (768px), and desktop (1920px)

## Full Documentation
See `/docs/ADSENSE_FALLBACK_CTA.md` for complete guide.

## Support
- Check the console for errors
- Verify `/register` route exists
- Test in incognito mode if needed
