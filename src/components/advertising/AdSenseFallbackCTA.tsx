import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface AdSenseFallbackCTAProps {
  className?: string;
}

/**
 * AdSenseFallbackCTA Component
 * 
 * A responsive Call-To-Action component displayed when Google AdSense is not active.
 * Fully compliant with AdSense policies - clearly distinguished from ads.
 * 
 * Responsive Design:
 * - Mobile: 100% width, stacked layout, large buttons
 * - Tablet: Medium width, centered
 * - Desktop: Max 728px width (standard banner size), centered
 * 
 * Customization:
 * - Text content: Update the heading, description, and emoji lines
 * - Buttons: Modify button text and URLs
 * - WhatsApp number: Set VITE_WHATSAPP_NUMBER environment variable
 * - Styling: Adjust colors and spacing via Tailwind classes
 */
export default function AdSenseFallbackCTA({ className }: AdSenseFallbackCTAProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // WhatsApp number from environment variable
  const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER;

  // Prevent hydration issues
  if (!isMounted) {
    return null;
  }

  // Return null if WhatsApp number is not configured
  if (!WHATSAPP_NUMBER) {
    if (import.meta.env.DEV) {
      console.warn('AdSenseFallbackCTA: VITE_WHATSAPP_NUMBER environment variable not configured');
    }
    return null;
  }

  const WHATSAPP_MESSAGE = encodeURIComponent('Hello, I would like to know more about TopAffaireImmo');
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

  return (
    <div 
      className={cn(
        // Container: Responsive width and centering
        "w-full max-w-[728px] mx-auto",
        // Padding: Responsive padding for mobile/tablet/desktop
        "px-4 sm:px-6 lg:px-0",
        // Vertical spacing
        "py-6 sm:py-8",
        className
      )}
    >
      <div
        className={cn(
          // Card styling with gradient background
          "relative overflow-hidden rounded-xl",
          "bg-gradient-to-br from-primary/10 via-background to-primary/5",
          "border-2 border-primary/20",
          "shadow-lg hover:shadow-xl transition-shadow duration-300",
          // Padding inside card
          "p-6 sm:p-8"
        )}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -z-10" />

        {/* Content */}
        <div className="relative z-10 text-center space-y-4">
          {/* Main heading with emoji - Customizable */}
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
            🏡 Buy – Sell – Rent real estate in Morocco
          </h2>

          {/* Subheading with promotional offer - Customizable */}
          <p className="text-base sm:text-lg font-semibold text-primary">
            ✨ 300 free lifetime accounts (limited time)
          </p>

          {/* Call-to-action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-2">
            {/* Primary CTA Button - Customizable link */}
            <Link
              to="/register"
              className={cn(
                // Full width on mobile, auto on larger screens
                "w-full sm:w-auto",
                // Button styling
                "inline-flex items-center justify-center",
                "px-8 py-3 sm:py-3.5",
                "text-base sm:text-lg font-semibold",
                "rounded-lg",
                // Primary button colors
                "bg-primary text-primary-foreground",
                "hover:bg-primary/90",
                // Transitions
                "transition-all duration-200",
                "shadow-md hover:shadow-lg",
                // Focus states for accessibility
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                // Touch-friendly sizing on mobile
                "min-h-[48px]"
              )}
            >
              Create Free Account
            </Link>

            {/* Secondary CTA Button - WhatsApp - Customizable */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                // Full width on mobile, auto on larger screens
                "w-full sm:w-auto",
                // Button styling
                "inline-flex items-center justify-center gap-2",
                "px-6 py-3 sm:py-3.5",
                "text-base sm:text-lg font-semibold",
                "rounded-lg",
                // Secondary button colors
                "bg-background text-foreground",
                "border-2 border-primary/30",
                "hover:bg-primary/5 hover:border-primary/50",
                // Transitions
                "transition-all duration-200",
                // Focus states for accessibility
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                // Touch-friendly sizing on mobile
                "min-h-[48px]"
              )}
            >
              {/* WhatsApp icon */}
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Contact via WhatsApp
            </a>
          </div>

          {/* Disclaimer - Important for AdSense compliance */}
          <p className="text-xs sm:text-sm text-muted-foreground pt-2">
            This is a promotional offer, not an advertisement
          </p>
        </div>
      </div>
    </div>
  );
}
