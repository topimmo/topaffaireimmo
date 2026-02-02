interface AdSenseBannerProps {
  slot: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  className?: string;
}

export default function AdSenseBanner({ 
  slot, 
  format = 'auto', 
  className = ''
}: AdSenseBannerProps) {
  // This is a placeholder for Google AdSense
  // In production, replace with actual AdSense code
  // Standard dimensions: Desktop 728×90, Mobile 320×50
  
  return (
    <div className={`adsense-banner-wrapper ${className}`}>
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
