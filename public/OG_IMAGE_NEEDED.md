# OG Image Required

Please add a social media preview image at `/public/og-image.jpg`

## Specifications
- **Dimensions:** 1200 x 630 pixels
- **Format:** JPG or PNG
- **Size:** < 1MB recommended
- **Content:** Logo + tagline + visual (property/building)

## Recommended Content
- TopAffaireImmo logo
- Tagline: "Trouvez votre propriété parfaite au Maroc"
- Background: Moroccan architecture or property image
- High contrast for readability

## Testing
After adding the image, test with:
- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator

## Temporary Solution
Until the image is created, the meta tags reference `/og-image.jpg` which will 404.
This won't break anything but social media previews won't show an image.

You can:
1. Create a simple image with logo and text
2. Or remove the og:image meta tags temporarily
3. Or use a stock real estate image as placeholder
