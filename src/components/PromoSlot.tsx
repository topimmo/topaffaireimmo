import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PromoSlotProps {
  /**
   * Content to render inside the slot (can be an image banner or AdSense code)
   */
  children?: ReactNode;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Behavior when no content is provided
   * - 'collapse': Remove the slot entirely (no space reserved)
   * - 'preserve': Keep minimum height for layout stability
   */
  emptyBehavior?: 'collapse' | 'preserve';
}

/**
 * PromoSlot - A responsive container for promotional content (banners/AdSense)
 * 
 * Responsive sizing:
 * - Desktop (≥1024px): max-w-[728px] min-h-[90px]
 * - Tablet (768-1023px): max-w-[728px] min-h-[90px]
 * - Mobile (<768px): max-w-[320px] min-h-[50px]
 * 
 * Features:
 * - Centered alignment
 * - No horizontal overflow
 * - Future-ready for AdSense integration
 * - Consistent spacing across devices
 */
export default function PromoSlot({ 
  children, 
  className, 
  emptyBehavior = 'collapse' 
}: PromoSlotProps) {
  // If no content and collapse mode, return null
  if (!children && emptyBehavior === 'collapse') {
    return null;
  }

  return (
    <div
      className={cn(
        // Centering
        'mx-auto w-full',
        // Responsive max-width and min-height
        // Mobile first approach
        'max-w-[320px] min-h-[50px]',
        // Tablet and Desktop
        'md:max-w-[728px] md:min-h-[90px]',
        // Prevent overflow
        'overflow-hidden',
        // Padding for breathing room
        'px-4',
        // Additional classes
        className
      )}
    >
      {children}
    </div>
  );
}
