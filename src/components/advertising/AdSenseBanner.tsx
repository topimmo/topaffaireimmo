interface AdSenseBannerProps {
  slot: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  className?: string;
}

export default function AdSenseBanner({ slot, format = 'auto', className = '' }: AdSenseBannerProps) {
  // This is a placeholder for Google AdSense
  // In production, replace with actual AdSense code
  
  // className is applied to wrapper for positioning/spacing
  return (
    <div className={`adsense-banner-wrapper ${className}`}>
      <div className="adsense-banner bg-muted/30 rounded-lg flex items-center justify-center min-h-[60px] border border-dashed border-muted">
        <div className="text-center text-sm text-muted-foreground">
          <p>Google AdSense</p>
          <p className="text-xs">Slot: {slot}</p>
        </div>
      </div>
    </div>
  );
}
