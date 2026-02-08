import { useState, useEffect } from 'react';
import AdSenseFallbackCTA from './AdSenseFallbackCTA';

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
  const [adsenseActive, setAdsenseActive] = useState(false);
  const [adsenseLoaded, setAdsenseLoaded] = useState(false);

  useEffect(() => {
    // Check if Google AdSense script is loaded and active
    // This checks for the presence of adsbygoogle array/object
    const checkAdSense = () => {
      // @ts-ignore - window.adsbygoogle may not exist in type definitions
      const hasAdSense = typeof window !== 'undefined' && window.adsbygoogle;
      
      if (hasAdSense) {
        setAdsenseActive(true);
      }
      
      setAdsenseLoaded(true);
    };

    // Small delay to allow AdSense script to load
    const timer = setTimeout(checkAdSense, 100);

    return () => clearTimeout(timer);
  }, []);

  // While checking AdSense status, show nothing (prevents flash)
  if (!adsenseLoaded) {
    return null;
  }

  // If AdSense is active, show the AdSense placeholder
  // In production, this would be replaced with actual AdSense code
  if (adsenseActive) {
    return (
      <div className={`adsense-banner-wrapper min-h-[50px] md:min-h-[90px] ${className}`}>
        <div className="adsense-banner bg-muted/30 rounded-lg flex items-center justify-center border border-dashed border-muted h-full">
          <div className="text-center text-sm text-muted-foreground">
            <p>Google AdSense Active</p>
            <p className="text-xs">Slot: {slot}</p>
            <p className="text-xs mt-1">728×90 (Desktop) / 320×50 (Mobile)</p>
          </div>
        </div>
      </div>
    );
  }

  // If AdSense is NOT active, show the fallback CTA component
  return <AdSenseFallbackCTA className={className} />;
}
