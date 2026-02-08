# AdSense Fallback CTA Component

## Overview

The `AdSenseFallbackCTA` component is a responsive Call-To-Action component that displays when Google AdSense is not active or unavailable. It serves as a promotional banner to increase user engagement and conversions while waiting for AdSense approval.

## Location

- Component: `/src/components/advertising/AdSenseFallbackCTA.tsx`
- Integration: `/src/components/advertising/AdSenseBanner.tsx`
- Homepage: `/src/components/home.tsx`

## Features

### ✅ Fully Responsive Design

- **Mobile (< 640px)**: 
  - 100% width with padding
  - Stacked button layout (vertical)
  - Large, touch-friendly buttons (min-height: 48px)
  - Readable text with appropriate spacing

- **Tablet (640px - 1023px)**:
  - Centered layout with medium width
  - Horizontal button layout
  - Optimized spacing and padding

- **Desktop (≥ 1024px)**:
  - Max width: 728px (standard AdSense banner size)
  - Centered horizontally
  - Clean, professional layout

### ✅ Display Logic

The component automatically determines when to display:

1. **AdSense Active**: Shows actual AdSense ads (when Google AdSense script is loaded)
2. **AdSense Inactive**: Shows the fallback CTA component

The detection is handled in `AdSenseBanner.tsx` by checking for the `window.adsbygoogle` object.

### ✅ AdSense Policy Compliance

- Clearly marked as "promotional offer, not an advertisement"
- Visually distinct from actual ads with custom styling
- Uses different colors and layout from typical ad formats
- No misleading ad-like appearance

### ✅ Accessibility

- High contrast colors for readability
- Focus states for keyboard navigation
- Touch-friendly button sizes (min 48px height)
- Semantic HTML structure
- Screen reader friendly

## Customization Guide

### 1. Update Text Content

Edit the component file at `/src/components/advertising/AdSenseFallbackCTA.tsx`:

```tsx
// Main heading (line ~52)
<h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
  🏡 Buy – Sell – Rent real estate in Morocco
</h2>

// Subheading/promotional text (line ~56)
<p className="text-base sm:text-lg font-semibold text-primary">
  ✨ 300 free lifetime accounts (limited time)
</p>
```

### 2. Update Button Links

**Primary Button** (Create Account):
```tsx
// Line ~66
<Link to="/register"
```
Change `/register` to your desired signup route.

**Secondary Button** (WhatsApp):
```tsx
// Line ~33 - Update the WhatsApp number
const WHATSAPP_NUMBER = '212600000000'; // Format: country code + number
const WHATSAPP_MESSAGE = encodeURIComponent('Your custom message');
```

Replace with your actual WhatsApp business number.

### 3. Update Button Text

**Primary Button**:
```tsx
// Line ~88
Create Free Account
```

**Secondary Button**:
```tsx
// Line ~139
Contact via WhatsApp
```

### 4. Customize Colors and Styling

The component uses Tailwind CSS classes. Common customizations:

**Background Gradient**:
```tsx
// Line ~45
"bg-gradient-to-br from-primary/10 via-background to-primary/5"
```

**Border**:
```tsx
// Line ~46
"border-2 border-primary/20"
```

**Button Colors**:
```tsx
// Primary button (line ~73)
"bg-primary text-primary-foreground"

// Secondary button (line ~99)
"bg-background text-foreground border-2 border-primary/30"
```

## Usage Example

The component is automatically integrated into the homepage via the AdBanner component:

```tsx
// In src/components/home.tsx (line 54-58)
<AdBanner
  page="home"
  position="home-middle"
  className="-mt-4"
/>
```

The `AdBanner` component uses `BannerSlot` which falls back to `AdSenseBanner`, which in turn shows the `AdSenseFallbackCTA` when AdSense is not active.

## Integration Flow

```
home.tsx
  └─> AdBanner (page="home", position="home-middle")
      └─> BannerSlot (checks for paid banner campaigns)
          └─> AdSenseBanner (fallback if no paid campaigns)
              └─> AdSenseFallbackCTA (fallback if AdSense not active)
```

## Testing

### Test in Different Viewports

1. **Desktop** (1920x1080): Should show centered, max-width 728px
2. **Tablet** (768x1024): Should show centered with medium width
3. **Mobile** (375x667): Should show full width with stacked buttons

### Test Display Logic

- **With AdSense**: Load page with AdSense script → should show AdSense placeholder
- **Without AdSense**: Load page normally → should show fallback CTA

## Screenshots

- **Desktop View**: Component centered, horizontal buttons, max 728px width
- **Tablet View**: Medium width, horizontal buttons, centered
- **Mobile View**: Full width, stacked buttons, large touch targets

## Performance Considerations

- Component uses `useState` and `useEffect` to prevent hydration issues
- Returns `null` until mounted to avoid SSR/CSR mismatches
- Minimal JavaScript footprint
- No external dependencies
- Lazy loading of component content

## SEO Considerations

- Uses semantic HTML (`<h2>`, `<p>`, `<Link>`)
- Clear, descriptive text content
- Proper link structure with `rel="noopener noreferrer"` for external links
- Does not interfere with page indexing

## AdSense Approval Process

Once Google AdSense is approved and the AdSense script is added to the site:

1. Add the AdSense script to `index.html`
2. The component will automatically detect `window.adsbygoogle`
3. AdSense ads will display instead of the fallback CTA
4. No code changes required - automatic switching

## Maintenance

- Review WhatsApp number periodically
- Update promotional text as needed
- Monitor conversion rates from the CTA
- Test responsive design after CSS framework updates
- Ensure links remain valid (especially `/register` route)

## Support

For issues or questions:
- Check console for errors
- Verify routes exist (`/register` for signup)
- Test in incognito mode to avoid cache issues
- Check responsive behavior in browser DevTools
