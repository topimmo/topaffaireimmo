interface AdSenseBannerProps {
  slot: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  className?: string;
  isHeaderBanner?: boolean;
}

export default function AdSenseBanner({ 
  slot, 
  format = 'auto', 
  className = '', 
  isHeaderBanner = false 
}: AdSenseBannerProps) {
  // This is a placeholder for Google AdSense
  // In production, replace with actual AdSense code
  // Standard dimensions: Desktop 728×90, Mobile 320×50
  
  // className is applied to wrapper for positioning/spacing
  // Add header-specific class for fixed height enforcement
  const wrapperClass = isHeaderBanner 
    ? `adsense-banner-wrapper adsense-header-banner ${className}`
    : `adsense-banner-wrapper ${className}`;
  
  return (
    <div className={wrapperClass}>
      <div className="adsense-banner bg-muted/30 rounded-lg flex items-center justify-center border border-dashed border-muted h-full">
        <div className="text-center text-sm text-muted-foreground">
          <p>Google AdSense</p>
          <p className="text-xs">Slot: {slot}</p>
          <p className="text-xs mt-1">728×90 (Desktop) / 320×50 (Mobile)</p>
        </div>
      </div>
    </div>
  );
}
